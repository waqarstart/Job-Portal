import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HiOutlineSquares2X2,
  HiOutlineUser,
  HiOutlineMagnifyingGlass,
  HiOutlineDocumentText,
  HiOutlineBookmark,
  HiOutlineVideoCamera,
  HiOutlineIdentification,
  HiOutlineBell,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import UserMenu from "../components/UserMenu";
import NotificationMenu from "../components/NotificationMenu";
import { getMyApplications } from "../services/applicationService";
import { getMyProfile } from "../services/userService";
import { getCachedProfilePicture, setCachedProfilePicture, getCachedNotifications, setCachedNotifications } from "../utils/profileCache";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: HiOutlineSquares2X2 },
  { to: "/dashboard/profile", label: "My Profile", icon: HiOutlineUser },
  { to: "/", label: "Find Jobs", icon: HiOutlineMagnifyingGlass },
  { to: "/dashboard/applications", label: "Applications", icon: HiOutlineDocumentText },
  { to: "/dashboard/saved-jobs", label: "Saved Jobs", icon: HiOutlineBookmark },
  { to: "/dashboard/interviews", label: "Interviews", icon: HiOutlineVideoCamera },
  { to: "/dashboard/resume", label: "Resume / CV", icon: HiOutlineIdentification },
  { to: "/dashboard/notifications", label: "Notifications", icon: HiOutlineBell },
  { to: "/dashboard/settings", label: "Settings", icon: HiOutlineCog6Tooth },
];

export default function CandidateLayout({ children, title, profilePicture: picProp }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState(getCachedNotifications() || []);

  // Initialize from (in order): the live-preview prop, the module-level
  // cache from a previous page's fetch, or empty. This lets every new page
  // render the correct avatar immediately — no loading flash on navigation.
  const cached = getCachedProfilePicture();
  const [profilePicture, setProfilePicture] = useState(picProp || cached || "");
  const [picLoading, setPicLoading] = useState(!picProp && cached === null);

  const initials = (user?.name || "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
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
  }, []);

  // Pick up profile picture from prop (live preview while editing), or
  // fetch/re-validate the candidate's current profile in the background so
  // the sidebar avatar stays accurate on every page.
  useEffect(() => {
    if (picProp) {
      setProfilePicture(picProp);
      setPicLoading(false);
      return;
    }

    getMyProfile()
      .then((profile) => {
        const pic = profile?.profilePicture || "";
        setProfilePicture(pic);
        setCachedProfilePicture(pic);
      })
      .catch(() => {
        if (user?.profilePicture) setProfilePicture(user.profilePicture);
      })
      .finally(() => setPicLoading(false));
  }, [picProp, user]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r bg-white">
        <Link to="/" className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <HiOutlineSquares2X2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-blue-600">HireHub</span>
        </Link>

        {/* Profile pic in sidebar — updates when candidate uploads */}
        <div className="mx-4 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
          {picLoading ? (
            <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 animate-pulse" />
          ) : profilePicture ? (
            <img
              src={`${FILE_BASE}${profilePicture}`}
              alt="Profile"
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500">Candidate</p>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link key={label} to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                }`}>
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b bg-white px-8 py-4">
          {/* Fix 5: show only page title in bold, no greeting */}
          <h1 className="text-xl font-bold text-gray-900">{title || "Dashboard"}</h1>

          <div className="flex items-center gap-3">
            {/* Fix 4: working notification bell */}
            <NotificationMenu notifications={notifications} />

            {/* Fix 3: avatar dropdown with name, language, password, logout */}
            <UserMenu
              user={user}
              logout={logout}
              profilePicture={profilePicture}
              settingsPath="/dashboard/settings"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
