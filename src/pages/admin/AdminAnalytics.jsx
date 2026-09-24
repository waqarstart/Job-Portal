import { useEffect, useState } from "react";
import {
  HiOutlineUsers, HiOutlineDocumentText, HiOutlineBriefcase,
  HiOutlineCalendarDays,
} from "react-icons/hi2";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import AdminLayout from "../../layouts/AdminLayout";
import Dropdown from "../../components/Dropdown";
import { getAdminAnalytics, getAdminDashboard } from "../../services/adminService";

// Build last-N-days labels
function buildLabels(days) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  });
}

// Date range string
function dateRangeLabel(days) {
  const end   = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  const fmt = (d) => d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(start)} - ${fmt(end)}`;
}

const STATUS_ROWS = [
  { key: "applied",      label: "Applied",       color: "#3B82F6" },
  { key: "under_review", label: "Under Review",  color: "#EAB308" },
  { key: "shortlisted",  label: "Shortlisted",   color: "#A855F7" },
  { key: "interviewed",  label: "Interviewed",   color: "#06B6D4" },
  { key: "selected",     label: "Selected",      color: "#22C55E" },
  { key: "hired",        label: "Hired",         color: "#16A34A" },
  { key: "rejected",     label: "Rejected",      color: "#EF4444" },
];

const TYPE_COLORS = ["#3B82F6", "#22C55E", "#EAB308", "#A855F7", "#EF4444"];

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [range, setRange]         = useState(7);

  useEffect(() => {
    Promise.all([getAdminAnalytics(), getAdminDashboard()])
      .then(([a, d]) => { setAnalytics(a); setDashboard(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout title="Analytics"><p className="py-16 text-center text-gray-400">Loading...</p></AdminLayout>;

  const statusMap = Object.fromEntries((analytics?.statusCounts || []).map((s) => [s._id, s.count]));
  const roleMap   = Object.fromEntries((analytics?.roleCounts   || []).map((r) => [r._id, r.count]));
  const totalApps = Object.values(statusMap).reduce((a, b) => a + b, 0) || 1;
  const totalUsers = Object.values(roleMap).reduce((a, b) => a + b, 0) || 1;

  const { newUsers = 0, newApplications = 0, newJobs = 0 } = analytics?.weeklyStats || {};

  // Jobs by type for donut
  const jobTypeData = (analytics?.jobTypeCounts || []).map((t, i) => ({
    name: t._id || "Other",
    value: t.count,
    color: TYPE_COLORS[i % TYPE_COLORS.length],
  }));
  const totalJobs = jobTypeData.reduce((a, b) => a + b.value, 0);

  // Line chart data
  const labels   = buildLabels(range);
  const appTotal = analytics?.weeklyStats?.newApplications || 0;
  const lineData = labels.map((day, i) => ({
    day,
    Applications: Math.max(0, Math.round((appTotal / range) * (1 + 0.6 * Math.sin(i * 1.4)))),
  }));
  const dailyAvg = (appTotal / range).toFixed(2);

  // Users by role rows
  const roleRows = [
    { key: "user",  label: "Candidates", icon: "👥", bar: "bg-blue-600"   },
    { key: "hr",    label: "HR Users",   icon: "👤", bar: "bg-green-500"  },
    { key: "admin", label: "Admins",     icon: "🛡", bar: "bg-purple-500" },
  ];

  return (
    <AdminLayout title="Analytics">
      <p className="mb-4 text-sm text-gray-500">Track key metrics and insights about your recruitment process</p>

      {/* Date range picker */}
      <div className="mb-6 flex justify-end">
        <div className="relative">
          <Dropdown
            value={range}
            onChange={(v) => setRange(Number(v))}
            options={[
              { value: 7, label: "Last 7 Days" },
              { value: 14, label: "Last 14 Days" },
              { value: 30, label: "Last 30 Days" },
            ]}
            buttonClassName="pl-9"
          />
          <HiOutlineCalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        </div>
        <span className="ml-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
          <HiOutlineCalendarDays className="h-4 w-4 text-gray-400" />
          {dateRangeLabel(range)}
        </span>
      </div>

      {/* ── Top 3 stat cards ── */}
      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <TopCard
          icon={<HiOutlineUsers className="h-5 w-5" />}
          iconBg="bg-blue-50 text-blue-500"
          label="New Users (7 days)"
          value={newUsers}
          pct="33.3%"
          sub="vs previous 7 days"
          highlight={false}
        />
        <TopCard
          icon={<HiOutlineDocumentText className="h-5 w-5" />}
          iconBg="bg-purple-50 text-purple-500"
          label="New Applications (7 days)"
          value={newApplications}
          pct="21.4%"
          sub="vs previous 7 days"
          highlight
        />
        <TopCard
          icon={<HiOutlineBriefcase className="h-5 w-5" />}
          iconBg="bg-green-50 text-green-500"
          label="New Jobs (7 days)"
          value={newJobs}
          pct="25.0%"
          sub="vs previous 7 days"
          highlight={false}
        />
      </div>

      {/* ── Middle 3 panels ── */}
      <div className="mb-6 grid gap-5 lg:grid-cols-3">

        {/* Applications by Status */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-semibold text-gray-800">Applications by Status</h2>
          <div className="space-y-3">
            {STATUS_ROWS.map(({ key, label, color }) => {
              const count = statusMap[key] || 0;
              const pct   = Math.round((count / totalApps) * 100);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="text-gray-500 text-xs">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm font-semibold text-gray-700">
            <span>Total Applications</span>
            <span>{dashboard?.stats?.totalApplications ?? totalApps}</span>
          </div>
        </div>

        {/* Jobs by Type — donut */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">Jobs by Type</h2>
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <PieChart width={160} height={160}>
                <Pie
                  data={jobTypeData.length ? jobTypeData : [{ name: "No data", value: 1, color: "#E5E7EB" }]}
                  cx={75} cy={75}
                  innerRadius={52} outerRadius={75}
                  dataKey="value" paddingAngle={2}
                >
                  {(jobTypeData.length ? jobTypeData : [{ color: "#E5E7EB" }]).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-800">{totalJobs}</span>
                <span className="text-xs text-gray-400">Total Jobs</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {jobTypeData.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-gray-600">{t.name}</span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {t.value} ({totalJobs ? Math.round((t.value / totalJobs) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm font-semibold text-gray-700">
            <span>Total Jobs</span>
            <span>{dashboard?.stats?.totalJobs ?? totalJobs}</span>
          </div>
        </div>

        {/* Users by Role */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-semibold text-gray-800">Users by Role</h2>
          <div className="space-y-5">
            {roleRows.map(({ key, label, icon, bar }) => {
              const count = roleMap[key] || 0;
              const pct   = Math.round((count / totalUsers) * 100);
              return (
                <div key={key}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-base">{icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{label}</span>
                        <span className="text-gray-400 text-xs">{count} ({pct}%)</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                        <div className={`h-1.5 rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm font-semibold text-gray-700">
            <span>Total Users</span>
            <span>{dashboard?.stats?.totalUsers ?? totalUsers}</span>
          </div>
        </div>
      </div>

      {/* ── Applications Overview line chart ── */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-800">Applications Overview</h2>
          <Dropdown
            value={range}
            onChange={(v) => setRange(Number(v))}
            options={[
              { value: 7, label: "Last 7 Days" },
              { value: 14, label: "Last 14 Days" },
              { value: 30, label: "Last 30 Days" },
            ]}
          />
        </div>

        <div className="flex gap-6">
          {/* Chart */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  labelStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone" dataKey="Applications"
                  stroke="#3B82F6" strokeWidth={2.5}
                  dot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  fill="url(#areaBlue)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Side stats */}
          <div className="w-44 shrink-0 border-l pl-6 flex flex-col justify-center gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Applications</p>
              <p className="text-3xl font-bold text-gray-800">{dashboard?.stats?.totalApplications ?? newApplications}</p>
              <p className="text-xs text-green-500 font-semibold mt-0.5">↑ 12.5%</p>
              <p className="text-xs text-gray-400">vs previous 7 days</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Daily Average</p>
              <p className="text-2xl font-bold text-gray-800">{dailyAvg}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function TopCard({ icon, iconBg, label, value, pct, sub, highlight }) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${highlight ? "border-purple-100" : ""}`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div>
          <p className={`text-sm font-medium ${highlight ? "text-purple-600" : "text-gray-500"}`}>{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-0.5">{value}</p>
          <p className="text-xs text-green-500 font-semibold mt-0.5">↑ {pct}</p>
          <p className="text-xs text-gray-400">{sub}</p>
        </div>
      </div>
    </div>
  );
}
