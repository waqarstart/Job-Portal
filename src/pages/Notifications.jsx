import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineBellAlert, HiOutlineDocumentText, HiOutlineUserGroup,
  HiOutlineCalendarDays, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineEnvelope, HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlineEnvelopeOpen, HiChevronDown, HiOutlineInboxStack,
  HiOutlinePencilSquare,
} from "react-icons/hi2";
import CandidateLayout from "../layouts/CandidateLayout";
import { getMyApplications } from "../services/applicationService";
import { getMyProfile } from "../services/userService";
import { searchJobs } from "../services/jobService";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 7;

// A job counts as "new" for the match feed if posted within this window.
const JOB_MATCH_WINDOW_DAYS = 14;

const TYPE_STYLES = {
  received:   { icon: HiOutlineDocumentText, bg: "bg-rose-50",    fg: "text-rose-500" },
  status:     { icon: HiOutlineDocumentText, bg: "bg-violet-50",  fg: "text-violet-500" },
  shortlisted:{ icon: HiOutlineUserGroup,    bg: "bg-violet-50",  fg: "text-violet-600" },
  rejected:   { icon: HiOutlineXCircle,      bg: "bg-red-50",     fg: "text-red-500" },
  selected:   { icon: HiOutlineCheckCircle,  bg: "bg-emerald-50", fg: "text-emerald-600" },
  hired:      { icon: HiOutlineCheckCircle,  bg: "bg-emerald-50", fg: "text-emerald-600" },
  interview:  { icon: HiOutlineCalendarDays, bg: "bg-amber-50",   fg: "text-amber-600" },
  job_match:  { icon: HiOutlineEnvelope,     bg: "bg-blue-50",    fg: "text-blue-600" },
  job_updated:{ icon: HiOutlinePencilSquare, bg: "bg-cyan-50",    fg: "text-cyan-600" },
};

const FILTERS = [
  { key: "all",          label: "All Notifications", icon: HiOutlineBellAlert },
  { key: "unread",       label: "Unread",             icon: HiOutlineEnvelopeOpen },
  { key: "applications", label: "Applications",       icon: HiOutlineDocumentText },
  { key: "interviews",   label: "Interviews",         icon: HiOutlineCalendarDays },
  { key: "offers",       label: "Offers",             icon: HiOutlineCheckCircle },
  { key: "system",       label: "System Updates",     icon: HiOutlineInboxStack },
];

function fmtDateTime(date) {
  const d = new Date(date);
  const datePart = d.toLocaleDateString("en-US");
  const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
}

