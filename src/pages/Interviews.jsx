import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineMapPin,
  HiOutlineVideoCamera,
  HiOutlineUserGroup,
  HiOutlineEllipsisVertical,
  HiOutlineSparkles,
} from "react-icons/hi2";
import CandidateLayout from "../layouts/CandidateLayout";
import { getMyApplications } from "../services/applicationService";

const AVATAR_COLORS = [
  "bg-indigo-700", "bg-orange-500", "bg-blue-600",
  "bg-emerald-600", "bg-rose-600", "bg-gray-900",
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
  pending: { label: "Pending", badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  completed: { label: "Completed", badge: "bg-green-50 text-green-700", dot: "bg-green-500" },
  cancelled: { label: "Cancelled", badge: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

function formatDate(date) {
  const d = new Date(date);
  return {
    date: d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
    weekday: d.toLocaleDateString(undefined, { weekday: "long" }),
    time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

export default function Interviews() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getMyApplications()
      .then(setApps)
      .finally(() => setLoading(false));
  }, []);

  // Only applications that actually have a scheduled interview
  const interviews = useMemo(
    () => apps.filter((a) => a.interviewDate && a.interviewStatus),
    [apps]
  );

  const counts = useMemo(() => {
    const c = { all: interviews.length, pending: 0, completed: 0, cancelled: 0 };
    interviews.forEach((a) => { c[a.interviewStatus] = (c[a.interviewStatus] || 0) + 1; });
    return c;
  }, [interviews]);

  const visible = useMemo(() => {
    let list = [...interviews];
    if (filter !== "all") list = list.filter((a) => a.interviewStatus === filter);
    list.sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));
    return list;
  }, [interviews, filter]);

  const TABS = [
    { key: "all", label: "All Interviews", count: counts.all, icon: HiOutlineCalendarDays },
    { key: "pending", label: "Pending", count: counts.pending, icon: HiOutlineClock },
    { key: "completed", label: "Completed", count: counts.completed, icon: HiOutlineCheckCircle },
    { key: "cancelled", label: "Cancelled", count: counts.cancelled, icon: HiOutlineXCircle },
  ];

  const STAT_CARDS = [
    { icon: HiOutlineCalendarDays, iconBg: "bg-blue-50", iconColor: "text-blue-600", cardBg: "bg-blue-50/40", value: counts.all, label: "Total Interviews", sub: "All scheduled interviews" },
    { icon: HiOutlineClock, iconBg: "bg-amber-100", iconColor: "text-amber-600", cardBg: "bg-amber-50/40", value: counts.pending, label: "Pending", sub: "Awaiting your response" },
    { icon: HiOutlineCheckCircle, iconBg: "bg-green-100", iconColor: "text-green-600", cardBg: "bg-green-50/40", value: counts.completed, label: "Completed", sub: "Interviews completed" },
    { icon: HiOutlineXCircle, iconBg: "bg-red-100", iconColor: "text-red-600", cardBg: "bg-red-50/40", value: counts.cancelled, label: "Cancelled", sub: "Interviews cancelled" },
  ];

  return (
    <CandidateLayout title="Interviews" subtitle="Track and manage your upcoming and past interviews.">

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

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition ${
              filter === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            <span className={`rounded-full px-1.5 text-xs ${filter === t.key ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {/* Interview cards */}
      <div className="space-y-4">
        {visible.map((app) => {
          const status = STATUS_META[app.interviewStatus] || STATUS_META.pending;
          const dt = formatDate(app.interviewDate);
          const company = app.job?.company || "Company";

          return (
            <div key={app._id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-start gap-5">

                {/* Company + role */}
                <div className="flex items-start gap-4 lg:w-1/3">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-white font-bold ${avatarColor(company)}`}>
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
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <HiOutlineVideoCamera className="h-3.5 w-3.5" />
                        AI Interview
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date/time + type banner */}
                <div className="lg:flex-1">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <HiOutlineCalendarDays className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{dt.date}</p>
                        <p className="text-xs text-gray-400">{dt.weekday}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <HiOutlineClock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{dt.time}</p>
                        {app.interviewDurationMinutes && (
                          <p className="text-xs text-gray-400">({app.interviewDurationMinutes} min)</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {app.interviewStatus === "cancelled" ? (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      <HiOutlineUserGroup className="h-4 w-4 shrink-0" />
                      Reason: {app.interviewCancelReason || "Not specified"}
                    </div>
                  ) : app.interviewType ? (
                    <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      app.interviewStatus === "completed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {app.interviewType.toLowerCase().includes("hr") ? (
                        <HiOutlineUserGroup className="h-4 w-4 shrink-0" />
                      ) : (
                        <HiOutlineVideoCamera className="h-4 w-4 shrink-0" />
                      )}
                      Interview type: {app.interviewType}
                    </div>
                  ) : null}

                  {expandedId === app._id && (
                    <div className="mt-3 space-y-2 text-sm text-gray-600 border-t pt-3">
                      {typeof app.interviewRating === "number" && (
                        <p><strong className="text-gray-800">Rating:</strong> {app.interviewRating}/10</p>
                      )}
                      {app.interviewSummary && (
                        <p><strong className="text-gray-800">Feedback:</strong> {app.interviewSummary}</p>
                      )}
                      {!app.interviewSummary && typeof app.interviewRating !== "number" && (
                        <p className="text-gray-400">No feedback details available yet.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Status + action */}
                <div className="flex items-start gap-2 lg:flex-col lg:items-end shrink-0">
                  <div className="flex items-center gap-2">
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
                        <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border bg-white shadow-lg z-10 py-1">
                          <Link
                            to={`/jobs/${app.job?._id}`}
                            onClick={() => setOpenMenuId(null)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            View Job
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {app.interviewStatus === "pending" && (
                    <Link
                      to={`/interview/${app.job?._id}`}
                      state={{ job: app.job, applicationId: app._id }}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 whitespace-nowrap"
                    >
                      Start Interview
                    </Link>
                  )}

                  {app.interviewStatus === "completed" && (
                    <button
                      onClick={() => setExpandedId(expandedId === app._id ? null : app._id)}
                      className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                    >
                      {expandedId === app._id ? "Hide Feedback" : "View Feedback"}
                    </button>
                  )}

                  {app.interviewStatus === "cancelled" && (
                    <button
                      onClick={() => setExpandedId(expandedId === app._id ? null : app._id)}
                      className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                    >
                      {expandedId === app._id ? "Hide Details" : "View Details"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!loading && visible.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm border">
            <HiOutlineCalendarDays className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            {interviews.length === 0
              ? "No interviews scheduled yet."
              : "No interviews in this category."}
          </div>
        )}
      </div>

      {/* Tips banner */}
      <div className="mt-6 rounded-2xl border bg-blue-50/60 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <HiOutlineSparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Stay prepared for your next interview</p>
            <p className="text-sm text-gray-600">View tips and resources to ace your interviews.</p>
          </div>
        </div>

        <button className="flex items-center gap-2 shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          View Resources
        </button>
      </div>
    </CandidateLayout>
  );
}
