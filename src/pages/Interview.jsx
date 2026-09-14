import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  AgentEventsEnum,
  LiveAvatarSession,
  SessionEvent,
  SessionState,
} from "@heygen/liveavatar-web-sdk";
import Navbar from "../components/Navbar";
import {
  finishInterviewSession,
  getMyApplication,
  startInterviewSession,
} from "../services/applicationService";

const INTERVIEW_DURATION_SECONDS = 120;
const CLOSING_AT_SECONDS = 105;

const CLOSING_MESSAGE =
  "Thank you for your time. We are now reaching the end of this interview. Our HR team will review your interview and contact you if you are selected for the next stage.";

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export default function Interview() {
  const { id: routeId } = useParams();
  const location = useLocation();

  const applicationId = routeId || location.state?.applicationId || null;

  const videoRef = useRef(null);
  const sessionRef = useRef(null);
  const intervalRef = useRef(null);
  const closingTimeoutRef = useRef(null);
  const endTimeoutRef = useRef(null);
  const endingRef = useRef(false);

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Ready");
  const [secondsRemaining, setSecondsRemaining] = useState(
    INTERVIEW_DURATION_SECONDS
  );

  const job = application?.job || location.state?.job || null;

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (closingTimeoutRef.current) {
      clearTimeout(closingTimeoutRef.current);
      closingTimeoutRef.current = null;
    }

    if (endTimeoutRef.current) {
      clearTimeout(endTimeoutRef.current);
      endTimeoutRef.current = null;
    }
  }, []);

  const stopAvatarSession = useCallback(async () => {
    const session = sessionRef.current;
    sessionRef.current = null;

    if (!session) return;

    try {
      await session.stop();
    } catch (err) {
      console.warn("Could not stop LiveAvatar session cleanly:", err);
    }
  }, []);

  const endInterview = useCallback(
    async (manual = false) => {
      if (endingRef.current) return;
      endingRef.current = true;

      clearTimers();
      setEnding(true);
      setStatus("Ending interview…");

      const session = sessionRef.current;
      const sessionId = session?.sessionId || null;

      try {
        await stopAvatarSession();

        if (applicationId) {
          await finishInterviewSession(applicationId, {
            sessionId,
            durationSeconds: manual
              ? INTERVIEW_DURATION_SECONDS - secondsRemaining
              : INTERVIEW_DURATION_SECONDS,
          });
        }
      } catch (err) {
        console.error("Failed to finish interview:", err);
        setError(
          err?.response?.data?.message ||
            "The interview ended, but the result could not be saved automatically."
        );
      } finally {
        setStarted(false);
        setFinished(true);
        setEnding(false);
        setSecondsRemaining(0);
        setStatus("Completed");
      }
    },
    [applicationId, clearTimers, secondsRemaining, stopAvatarSession]
  );

  const sayClosingMessage = useCallback(() => {
    const session = sessionRef.current;
    if (!session || endingRef.current) return;

    setStatus("Closing remarks");

    try {
      session.repeat(CLOSING_MESSAGE);
    } catch (err) {
      console.warn("Could not play closing message:", err);
    }
  }, []);

  const startInterview = useCallback(async () => {
    if (!applicationId || starting || started || finished) return;

    setStarting(true);
    setError("");
    setStatus("Creating interview session…");
    endingRef.current = false;

    try {
      // The backend should create the LiveAvatar session using the context ID
      // stored in its environment (for example LIVEAVATAR_CONTEXT_ID).
      // No question list is created or managed on this page.
      const data = await startInterviewSession(applicationId);

      if (!data?.sessionToken) {
        throw new Error("The backend did not return a LiveAvatar session token.");
      }

      setStatus("Connecting to AI interviewer…");

      const session = new LiveAvatarSession(data.sessionToken, {
        voiceChat: true,
      });

      sessionRef.current = session;

      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        if (!videoRef.current) return;

        try {
          session.attach(videoRef.current);
          videoRef.current.play?.().catch(() => {});
        } catch (err) {
          console.error("Could not attach LiveAvatar video:", err);
        }
      });

      session.on(SessionEvent.SESSION_STATE_CHANGED, (state) => {
        console.log("LiveAvatar state:", state);
        if (state === SessionState.CONNECTED) {
          setStatus("Interview in progress");
        }
      });

      session.on(SessionEvent.SESSION_DISCONNECTED, (reason) => {
        console.error("LiveAvatar disconnected:", reason);
        if (!endingRef.current) {
          setError(`LiveAvatar disconnected: ${String(reason || "unknown reason")}`);
          setStatus("Disconnected");
        }
      });

      session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
        if (!endingRef.current) setStatus("AI interviewer speaking");
      });

      session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
        if (!endingRef.current) setStatus("Listening to you");
      });

      console.log("Starting LiveAvatar SDK session…");
      await session.start();
      console.log("LiveAvatar SDK session started", session.sessionId);

      setStarted(true);
      setSecondsRemaining(INTERVIEW_DURATION_SECONDS);
      setStatus("Interview in progress");

      const startedAt = Date.now();

      intervalRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = Math.max(
          0,
          INTERVIEW_DURATION_SECONDS - elapsedSeconds
        );
        setSecondsRemaining(remaining);
      }, 250);

      closingTimeoutRef.current = setTimeout(() => {
        sayClosingMessage();
      }, CLOSING_AT_SECONDS * 1000);

      endTimeoutRef.current = setTimeout(() => {
        endInterview(false);
      }, INTERVIEW_DURATION_SECONDS * 1000);
    } catch (err) {
      console.error("Could not start interview:", err);
      await stopAvatarSession();
      clearTimers();
      const providerDetails = err?.response?.data?.details;
      const providerMessage =
        err?.response?.data?.message ||
        providerDetails?.message ||
        providerDetails?.error?.message ||
        providerDetails?.detail ||
        err?.message ||
        "Could not start the interview.";

      setError(providerMessage);
      setStatus("Ready");
    } finally {
      setStarting(false);
    }
  }, [
    applicationId,
    clearTimers,
    endInterview,
    finished,
    sayClosingMessage,
    started,
    starting,
    stopAvatarSession,
  ]);

  useEffect(() => {
    if (!applicationId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    getMyApplication(applicationId)
      .then((data) => {
        if (!cancelled) setApplication(data);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("Could not load application details:", err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  useEffect(() => {
    return () => {
      clearTimers();

      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) {
        session.stop().catch(() => {});
      }
    };
  }, [clearTimers]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 py-16 text-center text-gray-500">
          Loading interview…
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {!applicationId && (
          <div className="mb-6 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800">
            This interview is not linked to an application. Go back to{" "}
            <Link to="/dashboard/interviews" className="font-medium underline">
              Interviews
            </Link>
            .
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-black shadow-lg">
            <div className="relative h-[650px] w-full bg-black">
              {finished ? (
                <div className="flex h-full items-center justify-center bg-gray-900 px-6 text-center text-white">
                  <div>
                    <div className="mb-4 text-5xl">✅</div>
                    <h2 className="text-2xl font-semibold">
                      Interview Completed
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-sm text-gray-400">
                      Thank you. Your interview has been submitted for HR review.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`h-full w-full object-cover ${
                      started ? "block" : "hidden"
                    }`}
                  />

                  {!started && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 px-6 text-center text-white">
                      <div>
                        <div className="mb-4 text-5xl">🤖</div>
                        <h2 className="text-2xl font-semibold">AI Interviewer</h2>
                        <p className="mt-3 text-sm text-gray-400">
                          Click Start Interview and allow microphone access.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 bg-gray-950 p-4">
              {!started && !finished && (
                <button
                  type="button"
                  onClick={startInterview}
                  disabled={!applicationId || starting}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {starting ? "Starting…" : "Start Interview"}
                </button>
              )}

              {started && !finished && (
                <button
                  type="button"
                  onClick={() => endInterview(true)}
                  disabled={ending}
                  className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {ending ? "Ending…" : "End Interview"}
                </button>
              )}

              {finished && (
                <Link
                  to="/dashboard/interviews"
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
                >
                  Back to Interviews
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <h1 className="text-3xl font-bold">AI Interview</h1>

            {job && (
              <p className="mt-2 text-lg text-gray-600">
                {job.title}
                {job.company ? ` at ${job.company}` : ""}
              </p>
            )}

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Time remaining
              </p>
              <p className="mt-2 text-4xl font-bold tabular-nums text-gray-900">
                {formatTime(secondsRemaining)}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                The interview ends automatically at 2:00.
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Status</p>
              <p className="mt-1 font-medium text-gray-900">{status}</p>
            </div>

            {started && !finished && secondsRemaining <= 15 && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                <p className="font-semibold">Interview ending</p>
                <p className="mt-1 text-sm">
                  The AI interviewer is giving the closing message now.
                </p>
              </div>
            )}

            <div className="mt-6 rounded-xl bg-gray-100 p-5">
              <h2 className="font-semibold">How this works</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
                <li>The interview conversation comes from your LiveAvatar context.</li>
                <li>No frontend question queue is used.</li>
                <li>The total interview length is exactly 2 minutes.</li>
                <li>A closing message plays at 1:45.</li>
                <li>The session stops automatically at 2:00.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
