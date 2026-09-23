import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlineChevronDown, HiOutlineCheck } from "react-icons/hi2";

// Reusable custom dropdown (replaces native <select>) — rounded-xl border,
// shadow-xl menu, closes on outside click or option select.
//
// The menu is rendered into a portal (document.body) so it always floats on
// top of everything, instead of being clipped by an ancestor's overflow.
//
// Closing on outside click uses a passive document `mousedown` listener
// (same pattern as UserMenu/Navbar) instead of a full-screen invisible
// overlay — an overlay would swallow the very first click anywhere on the
// page while the menu is open, making the rest of the page feel frozen
// until the dropdown is closed first.
//
// Two anchoring modes:
//  - default: trigger lives in the normal scrolling page. The menu is
//    `position: absolute` in document coordinates and re-measures on every
//    scroll so it keeps following the trigger as the page scrolls — it does
//    NOT auto-close just because the trigger scrolls near/behind a fixed
//    header; it only closes on an outside click, re-toggling the trigger,
//    or picking an option.
//  - anchorFixed: trigger lives inside a `position: fixed` ancestor (e.g. a
//    fixed navbar) that never actually moves on screen when the page
//    scrolls. The menu is positioned with `position: fixed` viewport
//    coordinates instead — no scroll-driven recalculation needed, so there's
//    no per-scroll-event lag/jitter chasing a target that isn't moving.
export default function Dropdown({ value, onChange, options, className = "", buttonClassName = "", fullWidth = false, fixedPosition = false, anchorFixed = false }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const buttonRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (e.target.closest("[data-dropdown-layer]")) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);
  const menuPositionStyle = fixedPosition
    ? { overscrollBehavior: "contain" }
    : anchorFixed
    ? { top: rect?.bottom + 4, left: rect?.left, width: rect?.width, minWidth: "10rem", overscrollBehavior: "contain" }
    : { top: rect?.bottom + window.scrollY + 4, left: rect?.left + window.scrollX, width: rect?.width, minWidth: "10rem", overscrollBehavior: "contain" };
  const menu = (
    <div
      data-dropdown-layer
      className={`${fixedPosition ? "absolute left-0 top-full mt-1 w-44" : anchorFixed ? "fixed" : "absolute"} z-[101] max-h-64 overflow-y-auto overflow-x-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl`}
      style={menuPositionStyle}
      onWheel={containWheel}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => { onChange(opt.value); setOpen(false); }}
          className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-sm transition-[background-color,padding-left] duration-200 ease hover:bg-blue-50 hover:pl-5 hover:text-blue-600 ${
            opt.value === value ? "font-semibold text-blue-600 bg-blue-50/60" : "text-gray-700"
          }`}
        >
          {opt.label}
          {opt.value === value && <HiOutlineCheck className="h-4 w-4" />}
        </button>
      ))}
    </div>
  );

  function containWheel(e) {
    const list = e.currentTarget;
    const atTop = list.scrollTop <= 0 && e.deltaY < 0;
    const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 1 && e.deltaY > 0;
    if (atTop || atBottom || list.scrollHeight <= list.clientHeight) e.preventDefault();
    e.stopPropagation();
  }

  useLayoutEffect(() => {
    if (!open) return;

    const previousBodyOverflow = fixedPosition ? document.body.style.overflow : "";
    const previousRootOverflow = fixedPosition ? document.documentElement.style.overflow : "";
    if (fixedPosition) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    function measure() {
      if (buttonRef.current) {
        setRect(buttonRef.current.getBoundingClientRect());
      }
    }
    measure();

    // anchorFixed triggers don't move on scroll, so there's nothing to
    // track — only re-measure on resize. Default (page-flow) triggers keep
    // following the scroll so the menu stays correctly anchored, but that
    // never force-closes the menu anymore — it only closes via the outside
    // mousedown handler above, re-toggling the button, or picking an option.
    if (!fixedPosition && !anchorFixed) window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      if (!fixedPosition && !anchorFixed) window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      if (fixedPosition) {
        document.body.style.overflow = previousBodyOverflow;
        document.documentElement.style.overflow = previousRootOverflow;
      }
    };
  }, [open, fixedPosition, anchorFixed]);

  return (
    <div ref={containerRef} className={`relative ${fullWidth ? "w-full min-w-0" : "w-44 shrink-0"} ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none hover:border-gray-300 focus:ring-2 focus:ring-blue-500 ${buttonClassName}`}
      >
        <span className="truncate">{selected?.label || "Select..."}</span>
        <HiOutlineChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (fixedPosition ? menu : createPortal(menu, document.body))}
    </div>
  );
}
