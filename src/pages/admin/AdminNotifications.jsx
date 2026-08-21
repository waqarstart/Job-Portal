import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminDashboard } from "../../services/adminService";

export default function AdminNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then((data) => {
        const notifs = [
          ...data.recentUsers.map((u) => ({
            id: `user-${u._id}`,
            message: `New ${u.role} registered: ${u.name}`,
            date: u.createdAt,
            type: "user",
          })),
          ...data.recentJobs.map((j) => ({
            id: `job-${j._id}`,
            message: `New job posted: ${j.title} at ${j.company}`,
            date: j.createdAt,
            type: "job",
          })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date));
        setItems(notifs);
      })
      .finally(() => setLoading(false));
  }, []);

  const icons = { user: "👤", job: "💼" };

  return (
    <AdminLayout title="Notifications" subtitle="Recent platform activity and system events">
      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg">
              {icons[item.type] || "🔔"}
            </div>
            <div>
              <p className="text-sm text-gray-700">{item.message}</p>
              <p className="text-xs text-gray-400">{new Date(item.date).toLocaleString()}</p>
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">No notifications yet.</div>
        )}
      </div>
    </AdminLayout>
  );
}
