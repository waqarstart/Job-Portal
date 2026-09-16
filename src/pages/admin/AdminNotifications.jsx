import { useEffect, useState } from "react";
import {
  HiOutlineBriefcase, HiOutlineUser, HiOutlineDocumentText,
  HiOutlineCog6Tooth, HiOutlineEnvelopeOpen,
  HiChevronLeft, HiChevronRight, HiOutlineClock,
} from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminDashboard } from "../../services/adminService";
import { getAdminApplications } from "../../services/adminService";

const PAGE_SIZE = 8;

function buildNotifications(data, apps) {
  const notifs = [];

  // Jobs
  (data?.recentJobs || []).forEach((j) => {
    notifs.push({
      id: `job-${j._id}`,
      type: "job",
      message: `New job posted: ${j.title} at ${j.company}`,
      date: j.createdAt,
      read: false,
    });
  });

  // Users
  (data?.recentUsers || []).forEach((u) => {
    notifs.push({
      id: `user-${u._id}`,
      type: "user",
      message: `New user registered: ${u.name}`,
      date: u.createdAt,
      read: false,
    });
  });

  // Applications
  (apps || []).slice(0, 5).forEach((a) => {
    notifs.push({
      id: `app-${a._id}`,
      type: "application",
      message: `New application: ${a.user?.name || "Someone"} applied for ${a.job?.title || "a job"}`,
      date: a.createdAt,
      read: true,
    });
  });

  return notifs.sort((a, b) => new Date(b.date) - new Date(a.date));
}

const TYPE_ICON = {
  job:         { icon: HiOutlineBriefcase, bg: "bg-blue-50 text-blue-500" },
  user:        { icon: HiOutlineUser,      bg: "bg-purple-50 text-purple-500" },
  application: { icon: HiOutlineDocumentText, bg: "bg-green-50 text-green-500" },
  system:      { icon: HiOutlineCog6Tooth, bg: "bg-gray-100 text-gray-500" },
};

const TABS = ["All", "Unread", "Jobs", "Users", "Applications", "System"];

export default function AdminNotifications() {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("All");
  const [page, setPage]       = useState(1);

  useEffect(() => {
    Promise.all([getAdminDashboard(), getAdminApplications()])
      .then(([dash, apps]) => setNotifs(buildNotifications(dash, apps)))
      .finally(() => setLoading(false));
  }, []);

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  const unreadCount = notifs.filter((n) => !n.read).length;

  // Filter by tab
  const filtered = notifs.filter((n) => {
    if (tab === "All")          return true;
    if (tab === "Unread")       return !n.read;
    if (tab === "Jobs")         return n.type === "job";
    if (tab === "Users")        return n.type === "user";
    if (tab === "Applications") return n.type === "application";
    if (tab === "System")       return n.type === "system";
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminLayout title="Notifications">
      <p className="mb-6 text-sm text-gray-500">Stay updated with the latest activities and alerts</p>

      {/* ── Toolbar ── */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {/* Tabs */}
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t
                ? "bg-blue-600 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t}
            {t === "Unread" && unreadCount > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${tab === t ? "bg-white text-blue-600" : "bg-blue-600 text-white"}`}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}

        <div className="flex-1" />

        {/* Mark all as read */}
        <button
          onClick={markAllRead}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          <HiOutlineEnvelopeOpen className="h-4 w-4" />
          Mark all as read
        </button>
      </div>

      {/* ── Notification List ── */}
      {loading ? (
        <p className="py-16 text-center text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm divide-y divide-gray-50">
          {paginated.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">No notifications found.</p>
          ) : paginated.map((n) => {
            const meta = TYPE_ICON[n.type] ?? TYPE_ICON.system;
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`flex items-center gap-4 px-6 py-5 cursor-pointer hover:bg-gray-50 transition ${!n.read ? "bg-blue-50/30" : ""}`}
              >
                {/* Icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.bg}`}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-semibold text-gray-800" : "text-gray-700"}`}>
                    {n.message}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                    <HiOutlineClock className="h-3.5 w-3.5" />
                    {new Date(n.date).toLocaleString("en-US", {
                      month: "numeric", day: "numeric", year: "numeric",
                      hour: "numeric", minute: "2-digit", hour12: true,
                    })}
                  </p>
                </div>

                {/* Unread dot */}
                <div className="shrink-0 ml-2">
                  {!n.read
                    ? <span className="h-2.5 w-2.5 rounded-full bg-blue-500 block" />
                    : <span className="h-2.5 w-2.5 rounded-full bg-gray-200 block" />
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} notifications
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <HiChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                  p === page
                    ? "border border-blue-600 bg-white text-blue-600"
                    : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <HiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
