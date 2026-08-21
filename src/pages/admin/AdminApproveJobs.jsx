import { useEffect, useState } from "react";
import { HiOutlineCheck, HiOutlineXMark } from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminJobs, updateJobStatus } from "../../services/adminService";

export default function AdminApproveJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function load() {
    getAdminJobs().then(setJobs).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function approve(id) {
    const updated = await updateJobStatus(id, "active");
    setJobs((prev) => prev.map((j) => (j._id === id ? updated : j)));
  }

  async function reject(id) {
    const updated = await updateJobStatus(id, "closed");
    setJobs((prev) => prev.map((j) => (j._id === id ? updated : j)));
  }

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  return (
    <AdminLayout title="Approve Jobs" subtitle="Review and approve or reject job postings">
      <div className="mb-6 flex gap-2">
        {["all", "active", "closed"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition ${
              filter === s ? "bg-blue-600 text-white" : "border bg-white text-gray-600 hover:bg-gray-50"
            }`}>
            {s}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="space-y-4">
        {filtered.map((job) => (
          <div key={job._id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-sm text-gray-500">{job.company} • {job.city} • {job.type}</p>
                {job.salary && <p className="text-xs text-gray-400">{job.salary}</p>}
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{job.description}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Posted by {job.postedBy?.name || "Admin"} on {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${job.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {job.status}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => approve(job._id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                    title="Approve / Set Active">
                    <HiOutlineCheck className="h-4 w-4" />
                  </button>
                  <button onClick={() => reject(job._id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                    title="Reject / Close">
                    <HiOutlineXMark className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">No jobs found.</div>
        )}
      </div>
    </AdminLayout>
  );
}
