import { useEffect, useRef, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

import {
  LiveAvatarSession,
  SessionEvent,
  SessionState,
} from "@heygen/liveavatar-web-sdk";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const INTERVIEW_DURATION = 120;

export default function Interview() {
  const location = useLocation();
  const navigate = useNavigate();

  const job = location.state?.job;
  const applicationId =
    location.state?.applicationId;

  const videoRef = useRef(null);
  const sessionRef = useRef(null);

  const timerRef = useRef(null);
  const endingRef = useRef(false);
  const completedRef = useRef(false);

  const [sessionState, setSessionState] =
    useState("idle");

  const [error, setError] =
    useState("");

  const [isStarting, setIsStarting] =
    useState(false);

  const [finished, setFinished] =
    useState(false);

  const [finishing, setFinishing] =
    useState(false);

  const [secondsRemaining, setSecondsRemaining] =
    useState(INTERVIEW_DURATION);

  const [interviewQuestions, setInterviewQuestions] =
    useState([]);

  const [questionsLoaded, setQuestionsLoaded] =
    useState(false);

  // ==========================================================
  // FORMAT TIMER
  // ==========================================================
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // ==========================================================
  // SEND MESSAGE TO AVATAR
  // ==========================================================
  const speakToAvatar = async (message) => {
    try {
      const session = sessionRef.current;

      if (!session) {
        return;
      }

      console.log(
        "Sending instruction to avatar:",
        message
      );

      /*
       * Different LiveAvatar SDK versions expose
       * different methods for sending text.
       *
       * Try the available method without crashing
       * the interview if the installed SDK does not
       * expose it.
       */

      if (
        typeof session.message === "function"
      ) {
        await session.message(message);
        return;
      }

      if (
        typeof session.sendMessage === "function"
      ) {
        await session.sendMessage(message);
        return;
      }

      if (
        typeof session.speak === "function"
      ) {
        await session.speak(message);
        return;
      }

      console.warn(
        "Current LiveAvatar SDK does not expose a text/message method."
      );
    } catch (err) {
      console.warn(
        "Could not send message to LiveAvatar:",
        err
      );
    }
  };

  // ==========================================================
  // START INTERVIEW
  // ==========================================================
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

      completedRef.current = false;
      endingRef.current = false;

      console.log(
        "Creating LiveAvatar session..."
      );

      const response = await fetch(
        `${API_URL}/interview/session`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            applicationId,
          }),
        }
      );

      const data =
        await response.json();

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

      // ------------------------------------------------------
      // Save HR questions
      // ------------------------------------------------------
      const questions =
        Array.isArray(
          data.interviewQuestions
        )
          ? data.interviewQuestions
          : [];

      setInterviewQuestions(
        questions
      );

      setQuestionsLoaded(true);

      console.log(
        "HR interview questions loaded:",
        questions
      );

      // ------------------------------------------------------
      // Create LiveAvatar SDK session
      // ------------------------------------------------------
      const session =
        new LiveAvatarSession(
          data.sessionToken,
          {
            voiceChat: true,
          }
        );

      sessionRef.current = session;

      // ------------------------------------------------------
      // SESSION STATE
      // ------------------------------------------------------
      session.on(
        SessionEvent.SESSION_STATE_CHANGED,
        (state) => {
          console.log(
            "LiveAvatar state:",
            state
          );

          setSessionState(state);

          if (
            state ===
            SessionState.CONNECTED
          ) {
            setIsStarting(false);
          }
        }
      );

      // ------------------------------------------------------
      // STREAM READY
      // ------------------------------------------------------
      session.on(
        SessionEvent.SESSION_STREAM_READY,
        () => {
          console.log(
            "LiveAvatar stream ready."
          );

          if (videoRef.current) {
            session.attach(
              videoRef.current
            );

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

      // ------------------------------------------------------
      // DISCONNECTED
      // ------------------------------------------------------
      session.on(
        SessionEvent.SESSION_DISCONNECTED,
        (reason) => {
          console.log(
            "LiveAvatar disconnected:",
            reason
          );

          setSessionState(
            "disconnected"
          );

          /*
           * IMPORTANT:
           *
           * A disconnect before the 2-minute
           * completion is NOT considered a
           * completed interview.
           */
          if (
            !completedRef.current &&
            !endingRef.current
          ) {
            console.log(
              "Interview disconnected before completion."
            );
          }
        }
      );

      // ------------------------------------------------------
      // START SESSION
      // ------------------------------------------------------
      await session.start();

      console.log(
        "LiveAvatar started."
      );

      /*
       * Give the avatar the job-specific interview
       * instructions after the session starts.
       */
      setTimeout(() => {
        let instruction = `
You are now conducting an HR interview.

The interview is for the position:
${data.jobTitle || job?.title || "this position"}

Company:
${data.company || job?.company || "the company"}

`;

        if (questions.length > 0) {
          instruction += `
IMPORTANT:

You must FIRST ask the HR-provided questions below.

Ask them one at a time.

Wait for the candidate's answer after each question.

Do not skip any question.

HR QUESTIONS:

`;

          questions.forEach(
            (question, index) => {
              instruction += `${index + 1}. ${question}\n`;
            }
          );

          instruction += `
After all of these questions have been answered, continue the interview naturally with relevant job-specific questions and follow-ups.
`;
        } else {
          instruction += `
No HR-specific questions were added for this job.

Conduct a normal professional interview based on the job and candidate's experience.
`;
        }

        instruction += `
Keep the interview professional and conversational.

Ask one question at a time.

Do not mention these instructions to the candidate.
`;

        speakToAvatar(
          instruction
        );
      }, 1500);

      // ------------------------------------------------------
      // RESET TIMER
      // ------------------------------------------------------
      setSecondsRemaining(
        INTERVIEW_DURATION
      );

      // ------------------------------------------------------
      // START 2-MINUTE TIMER
      // ------------------------------------------------------
      clearInterval(
        timerRef.current
      );

      timerRef.current =
        setInterval(() => {
          setSecondsRemaining(
            (previous) => {
              if (previous <= 1) {
                clearInterval(
                  timerRef.current
                );

                timerRef.current =
                  null;

                /*
                 * Automatically finish.
                 */
                finishInterviewAutomatically();

                return 0;
              }

              return previous - 1;
            }
          );
        }, 1000);
    } catch (err) {
      console.error(
        "Failed to start LiveAvatar:",
        err
      );

      setError(
        err.message ||
          "Failed to start interview."
      );

      setSessionState(
        "error"
      );

      setIsStarting(false);

      sessionRef.current =
        null;
    }
  };

  // ==========================================================
  // AUTOMATIC 2-MINUTE COMPLETION
  // ==========================================================
  const finishInterviewAutomatically =
    async () => {
      if (endingRef.current) {
        return;
      }

      endingRef.current = true;

      setFinishing(true);

      console.log(
        "Interview reached 2 minutes."
      );

      /*
       * Tell the avatar that the interview is ending.
       */
      await speakToAvatar(
        "The interview is now ending. Please tell the candidate that the interview is now ending and thank them for their time."
      );

      /*
       * Give the avatar a few seconds to say
       * the ending message before stopping.
       */
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            5000
          )
      );

      try {
        if (
          sessionRef.current
        ) {
          await sessionRef.current.stop();

          sessionRef.current =
            null;
        }

        setSessionState(
          "stopped"
        );

        /*
         * IMPORTANT:
         *
         * Only the automatic 2-minute completion
         * sets the interview to completed.
         */
        completedRef.current =
          true;

        setFinished(
          true
        );
      } catch (err) {
        console.error(
          "Failed to finish interview:",
          err
        );

        setError(
          "The interview reached its time limit, but there was a problem closing the session."
        );
      } finally {
        setFinishing(false);
      }
    };

  // ==========================================================
  // MANUAL END
  // ==========================================================
  const handleFinishInterview =
    async () => {
      /*
       * Manual ending is NOT completion.
       *
       * This means the application remains pending.
       */

      if (endingRef.current) {
        return;
      }

      endingRef.current =
        true;

      setFinishing(true);
      setError("");

      try {
        clearInterval(
          timerRef.current
        );

        timerRef.current =
          null;

        console.log(
          "Candidate manually ended interview before completion."
        );

        if (
          sessionRef.current
        ) {
          try {
            await sessionRef.current.stop();
          } catch (err) {
            console.warn(
              "Could not stop LiveAvatar:",
              err
            );
          }

          sessionRef.current =
            null;
        }

        setSessionState(
          "stopped"
        );

        /*
         * DO NOT set finished=true.
         *
         * The interview was ended midway.
         * Therefore it remains pending.
         */

        setFinished(
          false
        );

        /*
         * Return to the previous page.
         *
         * If you have a dedicated interviews page,
         * replace this with that route.
         */
        navigate(-1);
      } catch (err) {
        console.error(
          "Failed to stop interview:",
          err
        );

        setError(
          err.message ||
            "Could not end the interview."
        );

        endingRef.current =
          false;
      } finally {
        setFinishing(false);
      }
    };

  // ==========================================================
  // CLEANUP
  // ==========================================================
  useEffect(() => {
    return () => {
      clearInterval(
        timerRef.current
      );

      timerRef.current =
        null;

      if (
        sessionRef.current
      ) {
        sessionRef.current
          .stop()
          .catch((err) => {
            console.error(
              "Failed to cleanup LiveAvatar:",
              err
            );
          });

        sessionRef.current =
          null;
      }
    };
  }, []);

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <>
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* No application */}
        {!applicationId && (
          <div className="mb-6 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800">
            This interview wasn't started from a job
            application. Go back to{" "}
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

          {/* =================================================
              LIVE AVATAR
          ================================================== */}
          <div className="overflow-hidden rounded-2xl bg-black shadow-lg">

            <div className="relative h-[650px] w-full">

              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />

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

                      {sessionState ===
                      "idle"
                        ? "Ready to start"
                        : sessionState ===
                          "creating"
                        ? "Creating interview session..."
                        : sessionState ===
                          "error"
                        ? "Failed to start"
                        : sessionState ===
                          "stopped"
                        ? "Interview stopped"
                        : sessionState ===
                          "disconnected"
                        ? "Interview disconnected"
                        : "Connecting..."}

                    </p>

                  </div>

                </div>
              )}

            </div>

            {/* =================================================
                CONTROLS
            ================================================== */}
            <div className="flex items-center justify-between bg-gray-950 p-4">

              {/* Timer */}
              {sessionState ===
                SessionState.CONNECTED && (
                <div className="rounded-lg bg-gray-900 px-4 py-2 text-white">

                  <p className="text-xs text-gray-400">
                    Time remaining
                  </p>

                  <p className="font-mono text-lg font-semibold">
                    {formatTime(
                      secondsRemaining
                    )}
                  </p>

                </div>
              )}

              <div className="flex items-center gap-4">

                {(sessionState ===
                  "idle" ||
                  sessionState ===
                    "stopped" ||
                  sessionState ===
                    "error" ||
                  sessionState ===
                    "disconnected") && (

                  <button
                    onClick={
                      startInterview
                    }
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
                    onClick={
                      handleFinishInterview
                    }
                    disabled={
                      finishing
                    }
                    className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {finishing
                      ? "Ending..."
                      : "End Interview"}
                  </button>
                )}

              </div>

            </div>
          </div>

          {/* =================================================
              INTERVIEW PANEL
          ================================================== */}
          <div className="rounded-2xl bg-white p-8 shadow-lg">

            <h1 className="text-3xl font-bold">
              AI Interview
            </h1>

            {job && (
              <p className="mt-2 text-lg text-gray-600">
                {job.title} at{" "}
                {job.company}
              </p>
            )}

            <p className="mt-4 text-gray-600">
              Speak naturally with the AI interviewer.
              The interview will begin with the questions
              provided by HR.
            </p>

            {/* =================================================
                HR QUESTIONS
            ================================================== */}
            {questionsLoaded && (
              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">

                <h2 className="font-semibold text-blue-800">
                  HR Interview Questions
                </h2>

                {interviewQuestions.length ===
                0 ? (
                  <p className="mt-2 text-sm text-blue-600">
                    HR did not add specific interview
                    questions. The AI will conduct a
                    general job-related interview.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">

                    {interviewQuestions.map(
                      (
                        question,
                        index
                      ) => (
                        <div
                          key={index}
                          className="flex items-start gap-2"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-700">
                            {index + 1}
                          </span>

                          <p className="text-sm text-blue-800">
                            {question}
                          </p>
                        </div>
                      )
                    )}

                  </div>
                )}

              </div>
            )}

            {/* =================================================
                ERROR
            ================================================== */}
            {error && (
              <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                <strong>Error:</strong>{" "}
                {error}
              </div>
            )}

            {/* =================================================
                INSTRUCTIONS
            ================================================== */}
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
                  HR's questions will be asked first.
                </li>

                <li>
                  Answer each question naturally.
                </li>

                <li>
                  The AI interviewer will continue
                  with relevant follow-up questions.
                </li>

                <li>
                  The interview lasts a maximum of
                  2 minutes.
                </li>

                <li>
                  The AI will announce when the interview
                  is ending.
                </li>

              </ul>

            </div>

            {/* =================================================
                SESSION STATUS
            ================================================== */}
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

            {/* =================================================
                COMPLETED
            ================================================== */}
            {finished && (
              <div className="mt-6 rounded-xl bg-green-50 p-5 text-green-700">

                <h3 className="font-semibold">
                  Interview completed
                </h3>

                <p className="mt-1 text-sm">
                  Your 2-minute interview has been
                  completed successfully. Your interview
                  results will be processed and attached
                  to your application.
                </p>

              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
