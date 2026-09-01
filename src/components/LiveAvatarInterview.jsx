import { useEffect, useRef, useState } from "react";
import {
  LiveAvatarSession,
  SessionEvent,
  AgentEventsEnum,
} from "@heygen/liveavatar-web-sdk";

/**
 * LiveAvatar video + speak control for the timed interview room.
 * Falls back to a placeholder UI when no sessionToken is available.
 */
export default function LiveAvatarInterview({
  sessionToken,
  active,
  questionText,
  questionIndex,
  onAvatarStopSpeaking,
  onSessionId,
  onError,
  onLocalTranscriptLine,
}) {
  const videoRef = useRef(null);
  const sessionRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const lastSpokenIndexRef = useRef(-1);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  // Start / stop session when token + active change
  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;

    async function boot() {
      if (!sessionToken) {
        setStatus("fallback");
        return;
      }

      try {
        setStatus("connecting");
        const session = new LiveAvatarSession(sessionToken, {
          voiceChat: true,
        });
        sessionRef.current = session;

        session.on(SessionEvent.SESSION_STREAM_READY, () => {
          if (cancelled) return;
          if (videoRef.current) {
            try {
              session.attach(videoRef.current);
            } catch (err) {
              console.error("Failed to attach LiveAvatar stream:", err);
            }
          }
          setStatus("ready");
        });

        session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
          if (cancelled) return;
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
          }
          onAvatarStopSpeaking?.();
        });

        session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION, (event) => {
          const text = event?.text;
          if (text) onLocalTranscriptLine?.("AI", text);
        });

        session.on(AgentEventsEnum.USER_TRANSCRIPTION, (event) => {
          const text = event?.text;
          if (text) onLocalTranscriptLine?.("Candidate", text);
        });

        await session.start();
        if (cancelled) {
          await session.stop().catch(() => {});
          return;
        }

        if (session.sessionId) {
          onSessionId?.(session.sessionId);
        }
      } catch (err) {
        console.error("LiveAvatar session error:", err);
        if (!cancelled) {
          setError(err.message || "Could not start LiveAvatar session.");
          setStatus("fallback");
          onError?.(err);
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) {
        session.stop().catch(() => {});
      }
    };
    // intentionally only re-boot when token/active change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, sessionToken]);

  // Speak current question (or use fallback speech timer)
  useEffect(() => {
    if (!active) return;
    if (!questionText) return;
    if (lastSpokenIndexRef.current === questionIndex) return;

    // Wait until connected (or fallback mode) before locking the spoken index
    if (status !== "ready" && status !== "fallback") return;

    lastSpokenIndexRef.current = questionIndex;

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    const session = sessionRef.current;
    const estimatedMs = Math.min(
      20000,
      Math.max(2500, (questionText.length / 14) * 1000)
    );

    const speak = () => {
      onLocalTranscriptLine?.("AI", questionText);

      if (session && status === "ready") {
        try {
          if (typeof session.repeat === "function") {
            session.repeat(questionText);
          } else if (typeof session.message === "function") {
            session.message(questionText);
          }
        } catch (err) {
          console.error("Avatar speak failed, using fallback timer:", err);
        }
      }

      fallbackTimerRef.current = setTimeout(() => {
        fallbackTimerRef.current = null;
        onAvatarStopSpeaking?.();
      }, estimatedMs);
    };

    const kickoff = setTimeout(speak, 400);

    return () => {
      clearTimeout(kickoff);
    };
  }, [
    active,
    questionText,
    questionIndex,
    status,
    onAvatarStopSpeaking,
    onLocalTranscriptLine,
  ]);

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  if (!active) {
    return (
      <div className="flex h-[650px] items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="mb-4 text-5xl">🤖</div>
          <p className="text-xl font-semibold">AI Interviewer</p>
          <p className="mt-2 text-sm text-gray-400">
            Ready to start your interview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[650px] w-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`h-full w-full object-cover ${
          status === "ready" ? "block" : "hidden"
        }`}
      />

      {status !== "ready" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white px-6 text-center">
          <div className="mb-4 text-5xl">🤖</div>
          <p className="text-xl font-semibold">
            {status === "connecting"
              ? "Connecting to AI interviewer…"
              : "AI Interviewer"}
          </p>
          <p className="mt-2 text-sm text-gray-400 max-w-md">
            {status === "fallback"
              ? "Video avatar unavailable. Continue answering using the on-screen questions and timers."
              : "Please allow microphone access when prompted."}
          </p>
          {error && (
            <p className="mt-3 text-xs text-amber-300 max-w-md">{error}</p>
          )}
          {questionText && (
            <div className="mt-6 max-w-lg rounded-xl bg-white/10 p-4 text-left text-sm text-gray-100">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                Current question
              </p>
              <p>{questionText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
