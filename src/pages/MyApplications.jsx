import { useEffect, useState } from "react";
import CandidateLayout from "../layouts/CandidateLayout";
import { getMyApplications } from "../services/applicationService";

const STATUS_STYLES = {
  applied: "bg-gray-100 text-gray-700",
  under_review: "bg-amber-50 text-amber-700",
  shortlisted: "bg-purple-50 text-purple-700",
  interviewed: "bg-blue-50 text-blue-700",
  selected: "bg-green-50 text-green-700",
  hired: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyApplications()
      .then(setApps)
      .finally(() => setLoading(false));
  }, []);

  return (
    <CandidateLayout title="Applications" subtitle="Track the status of every job you've applied to.">
      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="space-y-4">
        {apps.map((app) => (
          <div key={app._id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{app.job?.title}</h3>
                <p className="text-gray-500">
                  {app.job?.company} • {app.job?.city}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  STATUS_STYLES[app.status] || "bg-gray-100 text-gray-700"
                }`}
              >
                {app.status.replace("_", " ")}
              </span>
            </div>

            {typeof app.interviewRating === "number" && (
              <div className="mt-3 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Interview rating: {app.interviewRating}/10
              </div>
            )}

            {app.interviewSummary && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                <strong>Interview summary:</strong> {app.interviewSummary}
              </div>
            )}
          </div>
        ))}

        {!loading && apps.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            You haven&apos;t applied to any jobs yet.
          </div>
        )}
      </div>
    </CandidateLayout>
  );
}
