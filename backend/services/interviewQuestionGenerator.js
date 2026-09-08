import { parseLlmJson } from "../utils/parseLlmJson.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODEL = "openrouter/free";

const SYSTEM_PROMPT =
  "You are a precise technical interviewer. Reply with a single JSON object only. No markdown, no chain-of-thought, no explanations before or after the JSON.";

async function callOpenRouter(messages) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
      "X-Title": "Job Portal Interview Questions",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "OpenRouter question gen error:",
      JSON.stringify(data, null, 2)
    );
    throw new Error(
      data?.error?.message ||
        "OpenRouter request failed for question generation."
    );
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned an empty response for questions.");
  }

  return content;
}

function normalizeQuestions(result, maxCvQuestions) {
  const cvQuestions = Array.isArray(result.cvQuestions)
    ? result.cvQuestions
        .map((q) => String(q).trim())
        .filter(Boolean)
        .map((q) => (q.length > 120 ? `${q.slice(0, 117)}...` : q))
        .slice(0, maxCvQuestions)
    : [];

  const technicalFocus = Array.isArray(result.technicalFocus)
    ? result.technicalFocus.map((s) => String(s).trim()).filter(Boolean)
    : [];

  return { cvQuestions, technicalFocus };
}

/**
 * Generate short technical interview questions grounded in the candidate CV.
 */
export async function generateCvInterviewQuestions({
  jobTitle,
  jobDescription,
  jobSkills = [],
  hrQuestions = [],
  cvText = "",
  maxCvQuestions = 4,
}) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const truncatedCv = String(cvText || "").slice(0, 6000);
  const hrList = (hrQuestions || []).filter(Boolean);

  if (!truncatedCv.trim()) {
    return { cvQuestions: [], technicalFocus: [] };
  }

  const prompt = `
You are an expert technical interviewer for a hiring platform.

Generate up to ${maxCvQuestions} short TECHNICAL interview questions based on the candidate's CV and the job.

JOB TITLE:
${jobTitle}

JOB DESCRIPTION:
${jobDescription}

JOB SKILLS:
${(jobSkills || []).join(", ") || "Not specified"}

HR QUESTIONS ALREADY PLANNED (do NOT duplicate these):
${hrList.length ? hrList.map((q, i) => `${i + 1}. ${q}`).join("\n") : "None"}

CANDIDATE CV:
${truncatedCv}

Rules:
- Questions must be grounded in skills/experience present in the CV.
- Do NOT invent technologies the candidate did not mention.
- Prefer technical depth that reveals ability (tools, architecture, trade-offs, debugging).
- Each question must be answerable in about 15 seconds verbally (one short sentence answer).
- Keep each question under 120 characters so the avatar can speak it quickly.
- Make questions short and speakable out loud.
- Do not ask HR/behavioral soft questions if they overlap with HR QUESTIONS.

Return ONLY this JSON object (no other text):
{
  "cvQuestions": ["question 1", "question 2"],
  "technicalFocus": ["skill1", "skill2"]
}
`.trim();

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ];

  let content = await callOpenRouter(messages);

  try {
    const result = parseLlmJson(content);
    return normalizeQuestions(result, maxCvQuestions);
  } catch (firstErr) {
    console.warn(
      "Question gen JSON parse failed, retrying once:",
      firstErr.message
    );

    content = await callOpenRouter([
      ...messages,
      { role: "assistant", content: String(content).slice(0, 4000) },
      {
        role: "user",
        content:
          "Your previous reply was not valid JSON. Return ONLY the JSON object with keys cvQuestions and technicalFocus. No thinking, no markdown.",
      },
    ]);

    const result = parseLlmJson(content);
    return normalizeQuestions(result, maxCvQuestions);
  }
}
