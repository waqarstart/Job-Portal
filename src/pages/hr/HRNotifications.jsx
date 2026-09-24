import { useEffect, useMemo, useState } from "react";
import { HiOutlineDocumentText, HiOutlineCalendarDays, HiOutlineCheck, HiOutlineBellAlert } from "react-icons/hi2";
import HRLayout from "../../layouts/HRLayout";
import { getHRApplicants, getHRJobs } from "../../services/hrService";
import { useAuth } from "../../context/AuthContext";

// Icon-box colors cycle per row, matching the reference design.
const ICON_STYLES = [
  { bg: "bg-blue-50",    fg: "text-blue-600" },
  { bg: "bg-emerald-50", fg: "text-emerald-600" },
  { bg: "bg-violet-50",  fg: "text-violet-600" },
  { bg: "bg-amber-50",   fg: "text-amber-600" },
  { bg: "bg-rose-50",    fg: "text-rose-600" },
  { bg: "bg-cyan-50",    fg: "text-cyan-600" },
];

function fmtDateTime(date) {
  const d = new Date(date);
  const datePart = d.toLocaleDateString("en-US");
  const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
}

export default function HRNotifications() {
  const { user } = useAuth();
  const readKey = `hr_read_notifications:${user?._id || "anon"}`;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(readKey)) || []); }
    catch { return new Set(); }
  });

  useEffect(() => {
    Promise.all([
      getHRApplicants().catch(() => []),
      getHRJobs({ tab: "all", limit: 50, sort: "newest" }).catch(() => ({ jobs: [] })),
    ]).then(([applicants, jobsRes]) => {
      const applicationNotifs = applicants.map((a) => ({
        id: `app-${a._id}`,
        message: `${a.user?.name || "A candidate"} applied for ${a.job?.title || "a job"}`,
        date: a.createdAt,
      }));

      const jobPostedNotifs = (jobsRes.jobs || []).map((j) => ({
        id: `job-${j._id}`,
        message: `New job post '${j.title}' is live now`,
        date: j.createdAt,
      }));

      const all = [...applicationNotifs, ...jobPostedNotifs]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setItems(all);
    }).finally(() => setLoading(false));
  }, []);

  function persistReadIds(next) {
    setReadIds(next);
    try { localStorage.setItem(readKey, JSON.stringify([...next])); } catch {}
  }

  function markAllRead() {
    persistReadIds(new Set(items.map((n) => n.id)));
  }

  function markOneRead(id) {
    if (readIds.has(id)) return;
    persistReadIds(new Set([...readIds, id]));
  }

  const unreadCount = useMemo(() => items.filter((n) => !readIds.has(n.id)).length, [items, readIds]);

  return (
    <HRLayout title="Notifications" subtitle="Recent activity on your account">
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <HiOutlineCheck className="h-4 w-4" />
          Mark all as read
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="space-y-3">
        {items.map((item, i) => {
          const isUnread = !readIds.has(item.id);
          const style = ICON_STYLES[i % ICON_STYLES.length];
          return (
            <button
              key={item.id}
              onClick={() => markOneRead(item.id)}
              className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm hover:shadow-md transition"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.bg} ${style.fg}`}>
                <HiOutlineDocumentText className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{item.message}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                  <HiOutlineCalendarDays className="h-3.5 w-3.5" />
                  {fmtDateTime(item.date)}
                </p>
              </div>

              <span className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${isUnread ? "text-blue-600" : "text-gray-400"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isUnread ? "bg-blue-600" : "bg-gray-300"}`} />
                {isUnread ? "New" : "Read"}
              </span>
            </button>
          );
        })}

        {!loading && items.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <HiOutlineBellAlert className="mx-auto mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-400">No notifications yet.</p>
          </div>
        )}
      </div>
    </HRLayout>
  );
}
