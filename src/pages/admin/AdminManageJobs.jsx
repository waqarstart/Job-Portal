import { useEffect, useState } from "react";
import {
  HiOutlineTrash, HiOutlinePencilSquare, HiOutlineMagnifyingGlass,
  HiOutlinePlus, HiChevronDown, HiChevronLeft, HiChevronRight,
  HiOutlineBriefcase, HiOutlineCalendarDays,
} from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminJobs, updateJobStatus, deleteAdminJob } from "../../services/adminService";

const PAGE_SIZE = 8;

// Pick a small icon per job category keyword
function JobIcon({ title = "" }) {
  const t = title.toLowerCase();
  const base = "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 text-xl";
  if (t.includes("c++") || t.includes("frontend") || t.includes("react"))
    return <div className={base}>{"</>"}</div>;
  if (t.includes("laravel") || t.includes("php") || t.includes("cube"))
    return <div className={base}>⬡</div>;
  if (t.includes("ai") || t.includes("ml") || t.includes("robot"))
    return <div className={base}>🤖</div>;
  if (t.includes("backend") || t.includes("node") || t.includes("python"))
    return <div className={base}>{"{ }"}</div>;
  return <div className={base}><HiOutlineBriefcase className="h-5 w-5" /></div>;
}

export default function AdminManageJobs() {
  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]           = useState(1);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  async function load() {
    setLoading(true);
    getAdminJobs()
      .then((data) => { setJobs(data); setPage(1); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAdminJob(deleteModal._id);
      setJobs((prev) => prev.filter((j) => j._id !== deleteModal._id));
      setDeleteModal(null);
    } finally {
      setDeleting(false);
    }
  }

  // Filter
  const filtered = jobs.filter((j) => {
    const matchSearch = !search ||
      j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.company?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminLayout title="Manage Jobs">
      <p className="mb-6 text-sm text-gray-500">View, manage and manage all job listings</p>

      {/* ── Toolbar ── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-72">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search job title or keywords..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-9 text-sm text-gray-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="pending">Pending</option>
          </select>
          <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <div className="flex-1" />

        {/* Post New Job */}
        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">
          <HiOutlinePlus className="h-4 w-4" />
          Post New Job
        </button>
      </div>

      {/* ── Job Cards ── */}
      {loading ? (
        <p className="text-center text-sm text-gray-400 py-16">Loading...</p>
      ) : paginated.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-gray-400 shadow-sm border">No jobs found.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm divide-y divide-gray-100">
          {paginated.map((job) => (
            <div key={job._id} className="flex items-center gap-5 px-6 py-5 hover:bg-gray-50 transition">

              {/* Icon */}
              <JobIcon title={job.title} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 text-base">{job.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {job.company} &bull; {job.city}{job.country ? `, ${job.country}` : ", Pakistan"} &bull; {job.type || "Full Time"}
                </p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <HiOutlineCalendarDays className="h-3.5 w-3.5" />
                  Posted on {new Date(job.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>

              {/* Status badge */}
              <span className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold ${
                job.status === "active"
                  ? "bg-green-50 text-green-600 border border-green-100"
                  : job.status === "pending"
                  ? "bg-yellow-50 text-yellow-600 border border-yellow-100"
                  : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}>
                {job.status === "active" ? "Active" : job.status === "pending" ? "Pending" : "Closed"}
              </span>

              {/* Date + label */}
              <div className="shrink-0 text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700">
                  {new Date(job.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="text-xs text-gray-400">Posted</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-blue-500 hover:bg-blue-50 transition">
                  <HiOutlinePencilSquare className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteModal(job)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-red-500 hover:bg-red-50 transition"
                >
                  <HiOutlineTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} jobs
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <HiChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                  p === page
                    ? "border border-blue-600 bg-white text-blue-600"
                    : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <HiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-gray-800">Delete Job</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete <strong>{deleteModal.title}</strong>? This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteModal(null)}
                className="flex-1 rounded-xl border py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
