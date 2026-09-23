import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyProfile } from "../services/userService";
import { getMyApplications } from "../services/applicationService";
import { getHRApplicants } from "../services/hrService";
import { getAdminDashboard } from "../services/adminService";
import {
  getCachedProfilePicture, setCachedProfilePicture,
  getCachedNotifications, setCachedNotifications,
  getCachedHRNotifications, setCachedHRNotifications,
  getCachedAdminNotifications, setCachedAdminNotifications,
} from "../utils/profileCache";
import NotificationMenu from "./NotificationMenu";
import Dropdown from "./Dropdown";
import {
  HiOutlineLanguage, HiOutlineLockClosed, HiOutlineSquares2X2,
  HiOutlineArrowRightOnRectangle, HiChevronDown,
} from "react-icons/hi2";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const LANGUAGES = ["English", "اردو"];
const LANGUAGE_OPTIONS = LANGUAGES.map((language) => ({ value: language, label: language }));

export default function Navbar({ overlay = false }) {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("English");
  const [profilePicture, setProfilePicture] = useState(getCachedProfilePicture() || "");
  const [notifications, setNotifications] = useState(
    user?.role === "hr"
      ? (getCachedHRNotifications() || [])
      : user?.role === "admin"
        ? (getCachedAdminNotifications() || [])
        : (getCachedNotifications() || [])
  );
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (e.target.closest("[data-dropdown-layer]")) return;
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

  // Candidate notifications — same ones the dashboard sidebar shows
  useEffect(() => {
    if (!user || user.role !== "user") {
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

  // HR notifications — same recent-applicants list the HR layout's bell
  // shows, so the bell isn't empty when an HR user is on a public page
  // (Home, Find Jobs, etc.) instead of inside /hr/*.
  useEffect(() => {
    if (!user || user.role !== "hr") {
      return;
    }

    getHRApplicants()
      .then((apps) => {
        const notifs = apps.slice(0, 5).map((a) => ({
          message: `${a.user?.name} applied for ${a.job?.title}`,
          time: new Date(a.createdAt).toLocaleDateString(),
          icon: "📋",
        }));
        setNotifications(notifs);
        setCachedHRNotifications(notifs);
      })
      .catch(() => {});
  }, [user]);

  // Admin notifications — keep the public navbar in sync with the admin dashboard bell.
  useEffect(() => {
    if (!user || user.role !== "admin") {
      return;
    }

    getAdminDashboard()
      .then((data) => {
        const notifs = [
          ...(data.recentUsers || []).slice(0, 3).map((u) => ({
            message: `New ${u.role} registered: ${u.name}`,
            time: new Date(u.createdAt).toLocaleDateString(),
            icon: "👤",
          })),
          ...(data.recentJobs || []).slice(0, 2).map((j) => ({
            message: `New job posted: ${j.title}`,
            time: new Date(j.createdAt).toLocaleDateString(),
            icon: "💼",
          })),
        ];
        setNotifications(notifs);
        setCachedAdminNotifications(notifs);
      })
      .catch(() => {});
  }, [user]);

  // Clear stale notifications when switching roles or logging out.
  useEffect(() => {
    if (!user || !["user", "hr", "admin"].includes(user.role)) {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    if (location.pathname !== "/" || location.hash !== "#top-companies") return;
    requestAnimationFrame(() => {
      document.getElementById("top-companies")?.scrollIntoView({ behavior: "smooth" });
    });
  }, [location.pathname, location.hash]);

  function navClass(path, hash = "") {
    const active = location.pathname === path && location.hash === hash;
    return `nav-underline text-sm font-medium transition-colors hover:text-blue-600 ${
      active ? "nav-underline-active text-blue-600" : "text-gray-900"
    }`;
  }

  const initial = user ? (user.name || "?")[0].toUpperCase() : "";

  // When overlaying a hero photo, the navbar stays fixed + transparent the
  // entire time — it never switches to a solid bar, even once scrolled past
  // the hero.
  const transparent = overlay;

  function handleLogoClick() {
    navigate("/");
    window.location.reload();
  }

  function handleLogout() {
    setOpen(false);
    logout();
  }

  return (
    <nav
      className={
        overlay
          ? "fixed inset-x-0 top-0 z-40 bg-white/60 backdrop-blur-md"
          : "border-b bg-white shadow-sm"
      }
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo — click reloads home */}
        <button onClick={handleLogoClick} className="flex items-center gap-2 transition-all duration-200 hover:opacity-75">
          <img src="/images/tekky-icon.png" alt="Tekky Job" className="h-9 w-9 object-contain" />
          <span className="text-xl font-bold text-blue-600">Tekky Job</span>
        </button>

        {/* Center nav */}
        <div className="hidden items-center gap-8 md:flex">
          {!user ? (
            /* Guest nav links */
            <>
              <Link to="/" className={navClass("/")}>Home</Link>
              <Link to="/how-it-works" className={navClass("/how-it-works")}>
                How it Works
              </Link>
              <Link to="/find-jobs" className={navClass("/find-jobs")}>Find Jobs</Link>
              <Link to="/companies" className={navClass("/companies")}>Companies</Link>
            </>
          ) : (
            /* Logged-in nav links */
            <>
              <Link to="/" className={navClass("/")}>Home</Link>
              <Link to="/find-jobs" className={navClass("/find-jobs")}>Find Jobs</Link>
              <Link to="/companies" className={navClass("/companies")}>Companies</Link>
              <Link to="/#career-resources" className={navClass("/", "#career-resources")}>Career Advice</Link>
            </>
          )}
        </div>

        {/* Right side */}
        {!user ? (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
                transparent
                  ? "bg-white/85 text-gray-700 hover:bg-white hover:shadow-md"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              Login
            </Link>
            <Link to="/register"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30">
              Sign Up
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
                className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition ${
                  transparent
                    ? "border-white/40 bg-white/70 hover:bg-white"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-xs font-bold text-white">
                  {profilePicture ? (
                    <img src={`${FILE_BASE}${profilePicture}`} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden sm:block">{user.name}</span>
                <HiChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-500 ease-out ${open ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              <div
                className={`absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl border border-gray-100 bg-white shadow-xl z-50 overflow-hidden transition-all duration-500 ease-out ${
                  open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0 pointer-events-none"
                }`}
              >

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
                      className="flex items-center gap-3 pl-4 pr-4 py-2.5 text-sm text-gray-700 transition-[background-color,padding-left] duration-200 ease hover:bg-blue-50 hover:pl-5 hover:text-blue-600"
                    >
                      <HiOutlineSquares2X2 className="h-4 w-4 text-gray-400" />
                      Dashboard
                    </Link>

                    {/* Language */}
                    <div className="flex items-center justify-between pl-4 pr-4 py-2.5 text-sm text-gray-700 transition-[background-color,padding-left] duration-200 ease hover:bg-blue-50 hover:pl-5 hover:text-blue-600">
                      <div className="flex items-center gap-3">
                        <HiOutlineLanguage className="h-4 w-4 text-gray-400" />
                        Language
                      </div>
                      <Dropdown
                        value={lang}
                        onChange={setLang}
                        options={LANGUAGE_OPTIONS}
                        anchorFixed
                        className="!w-24 ml-auto shrink-0"
                        buttonClassName="!w-24 !rounded-lg !border-transparent !bg-transparent !px-1 !py-1 text-xs shadow-none hover:!border-transparent focus:ring-0"
                      />
                    </div>

                    {/* Change Password */}
                    <Link
                      to="/forgot-password"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 pl-4 pr-4 py-2.5 text-sm text-gray-700 transition-[background-color,padding-left] duration-200 ease hover:bg-blue-50 hover:pl-5 hover:text-blue-600"
                    >
                      <HiOutlineLockClosed className="h-4 w-4 text-gray-400" />
                      Change Password
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 pl-4 pr-4 py-3 text-sm font-medium text-red-500 transition-[background-color,padding-left] duration-200 ease hover:bg-red-50 hover:pl-5"
                    >
                      <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
