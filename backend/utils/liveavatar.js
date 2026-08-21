const LIVEAVATAR_BASE = "https://api.liveavatar.com";

/**
 * Creates a fresh LiveAvatar embed session for one interview, using
 * Sandbox Mode by default so testing doesn't consume real credits.
 * This is the "programmatic" version of what used to be a single
 * hardcoded embed URL — a new one is generated per application.
 *
 * Docs: https://docs.liveavatar.com/api-reference/embeddings/create-embed-v2
 */
export async function createLiveAvatarEmbed() {
  const response = await fetch(`${LIVEAVATAR_BASE}/v2/embeddings`, {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.LIVEAVATAR_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      avatar_id: process.env.LIVEAVATAR_AVATAR_ID,
      is_sandbox: true, // set to false once ready to spend real credits
      orientation: "horizontal",
    }),
  });

  const json = await response.json();

  if (!response.ok || !json.data) {
    throw new Error(json.message || "Failed to create LiveAvatar embed.");
  }

  // { embed_id, url, script }
  return json.data;
}

/**
 * Fetches the transcript for a session. NOTE: this is only confirmed to
 * work with a `session_id` from the Create Session Token flow — whether
 * an `embed_id` from Create Embed V2 is accepted here is UNCONFIRMED.
 * Test this against your real account; if it errors, that confirms they
 * aren't interchangeable and this endpoint needs the SDK-based session
 * flow instead (see LiveAvatar's Create Session Token docs).
 *
 * Docs: https://docs.liveavatar.com/api-reference/sessions/get-session-transcript
 */
export async function getLiveAvatarTranscript(sessionId) {
  const response = await fetch(
    `${LIVEAVATAR_BASE}/v1/sessions/${sessionId}/transcript`,
    {
      headers: { "X-API-KEY": process.env.LIVEAVATAR_API_KEY },
    }
  );

  const json = await response.json();

  if (!response.ok || !json.data) {
    throw new Error(json.message || "Failed to fetch transcript.");
  }

  // { session_active, next_timestamp, transcript_data: [{ role, transcript, ... }] }
  return json.data;
}

/**
 * Turns the raw transcript array into a readable summary string,
 * e.g. "AI: Tell me about yourself.\nCandidate: I'm a frontend developer..."
 */
export function formatTranscript(transcriptData) {
  return transcriptData
    .map((line) => `${line.role === "avatar" ? "AI" : "Candidate"}: ${line.transcript}`)
    .join("\n");
}
