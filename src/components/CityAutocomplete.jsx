import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlineMapPin } from "react-icons/hi2";

// Major Pakistani cities shown as quick suggestions — the field still
// accepts free-typed text (e.g. "Remote", or a city not in this list).
const MAJOR_CITIES = [
  "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad",
  "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
  "Hyderabad", "Sargodha",
];

// A text input that also offers a dropdown of major cities — the person
// text is always case-insensitive.
//
// The suggestion list is rendered into a portal (document.body) with
// `position: fixed` coordinates measured from the input, exactly like the
// Dropdown component — so it always floats on top instead of being clipped
// by an ancestor with `overflow-hidden` (e.g. the hero section).
export default function CityAutocomplete({ value, onChange, placeholder = "City, province or remote", className = "" }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const wrapRef = useRef(null);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return MAJOR_CITIES;
    return MAJOR_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [value]);

  function containWheel(e) {
    const list = e.currentTarget;
    const atTop = list.scrollTop <= 0 && e.deltaY < 0;
    const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 1 && e.deltaY > 0;
    if (atTop || atBottom || list.scrollHeight <= list.clientHeight) e.preventDefault();
    e.stopPropagation();
  }

  useEffect(() => {
    function handler(e) {
      if (e.target.closest("[data-dropdown-layer]")) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    function measure() {
      if (wrapRef.current) {
        const nextRect = wrapRef.current.getBoundingClientRect();
        if (nextRect.bottom <= 0 || nextRect.top > window.innerHeight) {
          setOpen(false);
          return;
        }
        setRect(nextRect);
      }
    }
    measure();

    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={`relative flex-1 min-w-0 ${className}`}>
      <div className="flex items-center gap-2 px-4 py-2.5">
        <HiOutlineMapPin className="h-5 w-5 shrink-0 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
        />
      </div>

      {open && rect && createPortal(
          <div
            data-dropdown-layer
            className="absolute z-[101] max-h-64 overflow-y-auto overflow-x-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl"
            style={{ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX, width: rect.width, minWidth: "12rem", overscrollBehavior: "contain" }}
            onWheel={containWheel}
          >
            {suggestions.length === 0 ? (
              <p className="px-4 py-2.5 text-sm text-gray-400">
                No matching city — you can still search "{value}"
              </p>
            ) : (
              suggestions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChange(c); setOpen(false); }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition-[background-color,padding-left] duration-200 ease hover:bg-blue-50 hover:pl-5 hover:text-blue-600"
                >
                  <HiOutlineMapPin className="h-4 w-4 text-gray-400" />
                  {c}
                </button>
              ))
            )}
          </div>,
        document.body
      )}
    </div>
  );
}
