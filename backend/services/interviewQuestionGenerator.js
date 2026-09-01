const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const MODEL = "openrouter/free";

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
- Prefer technical depth (tools, architecture, trade-offs, debugging).
- Each question must be answerable in about 15 seconds verbally (one short paragraph).
- Keep each question under 180 characters.
- Do not ask HR/behavioral soft questions if they overlap with HR QUESTIONS.

Return ONLY valid JSON:
{
  "cvQuestions": ["question 1", "question 2"],
  "technicalFocus": ["skill1", "skill2"]
}
`;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.CLIENT_URL || "http://localhost:5173",
      "X-Title": "Job Portal Interview Questions",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a precise technical interviewer. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("OpenRouter question gen error:", JSON.stringify(data, null, 2));
    throw new Error(
      data?.error?.message || "OpenRouter request failed for question generation."
    );
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned an empty response for questions.");
  }

  let result;
  try {
    result = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI returned invalid JSON for interview questions.");
    }
    result = JSON.parse(match[0]);
  }

  const cvQuestions = Array.isArray(result.cvQuestions)
    ? result.cvQuestions
        .map((q) => String(q).trim())
        .filter(Boolean)
        .slice(0, maxCvQuestions)
    : [];

  const technicalFocus = Array.isArray(result.technicalFocus)
    ? result.technicalFocus.map((s) => String(s).trim()).filter(Boolean)
    : [];

  return { cvQuestions, technicalFocus };
}
