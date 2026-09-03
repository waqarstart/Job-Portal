import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HiOutlineSquares2X2,
  HiOutlineBriefcase,
  HiOutlinePlus,
  HiOutlineUsers,
  HiOutlineVideoCamera,
  HiOutlineBuildingOffice2,
  HiOutlineBell,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import UserMenu from "../components/UserMenu";
import NotificationMenu from "../components/NotificationMenu";
import { getHRApplicants } from "../services/hrService";

const navItems = [
  { to: "/hr/dashboard", label: "Dashboard", icon: HiOutlineSquares2X2 },
  { to: "/hr/post-job", label: "Post Jobs", icon: HiOutlinePlus },
  { to: "/hr/jobs", label: "My Jobs", icon: HiOutlineBriefcase },
  { to: "/hr/applicants", label: "Applicants", icon: HiOutlineUsers },
  { to: "/hr/interviews", label: "Interviews", icon: HiOutlineVideoCamera },
  { to: "/hr/company", label: "Company Profile", icon: HiOutlineBuildingOffice2 },
  { to: "/hr/notifications", label: "Notifications", icon: HiOutlineBell },
  { to: "/hr/settings", label: "Settings", icon: HiOutlineCog6Tooth },
];

export default function HRLayout({ children, title, subtitle, headerExtra }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);

  const initials = (user?.name || "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    getHRApplicants()
      .then((apps) => {
        const recent = apps.slice(0, 5).map((a) => ({
          message: `${a.user?.name} applied for ${a.job?.title}`,
          time: new Date(a.createdAt).toLocaleDateString(),
          icon: "📋",
        }));
        setNotifications(recent);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r bg-white">
        <Link to="/" className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">T</div>
          <span className="text-lg font-bold text-blue-600">Tekky Job</span>
        </Link>

        <div className="mx-4 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500">HR</p>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link key={label} to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title || "HR Dashboard"}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            {headerExtra}
            <NotificationMenu notifications={notifications} />
            <UserMenu
              user={user}
              logout={logout}
              settingsPath="/hr/settings"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
