import { parseLlmJson } from "../utils/parseLlmJson.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODEL = "openrouter/free";

const SYSTEM_PROMPT =
  "You are a precise CV screening assistant. Reply with a single JSON object only. No markdown, no chain-of-thought, no explanations before or after the JSON.";

function validateCvResult(result) {
  if (
    typeof result?.rating !== "number" ||
    result.rating < 0 ||
    result.rating > 100
  ) {
    throw new Error("AI returned an invalid CV rating.");
  }
}

function buildUserPrompt({ cvText, jobDescription, jobTitle }) {
  return `
Evaluate the candidate's CV against the job description.

JOB TITLE:
${jobTitle}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE CV:
${cvText}

Consider: required technical skills, relevant work experience, education where relevant, previous responsibilities, seniority, tools/technologies, overall relevance.

Do NOT consider: name, gender, age, nationality, religion, race, photograph, marital status, or other protected characteristics.

Do not invent skills or experience that are not present in the CV.

Return ONLY this JSON object (no other text):
{
  "rating": 0,
  "summary": "Short explanation of the overall match.",
  "matchedSkills": ["skill 1", "skill 2"],
  "missingSkills": ["skill 1", "skill 2"]
}

rating must be an integer from 0 to 100.
100 = extremely strong match
80-99 = strong match
60-79 = moderate match
40-59 = weak match
0-39 = very weak match
`.trim();
}

async function callOpenRouter(messages) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
      "X-Title": "Job Portal CV Evaluator",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("OpenRouter error:", JSON.stringify(data, null, 2));
    throw new Error(data?.error?.message || "OpenRouter request failed.");
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return content;
}

function normalizeCvResult(result) {
  validateCvResult(result);
  return {
    rating: Math.round(result.rating),
    summary: result.summary || "",
    matchedSkills: Array.isArray(result.matchedSkills)
      ? result.matchedSkills
      : [],
    missingSkills: Array.isArray(result.missingSkills)
      ? result.missingSkills
      : [],
  };
}

export async function evaluateCvAgainstJob({
  cvText,
  jobDescription,
  jobTitle,
}) {
  const userPrompt = buildUserPrompt({ cvText, jobDescription, jobTitle });

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  let content = await callOpenRouter(messages);

  try {
    const result = parseLlmJson(content, { validate: validateCvResult });
    return normalizeCvResult(result);
  } catch (firstErr) {
    console.warn(
      "CV evaluator JSON parse failed, retrying once:",
      firstErr.message
    );
    console.error("Invalid AI response (first attempt):", content);

    const retryMessages = [
      ...messages,
      { role: "assistant", content: String(content).slice(0, 4000) },
      {
        role: "user",
        content:
          "Your previous reply was not valid JSON. Return ONLY the JSON object with keys rating, summary, matchedSkills, missingSkills. No thinking, no markdown.",
      },
    ];

    content = await callOpenRouter(retryMessages);
    const result = parseLlmJson(content, { validate: validateCvResult });
    return normalizeCvResult(result);
  }
}
