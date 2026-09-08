import { useEffect, useRef, useState } from "react";
import {
  LiveAvatarSession,
  SessionEvent,
  AgentEventsEnum,
} from "@heygen/liveavatar-web-sdk";

/**
 * LiveAvatar FULL-mode: interrupt context greeting, then speak scripted lines only.
 */
export default function LiveAvatarInterview({
  sessionToken,
  active,
  phase,
  speakText,
  speakKey,
  onAvatarStopSpeaking,
  onIntroSpoken,
  onClosingSpoken,
  onSessionId,
  onDisconnected,
  onError,
  onLocalTranscriptLine,
  onUserAnswerChunk,
}) {
  const videoRef = useRef(null);
  const sessionRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const lastSpeakKeyRef = useRef(null);
  const activeSpeakKeyRef = useRef(null);
  const speakEndedFiredRef = useRef(false);
  const interruptedOpeningRef = useRef(false);
  const phaseRef = useRef(phase);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const onAvatarStopSpeakingRef = useRef(onAvatarStopSpeaking);
  const onIntroSpokenRef = useRef(onIntroSpoken);
  const onClosingSpokenRef = useRef(onClosingSpoken);
  const onDisconnectedRef = useRef(onDisconnected);
  const onErrorRef = useRef(onError);
  const onLocalTranscriptLineRef = useRef(onLocalTranscriptLine);
  const onUserAnswerChunkRef = useRef(onUserAnswerChunk);
  const onSessionIdRef = useRef(onSessionId);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    onAvatarStopSpeakingRef.current = onAvatarStopSpeaking;
  }, [onAvatarStopSpeaking]);
  useEffect(() => {
    onIntroSpokenRef.current = onIntroSpoken;
  }, [onIntroSpoken]);
  useEffect(() => {
    onClosingSpokenRef.current = onClosingSpoken;
  }, [onClosingSpoken]);
  useEffect(() => {
    onDisconnectedRef.current = onDisconnected;
  }, [onDisconnected]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    onLocalTranscriptLineRef.current = onLocalTranscriptLine;
  }, [onLocalTranscriptLine]);
  useEffect(() => {
    onUserAnswerChunkRef.current = onUserAnswerChunk;
  }, [onUserAnswerChunk]);
  useEffect(() => {
    onSessionIdRef.current = onSessionId;
  }, [onSessionId]);

  const clearFallback = () => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  const safeCall = (fn, ...args) => {
    try {
      const session = sessionRef.current;
      if (!session || typeof session[fn] !== "function") return;
      return session[fn](...args);
    } catch (err) {
      console.warn(`LiveAvatar ${fn} failed:`, err?.message || err);
    }
  };

  const fireSpeakEnded = () => {
    if (speakEndedFiredRef.current) return;
    // Ignore stray events not tied to current speak key
    if (
      activeSpeakKeyRef.current &&
      lastSpeakKeyRef.current &&
      activeSpeakKeyRef.current !== lastSpeakKeyRef.current
    ) {
      return;
    }
    speakEndedFiredRef.current = true;
    clearFallback();

    const p = phaseRef.current;
    if (p === "closing") {
      onClosingSpokenRef.current?.();
    } else if (p === "introSpeaking") {
      onIntroSpokenRef.current?.();
    } else {
      onAvatarStopSpeakingRef.current?.(activeSpeakKeyRef.current);
    }
  };

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    interruptedOpeningRef.current = false;

    async function boot() {
      if (!sessionToken) {
        setStatus("fallback");
        return;
      }

      try {
        setStatus("connecting");
        setError("");
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
          // Cut context auto-opening ("Silas from LiveAvatar...")
          if (!interruptedOpeningRef.current) {
            interruptedOpeningRef.current = true;
            try {
              session.interrupt();
            } catch {
              /* ignore */
            }
          }
          setStatus("ready");
        });

        session.on(SessionEvent.SESSION_DISCONNECTED, () => {
          if (cancelled) return;
          setStatus("fallback");
          onDisconnectedRef.current?.("disconnected");
        });

        session.on(AgentEventsEnum.SESSION_STOPPED, () => {
          if (cancelled) return;
          setStatus("fallback");
          onDisconnectedRef.current?.("stopped");
        });

        session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
          if (cancelled) return;
          // Ignore ending of interrupted context greeting before we spoke
          if (!lastSpeakKeyRef.current) return;
          fireSpeakEnded();
        });

        session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION, (event) => {
          const text = event?.text;
          if (text) onLocalTranscriptLineRef.current?.("AI", text);
        });

        session.on(AgentEventsEnum.USER_TRANSCRIPTION, (event) => {
          const text = event?.text;
          if (!text) return;
          onLocalTranscriptLineRef.current?.("Candidate", text);
          if (phaseRef.current === "answering") {
            onUserAnswerChunkRef.current?.(text);
          }
        });

        await session.start();
        if (cancelled) {
          await session.stop().catch(() => {});
          return;
        }

        if (session.sessionId) {
          onSessionIdRef.current?.(session.sessionId);
        }
      } catch (err) {
        console.error("LiveAvatar session error:", err);
        if (!cancelled) {
          setError(err.message || "Could not start LiveAvatar session.");
          setStatus("fallback");
          onErrorRef.current?.(err);
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
      clearFallback();
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) {
        session.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, sessionToken]);

  useEffect(() => {
    if (!active || status !== "ready") return;
    if (phase === "answering") {
      safeCall("startListening");
    } else {
      safeCall("stopListening");
    }
  }, [active, status, phase]);

  useEffect(() => {
    if (!active) return;
    if (!speakText) return;
    if (
      phase !== "avatarSpeaking" &&
      phase !== "closing" &&
      phase !== "introSpeaking"
    ) {
      return;
    }
    if (status !== "ready" && status !== "fallback") return;
    if (lastSpeakKeyRef.current === speakKey) return;

    lastSpeakKeyRef.current = speakKey;
    activeSpeakKeyRef.current = speakKey;
    speakEndedFiredRef.current = false;
    clearFallback();

    const estimatedMs = Math.min(
      18000,
      Math.max(2500, (speakText.length / 14) * 1000)
    );

    const speak = () => {
      onLocalTranscriptLineRef.current?.("AI", speakText);

      if (status === "ready" && sessionRef.current) {
        safeCall("interrupt");
        safeCall("stopListening");
        safeCall("repeat", speakText);
      }

      fallbackTimerRef.current = setTimeout(() => {
        fallbackTimerRef.current = null;
        fireSpeakEnded();
      }, status === "fallback" ? estimatedMs : estimatedMs + 1000);
    };

    // Small delay after interrupt so context greeting is cut before our line
    const kickoff = setTimeout(speak, status === "ready" ? 500 : 200);
    return () => {
      clearTimeout(kickoff);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, speakText, speakKey, phase, status]);

  useEffect(() => () => clearFallback(), []);

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

      {status === "ready" && phase === "answering" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600/90 px-4 py-1.5 text-xs font-semibold text-white shadow">
          Listening…
        </div>
      )}

      {status !== "ready" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 px-6 text-center text-white">
          <div className="mb-4 text-5xl">🤖</div>
          <p className="text-xl font-semibold">
            {status === "connecting"
              ? "Connecting to AI interviewer…"
              : "AI Interviewer"}
          </p>
          <p className="mt-2 max-w-md text-sm text-gray-400">
            {status === "fallback"
              ? "Video avatar unavailable. Continue answering using the on-screen questions and timers."
              : "Please allow microphone access when prompted."}
          </p>
          {error && (
            <p className="mt-3 max-w-md text-xs text-amber-300">{error}</p>
          )}
          {speakText && (
            <div className="mt-6 max-w-lg rounded-xl bg-white/10 p-4 text-left text-sm text-gray-100">
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                {phase === "closing"
                  ? "Closing"
                  : phase === "introSpeaking"
                    ? "Introduction"
                    : "Current question"}
              </p>
              <p>{speakText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
