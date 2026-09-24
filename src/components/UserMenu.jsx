import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Dropdown from "./Dropdown";
import {
  HiOutlineUser,
  HiOutlineLanguage,
  HiOutlineLockClosed,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChevronDown,
} from "react-icons/hi2";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const LANGUAGES = ["English", "اردو"];
const LANGUAGE_OPTIONS = LANGUAGES.map((language) => ({ value: language, label: language }));

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
      if (e.target.closest("[data-dropdown-layer]")) return;
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
        className="flex items-center gap-2 rounded-full border bg-gray-50 py-1 pl-1 pr-2 transition-all duration-200 hover:scale-105 hover:bg-gray-100 hover:shadow-sm"
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
        <span className="whitespace-nowrap text-sm font-medium text-gray-700">
          {user?.name}
        </span>
        <HiOutlineChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-500 ease-out ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      <div
        className={`absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-2xl border bg-white shadow-xl transition-all duration-500 ease-out ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0 pointer-events-none"
        }`}
      >
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
            <div>
              <p className="text-sm font-semibold break-words">{user?.name}</p>
              <p className="truncate text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div className="p-2">
            {/* Language selector */}
            <div className="flex items-center gap-2 rounded-lg pl-3 pr-3 py-2.5 transition-[background-color,padding-left] duration-200 ease hover:bg-blue-50 hover:pl-4 hover:text-blue-600">
              <HiOutlineLanguage className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="min-w-0 text-xs text-gray-500 mr-auto">Language</span>
              <Dropdown
                value={lang}
                onChange={setLang}
                options={LANGUAGE_OPTIONS}
                className="!w-24 ml-auto shrink-0"
                buttonClassName="!w-24 !rounded-lg !border-transparent !bg-transparent !px-1 !py-1 text-xs shadow-none hover:!border-transparent focus:ring-0"
              />
            </div>

            {/* Change Password */}
            <Link
              to={settingsPath || "/dashboard/settings"}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg pl-3 pr-3 py-2.5 text-sm text-gray-700 transition-[background-color,padding-left] duration-200 ease hover:bg-blue-50 hover:pl-4 hover:text-blue-600"
            >
              <HiOutlineLockClosed className="h-4 w-4 text-gray-400" />
              Change Password
            </Link>

            <div className="my-1 border-t" />

            {/* Logout */}
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-2 rounded-lg pl-3 pr-3 py-2.5 text-sm text-red-600 transition-[background-color,padding-left] duration-200 ease hover:bg-red-50 hover:pl-4"
            >
              <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
    </div>
  );
}
