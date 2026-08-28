import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineMapPin,
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlineEllipsisVertical,
  HiOutlineChevronRight,
} from "react-icons/hi2";
import CandidateLayout from "../layouts/CandidateLayout";
import { getMyApplications } from "../services/applicationService";

const AVATAR_COLORS = [
  "bg-blue-600", "bg-orange-500", "bg-violet-600",
  "bg-emerald-600", "bg-rose-600", "bg-cyan-600", "bg-indigo-600",
];

function avatarColor(name = "") {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function companyInitials(name = "") {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const STATUS_META = {
  applied: { label: "Applied", dot: "bg-gray-500", badge: "bg-gray-100 text-gray-700" },
  under_review: { label: "In Review", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
  interviewed: { label: "In Review", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
  shortlisted: { label: "Shortlisted", dot: "bg-green-500", badge: "bg-green-50 text-green-700" },
  selected: { label: "Shortlisted", dot: "bg-green-500", badge: "bg-green-50 text-green-700" },
  hired: { label: "Hired", dot: "bg-green-500", badge: "bg-green-50 text-green-700" },
  rejected: { label: "Rejected", dot: "bg-red-500", badge: "bg-red-50 text-red-700" },
};

function bucketOf(status) {
  if (status === "applied") return "applied";
  if (status === "under_review" || status === "interviewed") return "in_review";
  if (status === "shortlisted" || status === "selected" || status === "hired") return "shortlisted";
  if (status === "rejected") return "rejected";
  return "applied";
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// Rough expected-response window (10 business days from application date)
// shown only while the application is still pending a decision.
function expectedResponseWindow(createdAt) {
  const start = new Date(createdAt);
  start.setDate(start.getDate() + 5);
  const end = new Date(createdAt);
  end.setDate(end.getDate() + 12);

  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = start.toLocaleDateString(undefined, { day: "numeric", month: sameMonth ? undefined : "short" });
  const endStr = end.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  return `${startStr} – ${endStr}`;
}

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    getMyApplications()
      .then(setApps)
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { all: apps.length, applied: 0, in_review: 0, shortlisted: 0, rejected: 0 };
    apps.forEach((a) => { c[bucketOf(a.status)]++; });
    return c;
  }, [apps]);

  const stats = useMemo(() => ({
    total: apps.length,
    shortlisted: apps.filter((a) => bucketOf(a.status) === "shortlisted").length,
    inProgress: apps.filter((a) => bucketOf(a.status) === "in_review").length,
    rejected: apps.filter((a) => bucketOf(a.status) === "rejected").length,
  }), [apps]);

  const visibleApps = useMemo(() => {
    if (filter === "all") return apps;
    return apps.filter((a) => bucketOf(a.status) === filter);
  }, [apps, filter]);

  const TABS = [
    { key: "all", label: "All", count: counts.all },
    { key: "applied", label: "Applied", count: counts.applied },
    { key: "in_review", label: "In Review", count: counts.in_review },
    { key: "shortlisted", label: "Shortlisted", count: counts.shortlisted },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  const STAT_CARDS = [
    { icon: HiOutlineDocumentText, iconBg: "bg-blue-50", iconColor: "text-blue-600", cardBg: "bg-blue-50/40", value: stats.total, label: "Total Applications", sub: "Jobs you have applied to" },
    { icon: HiOutlineCheckCircle, iconBg: "bg-green-100", iconColor: "text-green-600", cardBg: "bg-green-50/40", value: stats.shortlisted, label: "Shortlisted", sub: "You are in consideration" },
    { icon: HiOutlineClock, iconBg: "bg-amber-100", iconColor: "text-amber-600", cardBg: "bg-amber-50/40", value: stats.inProgress, label: "In Progress", sub: "Under review" },
    { icon: HiOutlineXCircle, iconBg: "bg-red-100", iconColor: "text-red-600", cardBg: "bg-red-50/40", value: stats.rejected, label: "Rejected", sub: "Not selected" },
  ];

  return (
    <CandidateLayout title="My Applications" subtitle="Track the status of jobs you have applied to.">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.cardBg}`}>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.iconBg} ${s.iconColor} mb-3`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm font-semibold text-gray-800">{s.label}</p>
            <p className="text-xs text-gray-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs + sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === t.key
                  ? "bg-blue-600 text-white"
                  : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 text-xs ${
                  filter === t.key ? "bg-white/20" : "bg-gray-100 text-gray-500"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
          Sort by: <span className="font-medium text-gray-700">Newest First</span>
        </div>
      </div>

      {/* Application cards */}
      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="space-y-4">
        {visibleApps.map((app) => {
          const status = STATUS_META[app.status] || STATUS_META.applied;
          const bucket = bucketOf(app.status);
          const isDecided = bucket === "shortlisted" || bucket === "rejected";
          const company = app.job?.company || "Company";

          return (
            <div key={app._id} className="rounded-2xl border bg-white p-5 shadow-sm relative">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-white font-bold ${avatarColor(company)}`}>
                    <span className="text-lg leading-none">{companyInitials(company)}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{app.job?.title || "Job title"}</h3>
                    <p className="text-gray-600 font-medium">{company}</p>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-sm text-gray-500">
                      {(app.job?.city || app.job?.location) && (
                        <span className="flex items-center gap-1">
                          <HiOutlineMapPin className="h-3.5 w-3.5" />
                          {app.job?.city || app.job?.location}
                        </span>
                      )}
                      {app.job?.type && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <HiOutlineBriefcase className="h-3.5 w-3.5" />
                            {app.job.type}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>Applied on {formatDate(app.createdAt)}</span>
                    </div>

                    {app.job?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {app.job.skills.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 shrink-0">
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>

                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === app._id ? null : app._id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                      <HiOutlineEllipsisVertical className="h-5 w-5" />
                    </button>

                    {openMenuId === app._id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border bg-white shadow-xl z-20 py-1">
                          <Link
                            to={`/jobs/${app.job?._id}`}
                            onClick={() => setOpenMenuId(null)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            View Job
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <HiOutlineCalendarDays className="h-4 w-4" />
                  {isDecided ? (
                    <span>
                      Responded on <span className="font-medium text-gray-700">{formatDate(app.updatedAt)}</span>
                    </span>
                  ) : (
                    <span>
                      Expected response{" "}
                      <span className="font-medium text-gray-700">{expectedResponseWindow(app.createdAt)}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4">
                  {app.cvOriginalName && (
                    <div className="flex items-center gap-2 text-sm">
                      <HiOutlineDocumentText className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-gray-800 font-medium leading-tight">Resume</p>
                        <p className="text-gray-400 text-xs leading-tight">{app.cvOriginalName}</p>
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/jobs/${app.job?._id}`}
                    className="flex items-center gap-1 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                  >
                    {bucket === "rejected" ? "View Feedback" : "View Details"}
                    <HiOutlineChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && visibleApps.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm border">
            <HiOutlineDocumentText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            {apps.length === 0
              ? "You haven't applied to any jobs yet."
              : "No applications in this category."}
          </div>
        )}
      </div>
    </CandidateLayout>
  );
}
