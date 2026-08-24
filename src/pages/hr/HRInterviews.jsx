import { useEffect, useState } from "react";
import HRLayout from "../../layouts/HRLayout";
import { getHRInterviews } from "../../services/hrService";

export default function HRInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHRInterviews().then(setInterviews).finally(() => setLoading(false));
  }, []);

  return (
    <HRLayout title="Interviews" subtitle="Candidates who have completed or are scheduled for AI interviews">
      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="space-y-4">
        {interviews.map((app) => (
          <div key={app._id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {(app.user?.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{app.user?.name}</p>
                    <p className="text-sm text-gray-500">{app.user?.email}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Job: <span className="font-medium">{app.job?.title}</span>
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  app.status === "selected" ? "bg-green-50 text-green-700" :
                  app.status === "shortlisted" ? "bg-purple-50 text-purple-700" :
                  "bg-blue-50 text-blue-700"
                }`}>
                  {app.status.replace("_", " ")}
                </span>
                {typeof app.interviewRating === "number" && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Rating: {app.interviewRating}/10
                  </span>
                )}
              </div>
            </div>

            {app.interviewSummary && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                <strong>Interview summary:</strong> {app.interviewSummary}
              </div>
            )}
          </div>
        ))}

        {!loading && interviews.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            No interviews yet — candidates will appear here after completing their AI interview.
          </div>
        )}
      </div>
    </HRLayout>
  );
}
