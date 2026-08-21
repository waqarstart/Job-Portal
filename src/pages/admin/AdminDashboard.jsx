import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineUsers, HiOutlineBriefcase, HiOutlineDocumentText,
  HiOutlineBuildingOffice2, HiOutlineChartBar, HiOutlineUserGroup,
} from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminDashboard } from "../../services/adminService";

const ROLE_COLORS = { user: "bg-blue-50 text-blue-700", hr: "bg-green-50 text-green-700", admin: "bg-purple-50 text-purple-700" };

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { getAdminDashboard().then(setData).catch(console.error); }, []);

  return (
    <AdminLayout title="Admin Dashboard" >
      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={HiOutlineUsers} color="blue" label="Total Users" value={data?.stats.totalUsers ?? "—"} />
        <StatCard icon={HiOutlineBriefcase} color="teal" label="Total Jobs" value={data?.stats.totalJobs ?? "—"} sub={`${data?.stats.activeJobs ?? 0} active`} />
        <StatCard icon={HiOutlineDocumentText} color="purple" label="Applications" value={data?.stats.totalApplications ?? "—"} />
        <StatCard icon={HiOutlineBuildingOffice2} color="amber" label="Companies" value={data?.stats.totalCompanies ?? "—"} />
        <StatCard icon={HiOutlineUserGroup} color="green" label="HR Users" value={data?.stats.hrUsers ?? "—"} />
        <StatCard icon={HiOutlineChartBar} color="red" label="Active Jobs" value={data?.stats.activeJobs ?? "—"} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent Users</h2>
            <Link to="/admin/users" className="text-sm font-medium text-blue-600">View All →</Link>
          </div>
          <div className="mt-4 divide-y">
            {data?.recentUsers.map((u) => (
              <div key={u._id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent Jobs</h2>
            <Link to="/admin/jobs" className="text-sm font-medium text-blue-600">View All →</Link>
          </div>
          <div className="mt-4 divide-y">
            {data?.recentJobs.map((job) => (
              <div key={job._id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{job.title}</p>
                  <p className="text-xs text-gray-400">{job.company} • {job.city}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${job.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { to: "/admin/users", label: "Manage Users", desc: "View and control all user accounts" },
          { to: "/admin/approve-jobs", label: "Approve Jobs", desc: "Review pending job postings" },
          { to: "/admin/analytics", label: "View Analytics", desc: "System performance and trends" },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="rounded-2xl border bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition">
            <p className="font-semibold">{item.label}</p>
            <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, color, label, value, sub }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600", teal: "bg-teal-50 text-teal-600",
    purple: "bg-purple-50 text-purple-600", amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600", red: "bg-red-50 text-red-600",
  };
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
