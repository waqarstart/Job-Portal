// Tiny in-memory cache for candidate UI data.
//
// This cache lives at module scope, so it survives component
// unmounts while the SPA is running. It prevents the navbar/sidebar
// from visibly blinking every time the candidate navigates between
// pages.

// ------------------------------------------------------------
// Profile picture cache
// ------------------------------------------------------------

let cachedProfilePicture = null;
// null = not loaded during this browser session

export function getCachedProfilePicture() {
  return cachedProfilePicture;
}

export function setCachedProfilePicture(value) {
  cachedProfilePicture = value || "";
}

// ------------------------------------------------------------
// Notifications cache
// ------------------------------------------------------------

let cachedNotifications = null;
// null = not loaded during this browser session

export function getCachedNotifications() {
  return cachedNotifications;
}

export function setCachedNotifications(value) {
  cachedNotifications = Array.isArray(value) ? value : [];
}
