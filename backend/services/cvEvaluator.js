const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

// const MODEL = "openai/gpt-oss-20b:free";

const MODEL = "openrouter/free";

export async function evaluateCvAgainstJob({
  cvText,
  jobDescription,
  jobTitle,
}) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured."
    );
  }

  const prompt = `
You are an expert recruitment screening assistant.

Evaluate the candidate's CV against the job description.

JOB TITLE:
${jobTitle}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE CV:
${cvText}

Evaluate how well this candidate matches this specific job.

Consider:
- Required technical skills
- Relevant work experience
- Education where relevant
- Previous responsibilities
- Seniority
- Tools and technologies
- Overall relevance to the position

Do NOT consider:
- Name
- Gender
- Age
- Nationality
- Religion
- Race
- Photograph
- Marital status
- Other protected characteristics

Do not invent skills or experience that are not present in the CV.

Return ONLY valid JSON in exactly this format:

{
  "rating": 0,
  "summary": "Short explanation of the overall match.",
  "matchedSkills": [
    "skill 1",
    "skill 2"
  ],
  "missingSkills": [
    "skill 1",
    "skill 2"
  ]
}

The rating must be an integer from 0 to 100.

100 = extremely strong match
80-99 = strong match
60-79 = moderate match
40-59 = weak match
0-39 = very weak match
`;

  const response = await fetch(
    OPENROUTER_URL,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${process.env.OPENROUTER_API_KEY}`,

        "Content-Type": "application/json",

        "HTTP-Referer":
          process.env.CLIENT_URL ||
          "http://localhost:5173",

        "X-Title": "Job Portal CV Evaluator",
      },

      body: JSON.stringify({
        model: MODEL,

        messages: [
          {
            role: "system",
            content:
              "You are a precise CV screening assistant. Return only valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.1,

        //max_tokens: 1000,
        max_tokens: 2000,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "OpenRouter error:",
      JSON.stringify(data, null, 2)
    );

    throw new Error(
      data?.error?.message ||
        "OpenRouter request failed."
    );
  }

  const content =
    data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(
      "OpenRouter returned an empty response."
    );
  }

  let result;

  try {
    result = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);

    if (!match) {
      console.error(
        "Invalid AI response:",
        content
      );

      throw new Error(
        "AI returned invalid JSON."
      );
    }

    result = JSON.parse(match[0]);
  }

  // Basic validation
  if (
    typeof result.rating !== "number" ||
    result.rating < 0 ||
    result.rating > 100
  ) {
    throw new Error(
      "AI returned an invalid CV rating."
    );
  }

  return {
    rating: Math.round(result.rating),

    summary:
      result.summary || "",

    matchedSkills:
      Array.isArray(result.matchedSkills)
        ? result.matchedSkills
        : [],

    missingSkills:
      Array.isArray(result.missingSkills)
        ? result.missingSkills
        : [],
  };
}