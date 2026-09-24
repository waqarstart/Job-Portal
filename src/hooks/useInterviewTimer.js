import { useCallback, useEffect, useRef, useState } from "react";

export const CLOSING_SECONDS = 5;

/**
 * Phases: idle → introSpeaking → avatarSpeaking → answering → … → closing → done
 * Closing only after question phase started, and only once.
 */
export default function useInterviewTimer({
  durationSeconds = 120,
  answerSeconds = 15,
  questionCount = 0,
  onSessionEnd,
  onAnswerTimeout,
  onClosingStart,
}) {
  const [phase, setPhase] = useState("idle");
  const [sessionRemaining, setSessionRemaining] = useState(durationSeconds);
  const [answerRemaining, setAnswerRemaining] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const sessionTimerRef = useRef(null);
  const answerTimerRef = useRef(null);
  const endingRef = useRef(false);
  const closingStartedRef = useRef(false);
  const closingCompletedRef = useRef(false);
  const questionsStartedRef = useRef(false);
  const speakEndedGuardRef = useRef("");
  const sessionRemainingRef = useRef(durationSeconds);
  const phaseRef = useRef("idle");
  const questionIndexRef = useRef(0);

  const onSessionEndRef = useRef(onSessionEnd);
  const onAnswerTimeoutRef = useRef(onAnswerTimeout);
  const onClosingStartRef = useRef(onClosingStart);

  useEffect(() => {
    onSessionEndRef.current = onSessionEnd;
  }, [onSessionEnd]);
  useEffect(() => {
    onAnswerTimeoutRef.current = onAnswerTimeout;
  }, [onAnswerTimeout]);
  useEffect(() => {
    onClosingStartRef.current = onClosingStart;
  }, [onClosingStart]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    questionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

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
    phaseRef.current = "done";
    setAnswerRemaining(null);
    onSessionEndRef.current?.();
  }, [clearAnswerTimer, clearSessionTimer]);

  const beginClosing = useCallback(() => {
    if (endingRef.current || closingStartedRef.current) return;
    // Do not close before intro/questions have started
    if (
      !questionsStartedRef.current &&
      phaseRef.current !== "avatarSpeaking" &&
      phaseRef.current !== "answering" &&
      phaseRef.current !== "introSpeaking"
    ) {
      return;
    }
    closingStartedRef.current = true;
    clearAnswerTimer();
    setAnswerRemaining(null);
    setPhase("closing");
    phaseRef.current = "closing";
    onClosingStartRef.current?.();
  }, [clearAnswerTimer]);

  const startSession = useCallback(() => {
    endingRef.current = false;
    closingStartedRef.current = false;
    closingCompletedRef.current = false;
    questionsStartedRef.current = false;
    speakEndedGuardRef.current = "";
    clearAnswerTimer();
    clearSessionTimer();
    setCurrentQuestionIndex(0);
    questionIndexRef.current = 0;
    sessionRemainingRef.current = durationSeconds;
    setSessionRemaining(durationSeconds);
    setAnswerRemaining(null);
    setPhase("introSpeaking");
    phaseRef.current = "introSpeaking";

    sessionTimerRef.current = setInterval(() => {
      setSessionRemaining((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        sessionRemainingRef.current = next;

        // Only enter closing in last 5s after questions have started
        if (
          next === CLOSING_SECONDS &&
          !closingStartedRef.current &&
          questionsStartedRef.current
        ) {
          setTimeout(() => beginClosing(), 0);
        }

        if (next <= 0) {
          clearInterval(sessionTimerRef.current);
          sessionTimerRef.current = null;
          setTimeout(() => finish(), 0);
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [
    durationSeconds,
    clearAnswerTimer,
    clearSessionTimer,
    beginClosing,
    finish,
  ]);

  /** After intro speech ends → begin first question speaking phase */
  const completeIntro = useCallback(() => {
    if (endingRef.current || closingStartedRef.current) return;
    if (phaseRef.current !== "introSpeaking") return;
    questionsStartedRef.current = true;
    setPhase("avatarSpeaking");
    phaseRef.current = "avatarSpeaking";
  }, []);

  const startAnswerWindow = useCallback(
    (speakKey) => {
      if (endingRef.current) return;
      if (phaseRef.current === "closing" || phaseRef.current === "done") return;
      if (closingStartedRef.current) return;
      if (phaseRef.current === "introSpeaking") return;

      const key = speakKey || `q-${questionIndexRef.current}`;
      if (speakEndedGuardRef.current === key) return;
      speakEndedGuardRef.current = key;

      questionsStartedRef.current = true;

      if (sessionRemainingRef.current <= CLOSING_SECONDS) {
        beginClosing();
        return;
      }

      clearAnswerTimer();
      setPhase("answering");
      phaseRef.current = "answering";
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
    },
    [answerSeconds, clearAnswerTimer, beginClosing]
  );

  const advanceQuestion = useCallback(() => {
    if (endingRef.current || closingStartedRef.current) return false;

    clearAnswerTimer();
    setAnswerRemaining(null);

    if (sessionRemainingRef.current <= CLOSING_SECONDS) {
      beginClosing();
      return false;
    }

    const prev = questionIndexRef.current;
    const next = prev + 1;

    if (next >= questionCount) {
      beginClosing();
      return false;
    }

    questionIndexRef.current = next;
    setCurrentQuestionIndex(next);
    setPhase("avatarSpeaking");
    phaseRef.current = "avatarSpeaking";
    return true;
  }, [questionCount, clearAnswerTimer, beginClosing]);

  const completeClosing = useCallback(() => {
    if (closingCompletedRef.current) return;
    if (!closingStartedRef.current && phaseRef.current !== "closing") return;
    closingCompletedRef.current = true;
    finish();
  }, [finish]);

  useEffect(() => {
    return () => {
      clearAnswerTimer();
      clearSessionTimer();
    };
  }, [clearAnswerTimer, clearSessionTimer]);

  return {
    phase,
    sessionRemaining,
    answerRemaining,
    currentQuestionIndex,
    startSession,
    completeIntro,
    startAnswerWindow,
    advanceQuestion,
    beginClosing,
    completeClosing,
    finish,
    isDone: phase === "done",
    isClosing: phase === "closing",
  };
}
