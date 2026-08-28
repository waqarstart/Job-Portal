import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineBriefcase, HiOutlineEye, HiOutlineUserGroup, HiOutlineCalendarDays,
  HiOutlineCheckCircle, HiOutlinePlus, HiOutlinePencil, HiOutlineEllipsisVertical,
  HiOutlineTrash, HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlineCodeBracket, HiOutlineComputerDesktop, HiOutlinePaintBrush,
  HiOutlineCloud, HiOutlineShieldCheck, HiOutlineDevicePhoneMobile,
} from "react-icons/hi2";
import HRLayout from "../../layouts/HRLayout";
import Dropdown from "../../components/Dropdown";
import { getHRJobs, deleteHRJob, updateHRJob } from "../../services/hrService";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

const JOB_ICONS = [
  HiOutlineCodeBracket, HiOutlineComputerDesktop, HiOutlinePaintBrush,
  HiOutlineCloud, HiOutlineShieldCheck, HiOutlineDevicePhoneMobile,
];
const JOB_ICON_BG = ["bg-blue-50 text-blue-600", "bg-green-50 text-green-600", "bg-purple-50 text-purple-600", "bg-amber-50 text-amber-600", "bg-rose-50 text-rose-600", "bg-cyan-50 text-cyan-600"];

const STATUS_META = {
  active: { label: "Active", badge: "bg-green-50 text-green-700", dot: "bg-green-500" },
  draft: { label: "Draft", badge: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  closed: { label: "Closed", badge: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function HRMyJobs() {
  const [data, setData] = useState({ jobs: [], totalCount: 0, totalPages: 1, locations: [], types: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [tab, setTab] = useState("all");
  const [location, setLocation] = useState("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  function load() {
    setLoading(true);
    getHRJobs({ tab, location, type, sort, page, limit: 7 })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(load, [tab, location, type, sort, page]);

  async function handleDelete(id) {
    setOpenMenuId(null);
    if (!confirm("Delete this job? This cannot be undone.")) return;
    await deleteHRJob(id);
    load();
  }

  async function toggleStatus(job) {
    setOpenMenuId(null);
    await updateHRJob(job._id, { status: job.status === "active" ? "closed" : "active" });
    load();
  }

  async function publishJob(job) {
    await updateHRJob(job._id, { status: "active" });
    load();
  }

  const locationOptions = useMemo(
    () => [{ value: "all", label: "All Locations" }, ...data.locations.map((l) => ({ value: l, label: l }))],
    [data.locations]
  );
  const typeOptions = useMemo(
    () => [{ value: "all", label: "All Job Types" }, ...data.types.map((t) => ({ value: t, label: t }))],
    [data.types]
  );

  const TABS = [
    { key: "all", label: "All Jobs" },
    { key: "active", label: "Active" },
    { key: "draft", label: "Draft" },
    { key: "closed", label: "Closed" },
  ];

  const s = data.stats || {};
  const STAT_CARDS = [
    { icon: HiOutlineBriefcase, bg: "bg-blue-50", color: "text-blue-600", value: s.totalJobs ?? 0, label: "Total Jobs" },
    { icon: HiOutlineEye, bg: "bg-green-50", color: "text-green-600", value: s.activeJobs ?? 0, label: "Active Jobs" },
    { icon: HiOutlineUserGroup, bg: "bg-purple-50", color: "text-purple-600", value: s.totalApplications ?? 0, label: "Total Applications" },
    { icon: HiOutlineCalendarDays, bg: "bg-amber-50", color: "text-amber-600", value: s.interviewsScheduled ?? 0, label: "Interviews Scheduled" },
    { icon: HiOutlineCheckCircle, bg: "bg-red-50", color: "text-red-600", value: s.closedJobs ?? 0, label: "Closed Jobs" },
  ];

  return (
    <HRLayout
      title="My Jobs"
      subtitle="Manage and track all your job postings in one place."
    >
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {STAT_CARDS.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} ${c.color} mb-3`}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-sm font-medium text-gray-700">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-5">
        <Link
          to="/hr/post-job"
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <HiOutlinePlus className="h-4 w-4" />
          Post New Job
        </Link>
      </div>

      {/* Tabs + sort filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-1 border-b lg:border-b-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
                tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Dropdown value={location} onChange={(v) => { setLocation(v); setPage(1); }} options={locationOptions} />
          <Dropdown value={type} onChange={(v) => { setType(v); setPage(1); }} options={typeOptions} />
          <Dropdown value={sort} onChange={setSort} options={SORT_OPTIONS} />
        </div>
      </div>

      {/* Jobs table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 border-b">
                <th className="px-5 py-3">Job Title</th>
                <th className="px-5 py-3 text-center">Applications</th>
                <th className="px-5 py-3 text-center">Views</th>
                <th className="px-5 py-3 text-center">Interviews</th>
                <th className="px-5 py-3">Posted On</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.jobs.map((job, i) => {
                const Icon = JOB_ICONS[i % JOB_ICONS.length];
                const meta = STATUS_META[job.status] || STATUS_META.active;

                return (
                  <tr key={job._id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${JOB_ICON_BG[i % JOB_ICON_BG.length]}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{job.title}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {job.company} · {job.city} · {job.type}
                          </p>
                          {job.salary && <p className="text-xs text-gray-400">{job.salary}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <p className="font-semibold text-gray-800">{job.applications}</p>
                      {job.newThisWeek > 0 && (
                        <p className="text-xs text-green-600">+{job.newThisWeek} new</p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center font-medium text-gray-700">{job.views}</td>
                    <td className="px-5 py-4 text-center font-medium text-gray-700">{job.interviews}</td>

                    <td className="px-5 py-4 text-gray-500">
                      <p>{new Date(job.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p>
                      <p className="text-xs text-gray-400">{timeAgo(job.createdAt)}</p>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2 relative">
                        {job.status === "draft" ? (
                          <button
                            onClick={() => publishJob(job)}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 whitespace-nowrap"
                          >
                            Publish Now
                          </button>
                        ) : job.status === "closed" ? (
                          <Link
                            to={`/hr/applicants?job=${job._id}`}
                            className="rounded-lg border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                          >
                            View Details
                          </Link>
                        ) : (
                          <Link
                            to={`/hr/applicants?job=${job._id}`}
                            className="rounded-lg border px-3 py-2 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 whitespace-nowrap"
                          >
                            View Applicants
                          </Link>
                        )}

                        <Link
                          to={`/hr/post-job?edit=${job._id}`}
                          title="Edit"
                          className="rounded-lg border p-2 text-gray-500 hover:bg-gray-50"
                        >
                          <HiOutlinePencil className="h-4 w-4" />
                        </Link>

                        <button
                          onClick={() => setOpenMenuId(openMenuId === job._id ? null : job._id)}
                          className="rounded-lg border p-2 text-gray-500 hover:bg-gray-50"
                        >
                          <HiOutlineEllipsisVertical className="h-4 w-4" />
                        </button>

                        {openMenuId === job._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-gray-100 bg-white shadow-xl z-20 py-1">
                              {job.status !== "draft" && (
                                <button
                                  onClick={() => toggleStatus(job)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  {job.status === "active" ? "Close Job" : "Reactivate Job"}
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(job._id)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <HiOutlineTrash className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && data.jobs.length === 0 && (
            <div className="p-10 text-center text-gray-500">
              No jobs found.{" "}
              <Link to="/hr/post-job" className="text-blue-600 font-medium">Post your first job →</Link>
            </div>
          )}

          {loading && <p className="p-6 text-center text-gray-400">Loading...</p>}
        </div>

        {/* Pagination */}
        {data.totalCount > 0 && (
          <div className="flex items-center justify-between border-t px-5 py-3">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * 7 + 1} to {Math.min(page * 7, data.totalCount)} of {data.totalCount} jobs
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <HiOutlineChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                    p === page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50 border"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <HiOutlineChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </HRLayout>
  );
}
