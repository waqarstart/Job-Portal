import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CandidateLayout from "../layouts/CandidateLayout";
import { getSavedJobs, unsaveJob } from "../services/savedJobService";

export default function SavedJobs() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    getSavedJobs()
      .then(setSaved)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleUnsave(jobId) {
    await unsaveJob(jobId);
    load();
  }

  return (
    <CandidateLayout title="Saved Jobs" subtitle="Jobs you've bookmarked to apply to later.">
      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="space-y-4">
        {saved.map(({ job, _id }) => (
          <div key={_id} className="flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm">
            <div>
              <h3 className="text-lg font-semibold">{job?.title}</h3>
              <p className="text-gray-500">
                {job?.company} • {job?.city}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                View Job
              </Link>
              <button
                onClick={() => handleUnsave(job._id)}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {!loading && saved.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            No saved jobs yet — browse jobs and save the ones you like.
          </div>
        )}
      </div>
    </CandidateLayout>
  );
}
