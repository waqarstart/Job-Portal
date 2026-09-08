import { parseLlmJson } from "../utils/parseLlmJson.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODEL = "openrouter/free";

const SYSTEM_PROMPT =
  "You are a precise interview reviewer. Reply with a single JSON object only. No markdown, no chain-of-thought, no explanations before or after the JSON.";

/**
 * Summarize an interview transcript and produce a 1–10 rating.
 */
export async function summarizeInterview({
  jobTitle,
  jobDescription,
  transcript,
  questions = [],
}) {
  if (!transcript || !String(transcript).trim()) {
    return {
      summary:
        "Interview completed. No transcript was available for automated review.",
      rating: null,
      technicalRating: null,
    };
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return {
      summary: String(transcript).slice(0, 500),
      rating: null,
      technicalRating: null,
    };
  }

  const prompt = `
You are an expert technical hiring interviewer reviewing a short AI interview transcript.

JOB TITLE:
${jobTitle || "N/A"}

JOB DESCRIPTION:
${jobDescription || "N/A"}

QUESTIONS ASKED:
${(questions || []).map((q, i) => `${i + 1}. ${q}`).join("\n") || "Unknown"}

TRANSCRIPT:
${String(transcript).slice(0, 8000)}

Evaluate the candidate's communication, relevance, and technical depth.

Return ONLY this JSON object (no other text):
{
  "summary": "2-4 sentence summary for HR",
  "rating": 7,
  "technicalRating": 6
}

rating and technicalRating must be integers from 1 to 10 (or null if insufficient data).
`.trim();

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ];

  const clamp = (n) =>
    typeof n === "number" && n >= 1 && n <= 10 ? Math.round(n) : null;

  try {
    const content = await callOpenRouter(messages);
    let result;
    try {
      result = parseLlmJson(content);
    } catch (firstErr) {
      console.warn(
        "Summarizer JSON parse failed, retrying once:",
        firstErr.message
      );
      const retryContent = await callOpenRouter([
        ...messages,
        { role: "assistant", content: String(content).slice(0, 4000) },
        {
          role: "user",
          content:
            "Your previous reply was not valid JSON. Return ONLY the JSON object with keys summary, rating, technicalRating. No thinking, no markdown.",
        },
      ]);
      result = parseLlmJson(retryContent);
    }

    return {
      summary: result.summary || "Interview completed.",
      rating: clamp(result.rating),
      technicalRating: clamp(result.technicalRating),
    };
  } catch (err) {
    console.error("Interview summarizer failed:", err.message);
    return {
      summary:
        "Interview completed. Automated summary unavailable; please review the transcript.",
      rating: null,
      technicalRating: null,
    };
  }
}

async function callOpenRouter(messages) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
      "X-Title": "Job Portal Interview Summarizer",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "OpenRouter summarizer error:",
      JSON.stringify(data, null, 2)
    );
    throw new Error(data?.error?.message || "Summarizer request failed.");
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty summarizer response.");
  return content;
}
