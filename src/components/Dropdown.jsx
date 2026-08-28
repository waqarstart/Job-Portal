import { useState } from "react";
import { HiOutlineChevronDown, HiOutlineCheck } from "react-icons/hi2";

// Reusable custom dropdown (replaces native <select>) — rounded-xl border,
// shadow-xl menu, closes on outside click or option select.
export default function Dropdown({ value, onChange, options, className = "", buttonClassName = "", fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${fullWidth ? "w-full min-w-0" : "w-44 shrink-0"} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none hover:border-gray-300 focus:ring-2 focus:ring-blue-500 ${buttonClassName}`}
      >
        <span className="truncate">{selected?.label || "Select..."}</span>
        <HiOutlineChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 max-h-64 w-full min-w-[10rem] overflow-y-auto overflow-x-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
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
        </>
      )}
    </div>
  );
}
