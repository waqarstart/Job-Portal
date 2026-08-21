import { useEffect, useState } from "react";
import HRLayout from "../../layouts/HRLayout";
import { getHRApplicants } from "../../services/hrService";

export default function HRNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHRApplicants()
      .then((apps) => {
        const notifications = apps
          .slice(0, 20)
          .map((a) => ({
            id: a._id,
            message: `${a.user?.name} applied for ${a.job?.title}`,
            date: a.createdAt,
            type: "application",
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setItems(notifications);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <HRLayout title="Notifications" subtitle="Recent activity on your job postings">
      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-sm font-bold">
              📋
            </div>
            <div>
              <p className="text-sm text-gray-700">{item.message}</p>
              <p className="text-xs text-gray-400">{new Date(item.date).toLocaleString()}</p>
            </div>
          </div>
        ))}

        {!loading && items.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            No notifications yet.
          </div>
        )}
      </div>
    </HRLayout>
  );
}
