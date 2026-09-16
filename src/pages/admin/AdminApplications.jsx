import { useEffect, useState } from "react";
import {
  HiOutlineMagnifyingGlass, HiChevronDown, HiChevronLeft,
  HiChevronRight, HiOutlineArrowDownTray, HiOutlineDocumentText,
  HiEllipsisVertical,
} from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminApplications } from "../../services/adminService";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const PAGE_SIZE = 8;

const STATUS_STYLE = {
  applied:      "bg-blue-50 text-blue-600",
  under_review: "bg-amber-50 text-amber-600",
  shortlisted:  "bg-purple-50 text-purple-600",
  interviewed:  "bg-cyan-50 text-cyan-600",
  selected:     "bg-green-50 text-green-600",
  hired:        "bg-green-100 text-green-700",
  rejected:     "bg-red-50 text-red-500",
};

const STATUS_LABEL = {
  applied:      "Applied",
  under_review: "Under Review",
  shortlisted:  "Shortlisted",
  interviewed:  "Interviewed",
  selected:     "Selected",
  hired:        "Hired",
  rejected:     "Rejected",
};

export default function AdminApplications() {
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [jobFilter, setJobFilter]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]       = useState(1);
  const [menuOpen, setMenuOpen] = useState(null);

  useEffect(() => {
    getAdminApplications().then(setApps).finally(() => setLoading(false));
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const h = () => setMenuOpen(null);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  // Unique job titles for dropdown
  const jobTitles = [...new Set(apps.map((a) => a.job?.title).filter(Boolean))];

  // Filter
  const filtered = apps.filter((a) => {
    const matchSearch = !search ||
      a.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.job?.title?.toLowerCase().includes(search.toLowerCase());
    const matchJob    = !jobFilter    || a.job?.title === jobFilter;
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchJob && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Export CSV
  function handleExport() {
    const rows = [["Candidate", "Email", "Job", "Company", "Status", "Applied On"]];
    filtered.forEach((a) => {
      rows.push([
        a.user?.name || "",
        a.user?.email || "",
        a.job?.title || "",
        a.job?.company || "",
        STATUS_LABEL[a.status] || a.status || "",
        new Date(a.createdAt).toLocaleDateString(),
      ]);
    });
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "applications.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout title="Applications">
      <p className="mb-6 text-sm text-gray-500">View and manage all job applications</p>

      {/* ── Toolbar ── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-72">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by candidate name or job title..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* All Jobs dropdown */}
        <div className="relative">
          <select
            value={jobFilter}
            onChange={(e) => { setJobFilter(e.target.value); setPage(1); }}
            className="appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-9 text-sm text-gray-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Jobs</option>
            {jobTitles.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        {/* All Status dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-9 text-sm text-gray-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_LABEL).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <div className="flex-1" />

        {/* Export button */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          <HiOutlineArrowDownTray className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
              <th className="px-6 py-4">Candidate</th>
              <th className="px-6 py-4">Job</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Applied On</th>
              <th className="px-6 py-4">CV</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">No applications found.</td></tr>
            ) : paginated.map((app) => (
              <tr key={app._id} className="hover:bg-gray-50 transition">

                {/* Candidate */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                      {(app.user?.name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{app.user?.name || "—"}</p>
                      <p className="text-xs text-gray-400">{app.user?.email || ""}</p>
                    </div>
                  </div>
                </td>

                {/* Job */}
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-800">{app.job?.title || "—"}</p>
                  <p className="text-xs text-gray-400">{app.job?.company || ""}</p>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[app.status] || "bg-gray-100 text-gray-500"}`}>
                    {STATUS_LABEL[app.status] || app.status?.replace("_", " ") || "—"}
                  </span>
                </td>

                {/* Applied On */}
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(app.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                </td>

                {/* View CV */}
                <td className="px-6 py-4">
                  {app.cvUrl ? (
                    <a
                      href={`${FILE_BASE}${app.cvUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition w-fit"
                    >
                      <HiOutlineDocumentText className="h-4 w-4" />
                      View CV
                    </a>
                  ) : (
                    <span className="text-xs text-gray-300">No CV</span>
                  )}
                </td>

                {/* 3-dot menu */}
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === app._id ? null : app._id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition"
                    >
                      <HiEllipsisVertical className="h-5 w-5" />
                    </button>
                    {menuOpen === app._id && (
                      <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border bg-white shadow-lg py-1">
                        <button className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-50">View Details</button>
                        <button className="w-full px-4 py-2 text-left text-xs text-red-500 hover:bg-red-50">Remove</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Pagination ── */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} applications
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
      </div>
    </AdminLayout>
  );
}
