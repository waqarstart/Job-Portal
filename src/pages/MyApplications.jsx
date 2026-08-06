import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getMyApplications } from "../services/applicationService";

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyApplications()
      .then(setApps)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold">My Applications</h1>

        {loading && <p className="mt-6 text-gray-500">Loading...</p>}

        <div className="mt-8 space-y-4">
          {apps.map((app) => (
            <div key={app._id} className="rounded-xl border bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold">{app.job?.title}</h3>
              <p className="text-gray-500">
                {app.job?.company} • {app.job?.city}
              </p>

              <span className="mt-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-600">
                {app.status}
              </span>

              {app.interviewSummary && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  <strong>Interview summary:</strong> {app.interviewSummary}
                </div>
              )}
            </div>
          ))}

          {!loading && apps.length === 0 && (
            <div className="rounded-xl bg-white p-10 text-center text-gray-500 shadow">
              You haven&apos;t applied to any jobs yet.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
