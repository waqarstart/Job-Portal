import { useState } from "react";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineClipboardDocument,
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineMusicalNote,
} from "react-icons/hi2";

const INTERVIEW_STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

function interviewStatusLabel(status) {
  if (!status) return "Not started";
  return String(status).replace(/_/g, " ");
}

export function InterviewStatusBadge({ status, className = "", short = false }) {
  const style =
    INTERVIEW_STATUS_STYLES[status] ||
    "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${style} ${className}`}
    >
      {short ? interviewStatusLabel(status) : `Interview: ${interviewStatusLabel(status)}`}
    </span>
  );
}

function scoredTurns(turns = []) {
  return (turns || []).filter(
    (t) => t?.question && !["intro", "closing"].includes(t.source)
  );
}

function closingTurn(turns = []) {
  return (turns || []).find((t) => t?.source === "closing");
}

/**
 * Expanded HR panel: structured Q&A, summary, rating, transcript.
 */
export default function InterviewFeedbackPanel({ application }) {
  const [openTranscript, setOpenTranscript] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!application) return null;

  const {
    interviewStatus,
    interviewSummary,
    interviewRating,
    interviewTechnicalRating,
    interviewTranscript,
    interviewTurns,
    interviewAudioUrl,
    status,
  } = application;

  const qaTurns = scoredTurns(interviewTurns);
  const closing = closingTurn(interviewTurns);

  const hasInterviewData =
    interviewStatus === "completed" ||
    interviewStatus === "in_progress" ||
    interviewStatus === "pending" ||
    !!interviewSummary ||
    !!interviewTranscript ||
    qaTurns.length > 0 ||
    typeof interviewRating === "number";

  const showPendingHint =
    !interviewStatus &&
    typeof application.cvRating === "number" &&
    application.cvRating > 50 &&
    status !== "rejected" &&
    status !== "interviewed";

  if (!hasInterviewData && !showPendingHint) return null;

  async function copyTranscript() {
    const text =
      qaTurns.length > 0
        ? qaTurns
            .map(
              (t, i) =>
                `Q${i + 1}. ${t.question}\nCandidate: ${
                  t.answer?.trim() || "No answer recorded."
                }`
            )
            .join("\n\n")
        : interviewTranscript;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-indigo-100 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          <HiOutlineChatBubbleLeftRight className="h-4 w-4 text-indigo-500" />
          AI Interview
        </div>
        <InterviewStatusBadge
          status={
            interviewStatus ||
            (showPendingHint ? "pending" : undefined)
          }
        />
        {typeof interviewRating === "number" && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            Overall {interviewRating}/10
          </span>
        )}
        {typeof interviewTechnicalRating === "number" && (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
            Technical {interviewTechnicalRating}/10
          </span>
        )}
      </div>

      {showPendingHint && !interviewStatus && (
        <p className="text-xs text-amber-700">
          Candidate is eligible for the AI interview. Waiting for them to
          complete it.
        </p>
      )}

      {interviewStatus === "pending" && !interviewSummary && (
        <p className="text-xs text-amber-700">
          Interview scheduled / pending — no results yet.
        </p>
      )}

      {interviewStatus === "in_progress" && (
        <p className="text-xs text-blue-700">
          Candidate is currently in the interview session.
        </p>
      )}

      {interviewSummary && (
        <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-700">
          <span className="font-semibold text-gray-800">Summary: </span>
          {interviewSummary}
        </div>
      )}

      {qaTurns.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Questions & answers
          </p>
          {qaTurns.map((t, i) => (
            <div
              key={`${t.order}-${i}`}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-700"
            >
              <p className="font-semibold text-gray-800">
                Q{i + 1}. {t.question}
              </p>
              <p className="mt-1.5 text-gray-600">
                <span className="font-medium text-gray-700">Candidate: </span>
                {t.answer?.trim() || "No answer recorded."}
              </p>
            </div>
          ))}
        </div>
      )}

      {closing?.question && (
        <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/60 p-3 text-xs text-amber-900">
          <span className="font-semibold">Closing: </span>
          {closing.question}
        </div>
      )}

      {interviewAudioUrl && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
          <HiOutlineMusicalNote className="h-4 w-4 text-gray-400" />
          <a
            href={interviewAudioUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-indigo-600 hover:underline"
          >
            Open interview audio
          </a>
        </div>
      )}

      {(interviewTranscript || qaTurns.length > 0) && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenTranscript((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {openTranscript ? (
                <HiOutlineChevronUp className="h-3.5 w-3.5" />
              ) : (
                <HiOutlineChevronDown className="h-3.5 w-3.5" />
              )}
              {openTranscript ? "Hide full transcript" : "Show full transcript"}
            </button>
            <button
              type="button"
              onClick={copyTranscript}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {copied ? (
                <HiOutlineCheck className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <HiOutlineClipboardDocument className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {openTranscript && (
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50 p-3 text-[11px] leading-relaxed text-gray-600">
              {qaTurns.length > 0
                ? qaTurns
                    .map(
                      (t, i) =>
                        `Q${i + 1}. ${t.question}\nCandidate: ${
                          t.answer?.trim() || "No answer recorded."
                        }`
                    )
                    .join("\n\n")
                : interviewTranscript}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
