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

// ------------------------------------------------------------
// HR notifications cache (used by both the public-page Navbar's HR
// branch and HRLayout, so switching between /hr/* pages — or between
// a public page and /hr/* — doesn't blink the bell to empty first).
// ------------------------------------------------------------

let cachedHRNotifications = null;

export function getCachedHRNotifications() {
  return cachedHRNotifications;
}

export function setCachedHRNotifications(value) {
  cachedHRNotifications = Array.isArray(value) ? value : [];
}

// ------------------------------------------------------------
// Admin notifications cache (AdminLayout is remounted on every
// /admin/* navigation since each admin page renders its own layout
// instance; without this the bell resets to empty and re-fetches on
// every click between admin pages, which reads as a blink).
// ------------------------------------------------------------

let cachedAdminNotifications = null;

export function getCachedAdminNotifications() {
  return cachedAdminNotifications;
}

export function setCachedAdminNotifications(value) {
  cachedAdminNotifications = Array.isArray(value) ? value : [];
}
