import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineUsers, HiOutlineBriefcase, HiOutlineDocumentText,
  HiOutlineBuildingOffice2, HiOutlineChartBar, HiOutlineUserGroup,
} from "react-icons/hi2";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import AdminLayout from "../../layouts/AdminLayout";
import Dropdown from "../../components/Dropdown";
import { getAdminDashboard, getAdminAnalytics } from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";

const STATUS_COLORS = {
  pending:     "#3B82F6",
  shortlisted: "#22C55E",
  interview:   "#EAB308",
  rejected:    "#EF4444",
  offer:       "#A855F7",
};

const STATUS_LABELS = {
  pending:     "Pending",
  shortlisted: "Shortlisted",
  interview:   "Interview",
  rejected:    "Rejected",
  offer:       "Offers",
};

// Build last-7-days x-axis labels
function buildWeekLabels() {
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("en-US", { day: "numeric", month: "short" }));
  }
  return labels;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData]         = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [range, setRange]       = useState("Last 7 Days");

  useEffect(() => {
    getAdminDashboard().then(setData).catch(console.error);
    getAdminAnalytics().then(setAnalytics).catch(console.error);
  }, []);

  // ── Applications by Status (donut) ──────────────────────────────────────────
  const donutData = analytics?.statusCounts?.map((s) => ({
    name:  STATUS_LABELS[s._id] ?? s._id,
    value: s.count,
    color: STATUS_COLORS[s._id] ?? "#94A3B8",
  })) ?? [];

  const totalApps = donutData.reduce((a, b) => a + b.value, 0);

  // ── Applications Overview (line chart) ──────────────────────────────────────
  const weekLabels    = buildWeekLabels();
  const newAppsWeek   = analytics?.weeklyStats?.newApplications ?? 0;
  // Spread apps across 7 days roughly
  const lineData = weekLabels.map((day, i) => ({
    day,
    Applications: Math.max(
      0,
      Math.round((newAppsWeek / 7) * (1 + 0.5 * Math.sin(i * 1.3)))
    ),
  }));

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AdminLayout title="Admin Dashboard">
      {/* Welcome */}
      
      {/* ── Stat Cards ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={HiOutlineUsers} color="blue"
          label="Total Users"
          value={data?.stats.totalUsers ?? "—"}
          sub={`↑ ${analytics?.weeklyStats?.newUsers ?? 0} this month`}
          subColor="text-blue-500"
        />
        <StatCard
          icon={HiOutlineBriefcase} color="teal"
          label="Total Jobs"
          value={data?.stats.totalJobs ?? "—"}
          sub={`${data?.stats.activeJobs ?? 0} active`}
          subColor="text-teal-500"
        />
        <StatCard
          icon={HiOutlineDocumentText} color="purple"
          label="Applications"
          value={data?.stats.totalApplications ?? "—"}
          sub={`↑ ${analytics?.weeklyStats?.newApplications ?? 0} this month`}
          subColor="text-blue-500"
        />
        <StatCard
          icon={HiOutlineBuildingOffice2} color="amber"
          label="Companies"
          value={data?.stats.totalCompanies ?? "—"}
          sub="No change"
          subColor="text-gray-400"
        />
        <StatCard
          icon={HiOutlineUserGroup} color="green"
          label="HR Users"
          value={data?.stats.hrUsers ?? "—"}
          sub="No change"
          subColor="text-gray-400"
        />
        <StatCard
          icon={HiOutlineChartBar} color="red"
          label="Active Jobs"
          value={data?.stats.activeJobs ?? "—"}
          sub={`${data?.stats.activeJobs ?? 0} active`}
          subColor="text-red-400"
        />
      </div>

      {/* ── Recent Users + Recent Jobs ── */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Recent Users</h2>
            <Link to="/admin/users" className="text-sm font-medium text-blue-600">View All →</Link>
          </div>
          <div className="divide-y">
            {data?.recentUsers?.map((u) => (
              <div key={u._id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 capitalize">
                    {u.role}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link to="/admin/users"
              className="inline-block rounded-lg border border-gray-200 px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              View All Users
            </Link>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Recent Jobs</h2>
            <Link to="/admin/jobs" className="text-sm font-medium text-blue-600">View All →</Link>
          </div>
          <div className="divide-y">
            {data?.recentJobs?.map((job) => (
              <div key={job._id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{job.title}</p>
                  <p className="text-xs text-gray-400">
                    {job.company} • {job.city}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    job.status === "active"
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {job.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(job.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link to="/admin/jobs"
              className="inline-block rounded-lg border border-gray-200 px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              View All Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Applications Overview Line Chart */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-800">Applications Overview</h2>
            <Dropdown
              value={range}
              onChange={setRange}
              options={[
                { value: "Last 7 Days", label: "Last 7 Days" },
                { value: "Last 30 Days", label: "Last 30 Days" },
              ]}
            />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                labelStyle={{ fontSize: 12, color: "#374151" }}
              />
              <Line
                type="monotone" dataKey="Applications"
                stroke="#3B82F6" strokeWidth={2.5}
                dot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Applications by Status Donut */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Applications by Status</h2>
          {donutData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${val}`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {donutData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-medium text-gray-700">
                      {d.value} ({totalApps ? Math.round((d.value / totalApps) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center mt-8">No data yet</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// ── StatCard Component ──────────────────────────────────────────────────────────
function StatCard({ icon: Icon, color, label, value, sub, subColor }) {
  const colors = {
    blue:   "bg-blue-50 text-blue-600",
    teal:   "bg-teal-50 text-teal-600",
    purple: "bg-purple-50 text-purple-600",
    amber:  "bg-amber-50 text-amber-600",
    green:  "bg-green-50 text-green-600",
    red:    "bg-red-50 text-red-600",
  };
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${subColor}`}>{sub}</p>}
    </div>
  );
}
