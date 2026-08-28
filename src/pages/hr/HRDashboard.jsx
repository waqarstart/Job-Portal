import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import {
  HiOutlineUserGroup, HiOutlineDocumentPlus, HiOutlineEye, HiOutlineStar,
  HiOutlineCalendarDays, HiOutlineCheckCircle, HiOutlinePlus, HiOutlineBell,
  HiOutlineEllipsisVertical, HiOutlineClock, HiOutlineChevronRight,
  HiOutlineCodeBracket, HiOutlineUsers, HiOutlineCloud, HiOutlinePaintBrush,
} from "react-icons/hi2";
import HRLayout from "../../layouts/HRLayout";
import Dropdown from "../../components/Dropdown";
import { getHRDashboard } from "../../services/hrService";

const PERIOD_OPTIONS = [
  { value: "month", label: "This Month" },
  { value: "week", label: "Last Week" },
];

const SOURCE_COLORS = {
  "Company Website": "#2563eb",
  "LinkedIn": "#38bdf8",
  "Indeed": "#f59e0b",
  "Referral": "#f87171",
  "Other": "#a78bfa",
};

const STATUS_META = {
  applied: { label: "Applied", badge: "bg-gray-100 text-gray-700" },
  under_review: { label: "Under Review", badge: "bg-amber-50 text-amber-700" },
  shortlisted: { label: "Shortlisted", badge: "bg-blue-50 text-blue-700" },
  interviewed: { label: "Interviewed", badge: "bg-purple-50 text-purple-700" },
  offered: { label: "Offered", badge: "bg-cyan-50 text-cyan-700" },
  selected: { label: "Selected", badge: "bg-cyan-50 text-cyan-700" },
  hired: { label: "Hired", badge: "bg-green-50 text-green-700" },
  rejected: { label: "Rejected", badge: "bg-red-50 text-red-700" },
};

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function initials(name = "") {
  const words = name.trim().split(/\s+/);
  if (!words[0]) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const JOB_ICONS = [HiOutlineCodeBracket, HiOutlineUsers, HiOutlinePaintBrush, HiOutlineCloud];

export default function HRDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pipelinePeriod, setPipelinePeriod] = useState("month");
  const [pipelineLoading, setPipelineLoading] = useState(false);

  useEffect(() => {
    getHRDashboard(pipelinePeriod)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handlePeriodChange(period) {
    setPipelinePeriod(period);
    setPipelineLoading(true);

    getHRDashboard(period)
      .then((data) =>
        setStats((prev) => (prev ? { ...prev, pipeline: data.pipeline, pipelinePeriod: data.pipelinePeriod } : data))
      )
      .catch(console.error)
      .finally(() => setPipelineLoading(false));
  }


  const chartData = useMemo(
    () =>
      (stats?.applicationsOverview || []).map((d) => ({
        ...d,
        label: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      })),
    [stats]
  );

  const sourceData = useMemo(
    () => (stats?.applicationsBySource || []).map((s) => ({ ...s, color: SOURCE_COLORS[s.source] || "#94a3b8" })),
    [stats]
  );

  const totalSource = sourceData.reduce((sum, s) => sum + s.count, 0);

  const STAT_CARDS = [
    { icon: HiOutlineUserGroup, bg: "bg-blue-50", color: "text-blue-600", value: stats?.totalApplicants ?? 0, label: "Total Applicants", trend: stats?.newApplicationsThisWeek ? `↑ ${stats.newApplicationsThisWeek} this week` : null },
    { icon: HiOutlineDocumentPlus, bg: "bg-green-50", color: "text-green-600", value: stats?.newApplicationsThisWeek ?? 0, label: "New Applications", trend: "this week" },
    { icon: HiOutlineEye, bg: "bg-amber-50", color: "text-amber-600", value: stats?.underReview ?? 0, label: "Under Review", trend: null },
    { icon: HiOutlineStar, bg: "bg-purple-50", color: "text-purple-600", value: stats?.shortlisted ?? 0, label: "Shortlisted", trend: null },
    { icon: HiOutlineCalendarDays, bg: "bg-cyan-50", color: "text-cyan-600", value: stats?.interviewsScheduled ?? 0, label: "Interviews", trend: null },
    { icon: HiOutlineCheckCircle, bg: "bg-emerald-50", color: "text-emerald-600", value: stats?.hired ?? 0, label: "Hired", trend: null },
  ];

  const PIPELINE = [
    { key: "applied", label: "Applied", icon: HiOutlineDocumentPlus, bg: "bg-blue-50", color: "text-blue-600" },
    { key: "underReview", label: "Under Review", icon: HiOutlineEye, bg: "bg-amber-50", color: "text-amber-600" },
    { key: "shortlisted", label: "Shortlisted", icon: HiOutlineUsers, bg: "bg-purple-50", color: "text-purple-600" },
    { key: "interviews", label: "Interviews", icon: HiOutlineCalendarDays, bg: "bg-blue-50", color: "text-blue-600" },
    { key: "offered", label: "Offered", icon: HiOutlineStar, bg: "bg-green-50", color: "text-green-600" },
    { key: "hired", label: "Hired", icon: HiOutlineCheckCircle, bg: "bg-green-100", color: "text-green-700" },
  ];

  return (
    <HRLayout
      title="Dashboard"
      subtitle="Here's what's happening with your hiring today."
      headerExtra={
        <Link
          to="/hr/post-job"
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 whitespace-nowrap"
        >
          <HiOutlinePlus className="h-4 w-4" />
          Post a Job
        </Link>
      }
    >
      {loading && <p className="text-gray-500">Loading dashboard...</p>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.bg} ${s.color} mb-3`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm font-medium text-gray-700">{s.label}</p>
            {s.trend && <p className="text-xs text-green-600 mt-0.5">{s.trend}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Hiring Pipeline */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Hiring Pipeline</h2>
            <Dropdown value={pipelinePeriod} onChange={handlePeriodChange} options={PERIOD_OPTIONS} />
          </div>

          <div className={`flex items-center overflow-x-auto gap-2 pb-1 transition-opacity ${pipelineLoading ? "opacity-50" : ""}`}>
            {PIPELINE.map((stage, i) => (
              <div key={stage.key} className="flex items-center shrink-0">
                <div className={`w-28 rounded-xl border p-4 text-center ${stage.bg}`}>
                  <stage.icon className={`h-5 w-5 mx-auto mb-2 ${stage.color}`} />
                  <p className="text-xl font-bold text-gray-900">{stats?.pipeline?.[stage.key] ?? 0}</p>
                  <p className="text-xs text-gray-500">{stage.label}</p>
                </div>
                {i < PIPELINE.length - 1 && (
                  <HiOutlineChevronRight className="h-5 w-5 text-gray-300 mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Interviews</h2>
            <Link to="/hr/interviews" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</Link>
          </div>

          <div className="space-y-4">
            {(stats?.upcomingInterviews || []).map((iv) => {
              const dt = new Date(iv.interviewDate);
              return (
                <div key={iv._id} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {initials(iv.candidateName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{iv.candidateName}</p>
                    <p className="text-xs text-gray-500 truncate">{iv.jobTitle}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <HiOutlineCalendarDays className="h-3 w-3" />
                      {dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      <HiOutlineClock className="h-3 w-3 ml-1" />
                      {dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold px-2.5 py-1">
                    Scheduled
                  </span>
                </div>
              );
            })}

            {!loading && (stats?.upcomingInterviews || []).length === 0 && (
              <p className="text-sm text-gray-400">No upcoming interviews scheduled.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Applications Overview */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Applications Overview</h2>
            <span className="rounded-lg border px-3 py-1.5 text-sm text-gray-600">Last 30 Days</span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="appFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} interval={4} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} fill="url(#appFill)" />
            </AreaChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="rounded-xl bg-blue-50 p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{stats?.totalApplicants ?? 0}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="rounded-xl bg-green-50 p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{stats?.newApplicationsThisWeek ?? 0}</p>
              <p className="text-xs text-gray-500">New</p>
            </div>
            <div className="rounded-xl bg-purple-50 p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{stats?.shortlisted ?? 0}</p>
              <p className="text-xs text-gray-500">Shortlisted</p>
            </div>
          </div>
        </div>

        {/* Applications by Source */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Applications by Source</h2>

          <div className="relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={sourceData}
                  dataKey="count"
                  nameKey="source"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {sourceData.map((s) => (
                    <Cell key={s.source} fill={s.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900">{totalSource}</p>
            </div>
          </div>

          <div className="space-y-2 mt-3">
            {sourceData.map((s) => (
              <div key={s.source} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.source}
                </span>
                <span className="text-gray-500">
                  {totalSource ? Math.round((s.count / totalSource) * 100) : 0}% ({s.count})
                </span>
              </div>
            ))}
            {sourceData.length === 0 && <p className="text-sm text-gray-400">No applications yet.</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Job Postings */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Job Postings</h2>
            <Link to="/hr/jobs" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 border-b">
                  <th className="pb-2 pr-4">Job Title</th>
                  <th className="pb-2 px-4 text-center">Applications</th>
                  <th className="pb-2 px-4 text-center">Shortlisted</th>
                  <th className="pb-2 px-4 text-center">Interviews</th>
                  <th className="pb-2 px-4 text-center">Hired</th>
                  <th className="pb-2 pl-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(stats?.recentJobPostings || []).map((job, i) => {
                  const Icon = JOB_ICONS[i % JOB_ICONS.length];
                  return (
                    <tr key={job._id}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{job.title}</p>
                            <p className="text-xs text-gray-400">{job.city} · {job.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-gray-700">{job.applications}</td>
                      <td className="py-3 px-4 text-center font-medium text-gray-700">{job.shortlisted}</td>
                      <td className="py-3 px-4 text-center font-medium text-gray-700">{job.interviews}</td>
                      <td className="py-3 px-4 text-center font-medium text-gray-700">{job.hired}</td>
                      <td className="py-3 pl-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          job.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {job.status === "active" ? "Active" : "Closed"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!loading && (stats?.recentJobPostings || []).length === 0 && (
              <p className="text-sm text-gray-400 py-4">No jobs posted yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Recent Applications */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Applications</h2>
              <Link to="/hr/applicants" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</Link>
            </div>

            <div className="space-y-4">
              {(stats?.recentApplications || []).map((app) => {
                const meta = STATUS_META[app.status] || STATUS_META.applied;
                return (
                  <div key={app._id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                      {initials(app.candidateName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{app.candidateName}</p>
                      <p className="text-xs text-gray-500 truncate">{app.jobTitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{timeAgo(app.createdAt)}</p>
                      <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {!loading && (stats?.recentApplications || []).length === 0 && (
                <p className="text-sm text-gray-400">No applications yet.</p>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tasks</h2>

            <div className="space-y-3 text-sm">
              <Link to="/hr/applicants" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                <HiOutlineCheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                Review {stats?.tasks?.newToReview ?? 0} new applications
              </Link>

              <Link to="/hr/interviews" className="flex items-center justify-between gap-2 text-gray-700 hover:text-blue-600">
                <span className="flex items-center gap-2">
                  <HiOutlineCheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  Schedule interviews for shortlisted candidates
                </span>
                {stats?.tasks?.shortlistedNeedingInterview > 0 && (
                  <span className="rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold px-2 py-0.5">
                    {stats.tasks.shortlistedNeedingInterview}
                  </span>
                )}
              </Link>

              <Link to="/hr/jobs" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                <HiOutlineCheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                Update job descriptions
              </Link>
            </div>

            <Link to="/hr/applicants" className="flex items-center justify-end gap-1 mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">
              View All Tasks
              <HiOutlineChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </HRLayout>
  );
}
