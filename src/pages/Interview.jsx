import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

import {
  LiveAvatarSession,
  SessionEvent,
  SessionState,
} from "@heygen/liveavatar-web-sdk";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Interview() {
  const location = useLocation();

  const job = location.state?.job;
  const applicationId = location.state?.applicationId;

  const videoRef = useRef(null);
  const sessionRef = useRef(null);

  const [sessionState, setSessionState] = useState("idle");
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const [finished, setFinished] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const [manualNote, setManualNote] = useState("");
  const [needsManualNote, setNeedsManualNote] = useState(false);

  /*
   * Start LiveAvatar session
   */
  const startInterview = async () => {
    if (!applicationId) {
      setError(
        "This interview is not linked to an application."
      );
      return;
    }

    try {
      setError("");
      setIsStarting(true);
      setSessionState("creating");

      console.log("Creating LiveAvatar session...");

      const response = await fetch(
        `${API_URL}/api/interview/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicationId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create LiveAvatar session."
        );
      }

      if (!data.sessionToken) {
        throw new Error(
          "LiveAvatar did not return a session token."
        );
      }

      console.log(
        "LiveAvatar session token received."
      );

      /*
       * Create LiveAvatar SDK session.
       *
       * The API key stays on the backend.
       * Only the temporary session token reaches the browser.
       */
      const session = new LiveAvatarSession(
        data.sessionToken,
        {
          voiceChat: true,
        }
      );

      sessionRef.current = session;

      /*
       * Session state changes
       */
      session.on(
        SessionEvent.SESSION_STATE_CHANGED,
        (state) => {
          console.log(
            "LiveAvatar state:",
            state
          );

          setSessionState(state);

          if (
            state === SessionState.CONNECTED
          ) {
            setIsStarting(false);
          }
        }
      );

      /*
       * WebRTC stream ready
       */
      session.on(
        SessionEvent.SESSION_STREAM_READY,
        () => {
          console.log(
            "LiveAvatar stream ready."
          );

          if (videoRef.current) {
            session.attach(videoRef.current);

            videoRef.current
              .play()
              .catch((err) => {
                console.warn(
                  "Video autoplay was blocked:",
                  err
                );
              });
          }
        }
      );

      /*
       * Session disconnected
       */
      session.on(
        SessionEvent.SESSION_DISCONNECTED,
        (reason) => {
          console.log(
            "LiveAvatar disconnected:",
            reason
          );

          setSessionState("disconnected");
        }
      );

      /*
       * Start LiveAvatar
       */
      await session.start();

      console.log(
        "LiveAvatar started."
      );
    } catch (err) {
      console.error(
        "Failed to start LiveAvatar:",
        err
      );

      setError(
        err.message ||
          "Failed to start interview."
      );

      setSessionState("error");
      setIsStarting(false);
      sessionRef.current = null;
    }
  };

  /*
   * Stop LiveAvatar
   */
  const stopInterview = async () => {
    try {
      if (sessionRef.current) {
        console.log(
          "Stopping LiveAvatar..."
        );

        await sessionRef.current.stop();

        sessionRef.current = null;
      }

      setSessionState("stopped");
    } catch (err) {
      console.error(
        "Failed to stop LiveAvatar:",
        err
      );
    }
  };

  /*
   * Finish interview
   *
   * IMPORTANT:
   * The current backend code you showed does NOT have
   * a /finish endpoint.
   *
   * Therefore we first stop the LiveAvatar session.
   *
   * The webhook is responsible for saving the actual
   * interview summary/rating when it receives them.
   */
  const handleFinishInterview = async () => {
    if (!applicationId) return;

    setFinishing(true);
    setError("");

    try {
      /*
       * Stop avatar
       */
      if (sessionRef.current) {
        try {
          await sessionRef.current.stop();
        } catch (err) {
          console.warn(
            "Could not stop LiveAvatar:",
            err
          );
        }

        sessionRef.current = null;
      }

      setSessionState("stopped");

      /*
       * There is currently no finish endpoint
       * in the interviewRoutes.js you provided.
       *
       * The LiveAvatar/HeyGen webhook should update:
       *
       * interviewSummary
       * interviewAudioUrl
       * interviewRating
       * status
       *
       * on the application.
       */

      setFinished(true);
    } catch (err) {
      console.error(
        "Failed to finish interview:",
        err
      );

      setNeedsManualNote(true);
      setError(
        err.message ||
          "Could not finish the interview."
      );
    } finally {
      setFinishing(false);
    }
  };

  /*
   * Manual fallback
   *
   * NOTE:
   * Your current backend routes do not contain a
   * candidate manual-finish endpoint.
   *
   * So this currently only displays the note.
   *
   * If you want this saved to MongoDB, we need to
   * add a backend endpoint for it.
   */
  const handleManualSubmit = async () => {
    if (!applicationId) return;

    setFinishing(true);

    try {
      console.log(
        "Manual interview note:",
        manualNote
      );

      /*
       * No candidate manual-note endpoint exists
       * in the backend code you provided.
       *
       * For now, mark the interview as finished locally.
       */

      setFinished(true);
      setNeedsManualNote(false);
    } catch (err) {
      console.error(
        "Could not save interview notes:",
        err
      );

      setError(
        "Could not save interview notes."
      );
    } finally {
      setFinishing(false);
    }
  };

  /*
   * Cleanup LiveAvatar when leaving page
   */
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current
          .stop()
          .catch((err) => {
            console.error(
              "Failed to cleanup LiveAvatar:",
              err
            );
          });

        sessionRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* No application warning */}
        {!applicationId && (
          <div className="mb-6 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800">
            This interview wasn't started from a job
            application, so your results won't be linked
            to a specific application. Go back to{" "}
            <Link
              to="/"
              className="font-medium underline"
            >
              the homepage
            </Link>{" "}
            and apply to a job to start a linked
            interview.
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">

          {/* =========================
              LIVE AVATAR
          ========================== */}

          <div className="overflow-hidden rounded-2xl bg-black shadow-lg">

            <div className="relative h-[650px] w-full">

              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />

              {/* Loading / connection state */}
              {sessionState !==
                SessionState.CONNECTED && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">

                  <div className="text-center text-white">

                    <div className="mb-4 text-4xl">
                      🤖
                    </div>

                    <p className="text-lg font-medium">
                      AI Interviewer
                    </p>

                    <p className="mt-2 text-sm text-gray-400">

                      {sessionState === "idle"
                        ? "Ready to start"
                        : sessionState === "creating"
                        ? "Creating interview session..."
                        : sessionState === "error"
                        ? "Failed to start"
                        : sessionState === "stopped"
                        ? "Interview stopped"
                        : sessionState === "disconnected"
                        ? "Interview disconnected"
                        : "Connecting..."}

                    </p>

                  </div>

                </div>
              )}

            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 bg-gray-950 p-4">

              {(sessionState === "idle" ||
                sessionState === "stopped" ||
                sessionState === "error" ||
                sessionState === "disconnected") && (

                <button
                  onClick={startInterview}
                  disabled={
                    isStarting ||
                    !applicationId
                  }
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isStarting
                    ? "Starting..."
                    : "Start Interview"}
                </button>

              )}

              {sessionState ===
                SessionState.CONNECTED && (

                <button
                  onClick={handleFinishInterview}
                  disabled={finishing}
                  className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {finishing
                    ? "Finishing..."
                    : "End Interview"}
                </button>

              )}

            </div>

          </div>

          {/* =========================
              INTERVIEW PANEL
          ========================== */}

          <div className="rounded-2xl bg-white p-8 shadow-lg">

            <h1 className="text-3xl font-bold">
              AI Interview
            </h1>

            {job && (
              <p className="mt-2 text-lg text-gray-600">
                {job.title} at {job.company}
              </p>
            )}

            <p className="mt-4 text-gray-600">
              Speak naturally with the AI interviewer.
              It will ask questions related to this job.
            </p>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                <strong>Error:</strong>{" "}
                {error}
              </div>
            )}

            {/* Instructions */}
            <div className="mt-8 rounded-xl bg-gray-100 p-5">

              <h2 className="font-semibold">
                Instructions
              </h2>

              <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">

                <li>
                  Click Start Interview.
                </li>

                <li>
                  Allow microphone access.
                </li>

                <li>
                  Answer each question naturally.
                </li>

                <li>
                  The AI interviewer will continue the
                  conversation automatically.
                </li>

                <li>
                  When you're finished, click End Interview.
                </li>

              </ul>

            </div>

            {/* Session status */}
            <div className="mt-6 rounded-xl border border-gray-200 p-5">

              <p className="text-sm text-gray-500">
                Session status
              </p>

              <p className="mt-1 font-medium capitalize">
                {String(
                  sessionState
                ).toLowerCase()}
              </p>

            </div>

            {/* Manual fallback */}
            {needsManualNote &&
              !finished && (
                <div className="mt-6 rounded-xl border bg-yellow-50 p-5">

                  <h3 className="font-semibold text-gray-800">
                    Finish Interview
                  </h3>

                  <p className="mt-2 text-sm text-gray-600">
                    We couldn't automatically retrieve
                    the interview transcript. You can leave
                    a note about the interview below.
                  </p>

                  <textarea
                    value={manualNote}
                    onChange={(e) =>
                      setManualNote(
                        e.target.value
                      )
                    }
                    rows={5}
                    placeholder="Enter interview notes..."
                    className="mt-4 w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-600"
                  />

                  <button
                    onClick={handleManualSubmit}
                    disabled={finishing}
                    className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {finishing
                      ? "Saving..."
                      : "Submit Interview"}
                  </button>

                </div>
              )}

            {/* Completed */}
            {finished && (
              <div className="mt-6 rounded-xl bg-green-50 p-5 text-green-700">

                <h3 className="font-semibold">
                  Interview completed
                </h3>

                <p className="mt-1 text-sm">
                  Your interview results will be
                  processed and attached to your
                  application.
                </p>

              </div>
            )}

          </div>

        </div>

      </div>
    </>
  );
}