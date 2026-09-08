import { generateCvInterviewQuestions } from "./interviewQuestionGenerator.js";

export const DEFAULT_MAX_QUESTIONS = 6;
export const SANDBOX_MAX_QUESTIONS = 3;
export const DEFAULT_DURATION_SECONDS = 120;
export const SANDBOX_DURATION_SECONDS = 55;
export const DEFAULT_ANSWER_SECONDS = 15;

export function isLiveAvatarSandbox() {
  return process.env.LIVEAVATAR_SANDBOX === "true";
}

export function buildIntroText(company, jobTitle) {
  const companyName = String(company || "our company").trim() || "our company";
  const title = String(jobTitle || "this role").trim() || "this role";
  return `Hi, I'm your AI interviewer from ${companyName}. Today we'll talk about the ${title} role. Let's begin.`;
}

export function formatTurnsTranscript(turns = []) {
  const scored = (turns || []).filter(
    (t) => t && t.question && !["intro", "closing"].includes(t.source)
  );

  if (!scored.length) {
    return "";
  }

  return scored
    .map((t, i) => {
      const answer =
        t.answer && String(t.answer).trim()
          ? String(t.answer).trim()
          : "No answer recorded.";
      return `Q${i + 1}. ${t.question}\nCandidate: ${answer}`;
    })
    .join("\n\n");
}

/**
 * Build ordered interview queue: HR questions first, then CV technical questions.
 */
export async function buildInterviewQueue({
  job,
  application,
  maxQuestions = DEFAULT_MAX_QUESTIONS,
}) {
  const hrQuestions = (job?.interviewQuestions || [])
    .map((q) => String(q).trim())
    .filter(Boolean);

  const remainingSlots = Math.max(0, maxQuestions - hrQuestions.length);
  const maxCvQuestions = Math.min(4, remainingSlots);

  let cvQuestions = [];

  if (maxCvQuestions > 0) {
    try {
      const generated = await generateCvInterviewQuestions({
        jobTitle: job?.title || "",
        jobDescription: job?.description || "",
        jobSkills: job?.skills || [],
        hrQuestions,
        cvText: application?.cvExtractedText || "",
        maxCvQuestions,
      });
      cvQuestions = generated.cvQuestions || [];
    } catch (err) {
      console.error(
        "CV question generation failed, continuing with HR questions:",
        err.message
      );
      cvQuestions = [];
    }
  }

  if (hrQuestions.length === 0 && cvQuestions.length === 0) {
    cvQuestions = [
      `Briefly describe a technical project relevant to the ${job?.title || "role"} and your role in it.`,
    ];
  }

  const queue = [];
  let order = 0;

  for (const text of hrQuestions) {
    if (queue.length >= maxQuestions) break;
    queue.push({ text, source: "hr", order: order++ });
  }

  for (const text of cvQuestions) {
    if (queue.length >= maxQuestions) break;
    const normalized = text.toLowerCase();
    if (queue.some((q) => q.text.toLowerCase() === normalized)) continue;
    queue.push({ text, source: "cv", order: order++ });
  }

  return queue.slice(0, maxQuestions);
}

export function getInterviewTiming(job, { sandbox = false } = {}) {
  if (sandbox) {
    return {
      durationSeconds: SANDBOX_DURATION_SECONDS,
      answerSeconds: DEFAULT_ANSWER_SECONDS,
    };
  }

  const durationSeconds =
    Number.isFinite(Number(job?.interviewDurationSeconds)) &&
    Number(job.interviewDurationSeconds) > 0
      ? Number(job.interviewDurationSeconds)
      : DEFAULT_DURATION_SECONDS;

  const answerSeconds =
    Number.isFinite(Number(job?.questionAnswerSeconds)) &&
    Number(job.questionAnswerSeconds) > 0
      ? Number(job.questionAnswerSeconds)
      : DEFAULT_ANSWER_SECONDS;

  return { durationSeconds, answerSeconds };
}
