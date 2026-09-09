import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlineChevronDown, HiOutlineCheck } from "react-icons/hi2";

// Reusable custom dropdown (replaces native <select>) — rounded-xl border,
// shadow-xl menu, closes on outside click or option select.
//
// The menu is rendered into a portal (document.body) with `position: fixed`
// coordinates measured from the trigger button. This means it always floats
// on top of everything — including inside scrollable modals — instead of
// being clipped or mispositioned by an ancestor's overflow/scroll.
export default function Dropdown({ value, onChange, options, className = "", buttonClassName = "", fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const buttonRef = useRef(null);
  const selected = options.find((o) => o.value === value);

  useLayoutEffect(() => {
    if (!open) return;

    function measure() {
      if (buttonRef.current) setRect(buttonRef.current.getBoundingClientRect());
    }
    measure();

    // Keep it glued to the button while the page scrolls or resizes;
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  return (
    <div className={`relative ${fullWidth ? "w-full min-w-0" : "w-44 shrink-0"} ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none hover:border-gray-300 focus:ring-2 focus:ring-blue-500 ${buttonClassName}`}
      >
        <span className="truncate">{selected?.label || "Select..."}</span>
        <HiOutlineChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && rect && createPortal(
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[101] max-h-64 overflow-y-auto overflow-x-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl"
            style={{ top: rect.bottom + 4, left: rect.left, width: rect.width, minWidth: "10rem" }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-sm transition hover:bg-blue-50 ${
                  opt.value === value ? "font-semibold text-blue-600 bg-blue-50/60" : "text-gray-700"
                }`}
              >
                {opt.label}
                {opt.value === value && <HiOutlineCheck className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
