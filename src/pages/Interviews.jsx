import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CandidateLayout from "../layouts/CandidateLayout";
import { getMyApplications } from "../services/applicationService";

export default function Interviews() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyApplications()
      .then(setApps)
      .finally(() => setLoading(false));
  }, []);

  const pending = apps.filter((a) => a.status === "applied");
  const completed = apps.filter((a) => a.status !== "applied");

  return (
    <CandidateLayout title="Interviews" subtitle="Your AI interviews — pending and completed.">
      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && (
        <>
          <h2 className="mb-3 font-semibold text-gray-700">Pending</h2>
          <div className="mb-8 space-y-4">
            {pending.map((app) => (
              <div key={app._id} className="flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm">
                <div>
                  <h3 className="font-semibold">{app.job?.title}</h3>
                  <p className="text-sm text-gray-500">{app.job?.company}</p>
                </div>
                <Link
                  to={`/interview/${app.job?._id}`}
                  state={{ job: app.job, applicationId: app._id }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Start Interview
                </Link>
              </div>
            ))}
            {pending.length === 0 && <p className="text-sm text-gray-400">No pending interviews.</p>}
          </div>

          <h2 className="mb-3 font-semibold text-gray-700">Completed</h2>
          <div className="space-y-4">
            {completed.map((app) => (
              <div key={app._id} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{app.job?.title}</h3>
                    <p className="text-sm text-gray-500">{app.job?.company}</p>
                  </div>
                  {typeof app.interviewRating === "number" && (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      {app.interviewRating}/10
                    </span>
                  )}
                </div>
                {app.interviewSummary && (
                  <p className="mt-3 text-sm text-gray-600">{app.interviewSummary}</p>
                )}
              </div>
            ))}
            {completed.length === 0 && <p className="text-sm text-gray-400">No completed interviews yet.</p>}
          </div>
        </>
      )}
    </CandidateLayout>
  );
}
