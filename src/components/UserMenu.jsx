import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineUser,
  HiOutlineLanguage,
  HiOutlineLockClosed,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChevronDown,
} from "react-icons/hi2";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const LANGUAGES = ["English", "اردو"];

export default function UserMenu({ user, logout, profilePicture, settingsPath }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("English");
  const ref = useRef();

  const initials = (user?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border bg-gray-50 py-1 pl-1 pr-2 hover:bg-gray-100 transition"
      >
        {profilePicture ? (
          <img
            src={`${FILE_BASE}${profilePicture}`}
            alt="Profile"
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {initials}
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
          {user?.name}
        </span>
        <HiOutlineChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border bg-white shadow-xl">
          {/* User info */}
          <div className="flex items-center gap-3 border-b p-4">
            {profilePicture ? (
              <img
                src={`${FILE_BASE}${profilePicture}`}
                alt="Profile"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div className="p-2">
            {/* Language selector */}
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5">
              <HiOutlineLanguage className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="text-xs text-gray-500 mr-auto">Language</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="text-xs font-medium text-gray-700 border-0 outline-none bg-transparent cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Change Password */}
            <Link
              to={settingsPath || "/dashboard/settings"}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <HiOutlineLockClosed className="h-4 w-4 text-gray-400" />
              Change Password
            </Link>

            <div className="my-1 border-t" />

            {/* Logout */}
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
