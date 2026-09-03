import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyProfile } from "../services/userService";
import { getMyApplications } from "../services/applicationService";
import {
  getCachedProfilePicture, setCachedProfilePicture,
  getCachedNotifications, setCachedNotifications,
} from "../utils/profileCache";
import NotificationMenu from "./NotificationMenu";
import {
  HiOutlineLanguage, HiOutlineLockClosed,
  HiOutlineArrowRightOnRectangle, HiChevronDown, HiChevronUp,
} from "react-icons/hi2";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

export default function Navbar() {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(getCachedProfilePicture() || "");
  const [notifications, setNotifications] = useState(getCachedNotifications() || []);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Candidates ("user" role) have a profile picture — HR/Admin accounts
  // don't have this endpoint, so failures here are expected and just fall
  // back to initials.
  useEffect(() => {
    if (!user || user.role !== "user") {
      setProfilePicture("");
      return;
    }

    getMyProfile()
      .then((profile) => {
        const pic = profile?.profilePicture || "";
        setProfilePicture(pic);
        setCachedProfilePicture(pic);
      })
      .catch(() => setProfilePicture(""));
  }, [user]);

  // Same candidate-only notifications the dashboard sidebar shows
  useEffect(() => {
    if (!user || user.role !== "user") {
      setNotifications([]);
      return;
    }

    getMyApplications()
      .then((apps) => {
        const notifs = apps
          .filter((a) => ["shortlisted", "selected", "hired", "rejected", "under_review"].includes(a.status))
          .map((a) => ({
            message: `Your application for ${a.job?.title} is ${a.status.replace("_", " ")}`,
            time: new Date(a.updatedAt).toLocaleDateString(),
            icon: a.status === "hired" ? "🎉" : a.status === "rejected" ? "❌" : "📋",
          }));
        setNotifications(notifs);
        setCachedNotifications(notifs);
      })
      .catch(() => {});
  }, [user]);

  function navClass(path) {
    return `text-sm font-medium transition ${
      location.pathname === path ? "text-blue-600 border-b-2 border-blue-600 pb-0.5" : "text-gray-600 hover:text-blue-600"
    }`;
  }

  const initial = user ? (user.name || "?")[0].toUpperCase() : "";

  function handleLogoClick() {
    navigate("/");
    window.location.reload();
  }

  function handleLogout() {
    setOpen(false);
    logout();
  }

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo — click reloads home */}
        <button onClick={handleLogoClick} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
            T
          </div>
          <span className="text-xl font-bold text-blue-600">Tekky Job</span>
        </button>

        {/* Center nav */}
        <div className="hidden items-center gap-8 md:flex">
          <Link to="/" className={navClass("/")}>Home</Link>
          <Link to="/find-jobs" className={navClass("/find-jobs")}>Find Jobs</Link>
          <Link to="/#top-companies" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">Companies</Link>
          <button
            type="button"
            onClick={() => alert("Salary insights are coming soon.")}
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition"
          >
            Salaries
          </button>
          <Link to="/#career-resources" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">Career Advice</Link>
        </div>

        {/* Right side */}
        {!user ? (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600">Login</Link>
            <Link to="/register"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
              Register
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">

            {user.role === "hr" && (
              <Link
                to="/hr/post-job"
                className="hidden sm:block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Post a Job
              </Link>
            )}

            {/* Bell */}
            <NotificationMenu notifications={notifications} />

            {/* Avatar dropdown */}
            <div className="relative" ref={ref}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1 pl-1 pr-3 hover:bg-gray-100 transition"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-xs font-bold text-white">
                  {profilePicture ? (
                    <img src={`${FILE_BASE}${profilePicture}`} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden sm:block">{user.name}</span>
                {open
                  ? <HiChevronUp className="h-4 w-4 text-gray-400" />
                  : <HiChevronDown className="h-4 w-4 text-gray-400" />}
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-gray-100 bg-white shadow-xl z-50 overflow-hidden">

                  {/* User info */}
                  <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-base font-bold text-white">
                      {profilePicture ? (
                        <img src={`${FILE_BASE}${profilePicture}`} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Dashboard link */}
                  <div className="py-1">
                    <Link
                      to={user.role === "admin" ? "/admin/dashboard" : user.role === "hr" ? "/hr/dashboard" : "/dashboard"}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      Dashboard
                    </Link>

                    {/* Language */}
                    <div className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition cursor-pointer">
                      <div className="flex items-center gap-3">
                        <HiOutlineLanguage className="h-4 w-4 text-gray-400" />
                        Language
                      </div>
                      <span className="flex items-center gap-1 text-gray-500 text-xs font-medium">
                        English <HiChevronDown className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    {/* Change Password */}
                    <Link
                      to="/forgot-password"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <HiOutlineLockClosed className="h-4 w-4 text-gray-400" />
                      Change Password
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition"
                    >
                      <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
