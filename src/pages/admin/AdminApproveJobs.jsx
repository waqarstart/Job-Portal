import { useEffect, useState } from "react";
import {
  HiOutlineCheck, HiOutlineXMark, HiOutlineMagnifyingGlass,
  HiChevronDown, HiChevronLeft, HiChevronRight, HiOutlineCalendarDays,
  HiOutlineBriefcase,
} from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminJobs, updateJobStatus } from "../../services/adminService";

const PAGE_SIZE = 8;

function JobIcon({ title = "" }) {
  const t = title.toLowerCase();
  const base = "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 text-lg font-bold";
  if (t.includes("c++") || t.includes("frontend") || t.includes("react"))
    return <div className={base}>{"</>"}</div>;
  if (t.includes("laravel") || t.includes("php"))
    return <div className={base}>⬡</div>;
  if (t.includes("ai") || t.includes("ml") || t.includes("robot"))
    return <div className={base}>🤖</div>;
  if (t.includes("backend") || t.includes("node"))
    return <div className={base}>{"{ }"}</div>;
  return <div className={base}><HiOutlineBriefcase className="h-5 w-5" /></div>;
}

export default function AdminApproveJobs() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage]       = useState(1);

  async function load() {
    setLoading(true);
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

  // Unique locations for dropdown
  const locations = [...new Set(jobs.map((j) => j.city).filter(Boolean))];

  // Filter
  const filtered = jobs.filter((j) => {
    const matchFilter   = filter === "all" || j.status === filter;
    const matchSearch   = !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.company?.toLowerCase().includes(search.toLowerCase());
    const matchLocation = !location || j.city === location;
    return matchFilter && matchSearch && matchLocation;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminLayout title="Approve Jobs">
      <p className="mb-6 text-sm text-gray-500">Review and approve job postings before they go live</p>

      {/* ── Toolbar ── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Tab filters */}
        <div className="flex items-center gap-2">
          {[["all", "All"], ["active", "Active"], ["closed", "Closed"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => { setFilter(val); setPage(1); }}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                filter === val
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-64">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search jobs by title or keyword..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* All Locations dropdown */}
        <div className="relative">
          <select
            value={location}
            onChange={(e) => { setLocation(e.target.value); setPage(1); }}
            className="appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-9 text-sm text-gray-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* ── Job Cards ── */}
      {loading ? (
        <p className="py-16 text-center text-sm text-gray-400">Loading...</p>
      ) : paginated.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center text-gray-400 shadow-sm">No jobs found.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm divide-y divide-gray-100">
          {paginated.map((job) => (
            <div key={job._id} className="flex items-start gap-5 px-6 py-6 hover:bg-gray-50 transition">

              {/* Icon */}
              <JobIcon title={job.title} />

              {/* Info — takes full remaining width */}
              <div className="flex-1 min-w-0">
                {/* Title row — title + status badge in same row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-bold text-gray-800 text-base">{job.title}</h3>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                    job.status === "active"
                      ? "bg-green-50 text-green-600 border border-green-100"
                      : job.status === "pending"
                      ? "bg-yellow-50 text-yellow-600 border border-yellow-100"
                      : "bg-gray-100 text-gray-500 border border-gray-200"
                  }`}>
                    {job.status === "active" ? "Active" : job.status === "pending" ? "Pending" : "Closed"}
                  </span>
                </div>

                <p className="mt-0.5 text-sm text-gray-500">
                  {job.company} &bull; {job.city}{job.country ? `, ${job.country}` : ", Pakistan"} &bull; {job.type || "Full Time"}
                </p>

                {/* Salary */}
                {job.salaryMin || job.salary ? (
                  <p className="mt-1 text-sm font-semibold text-blue-600">
                    {job.salaryMin && job.salaryMax
                      ? `PKR ${Number(job.salaryMin).toLocaleString()} - ${Number(job.salaryMax).toLocaleString()} Per Month`
                      : job.salary || ""}
                  </p>
                ) : null}

                {/* Description */}
                {job.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{job.description}</p>
                )}

                {/* Posted info */}
                <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                  <HiOutlineCalendarDays className="h-3.5 w-3.5" />
                  Posted by {job.postedBy?.name || "Admin"} on{" "}
                  {new Date(job.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>

              {/* Approve / Reject buttons */}
              <div className="flex shrink-0 items-center gap-2 mt-1">
                <button
                  onClick={() => approve(job._id)}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition"
                >
                  <HiOutlineCheck className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => reject(job._id)}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 transition"
                >
                  <HiOutlineXMark className="h-4 w-4" />
                  Reject
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
    </AdminLayout>
  );
}
