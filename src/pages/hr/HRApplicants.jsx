import { useEffect, useState, useMemo } from "react";
import HRLayout from "../../layouts/HRLayout";
import {
  getHRApplicants,
  updateApplicantStatus,
} from "../../services/hrService";
import {
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineStar,
  HiOutlineCheckCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineCalendarDays,
  HiOutlineEye,
  HiOutlineArrowDownTray,
  HiOutlineEllipsisVertical,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineMapPin,
  HiOutlineAdjustmentsHorizontal,
  HiMiniChevronUpDown,
} from "react-icons/hi2";

const FILE_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api$/, "");

const STATUS_OPTIONS = [
  "applied","under_review","shortlisted","interviewed","selected","hired","rejected",
];

const STATUS_STYLES = {
  applied:      "bg-gray-100 text-gray-600 border-gray-200",
  under_review: "bg-amber-50 text-amber-700 border-amber-200",
  shortlisted:  "bg-purple-50 text-purple-700 border-purple-200",
  interviewed:  "bg-blue-50 text-blue-700 border-blue-200",
  selected:     "bg-green-50 text-green-700 border-green-200",
  hired:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected:     "bg-red-50 text-red-700 border-red-200",
};

const AVATAR_COLORS = [
  "bg-blue-500","bg-violet-500","bg-emerald-500",
  "bg-rose-500","bg-amber-500","bg-cyan-500",
  "bg-pink-500","bg-indigo-500",
];

