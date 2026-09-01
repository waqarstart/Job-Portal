import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import LiveAvatarInterview from "../components/LiveAvatarInterview";
import useInterviewTimer from "../hooks/useInterviewTimer";
import {
  finishInterviewSession,
  getMyApplication,
  nextInterviewQuestion,
  startInterviewSession,
} from "../services/applicationService";

function formatMmSs(secs) {
  const s = Math.max(0, Number(secs) || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function Interview() {
  const { id: routeId } = useParams();
  const location = useLocation();

  const applicationId =
    routeId || location.state?.applicationId || null;

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");
  const [application, setApplication] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [durationSeconds, setDurationSeconds] = useState(120);
  const [answerSeconds, setAnswerSeconds] = useState(15);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [finishMessage, setFinishMessage] = useState("");

  const localTranscriptRef = useRef([]);
  const finishingLockRef = useRef(false);
  const autoStartTriedRef = useRef(false);
  const sessionStartedRef = useRef(false);
  const timerApiRef = useRef(null);

  const job = application?.job || location.state?.job || null;

  const alreadyCompleted =
    application?.interviewStatus === "completed" ||
    application?.status === "interviewed";

  const handleFinish = useCallback(async () => {
    if (finishingLockRef.current) return;
    finishingLockRef.current = true;
    setFinishing(true);

    try {
      const transcript = localTranscriptRef.current.join("\n");
      await finishInterviewSession(applicationId, {
        sessionId,
        transcript,
      });
      setFinishMessage(
        "Your interview is complete. Our HR team will review your responses and notify you about the next steps."
      );
    } catch (err) {
      console.error(err);
      setFinishMessage(
        "Your interview window has closed. If something went wrong saving results, please contact HR."
      );
    } finally {
      setStarted(false);
      setFinished(true);
      setFinishing(false);
    }
  }, [applicationId, sessionId]);

  const handleAnswerTimeout = useCallback(async () => {
    const api = timerApiRef.current;
    if (!api) return;

    const nextIdx = api.currentQuestionIndex + 1;
    if (nextIdx >= questions.length) {
      api.finish();
      return;
    }

    api.advanceQuestion();
    try {
      await nextInterviewQuestion(applicationId);
    } catch (err) {
      console.error("Failed to sync next question:", err);
    }
  }, [applicationId, questions.length]);

  const timer = useInterviewTimer({
    durationSeconds,
    answerSeconds,
    questionCount: questions.length,
    onSessionEnd: handleFinish,
    onAnswerTimeout: handleAnswerTimeout,
  });

  timerApiRef.current = timer;

  useEffect(() => {
    if (!applicationId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getMyApplication(applicationId)
      .then((app) => {
        if (cancelled) return;
        setApplication(app);
        if (
          app.interviewStatus === "completed" ||
          app.status === "interviewed"
        ) {
          setFinished(true);
          setFinishMessage(
            "Your interview is complete. Our HR team will review your responses and notify you about the next steps."
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Could not load this interview."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  const currentQuestion = questions[timer.currentQuestionIndex] || null;

  const progressPct = useMemo(() => {
    if (!questions.length) return 0;
    const completedSteps =
      timer.phase === "done"
        ? questions.length
        : timer.currentQuestionIndex;
    return Math.min(
      100,
      Math.round((completedSteps / questions.length) * 100)
    );
  }, [questions.length, timer.currentQuestionIndex, timer.phase]);

  const beginInterview = useCallback(async () => {
    if (!applicationId || starting || finished || alreadyCompleted) return;

    setStarting(true);
    setError("");
    finishingLockRef.current = false;
    sessionStartedRef.current = false;
    localTranscriptRef.current = [];

    try {
      const data = await startInterviewSession(applicationId);
      setQuestions(data.questions || []);
      setDurationSeconds(data.durationSeconds || 120);
      setAnswerSeconds(data.answerSeconds || 15);
      setSessionToken(data.sessionToken || null);
      setSessionId(data.sessionId || null);
      setStarted(true);
      setFinished(false);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Could not start the interview."
      );
    } finally {
      setStarting(false);
    }
  }, [applicationId, starting, finished, alreadyCompleted]);

  useEffect(() => {
    if (!started || finished || !questions.length) return;
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;
    timer.startSession();
  }, [started, finished, questions.length, timer]);

  useEffect(() => {
    if (!started) sessionStartedRef.current = false;
  }, [started]);

  useEffect(() => {
    if (autoStartTriedRef.current) return;
    if (!location.state?.autoStart) return;
    if (loading || !applicationId || alreadyCompleted || finished) return;
    autoStartTriedRef.current = true;
    beginInterview();
  }, [
    location.state?.autoStart,
    loading,
    applicationId,
    alreadyCompleted,
    finished,
    beginInterview,
  ]);

  const onAvatarStopSpeaking = useCallback(() => {
    if (!started || finished) return;
    timer.startAnswerWindow();
  }, [started, finished, timer]);

  const onLocalTranscriptLine = useCallback((role, text) => {
    if (!text) return;
    localTranscriptRef.current.push(`${role}: ${text}`);
  }, []);

  const handleManualEnd = () => {
    timer.finish();
  };

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
            This interview wasn&apos;t started from a job application. Go back to{" "}
            <Link to="/dashboard/interviews" className="font-medium underline">
              Interviews
            </Link>{" "}
            and start from an eligible application.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-black shadow-lg">
            <div className="relative w-full">
              {finished ? (
                <div className="flex h-[650px] items-center justify-center bg-gray-900">
                  <div className="text-center text-white px-6">
                    <div className="mb-4 text-5xl">✅</div>
                    <p className="text-xl font-semibold">Interview Completed</p>
                    <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
                      {finishMessage ||
                        "Thank you for completing your interview."}
                    </p>
                  </div>
                </div>
              ) : (
                <LiveAvatarInterview
                  sessionToken={sessionToken}
                  active={started && !finished}
                  questionText={currentQuestion?.text || ""}
                  questionIndex={timer.currentQuestionIndex}
                  onAvatarStopSpeaking={onAvatarStopSpeaking}
                  onSessionId={setSessionId}
                  onLocalTranscriptLine={onLocalTranscriptLine}
                  onError={(err) =>
                    console.warn("LiveAvatar fallback mode:", err?.message)
                  }
                />
              )}
            </div>

            <div className="flex items-center justify-center gap-4 bg-gray-950 p-4">
              {!started && !finished && (
                <button
                  onClick={beginInterview}
                  disabled={!applicationId || starting || alreadyCompleted}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {starting ? "Starting…" : "Start Interview"}
                </button>
              )}

              {started && !finished && (
                <button
                  onClick={handleManualEnd}
                  disabled={finishing}
                  className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {finishing ? "Ending…" : "End Interview"}
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

            <p className="mt-4 text-gray-600">
              You have up to {formatMmSs(durationSeconds)} total. After each
              question is asked, you have {answerSeconds} seconds to answer
              before the next question.
            </p>

            {started && !finished && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Session time
                  </p>
                  <p
                    className={`mt-1 text-3xl font-bold tabular-nums ${
                      timer.sessionRemaining <= 15
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    {formatMmSs(timer.sessionRemaining)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Answer window
                  </p>
                  <p
                    className={`mt-1 text-3xl font-bold tabular-nums ${
                      timer.phase === "answering"
                        ? timer.answerRemaining <= 5
                          ? "text-red-600"
                          : "text-blue-600"
                        : "text-gray-400"
                    }`}
                  >
                    {timer.phase === "answering"
                      ? formatMmSs(timer.answerRemaining)
                      : timer.phase === "avatarSpeaking"
                        ? "Listening…"
                        : "—"}
                  </p>
                </div>
              </div>
            )}

            {questions.length > 0 && (started || finished) && (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Question{" "}
                    {Math.min(
                      timer.currentQuestionIndex + 1,
                      questions.length
                    )}{" "}
                    of {questions.length}
                  </span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {started && !finished && currentQuestion && (
              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {currentQuestion.source === "hr"
                    ? "Job question"
                    : currentQuestion.source === "cv"
                      ? "CV technical question"
                      : "Interview question"}
                </p>
                <p className="mt-2 font-medium text-gray-900">
                  {currentQuestion.text}
                </p>
              </div>
            )}

            <div className="mt-8 rounded-xl bg-gray-100 p-5">
              <h2 className="font-semibold">Instructions</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
                <li>Click Start Interview and allow microphone access.</li>
                <li>
                  Job-related questions are asked first, then CV-based technical
                  questions.
                </li>
                <li>
                  After the AI finishes asking, you have {answerSeconds} seconds
                  to answer.
                </li>
                <li>
                  When time runs out the next question starts automatically.
                </li>
                <li>
                  The session auto-closes after {formatMmSs(durationSeconds)}.
                </li>
              </ul>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Interview status</p>
              <p className="mt-1 font-medium capitalize text-gray-800">
                {finished
                  ? "Completed"
                  : started
                    ? timer.phase === "answering"
                      ? "Your turn to answer"
                      : "In progress"
                    : alreadyCompleted
                      ? "Completed"
                      : "Ready to start"}
              </p>
            </div>

            {finished && (
              <div className="mt-6 rounded-xl bg-green-50 p-5 text-green-800">
                <h3 className="font-semibold">Interview completed</h3>
                <p className="mt-1 text-sm">
                  {finishMessage ||
                    "Your interview has been completed. Our HR team will review and notify you further."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
