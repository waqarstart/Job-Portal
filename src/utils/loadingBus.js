// A minimal store (no React import needed) that tracks how many requests
// are currently "in flight", plus a short-lived "just navigated" flag. The
// axios instance (src/services/api.js) reports into this on every request;
// <RouteLoader /> subscribes to it to know when it's safe to fade out —
// i.e. once the destination page's own data has actually finished loading,
// not just after a fixed timer.
let count = 0;
let transitioning = false;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(count));
}

export function startLoading() {
  count += 1;
  notify();
}

export function stopLoading() {
  count = Math.max(0, count - 1);
  notify();
}

export function getLoadingCount() {
  return count;
}

export function subscribeLoading(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Marks a short window right after a route change during which GET requests
// (a page's initial data fetch) should also count toward "busy" — outside
// this window, background GETs (polling, search-as-you-type, etc.) are left
// alone so they don't trigger the full-page loader.
export function setTransitioning(value) {
  transitioning = value;
}

export function isTransitioning() {
  return transitioning;
}