function avatarColor(name = "") {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function experienceLabel(years) {
  if (!years && years !== 0) return { text: "—", level: "unknown" };
  if (years < 1)  return { text: `${(years * 12).toFixed(0)} mo`, level: "Fresher" };
  if (years < 2)  return { text: `${years.toFixed(1)} Yrs`, level: "Fresher" };
  if (years < 4)  return { text: `${years.toFixed(1)} Yrs`, level: "Intermediate" };
  return           { text: `${years.toFixed(1)} Yrs`, level: "Experienced" };
}

const LEVEL_DOT = {
  Fresher:      "bg-red-400",
  Intermediate: "bg-amber-400",
  Experienced:  "bg-emerald-500",
  unknown:      "bg-gray-300",
};

const PAGE_SIZE = 6;

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, iconBg, label, value, sub }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ── Custom dropdown — same style as 3-dot menu ────────────────────────────────
function CustomDropdown({ icon: Icon, value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition min-w-[140px]"
      >
        <Icon className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="flex-1 text-left truncate">{current?.label || placeholder}</span>
        <HiMiniChevronUpDown className="h-4 w-4 text-gray-400 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-1 min-w-[160px] rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full px-4 py-2 text-left text-sm capitalize hover:bg-gray-50 transition ${
                  value === opt.value ? "font-semibold text-blue-600 bg-blue-50/50" : "text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── 3-dot Action menu — opens upward for last rows ────────────────────────────
function ActionMenu({ app, onStatusChange, openUp }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
      >
        <HiOutlineEllipsisVertical className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 z-20 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-xl ${openUp ? "bottom-full mb-1" : "top-full mt-1"}`}>
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Change Status
            </p>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { onStatusChange(app._id, s); setOpen(false); }}
                className={`w-full px-3 py-2 text-left text-xs capitalize hover:bg-gray-50 transition ${
                  app.status === s ? "font-semibold text-blue-600" : "text-gray-700"
                }`}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── CV Evaluation panel ────────────────────────────────────────────────────────
function CvEvalPanel({ application }) {
  const { cvRating, cvMatchSummary, cvMatchedSkills, cvMissingSkills, cvEvaluationStatus } = application;

  if (cvEvaluationStatus === "pending") {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
        <p className="text-xs text-blue-700">AI is evaluating this CV against the job requirements…</p>
      </div>
    );
  }
  if (cvEvaluationStatus === "failed") {
    return (
      <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
        <p className="text-xs text-red-700">AI evaluation could not be completed for this CV.</p>
      </div>
    );
  }
  if (cvEvaluationStatus !== "completed" && typeof cvRating !== "number") return null;

  return (
    <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs font-semibold text-gray-700">AI CV Evaluation</p>
        {typeof cvRating === "number" && (
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-bold text-indigo-700">
            {cvRating}/100
          </span>
        )}
      </div>
      {typeof cvRating === "number" && (
        <div className="mb-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${Math.min(Math.max(cvRating, 0), 100)}%` }}
            />
          </div>
        </div>
      )}
      {cvMatchSummary && (
        <p className="mb-3 text-xs leading-5 text-gray-600">{cvMatchSummary}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {cvMatchedSkills?.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Matched</p>
            <div className="flex flex-wrap gap-1">
              {cvMatchedSkills.map((s, i) => (
                <span key={i} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">✓ {s}</span>
              ))}
            </div>
          </div>
        )}
        {cvMissingSkills?.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">Missing</p>
            <div className="flex flex-wrap gap-1">
              {cvMissingSkills.map((s, i) => (
                <span key={i} className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">• {s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function HRApplicants() {
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter]       = useState("all");
  const [expandedId, setExpandedId]     = useState(null);
  const [page, setPage]       = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sortBy, setSortBy]     = useState("date_desc"); // date_desc, date_asc, cv_desc, cv_asc

  useEffect(() => {
    getHRApplicants()
      .then(setApps)
      .catch((err) => console.error("Failed to load applicants:", err))
      .finally(() => setLoading(false));
  }, []);

  async function handleStatus(id, status) {
    try {
      const updated = await updateApplicantStatus(id, status);
      setApps((prev) => prev.map((a) => (a._id === id ? updated : a)));
    } catch (err) {
      alert(err.response?.data?.message || "Could not update status.");
    }
  }

  const jobOptions = useMemo(() => {
    const seen = new Map();
    apps.forEach((a) => { if (a.job?._id) seen.set(a.job._id, a.job.title); });
    return [
      { value: "all", label: "All Jobs" },
      ...[...seen.entries()].map(([id, title]) => ({ value: id, label: title })),
    ];
  }, [apps]);

  const statusOptions = [
    { value: "all", label: "All Status" },
    ...STATUS_OPTIONS.map((s) => ({
      value: s,
      label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    })),
  ];

  const stats = useMemo(() => ({
    total:       apps.length,
    newThisWeek: apps.filter((a) => (new Date() - new Date(a.createdAt)) / 86400000 <= 7).length,
    underReview: apps.filter((a) => a.status === "under_review").length,
    shortlisted: apps.filter((a) => a.status === "shortlisted").length,
    hired:       apps.filter((a) => a.status === "hired").length,
  }), [apps]);

  const tabCounts = useMemo(() => {
    const counts = { all: apps.length };
    STATUS_OPTIONS.forEach((s) => { counts[s] = apps.filter((a) => a.status === s).length; });
    return counts;
  }, [apps]);

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch = !q || a.user?.name?.toLowerCase().includes(q) || a.user?.email?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      const matchJob    = jobFilter === "all" || a.job?._id === jobFilter;
      const appDate     = new Date(a.createdAt);
      const matchFrom   = !dateFrom || appDate >= new Date(dateFrom);
      const matchTo     = !dateTo   || appDate <= new Date(dateTo + "T23:59:59");
      return matchSearch && matchStatus && matchJob && matchFrom && matchTo;
    }).sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "date_asc")  return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "cv_desc")   return (b.cvRating ?? -1) - (a.cvRating ?? -1);
      if (sortBy === "cv_asc")    return (a.cvRating ?? 999) - (b.cvRating ?? 999);
      return 0;
    });
  }, [apps, search, statusFilter, jobFilter, dateFrom, dateTo, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  function goPage(p) { setPage(Math.min(Math.max(1, p), totalPages)); }
  useEffect(() => { setPage(1); }, [search, statusFilter, jobFilter, dateFrom, dateTo, sortBy]);

  const STATUS_TABS = ["all","applied","under_review","shortlisted","interviewed","hired","rejected"];
  const TAB_LABELS  = { all:"All", applied:"Applied", under_review:"Under Review", shortlisted:"Shortlisted", interviewed:"Interviewed", hired:"Hired", rejected:"Rejected" };

  return (
    <HRLayout title="Applicants" subtitle="Review and manage candidates who applied to your jobs">

      {/* ── Stat cards ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={HiOutlineUsers}        iconBg="bg-blue-50 text-blue-600"        label="Total Applicants"  value={stats.total}       sub="All time" />
        <StatCard icon={HiOutlineDocumentText}  iconBg="bg-teal-50 text-teal-600"       label="New Applications"  value={stats.newThisWeek} sub="This week" />
        <StatCard icon={HiOutlineClock}         iconBg="bg-amber-50 text-amber-600"     label="Under Review"      value={stats.underReview} sub="In progress" />
        <StatCard icon={HiOutlineStar}          iconBg="bg-purple-50 text-purple-600"   label="Shortlisted"       value={stats.shortlisted} sub="Candidates" />
        <StatCard icon={HiOutlineCheckCircle}   iconBg="bg-emerald-50 text-emerald-600" label="Hired"             value={stats.hired}       sub="This month" />
      </div>

      {/* ── Filters ── */}
      <div className="mb-4 flex flex-wrap gap-2">

        {/* Search */}
        <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 focus-within:border-blue-400 transition">
          <HiOutlineMagnifyingGlass className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
        </div>

        {/* All Jobs — custom dropdown */}
        <CustomDropdown
          icon={HiOutlineFunnel}
          value={jobFilter}
          onChange={setJobFilter}
          options={jobOptions}
          placeholder="All Jobs"
        />

        {/* All Status — custom dropdown */}
        <CustomDropdown
          icon={HiOutlineAdjustmentsHorizontal}
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder="All Status"
        />

        {/* Sort dropdown */}
        <CustomDropdown
          icon={HiMiniChevronUpDown}
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "date_desc", label: "Newest First" },
            { value: "date_asc",  label: "Oldest First" },
            { value: "cv_desc",   label: "CV Score: High to Low" },
            { value: "cv_asc",    label: "CV Score: Low to High" },
          ]}
          placeholder="Sort By"
        />

        {/* Date Range */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker((v) => !v)}
            className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm transition whitespace-nowrap ${
              dateFrom || dateTo ? "border-blue-400 text-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <HiOutlineCalendarDays className="h-4 w-4 text-gray-400" />
            {dateFrom || dateTo ? `${dateFrom || "..."} → ${dateTo || "..."}` : "Date Range"}
          </button>

          {showDatePicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDatePicker(false)} />
              <div className="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-gray-100 bg-white p-4 shadow-xl">
                <p className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter by Date</p>
                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-[10px] text-gray-400 uppercase tracking-wide">From</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-gray-400 uppercase tracking-wide">To</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-400" />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                    className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition">Clear</button>
                  <button onClick={() => setShowDatePicker(false)}
                    className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition">Apply</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Status tabs ── */}
      <div className="mb-0 flex gap-0 border-b border-gray-200">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              statusFilter === s ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {TAB_LABELS[s]}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {tabCounts[s] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="rounded-b-2xl border border-t-0 border-gray-100 bg-white shadow-sm overflow-hidden">

        {/* Table head */}
        <div className="hidden md:grid md:grid-cols-[2fr_1.6fr_1fr_1.6fr_1.2fr_1.2fr_100px] items-center border-b border-gray-100 bg-gray-50/70 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <div>Candidate</div>
          <div>Email</div>
          <div>Experience</div>
          <div>Applied For</div>
          <button
            onClick={() => setSortBy(sortBy === "cv_desc" ? "cv_asc" : "cv_desc")}
            className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition select-none"
          >
            CV Rating
            <span className="flex flex-col">
              <HiMiniChevronUpDown className={`h-3 w-3 ${sortBy === "cv_desc" || sortBy === "cv_asc" ? "text-blue-600" : ""}`} />
            </span>
          </button>
          <div className="flex items-center gap-1 cursor-pointer select-none"
            onClick={() => setSortBy(sortBy === "date_desc" ? "date_asc" : "date_desc")}>
            Applied Date <HiMiniChevronUpDown className={`h-3 w-3 ${sortBy === "date_desc" || sortBy === "date_asc" ? "text-blue-600" : ""}`} />
          </div>
          <div className="text-right">Actions</div>
        </div>

        {loading && (
          <div className="px-5 py-12 text-center text-sm text-gray-400">Loading applicants…</div>
        )}

        {!loading && paginated.map((app, index) => {
          const exp    = experienceLabel(app.user?.yearsOfExperience);
          const isExp  = expandedId === app._id;
          // Open upward for last 2 rows
          const openUp = index >= paginated.length - 2;

          return (
            <div key={app._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition">

              {/* ── Desktop row ── */}
              <div className="hidden md:grid md:grid-cols-[2fr_1.6fr_1fr_1.6fr_1.2fr_1.2fr_100px] items-center px-5 py-3.5 gap-3">

                {/* Candidate — no CV rating here */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(app.user?.name)}`}>
                    {(app.user?.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">{app.user?.name || "—"}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="min-w-0">
                  <p className="truncate text-sm text-gray-500">{app.user?.email || "—"}</p>
                </div>

                {/* Experience */}
                <div>
                  <p className="text-sm font-medium text-gray-700">{exp.text}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${LEVEL_DOT[exp.level]}`} />
                    <span className="text-[10px] text-gray-400">{exp.level}</span>
                  </div>
                </div>

                {/* Applied for */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{app.job?.title || "—"}</p>
                  {app.job?.city && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <HiOutlineMapPin className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-400 truncate">{app.job.city}</span>
                    </div>
                  )}
                </div>

                {/* CV Rating column */}
                <div className="min-w-0">
                  {typeof app.cvRating === "number" ? (
                    <div>
                      <p className="text-sm font-bold text-indigo-600 mb-1">{app.cvRating}/100</p>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${Math.min(Math.max(app.cvRating, 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </div>

                {/* Applied date */}
                <div>
                  <p className="text-sm text-gray-600">
                    {new Date(app.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(app.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5">
                  {/* View — slightly wider */}
                  <button
                    onClick={() => setExpandedId(isExp ? null : app._id)}
                    title="View Details"
                    className={`flex h-8 w-10 items-center justify-center rounded-lg border transition ${
                      isExp ? "border-blue-300 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <HiOutlineEye className="h-4 w-4" />
                  </button>

                  {/* Download — slightly wider */}
                  {app.cvUrl ? (
                    <a
                      href={`${FILE_BASE}${app.cvUrl}`}
                      download target="_blank" rel="noreferrer"
                      title="Download CV"
                      className="flex h-8 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                    >
                      <HiOutlineArrowDownTray className="h-4 w-4" />
                    </a>
                  ) : (
                    <div className="flex h-8 w-10 items-center justify-center rounded-lg border border-gray-100 text-gray-300" title="No CV">
                      <HiOutlineArrowDownTray className="h-4 w-4" />
                    </div>
                  )}

                  <ActionMenu app={app} onStatusChange={handleStatus} openUp={openUp} />
                </div>
              </div>

              {/* ── Mobile card ── */}
              <div className="flex md:hidden items-start gap-3 px-4 py-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(app.user?.name)}`}>
                  {(app.user?.name || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">{app.user?.name || "—"}</p>
                      <p className="truncate text-xs text-gray-400">{app.user?.email || "—"}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setExpandedId(isExp ? null : app._id)}
                        className={`flex h-7 w-8 items-center justify-center rounded-lg border transition ${
                          isExp ? "border-blue-300 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-500"
                        }`}
                      >
                        <HiOutlineEye className="h-3.5 w-3.5" />
                      </button>
                      {app.cvUrl && (
                        <a href={`${FILE_BASE}${app.cvUrl}`} download target="_blank" rel="noreferrer"
                          className="flex h-7 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                          <HiOutlineArrowDownTray className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <ActionMenu app={app} onStatusChange={handleStatus} openUp={openUp} />
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>{app.job?.title || "—"}</span>
                    {app.job?.city && <span>· {app.job.city}</span>}
                    {typeof app.cvRating === "number" && (
                      <span className="text-indigo-600 font-medium">CV {app.cvRating}/100</span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400">
                    {new Date(app.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* ── Expanded detail ── */}
              {isExp && (
                <div className="mx-4 md:mx-5 mb-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[app.status] || "bg-gray-100 text-gray-600"}`}>
                      {app.status.replace(/_/g, " ")}
                    </span>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatus(app._id, e.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500 text-gray-700"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                    {app.user?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {app.user.skills.slice(0, 6).map((sk) => (
                          <span key={sk} className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600">{sk}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <CvEvalPanel application={app} />
                  {app.interviewSummary && (
                    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600">
                      <span className="font-semibold text-gray-700">Interview summary: </span>
                      {app.interviewSummary}
                    </div>
                  )}
                  {typeof app.interviewRating === "number" && (
                    <span className="mt-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Interview rating: {app.interviewRating}/10
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {!loading && paginated.length === 0 && (
          <div className="py-14 text-center">
            <HiOutlineUsers className="mx-auto mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-400">
              No applicants found
              {statusFilter !== "all" ? ` with status "${statusFilter.replace(/_/g, " ")}"` : ""}
              {search ? ` matching "${search}"` : ""}.
            </p>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3">
            <p className="text-xs text-gray-400">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} results
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => goPage(page - 1)} disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition">
                <HiOutlineChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button key={p} onClick={() => goPage(p)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition ${
                      page === p ? "bg-blue-600 text-white shadow" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}>
                    {p}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="px-1 text-xs text-gray-400">…{totalPages}</span>}
              <button onClick={() => goPage(page + 1)} disabled={page === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition">
                <HiOutlineChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </HRLayout>
  );
}
