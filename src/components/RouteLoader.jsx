import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { subscribeLoading, getLoadingCount, setTransitioning } from "../utils/loadingBus";

// Full-page loader shown with the Tekky Job logo:
//  1. On every route change — candidate / HR / admin / home, anywhere —
//     and it stays up until the destination page's own data has actually
//     finished loading (via loadingBus), not just for a fixed timer, so the
//     page is fully ready the moment the loader fades out.
//  2. On any save/submit (POST/PUT/PATCH/DELETE through the api instance),
//     even without a route change, so the user sees it load and return.
const MIN_SHOW_MS   = 550;  // loader always stays up at least this long — calm, not a flash
const FADE_MS       = 300;  // fade in/out duration
const ROUTE_GRACE_MS = 220; // grace window after navigating, to catch the new page's initial fetch(es)
const MAX_BUSY_MS   = 6000; // safety cap — never block the UI forever if something hangs

export default function RouteLoader() {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const busyRef = useRef(false);
  const routeGraceActiveRef = useRef(false);
  const shownAtRef = useRef(0);
  const hideTimerRef = useRef(null);
  const graceTimerRef = useRef(null);
  const maxTimerRef = useRef(null);
  const isFirstRender = useRef(true);

  function computeBusy(requestCount) {
    return routeGraceActiveRef.current || requestCount > 0;
  }

  function show() {
    if (busyRef.current) return;
    busyRef.current = true;
    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
    setMounted(true);
    shownAtRef.current = Date.now();
    requestAnimationFrame(() => setVisible(true));

    clearTimeout(maxTimerRef.current);
    maxTimerRef.current = setTimeout(() => {
      // Safety net: something never resolved — don't trap the user.
      routeGraceActiveRef.current = false;
      setTransitioning(false);
      hide();
    }, MAX_BUSY_MS);
  }

  function hide() {
    if (!busyRef.current) return;
    busyRef.current = false;
    clearTimeout(maxTimerRef.current);

    const elapsed = Date.now() - shownAtRef.current;
    const wait = Math.max(0, MIN_SHOW_MS - elapsed);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      hideTimerRef.current = setTimeout(() => setMounted(false), FADE_MS);
    }, wait);
  }

  function reevaluate() {
    const busyNow = computeBusy(getLoadingCount());
    if (busyNow) show();
    else hide();
  }

  // Route change → open a short grace window so the destination page's
  // initial fetch (fired from its own useEffect on mount) has a moment to
  // register with loadingBus before we decide whether we're done.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    routeGraceActiveRef.current = true;
    setTransitioning(true);
    show();

    clearTimeout(graceTimerRef.current);
    graceTimerRef.current = setTimeout(() => {
      routeGraceActiveRef.current = false;
      setTransitioning(false);
      reevaluate();
    }, ROUTE_GRACE_MS);

    return () => clearTimeout(graceTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Any in-flight request (save/submit anywhere, or a tracked page fetch)
  // toggles the loader too — this is what makes it wait for real data.
  useEffect(() => {
    const unsubscribe = subscribeLoading(() => reevaluate());
    return () => {
      unsubscribe();
      clearTimeout(hideTimerRef.current);
      clearTimeout(graceTimerRef.current);
      clearTimeout(maxTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm transition-opacity ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <img
        src="/images/tekky-icon.png"
        alt=""
        className="h-16 w-16 animate-[pulse_1.1s_ease-in-out_infinite] object-contain"
      />
      <p className="mt-3 text-lg font-bold tracking-tight text-gray-900">
        Tekky <span className="text-blue-600">Job</span>
      </p>
      <div className="mt-4 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" />
      </div>
    </div>
  );
}
