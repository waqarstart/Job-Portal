import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminAnalytics } from "../../services/adminService";

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAnalytics().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout title="Analytics"><p className="text-gray-500">Loading...</p></AdminLayout>;

  const statusMap = Object.fromEntries((data?.statusCounts || []).map((s) => [s._id, s.count]));
  const roleMap = Object.fromEntries((data?.roleCounts || []).map((r) => [r._id, r.count]));

  return (
    <AdminLayout title="Analytics" subtitle="System performance and platform trends">
      {/* Weekly highlights */}
      <div className="grid gap-5 sm:grid-cols-3 mb-8">
        <HighlightCard label="New Users (7 days)" value={data?.weeklyStats.newUsers ?? 0} color="blue" />
        <HighlightCard label="New Applications (7 days)" value={data?.weeklyStats.newApplications ?? 0} color="purple" />
        <HighlightCard label="New Jobs (7 days)" value={data?.weeklyStats.newJobs ?? 0} color="teal" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Applications by status */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Applications by Status</h2>
          <div className="space-y-3">
            {[
              ["applied", "Applied", "bg-gray-300"],
              ["under_review", "Under Review", "bg-amber-400"],
              ["shortlisted", "Shortlisted", "bg-purple-400"],
              ["interviewed", "Interviewed", "bg-blue-400"],
              ["selected", "Selected", "bg-green-400"],
              ["hired", "Hired", "bg-green-600"],
              ["rejected", "Rejected", "bg-red-400"],
            ].map(([key, label, color]) => {
              const count = statusMap[key] || 0;
              const total = Object.values(statusMap).reduce((a, b) => a + b, 0) || 1;
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{label}</span><span>{count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Jobs by type */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Jobs by Type</h2>
          <div className="space-y-3">
            {(data?.jobTypeCounts || []).map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item._id}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Users by role */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Users by Role</h2>
          <div className="space-y-4">
            {[
              ["user", "Candidates", "bg-blue-600"],
              ["hr", "HR Users", "bg-green-600"],
              ["admin", "Admins", "bg-purple-600"],
            ].map(([key, label, color]) => {
              const count = roleMap[key] || 0;
              const total = Object.values(roleMap).reduce((a, b) => a + b, 0) || 1;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100">
                    <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function HighlightCard({ label, value, color }) {
  const colors = { blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", teal: "text-teal-600 bg-teal-50" };
  return (
    <div className={`rounded-2xl p-5 shadow-sm ${colors[color]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
