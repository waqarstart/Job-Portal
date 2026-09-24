/**
 * A minimal concurrency limiter — caps how many calls to a given async
 * function can run at the same time across the whole process. Extra
 * calls wait in a FIFO queue and run as soon as a slot frees up.
 *
 * Why this exists: CV text extraction and the OpenRouter AI evaluation
 * calls are CPU/network-heavy and currently run inline inside each
 * request handler. That's fine at normal traffic, but if a burst of
 * applicants (e.g. hundreds around a deadline) all apply within the same
 * second, running all of that work in parallel would spike memory/CPU
 * and could make the external AI API start failing or rate-limiting us.
 *
 * This does NOT change any response shape, timing contract, or business
 * logic — a caller still `await`s the same function and gets the same
 * result. Under a burst, later calls simply wait a little longer for a
 * free slot instead of all firing at once.
 */
export function createLimiter(maxConcurrent) {
  let active = 0;
  const queue = [];

  function next() {
    if (active >= maxConcurrent || queue.length === 0) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    fn()
      .then(resolve, reject)
      .finally(() => {
        active--;
        next();
      });
  }

  return function limit(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      next();
    });
  };
}