export default function Notifications() {
  const { user } = useAuth();
  const readKey = `read_notifications:${user?._id || "anon"}`;

  const [apps, setApps] = useState([]);
  const [jobMatches, setJobMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(readKey)) || []); }
    catch { return new Set(); }
  });

  const [activeFilter, setActiveFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([
      getMyApplications().catch(() => []),
      getMyProfile().catch(() => null),
      searchJobs("", "").catch(() => []),
    ]).then(([applications, profile, jobs]) => {
      setApps(applications || []);

      // New-job-match notifications: real recent postings whose title
      // overlaps with the candidate's own skills, excluding jobs they've
      // already applied to.
      const skills = (profile?.skills || []).map((s) => s.toLowerCase());
      const appliedJobIds = new Set((applications || []).map((a) => a.job?._id));
      const cutoff = Date.now() - JOB_MATCH_WINDOW_DAYS * 86400000;

      const matches = (jobs || []).filter((j) => {
        if (appliedJobIds.has(j._id)) return false;
        if (new Date(j.createdAt).getTime() < cutoff) return false;
        if (skills.length === 0) return false;
        const title = (j.title || "").toLowerCase();
        return skills.some((s) => s && title.includes(s));
      });
      setJobMatches(matches);
    }).finally(() => setLoading(false));
  }, []);

  function persistReadIds(next) {
    setReadIds(next);
    try { localStorage.setItem(readKey, JSON.stringify([...next])); } catch {}
  }

  // ── Build the unified notification feed from real application + job data ──
  const items = useMemo(() => {
    const list = [];

    for (const a of apps) {
      const job = a.job?.title || "a job";

      list.push({
        id: `${a._id}-received`,
        category: "applications",
        type: "received",
        title: "Application received",
        message: `We have received your application for the ${job} position. We will review it and get back to you soon.`,
        date: a.createdAt,
      });

      if (a.status === "under_review") {
        list.push({
          id: `${a._id}-status`,
          category: "applications",
          type: "status",
          title: "Application status updated",
          message: `Your application for ${job} has been moved to Under Review.`,
          date: a.updatedAt,
        });
      }

      if (a.status === "shortlisted") {
        list.push({
          id: `${a._id}-shortlisted`,
          category: "applications",
          type: "shortlisted",
          title: "Your application has been shortlisted",
          message: `Great news! Your application for the ${job} position has been shortlisted.`,
          date: a.updatedAt,
        });
      }

      if (a.status === "rejected") {
        list.push({
          id: `${a._id}-rejected`,
          category: "applications",
          type: "rejected",
          title: "Application update",
          message: `Your application for ${job} was not selected this time.`,
          date: a.updatedAt,
        });
      }

      if (a.status === "selected") {
        list.push({
          id: `${a._id}-selected`,
          category: "offers",
          type: "selected",
          title: "You've been selected!",
          message: `You've been selected for the ${job} position.`,
          date: a.updatedAt,
        });
      }

      if (a.status === "hired") {
        list.push({
          id: `${a._id}-hired`,
          category: "offers",
          type: "hired",
          title: `Congratulations — you were hired for ${job}!`,
          message: `We are excited to inform you that you have been selected for the ${job} position. Welcome to the team!`,
          date: a.updatedAt,
        });
      }

      if (a.interviewDate) {
        list.push({
          id: `${a._id}-interview`,
          category: "interviews",
          type: "interview",
          title: "Interview scheduled",
          message: `Your interview for the ${job} position is scheduled on ${new Date(a.interviewDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} at ${new Date(a.interviewDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`,
          date: a.updatedAt,
        });
      }

      // Job posting edited after this candidate applied — a job's
      // updatedAt only moves past its own createdAt (which is always
      // before the application) when HR saves a real edit.
      if (a.job?.updatedAt && new Date(a.job.updatedAt) > new Date(a.createdAt)) {
        list.push({
          id: `${a._id}-job-updated`,
          category: "applications",
          type: "job_updated",
          title: "Job posting updated",
          message: `The job "${job}" you applied for has been updated by the employer. Review the latest details.`,
          date: a.job.updatedAt,
        });
      }
    }

    for (const j of jobMatches) {
      list.push({
        id: `job-${j._id}`,
        category: "system",
        type: "job_match",
        title: "New job match for you",
        message: `We found a new job that matches your profile: ${j.title} at ${j.company}.`,
        date: j.createdAt,
      });
    }

    list.sort((a, b) =>
      sortOrder === "latest"
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );

    return list;
  }, [apps, jobMatches, sortOrder]);

  const counts = useMemo(() => ({
    all: items.length,
    unread: items.filter((n) => !readIds.has(n.id)).length,
    applications: items.filter((n) => n.category === "applications").length,
    interviews: items.filter((n) => n.category === "interviews").length,
    offers: items.filter((n) => n.category === "offers").length,
    system: items.filter((n) => n.category === "system").length,
  }), [items, readIds]);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return items;
    if (activeFilter === "unread") return items.filter((n) => !readIds.has(n.id));
    return items.filter((n) => n.category === activeFilter);
  }, [items, activeFilter, readIds]);

  useEffect(() => { setPage(1); }, [activeFilter, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function markAllRead() {
    persistReadIds(new Set(items.map((n) => n.id)));
  }

  function markOneRead(id) {
    if (readIds.has(id)) return;
    persistReadIds(new Set([...readIds, id]));
  }

  return (
    <CandidateLayout title="Notifications" subtitle="Stay updated on your applications and activities">
      <div className="flex flex-col lg:flex-row items-start gap-6">

        {/* ── Filter sidebar ── */}
        <div className="w-full lg:w-64 shrink-0 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
          {FILTERS.map((f) => {
            const active = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <f.icon className="h-4 w-4" />
                  {f.label}
                </span>
                {counts[f.key] > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {counts[f.key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Notification list ── */}
        <div className="flex-1 w-full rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-b border-gray-50 px-5 py-3">
            <button
              onClick={markAllRead}
              disabled={counts.unread === 0}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <HiOutlineEnvelopeOpen className="h-4 w-4" />
              Mark all read
            </button>

            <div className="relative">
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Sort by: {sortOrder === "latest" ? "Latest" : "Oldest"}
                <HiChevronDown className="h-4 w-4" />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                    {["latest", "oldest"].map((o) => (
                      <button
                        key={o}
                        onClick={() => { setSortOrder(o); setSortOpen(false); }}
                        className={`block w-full px-3 py-1.5 text-left text-sm capitalize hover:bg-gray-50 ${sortOrder === o ? "text-blue-600 font-medium" : "text-gray-600"}`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Rows */}
          {loading && (
            <div className="px-5 py-16 text-center text-sm text-gray-400">Loading notifications…</div>
          )}

          {!loading && paginated.length === 0 && (
            <div className="px-5 py-16 text-center">
              <HiOutlineBellAlert className="mx-auto mb-3 h-10 w-10 text-gray-200" />
              <p className="text-sm text-gray-400">No notifications here yet.</p>
            </div>
          )}

          {!loading && paginated.map((n) => {
            const isUnread = !readIds.has(n.id);
            const style = TYPE_STYLES[n.type] || TYPE_STYLES.status;
            return (
              <button
                key={n.id}
                onClick={() => markOneRead(n.id)}
                className={`flex w-full items-start gap-4 border-b border-gray-50 px-5 py-4 text-left transition hover:bg-gray-50/60 ${isUnread ? "bg-blue-50/40" : ""}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.fg}`}>
                  <style.icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-gray-500 leading-relaxed">{n.message}</p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2 pl-2">
                  <span className="whitespace-nowrap text-xs text-gray-400">{fmtDateTime(n.date)}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${isUnread ? "bg-blue-600" : "border border-gray-300"}`} />
                </div>
              </button>
            );
          })}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <p className="text-xs text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} notifications
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <HiOutlineChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: pageCount }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition ${
                      page === i + 1 ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <HiOutlineChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CandidateLayout>
  );
}
