import { useCallback, useEffect, useRef, useState } from "react";

/**
 * App-side interview pacing:
 * - sessionRemaining: hard 2-minute (or configured) cap
 * - answerRemaining: 15s after avatar finishes speaking
 */
export default function useInterviewTimer({
  durationSeconds = 120,
  answerSeconds = 15,
  questionCount = 0,
  onSessionEnd,
  onAnswerTimeout,
}) {
  const [phase, setPhase] = useState("idle"); // idle | avatarSpeaking | answering | done
  const [sessionRemaining, setSessionRemaining] = useState(durationSeconds);
  const [answerRemaining, setAnswerRemaining] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const sessionTimerRef = useRef(null);
  const answerTimerRef = useRef(null);
  const endingRef = useRef(false);
  const onSessionEndRef = useRef(onSessionEnd);
  const onAnswerTimeoutRef = useRef(onAnswerTimeout);

  useEffect(() => {
    onSessionEndRef.current = onSessionEnd;
  }, [onSessionEnd]);

  useEffect(() => {
    onAnswerTimeoutRef.current = onAnswerTimeout;
  }, [onAnswerTimeout]);

  const clearAnswerTimer = useCallback(() => {
    if (answerTimerRef.current) {
      clearInterval(answerTimerRef.current);
      answerTimerRef.current = null;
    }
  }, []);

  const clearSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    clearAnswerTimer();
    clearSessionTimer();
    setPhase("done");
    setAnswerRemaining(null);
    onSessionEndRef.current?.();
  }, [clearAnswerTimer, clearSessionTimer]);

  const startSession = useCallback(() => {
    endingRef.current = false;
    clearAnswerTimer();
    clearSessionTimer();
    setCurrentQuestionIndex(0);
    setSessionRemaining(durationSeconds);
    setAnswerRemaining(null);
    setPhase("avatarSpeaking");

    sessionTimerRef.current = setInterval(() => {
      setSessionRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(sessionTimerRef.current);
          sessionTimerRef.current = null;
          // defer finish to avoid setState during render of another setState
          setTimeout(() => finish(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [durationSeconds, clearAnswerTimer, clearSessionTimer, finish]);

  const startAnswerWindow = useCallback(() => {
    if (endingRef.current) return;
    clearAnswerTimer();
    setPhase("answering");
    setAnswerRemaining(answerSeconds);

    answerTimerRef.current = setInterval(() => {
      setAnswerRemaining((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          clearInterval(answerTimerRef.current);
          answerTimerRef.current = null;
          setTimeout(() => onAnswerTimeoutRef.current?.(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [answerSeconds, clearAnswerTimer]);

  const markAvatarSpeaking = useCallback(() => {
    if (endingRef.current) return;
    clearAnswerTimer();
    setAnswerRemaining(null);
    setPhase("avatarSpeaking");
  }, [clearAnswerTimer]);

  const advanceQuestion = useCallback(() => {
    if (endingRef.current) return false;

    clearAnswerTimer();
    setAnswerRemaining(null);

    setCurrentQuestionIndex((prev) => {
      const next = prev + 1;
      if (next >= questionCount) {
        setTimeout(() => finish(), 0);
        return prev;
      }
      setPhase("avatarSpeaking");
      return next;
    });

    return true;
  }, [questionCount, clearAnswerTimer, finish]);

  useEffect(() => {
    return () => {
      clearAnswerTimer();
      clearSessionTimer();
    };
  }, [clearAnswerTimer, clearSessionTimer]);

  const formatTime = (secs) => {
    const s = Math.max(0, Number(secs) || 0);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  return {
    phase,
    sessionRemaining,
    answerRemaining,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    startSession,
    startAnswerWindow,
    markAvatarSpeaking,
    advanceQuestion,
    finish,
    formatTime,
    isDone: phase === "done",
  };
}
