import path from "path";

/**
 * Turn an attacker-controlled upload filename into something safe to use
 * on disk. `path.basename` strips any directory components (so "../../x"
 * collapses to just "x"), and we also strip anything that isn't a normal
 * filename character to rule out null bytes, control characters, etc.
 * Always call this on `file.originalname` before writing it into a path.
 */
export function safeOriginalName(originalName = "file") {
  const base = path.basename(originalName);
  return base.replace(/[^a-zA-Z0-9.\-_]/g, "_") || "file";
}

/**
 * Escape a user-supplied string so it's safe to interpolate into a
 * MongoDB $regex filter. Without this, a search box becomes a vector for
 * ReDoS (catastrophic backtracking patterns) since the raw string would
 * otherwise be compiled as a regular expression.
 */
export function escapeRegex(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
