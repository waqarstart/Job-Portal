import { useEffect, useState } from "react";
import CandidateLayout from "../layouts/CandidateLayout";
import { getMyApplications } from "../services/applicationService";

const STATUS_MESSAGES = {
  under_review: (job) => `Your application for ${job} is now under review.`,
  shortlisted: (job) => `You've been shortlisted for ${job}!`,
  interviewed: (job) => `Your interview for ${job} has been completed.`,
  selected: (job) => `You've been selected for ${job}. 🎉`,
  hired: (job) => `Congratulations — you were hired for ${job}!`,
  rejected: (job) => `Your application for ${job} was not selected this time.`,
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyApplications()
      .then((apps) => {
        const notifications = apps
          .filter((a) => STATUS_MESSAGES[a.status])
          .map((a) => ({
            id: a._id,
            message: STATUS_MESSAGES[a.status](a.job?.title || "a job"),
            date: a.updatedAt,
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setItems(notifications);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <CandidateLayout title="Notifications" subtitle="Updates on your applications.">
      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-700">{item.message}</p>
            <p className="mt-1 text-xs text-gray-400">{new Date(item.date).toLocaleString()}</p>
          </div>
        ))}

        {!loading && items.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            No notifications yet — updates on your applications will show up here.
          </div>
        )}
      </div>
    </CandidateLayout>
  );
}
