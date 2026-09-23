/**
 * Extract and parse a JSON object from noisy LLM output
 * (markdown fences, leading chain-of-thought, trailing prose).
 */
export function parseLlmJson(content, { validate } = {}) {
  if (content == null || !String(content).trim()) {
    throw new Error("Empty LLM response.");
  }

  let text = String(content).trim();

  // Strip ```json ... ``` or ``` ... ```
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    text = fence[1].trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Prefer the last complete {...} object (thinking often precedes JSON)
    const objects = extractJsonObjects(text);
    if (!objects.length) {
      throw new Error("AI returned invalid JSON.");
    }
    let lastError;
    parsed = null;
    for (let i = objects.length - 1; i >= 0; i--) {
      try {
        parsed = JSON.parse(objects[i]);
        break;
      } catch (err) {
        lastError = err;
      }
    }
    if (parsed == null) {
      throw lastError || new Error("AI returned invalid JSON.");
    }
  }

  if (typeof validate === "function") {
    validate(parsed);
  }

  return parsed;
}

function extractJsonObjects(text) {
  const results = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      if (depth > 0) depth--;
      if (depth === 0 && start >= 0) {
        results.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return results;
}
