import { useEffect, useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminJobs, updateJobStatus, deleteAdminJob } from "../../services/adminService";

export default function AdminManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    getAdminJobs().then(setJobs).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleToggleStatus(job) {
    const newStatus = job.status === "active" ? "closed" : "active";
    const updated = await updateJobStatus(job._id, newStatus);
    setJobs((prev) => prev.map((j) => (j._id === job._id ? updated : j)));
  }

  async function handleDelete(id) {
    if (!confirm("Delete this job permanently?")) return;
    await deleteAdminJob(id);
    setJobs((prev) => prev.filter((j) => j._id !== id));
  }

  return (
    <AdminLayout title="Manage Jobs" subtitle="View and control all job postings across the platform">
      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job._id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-sm text-gray-500">{job.company} • {job.city} • {job.type}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Posted by: {job.postedBy?.name || "Admin"} • {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button onClick={() => handleToggleStatus(job)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    job.status === "active" ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}>
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
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">No jobs found.</div>
        )}
      </div>
    </AdminLayout>
  );
}
