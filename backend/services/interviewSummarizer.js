const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const MODEL = "openrouter/free";

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

Return ONLY valid JSON:
{
  "summary": "2-4 sentence summary for HR",
  "rating": 7,
  "technicalRating": 6
}

rating and technicalRating must be integers from 1 to 10 (or null if insufficient data).
`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.CLIENT_URL || "http://localhost:5173",
        "X-Title": "Job Portal Interview Summarizer",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a precise interview reviewer. Return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter summarizer error:", JSON.stringify(data, null, 2));
      throw new Error(data?.error?.message || "Summarizer request failed.");
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty summarizer response.");

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid summarizer JSON.");
      result = JSON.parse(match[0]);
    }

    const clamp = (n) =>
      typeof n === "number" && n >= 1 && n <= 10 ? Math.round(n) : null;

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
