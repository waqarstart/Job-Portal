import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineBookmark,
  HiOutlineEye,
  HiOutlineClock,
  HiOutlineBell,
  HiOutlineMagnifyingGlass,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineMapPin,
  HiOutlineBriefcase,
  HiOutlineCurrencyDollar,
  HiOutlineTrash,
  HiOutlineArrowRight,
  HiOutlineEllipsisVertical,
  HiOutlineCheck,
} from "react-icons/hi2";
import CandidateLayout from "../layouts/CandidateLayout";
import Dropdown from "../components/Dropdown";
import { getSavedJobs, unsaveJob } from "../services/savedJobService";
import { getMyApplications } from "../services/applicationService";

const SORT_OPTIONS = [
  { value: "recent", label: "Recently Saved" },
  { value: "oldest", label: "Oldest Saved" },
  { value: "title", label: "Job Title" },
];

const AVATAR_COLORS = [
  "bg-blue-600", "bg-orange-500", "bg-violet-600",
  "bg-emerald-600", "bg-rose-600", "bg-cyan-600", "bg-gray-900",
];

function avatarColor(name = "") {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function companyInitials(name = "") {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const TAG_COLORS = [
  "bg-green-50 text-green-700",
  "bg-blue-50 text-blue-700",
  "bg-purple-50 text-purple-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
];

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function SavedJobs() {
  const [saved, setSaved] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [typeFilter, setTypeFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      getSavedJobs(),
      getMyApplications().catch(() => []),
    ])
      .then(([savedJobs, applications]) => {
        // A saved job whose underlying job was deleted comes back with job: null —
        // drop those so the count and the list always agree.
        setSaved(savedJobs.filter((s) => s.job));
        setAppliedJobIds(new Set(applications.map((a) => a.job?._id).filter(Boolean)));
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleUnsave(jobId) {
    setOpenMenuId(null);
    await unsaveJob(jobId);
    load();
  }

  const appliedFromSavedCount = useMemo(
    () => saved.filter((s) => appliedJobIds.has(s.job?._id)).length,
    [saved, appliedJobIds]
  );

  const jobTypes = useMemo(
    () => [...new Set(saved.map((s) => s.job?.type).filter(Boolean))],
    [saved]
  );

  const visibleSaved = useMemo(() => {
    let list = [...saved];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.job?.title?.toLowerCase().includes(q) ||
          s.job?.company?.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all") {
      list = list.filter((s) => s.job?.type === typeFilter);
    }

    if (sortBy === "recent") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "title") {
      list.sort((a, b) => (a.job?.title || "").localeCompare(b.job?.title || ""));
    }

    return list;
  }, [saved, search, sortBy, typeFilter]);

  const STAT_CARDS = [
    { icon: HiOutlineBookmark, iconBg: "bg-blue-50", iconColor: "text-blue-600", cardBg: "bg-blue-50/40", value: saved.length, label: "Saved Jobs", sub: "Jobs you saved" },
    { icon: HiOutlineEye, iconBg: "bg-green-100", iconColor: "text-green-600", cardBg: "bg-green-50/40", value: 0, label: "Viewed", sub: "Jobs you viewed" },
    { icon: HiOutlineClock, iconBg: "bg-amber-100", iconColor: "text-amber-600", cardBg: "bg-amber-50/40", value: appliedFromSavedCount, label: "Applied", sub: "Applied from saved" },
    { icon: HiOutlineBell, iconBg: "bg-purple-100", iconColor: "text-purple-600", cardBg: "bg-purple-50/40", value: 0, label: "Alerts", sub: "New job alerts" },
  ];

  return (
    <CandidateLayout title="Saved Jobs" subtitle="Jobs you saved for later">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.cardBg}`}>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.iconBg} ${s.iconColor} mb-3`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm font-semibold text-gray-800">{s.label}</p>
            <p className="text-xs text-gray-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-5">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved jobs..."
            className="w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-gray-500">Sort by:</span>
          <Dropdown value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />

          <div className="relative">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border bg-white hover:bg-gray-50 ${
                typeFilter !== "all" ? "border-blue-400 text-blue-600" : "text-gray-500"
              }`}
            >
              <HiOutlineAdjustmentsHorizontal className="h-4 w-4" />
            </button>

            {showFilters && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-gray-100 bg-white p-3 shadow-xl">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Job Type</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setTypeFilter("all"); setShowFilters(false); }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-blue-50 ${
                        typeFilter === "all" ? "font-semibold text-blue-600 bg-blue-50/60" : "text-gray-700"
                      }`}
                    >
                      All Types
                      {typeFilter === "all" && <HiOutlineCheck className="h-4 w-4" />}
                    </button>
                    {jobTypes.map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTypeFilter(t); setShowFilters(false); }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-blue-50 ${
                          typeFilter === t ? "font-semibold text-blue-600 bg-blue-50/60" : "text-gray-700"
                        }`}
                      >
                        {t}
                        {typeFilter === t && <HiOutlineCheck className="h-4 w-4" />}
                      </button>
                    ))}
                    {jobTypes.length === 0 && (
                      <p className="px-3 py-2 text-xs text-gray-400">No job types to filter yet.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {/* Saved job cards */}
      <div className="space-y-4">
        {visibleSaved.map(({ job, _id, createdAt }) => {
          if (!job) return null;
          const applied = appliedJobIds.has(job._id);

          return (
            <div key={_id} className="rounded-2xl border bg-white p-5 shadow-sm relative">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-white font-bold ${avatarColor(job.company || "")}`}>
                    <span className="text-lg leading-none">{companyInitials(job.company || "")}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                    <p className="text-gray-600 font-medium">{job.company}</p>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-sm text-gray-500">
                      {(job.location || job.city) && (
                        <span className="flex items-center gap-1">
                          <HiOutlineMapPin className="h-3.5 w-3.5" />
                          {job.location || job.city}
                        </span>
                      )}
                      {job.type && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <HiOutlineBriefcase className="h-3.5 w-3.5" />
                            {job.type}
                          </span>
                        </>
                      )}
                      {job.salary && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <HiOutlineCurrencyDollar className="h-3.5 w-3.5" />
                            {job.salary}
                          </span>
                        </>
                      )}
                      {applied && (
                        <>
                          <span>·</span>
                          <span className="text-green-600 font-medium">Applied</span>
                        </>
                      )}
                    </div>

                    {job.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {job.skills.slice(0, 5).map((s, i) => (
                          <span
                            key={s}
                            className={`rounded-full text-xs font-medium px-2.5 py-1 ${TAG_COLORS[i % TAG_COLORS.length]}`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 shrink-0">
                  <span className="text-xs text-gray-400 whitespace-nowrap mt-2">
                    Saved on {formatDate(createdAt)}
                  </span>

                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === _id ? null : _id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                      <HiOutlineEllipsisVertical className="h-5 w-5" />
                    </button>

                    {openMenuId === _id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-gray-100 bg-white shadow-xl z-20 py-1">
                          <Link
                            to={`/jobs/${job._id}`}
                            onClick={() => setOpenMenuId(null)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            View Job
                          </Link>
                          <button
                            onClick={() => handleUnsave(job._id)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-end gap-3">
                <button
                  onClick={() => handleUnsave(job._id)}
                  className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <HiOutlineTrash className="h-4 w-4" />
                  Remove
                </button>

                <Link
                  to={`/jobs/${job._id}`}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  View Job
                  <HiOutlineArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}

        {!loading && visibleSaved.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm border">
            <HiOutlineBookmark className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            {saved.length === 0
              ? "No saved jobs yet — browse jobs and save the ones you like."
              : "No saved jobs match your search."}
          </div>
        )}
      </div>

      {/* Alerts banner */}
      <div className="mt-6 rounded-2xl border bg-blue-50/60 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <HiOutlineBell className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Never miss a job!</p>
            <p className="text-sm text-gray-600">
              Turn on job alerts and get notified when similar jobs are posted.
            </p>
          </div>
        </div>

        <Link
          to="/dashboard/settings"
          className="flex items-center gap-2 shrink-0 rounded-xl border bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <HiOutlineBell className="h-4 w-4" />
          Manage Alerts
        </Link>
      </div>
    </CandidateLayout>
  );
}
