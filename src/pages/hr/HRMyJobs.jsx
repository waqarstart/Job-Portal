import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import HRLayout from "../../layouts/HRLayout";
import { getHRJobs, deleteHRJob, updateHRJob } from "../../services/hrService";

export default function HRMyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    getHRJobs().then(setJobs).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this job?")) return;
    await deleteHRJob(id);
    load();
  }

  async function toggleStatus(job) {
    await updateHRJob(job._id, { status: job.status === "active" ? "closed" : "active" });
    load();
  }

  return (
    <HRLayout title="My Jobs" subtitle="Manage all the jobs you've posted">
      <div className="flex justify-end mb-6">
        <Link to="/hr/post-job"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          <HiOutlinePlus className="h-4 w-4" /> Post New Job
        </Link>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job._id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{job.title}</h3>
                <p className="text-sm text-gray-500">{job.company} • {job.city} • {job.type}</p>
                {job.salary && <p className="text-sm text-gray-400">{job.salary}</p>}
                <p className="mt-1 text-xs text-gray-400">Posted {new Date(job.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => toggleStatus(job)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${job.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {job.status === "active" ? "Active" : "Closed"}
                </button>
                <button onClick={() => handleDelete(job._id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100">
                  <HiOutlineTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && jobs.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            No jobs posted yet.{" "}
            <Link to="/hr/post-job" className="text-blue-600 font-medium">Post your first job →</Link>
          </div>
        )}
      </div>
      
    </HRLayout>
  );
}
