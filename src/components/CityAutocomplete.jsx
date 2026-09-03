import { useMemo, useState } from "react";
import { HiOutlineMapPin } from "react-icons/hi2";

// Major Pakistani cities shown as quick suggestions — the field still
// accepts free-typed text (e.g. "Remote", or a city not in this list).
const MAJOR_CITIES = [
  "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad",
  "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
  "Hyderabad", "Sargodha", "Remote",
];

// A text input that also offers a dropdown of major cities — the person
// can type freely (any case) or pick a suggestion. Matching against typed
// text is always case-insensitive.
export default function CityAutocomplete({ value, onChange, placeholder = "City, province or remote", className = "" }) {
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return MAJOR_CITIES;
    return MAJOR_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [value]);

  return (
    <div className={`relative flex-1 min-w-0 ${className}`}>
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

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
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
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <HiOutlineMapPin className="h-4 w-4 text-gray-400" />
                  {c}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
