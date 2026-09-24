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

const DEFAULT_CLOSING =
  "Thank you for your time. I'll send my remarks to the HR team. If you are selected, they will contact you for the next stage.";

function formatMmSs(secs) {
  const s = Math.max(0, Number(secs) || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function Interview() {
  const { id: routeId } = useParams();
  const location = useLocation();
  const applicationId = routeId || location.state?.applicationId || null;

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
  const [sandbox, setSandbox] = useState(false);
  const [introText, setIntroText] = useState("");
  const [closingRemarks, setClosingRemarks] = useState(DEFAULT_CLOSING);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [finishMessage, setFinishMessage] = useState("");
  const [avatarFallback, setAvatarFallback] = useState(false);

  const turnsRef = useRef([]);
  const currentAnswerRef = useRef("");
  const localLogRef = useRef([]);
  const finishingLockRef = useRef(false);
  const autoStartTriedRef = useRef(false);
  const sessionStartedRef = useRef(false);
  const timerApiRef = useRef(null);
  const questionSpokenRef = useRef(new Set());

  const job = application?.job || location.state?.job || null;

  const alreadyCompleted =
    application?.interviewStatus === "completed" ||
    application?.status === "interviewed";

  const flushCurrentAnswer = useCallback(() => {
    const turns = turnsRef.current;
    if (!turns.length) return;
    const last = turns[turns.length - 1];
    if (!last || ["intro", "closing"].includes(last.source)) return;
    const chunk = currentAnswerRef.current.trim();
    if (chunk) {
      last.answer = last.answer
        ? `${last.answer} ${chunk}`.trim()
        : chunk;
    }
    currentAnswerRef.current = "";
  }, []);

  const handleFinish = useCallback(async () => {
    if (finishingLockRef.current) return;
    finishingLockRef.current = true;
    setFinishing(true);
    flushCurrentAnswer();

    try {
      await finishInterviewSession(applicationId, {
        sessionId,
        turns: turnsRef.current,
        transcript: turnsRef.current
          .filter((t) => !["intro", "closing"].includes(t.source))
          .map(
            (t, i) =>
              `Q${i + 1}. ${t.question}\nCandidate: ${
                t.answer?.trim() || "No answer recorded."
              }`
          )
          .join("\n\n"),
        rawLog: localLogRef.current,
      });
      setFinishMessage(closingRemarks || DEFAULT_CLOSING);
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
  }, [applicationId, sessionId, closingRemarks, flushCurrentAnswer]);

  const handleAnswerTimeout = useCallback(async () => {
    const api = timerApiRef.current;
    if (!api) return;
    flushCurrentAnswer();
    api.advanceQuestion();
    try {
      await nextInterviewQuestion(applicationId);
    } catch (err) {
      console.error("Failed to sync next question:", err);
    }
  }, [applicationId, flushCurrentAnswer]);

  const handleClosingStart = useCallback(() => {
    flushCurrentAnswer();
    const text = closingRemarks || DEFAULT_CLOSING;
    turnsRef.current.push({
      order: turnsRef.current.length,
      question: text,
      source: "closing",
      answer: "",
    });
  }, [closingRemarks, flushCurrentAnswer]);

  const timer = useInterviewTimer({
    durationSeconds,
    answerSeconds,
    questionCount: questions.length,
    onSessionEnd: handleFinish,
    onAnswerTimeout: handleAnswerTimeout,
    onClosingStart: handleClosingStart,
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
          setFinishMessage(DEFAULT_CLOSING);
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

  const speakText =
    timer.phase === "closing"
      ? closingRemarks || DEFAULT_CLOSING
      : timer.phase === "introSpeaking"
        ? introText
        : currentQuestion?.text || "";

  const speakKey =
    timer.phase === "closing"
      ? "closing"
      : timer.phase === "introSpeaking"
        ? "intro"
        : `q-${timer.currentQuestionIndex}`;

  // Register question turn when we start speaking it
  useEffect(() => {
    if (!started || finished) return;
    if (timer.phase !== "avatarSpeaking" || !currentQuestion?.text) return;
    const key = `q-${timer.currentQuestionIndex}`;
    if (questionSpokenRef.current.has(key)) return;
    questionSpokenRef.current.add(key);
    flushCurrentAnswer();
    turnsRef.current.push({
      order: turnsRef.current.length,
      question: currentQuestion.text,
      source: currentQuestion.source || "hr",
      answer: "",
    });
  }, [
    started,
    finished,
    timer.phase,
    timer.currentQuestionIndex,
    currentQuestion,
    flushCurrentAnswer,
  ]);

  useEffect(() => {
    if (!started || finished) return;
    if (timer.phase !== "introSpeaking" || !introText) return;
    if (questionSpokenRef.current.has("intro")) return;
    questionSpokenRef.current.add("intro");
    turnsRef.current.push({
      order: 0,
      question: introText,
      source: "intro",
      answer: "",
    });
  }, [started, finished, timer.phase, introText]);

  const progressPct = useMemo(() => {
    if (!questions.length) return 0;
    if (timer.phase === "closing" || timer.phase === "done") return 100;
    if (timer.phase === "introSpeaking") return 0;
    return Math.min(
      100,
      Math.round((timer.currentQuestionIndex / questions.length) * 100)
    );
  }, [questions.length, timer.currentQuestionIndex, timer.phase]);

  const beginInterview = useCallback(async () => {
    if (!applicationId || starting || finished || alreadyCompleted) return;

    setStarting(true);
    setError("");
    setAvatarFallback(false);
    finishingLockRef.current = false;
    sessionStartedRef.current = false;
    turnsRef.current = [];
    currentAnswerRef.current = "";
    localLogRef.current = [];
    questionSpokenRef.current = new Set();

    try {
      const data = await startInterviewSession(applicationId);
      setQuestions(data.questions || []);
      setDurationSeconds(data.durationSeconds || 120);
      setAnswerSeconds(data.answerSeconds || 15);
      setSandbox(Boolean(data.sandbox));
      setIntroText(
        data.introText ||
          `Hi, I'm your AI interviewer from ${
            data.companyName || data.job?.company || "our company"
          }. Today we'll talk about the ${
            data.jobTitle || data.job?.title || "role"
          } role. Let's begin.`
      );
      setClosingRemarks(data.closingRemarks || DEFAULT_CLOSING);
      setSessionToken(data.sessionToken || null);
      setSessionId(data.sessionId || null);
      if (!data.sessionToken) setAvatarFallback(true);
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
    if (!started || finished || !questions.length || !introText) return;
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;
    timer.startSession();
  }, [started, finished, questions.length, introText, timer]);

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

  const onIntroSpoken = useCallback(() => {
    timer.completeIntro();
  }, [timer]);

  const onAvatarStopSpeaking = useCallback(
    (speakKeyFromAvatar) => {
      if (!started || finished) return;
      if (timer.phase === "closing" || timer.phase === "introSpeaking") return;
      timer.startAnswerWindow(
        speakKeyFromAvatar || `q-${timer.currentQuestionIndex}`
      );
    },
    [started, finished, timer]
  );

  const onClosingSpoken = useCallback(() => {
    timer.completeClosing();
  }, [timer]);

  const onLocalTranscriptLine = useCallback((role, text) => {
    if (!text) return;
    localLogRef.current.push(`${role}: ${text}`);
  }, []);

  const onUserAnswerChunk = useCallback((text) => {
    if (!text) return;
    currentAnswerRef.current = currentAnswerRef.current
      ? `${currentAnswerRef.current} ${text}`.trim()
      : text.trim();
  }, []);

  const handleManualEnd = () => {
    timer.finish();
  };

  const phaseLabel =
    finished || timer.phase === "done"
      ? "Completed"
      : timer.phase === "closing"
        ? "Closing remarks"
        : timer.phase === "introSpeaking"
          ? "Introduction"
          : timer.phase === "answering"
            ? "Your turn to answer"
            : timer.phase === "avatarSpeaking"
              ? "Avatar asking"
              : started
                ? "In progress"
                : alreadyCompleted
                  ? "Completed"
                  : "Ready to start";

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

        {sandbox && started && !finished && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            Sandbox mode (~{formatMmSs(durationSeconds)}, Wayne avatar). For
            full Silas interviews set LIVEAVATAR_SANDBOX=false (uses credits).
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-black shadow-lg">
            <div className="relative w-full">
              {finished ? (
                <div className="flex h-[650px] items-center justify-center bg-gray-900">
                  <div className="px-6 text-center text-white">
                    <div className="mb-4 text-5xl">✅</div>
                    <p className="text-xl font-semibold">Interview Completed</p>
                    <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
                      {finishMessage || DEFAULT_CLOSING}
                    </p>
                  </div>
                </div>
              ) : (
                <LiveAvatarInterview
                  sessionToken={sessionToken}
                  active={started && !finished}
                  phase={timer.phase}
                  speakText={speakText}
                  speakKey={speakKey}
                  onIntroSpoken={onIntroSpoken}
                  onAvatarStopSpeaking={onAvatarStopSpeaking}
                  onClosingSpoken={onClosingSpoken}
                  onSessionId={setSessionId}
                  onDisconnected={() => setAvatarFallback(true)}
                  onLocalTranscriptLine={onLocalTranscriptLine}
                  onUserAnswerChunk={onUserAnswerChunk}
                  onError={(err) => {
                    setAvatarFallback(true);
                    console.warn("LiveAvatar fallback mode:", err?.message);
                  }}
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
              Up to {formatMmSs(durationSeconds)} total. After each question you
              have {answerSeconds} seconds to answer. Closing remarks play once
              at the end.
            </p>

            {avatarFallback && started && !finished && (
              <p className="mt-3 text-xs text-amber-700">
                {sandbox && !sessionToken
                  ? "Sandbox video token failed — check LIVEAVATAR_SANDBOX_AVATAR_ID is Wayne (dd73ea75-…) and restart the backend. Continue with on-screen prompts and timers."
                  : "Avatar video/audio unavailable — continue with on-screen prompts and timers."}
              </p>
            )}

            {started && !finished && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Session time
                  </p>
                  <p
                    className={`mt-1 text-3xl font-bold tabular-nums ${
                      timer.sessionRemaining <= 5
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
                        ? "Asking…"
                        : timer.phase === "introSpeaking"
                          ? "Intro…"
                          : timer.phase === "closing"
                            ? "Closing…"
                            : "—"}
                  </p>
                </div>
              </div>
            )}

            {started && !finished && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    timer.phase === "introSpeaking"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  Intro
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    timer.phase === "avatarSpeaking"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  Asking
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    timer.phase === "answering"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  Listening
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    timer.phase === "closing"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  Closing
                </span>
              </div>
            )}

            {questions.length > 0 && (started || finished) && (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {timer.phase === "introSpeaking"
                      ? "Introduction"
                      : timer.phase === "closing" || timer.phase === "done"
                        ? "All questions covered"
                        : `Question ${Math.min(
                            timer.currentQuestionIndex + 1,
                            questions.length
                          )} of ${questions.length}`}
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

            {started && !finished && speakText && (
              <div
                className={`mt-6 rounded-xl border p-5 ${
                  timer.phase === "closing"
                    ? "border-amber-200 bg-amber-50"
                    : timer.phase === "introSpeaking"
                      ? "border-violet-200 bg-violet-50"
                      : "border-blue-100 bg-blue-50"
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    timer.phase === "closing"
                      ? "text-amber-700"
                      : timer.phase === "introSpeaking"
                        ? "text-violet-700"
                        : "text-blue-600"
                  }`}
                >
                  {timer.phase === "closing"
                    ? "Closing remarks"
                    : timer.phase === "introSpeaking"
                      ? "Company introduction"
                      : currentQuestion?.source === "hr"
                        ? "Job question"
                        : currentQuestion?.source === "cv"
                          ? "CV technical question"
                          : "Interview question"}
                </p>
                <p className="mt-2 font-medium text-gray-900">{speakText}</p>
              </div>
            )}

            <div className="mt-8 rounded-xl bg-gray-100 p-5">
              <h2 className="font-semibold">Instructions</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
                <li>Click Start Interview and allow microphone access.</li>
                <li>
                  The interviewer introduces the company, then asks job and CV
                  questions one by one.
                </li>
                <li>
                  After each question you have {answerSeconds} seconds to answer.
                </li>
                <li>Closing remarks play once at the end of the session.</li>
              </ul>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Interview status</p>
              <p className="mt-1 font-medium text-gray-800">{phaseLabel}</p>
            </div>

            {finished && (
              <div className="mt-6 rounded-xl bg-green-50 p-5 text-green-800">
                <h3 className="font-semibold">Interview completed</h3>
                <p className="mt-1 text-sm">
                  {finishMessage || DEFAULT_CLOSING}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
