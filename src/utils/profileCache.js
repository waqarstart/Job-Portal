// Tiny in-memory cache for the candidate's profile picture.
//
// Every candidate page mounts its own <CandidateLayout>, so without this
// cache the sidebar/navbar avatar would show a loading placeholder and then
// pop in the real photo on *every* navigation — a visible "blink". Caching
// the last-known value in module scope (not React state) lets each new
// mount render the correct avatar immediately, then quietly re-validate in
// the background.
let cachedProfilePicture = null; // null = not yet loaded this session

export function getCachedProfilePicture() {
  return cachedProfilePicture;
}

export function setCachedProfilePicture(value) {
  cachedProfilePicture = value || "";
}
