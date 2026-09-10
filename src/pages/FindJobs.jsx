import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Dropdown from "../components/Dropdown";
import CityAutocomplete from "../components/CityAutocomplete";
import { searchJobs } from "../services/jobService";
import { saveJob, unsaveJob, getSavedJobs } from "../services/savedJobService";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineMagnifyingGlass, HiOutlineMapPin, HiOutlineBriefcase,
  HiOutlineBookmark, HiBookmark, HiOutlineCheckCircle,
  HiOutlineClock, HiOutlineCurrencyDollar, HiOutlineCalendarDays,
  HiOutlineBuildingOffice2, HiOutlineShare, HiOutlineXMark,
  HiOutlineBell, HiOutlineArrowUpTray,
  HiOutlineArrowPath,
} from "react-icons/hi2";

const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "salary-high", label: "Salary: High to Low" },
  { value: "salary-low", label: "Salary: Low to High" },
];

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

function parseSalaryNumber(salary = "") {
  const nums = (salary.match(/\d[\d,]*/g) || []).map((n) => parseInt(n.replace(/,/g, "")));
  return nums.length ? Math.max(...nums) : 0;
}

const AVATAR_COLORS = [
  "bg-blue-600","bg-violet-600","bg-emerald-600",
  "bg-rose-600","bg-amber-600","bg-cyan-600","bg-indigo-600","bg-pink-600",
];

function avatarColor(name = "") {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function timeAgo(date) {
  const h = Math.floor((Date.now() - new Date(date)) / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

function isNewJob(date) {
  const h = (Date.now() - new Date(date)) / 3600000;
  return h < 48;
}

function formatSalary(salary) {
  if (!salary) return null;
  const toK = (n) => { const x = parseInt(n.replace(/,/g, "")); return isNaN(x) ? n : x >= 1000 ? `${Math.round(x / 1000)}K` : String(x); };
  let s = salary.replace(/\s*(per\s*(month|year|hour)|\/month|\/year|fixed)/gi, "").trim();
  s = s.replace(/\b(\d[\d,]*)\b/g, (m) => toK(m));
  return /pkr/i.test(s) ? s.trim() : `PKR ${s}`.trim();
}

function parseDesc(desc = "") {
  if (!desc) return { about: "", responsibilities: [], requirements: [] };
  const lines = desc.split("\n");
  let about = "", responsibilities = [], requirements = [], mode = "about";
  for (const line of lines) {
    const l = line.trim(); if (!l) continue;
    if (/responsibilit/i.test(l)) { mode = "resp"; continue; }
    if (/requirement|qualification/i.test(l)) { mode = "req"; continue; }
    if (mode === "about") about += (about ? " " : "") + l;
    else if (mode === "resp") responsibilities.push(l.replace(/^[-•*]\s*/, ""));
    else requirements.push(l.replace(/^[-•*]\s*/, ""));
  }
  return { about, responsibilities, requirements };
}

// ── Custom checkbox ─────────────────────────────────────────────────────────
function Checkbox({ label, count, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group py-1">
      <div className="flex items-center gap-2">
        <div onClick={onChange}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
            checked ? "border-blue-600 bg-blue-600" : "border-gray-300 group-hover:border-blue-400"
          }`}>
          {checked && (
            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className={`text-xs transition leading-tight ${checked ? "text-blue-600 font-semibold" : "text-gray-600 group-hover:text-blue-600"}`}>
          {label}
        </span>
      </div>
      {count !== undefined && <span className="text-[10px] text-gray-400 ml-1 shrink-0">{count}</span>}
    </label>
  );
}

// ── Filter section ──────────────────────────────────────────────────────────
function FilterSection({ title, options, counts, selected, onToggle }) {
  return (
    <div className="border-b border-gray-100 pb-3 mb-3 last:border-0 last:mb-0 last:pb-0">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">{title}</p>
      {options.map(opt => (
        <Checkbox key={opt} label={opt} count={counts?.[opt]}
          checked={selected.includes(opt)}
          onChange={() => onToggle(opt)} />
      ))}
    </div>
  );
}

// ── Right panel ─────────────────────────────────────────────────────────────

// Same share dropdown as the JobDetail page (Copy Link / WhatsApp / LinkedIn
// / Facebook / Instagram) — icon-only trigger button to match the compact
// bookmark/apply row here.
function ShareDropdown({ job }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const jobUrl = `${window.location.origin}/jobs/${job._id}`;
  const text = encodeURIComponent(`Check out this job: ${job.title}`);
  const url = encodeURIComponent(jobUrl);

  const options = [
    {
      label: "Copy Link",
      color: "text-gray-700",
      bg: "hover:bg-gray-50",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      action: () => {
        navigator.clipboard.writeText(jobUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
    },
    {
      label: "WhatsApp",
      color: "text-green-600",
      bg: "hover:bg-green-50",
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.528 5.845L0 24l6.335-1.508A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.875 9.875 0 01-5.031-1.374l-.36-.214-3.733.888.936-3.638-.235-.374A9.87 9.87 0 012.118 12C2.118 6.533 6.533 2.118 12 2.118S21.882 6.533 21.882 12 17.467 21.882 12 21.882z" />
        </svg>
      ),
      action: () => window.open(`https://wa.me/?text=${text}%20${url}`, "_blank"),
    },
    {
      label: "LinkedIn",
      color: "text-blue-700",
      bg: "hover:bg-blue-50",
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank"),
    },
    {
      label: "Facebook",
      color: "text-blue-600",
      bg: "hover:bg-blue-50",
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank"),
    },
    {
      label: "Instagram",
      color: "text-pink-600",
      bg: "hover:bg-pink-50",
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.28-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919C8.333.014 8.741 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
      action: () => {
        navigator.clipboard.writeText(jobUrl);
        alert("Link copied! Paste it in your Instagram story or bio.");
      },
    },
  ];

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Share this job"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 transition"
      >
        <HiOutlineShare className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
            {options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  opt.action();
                  if (opt.label !== "Copy Link") setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition ${opt.color} ${opt.bg}`}
              >
                {opt.icon}
                {opt.label === "Copy Link" && copied ? "Copied!" : opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function JobPanel({ job, saved, onSave, onApply, onClose }) {
  if (!job) return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="text-center">
        <HiOutlineBriefcase className="mx-auto mb-3 h-12 w-12 text-gray-200" />
        <p className="text-sm text-gray-400">Click a job to see details</p>
      </div>
    </div>
  );

  const initial = (job.company || "C")[0].toUpperCase();
  const salary = formatSalary(job.salary);

  // Prefer the structured fields HR filled in; only fall back to guessing
  // the split from the merged `description` blob for older jobs.
  const hasStructuredSections = Boolean(job.aboutRole || job.responsibilities || job.requirements);
  const fallback = parseDesc(job.description);
  const about = hasStructuredSections ? (job.aboutRole || "") : fallback.about;
  const responsibilities = hasStructuredSections
    ? (job.responsibilities || "").split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean)
    : fallback.responsibilities;
  const requirements = hasStructuredSections
    ? (job.requirements || "").split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean)
    : fallback.requirements;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg font-bold text-white ${avatarColor(job.company)}`}>
              {job.companyRef?.logo ? (
                <img src={`${FILE_BASE}${job.companyRef.logo}`} alt={job.company} className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 leading-tight">{job.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-400">
                {job.city     && <span className="flex items-center gap-1"><HiOutlineMapPin className="h-3 w-3" />{job.city}</span>}
                {job.workMode && <span className="flex items-center gap-1"><HiOutlineBuildingOffice2 className="h-3 w-3" />{job.workMode}</span>}
              </div>
              {salary && <p className="mt-1 text-sm font-bold text-gray-800">{salary}</p>}
            </div>
          </div>
          <button onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition ml-2">
            <HiOutlineXMark className="h-4 w-4" />
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.type            && <span className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">{job.type}</span>}
          {job.workMode        && <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">{job.workMode}</span>}
          {job.experienceLevel && <span className="rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-600">{job.experienceLevel}</span>}
        </div>

        {/* Overview */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: HiOutlineClock,          label: "Experience", value: job.experienceLevel || "Any" },
            { icon: HiOutlineCurrencyDollar, label: "Salary",     value: salary || "Negotiable" },
            { icon: HiOutlineCalendarDays,   label: "Posted",     value: timeAgo(job.createdAt) },
          ].map((r) => (
            <div key={r.label} className="flex flex-col items-center rounded-xl bg-gray-50 p-2 text-center">
              <r.icon className="h-4 w-4 text-blue-500 mb-0.5" />
              <p className="text-[9px] text-gray-400 uppercase tracking-wide">{r.label}</p>
              <p className="text-[10px] font-semibold text-gray-700 mt-0.5 truncate w-full text-center">{r.value}</p>
            </div>
          ))}
        </div>

        {/* Skills */}
        {job.skills?.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Skills</p>
            <div className="flex flex-wrap gap-1">
              {job.skills.map(s => (
                <span key={s} className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-600">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={() => onSave(job._id)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 transition">
            {saved ? <HiBookmark className="h-5 w-5 text-blue-600" /> : <HiOutlineBookmark className="h-5 w-5" />}
          </button>
          <button
            onClick={() => onApply(job)}
            className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 transition">
            Apply Now
          </button>
          <ShareDropdown job={job} />
        </div>
      </div>

      {/* Scrollable description */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {about && (
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2">Job Description</h4>
            <p className="text-sm text-gray-600 leading-6">{about}</p>
          </div>
        )}
        {responsibilities.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2">Key Responsibilities</h4>
            <ul className="space-y-1.5">
              {responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />{r}
                </li>
              ))}
            </ul>
          </div>
        )}
        {requirements.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2">Requirements</h4>
            <ul className="space-y-1.5">
              {requirements.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />{r}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!about && responsibilities.length === 0 && requirements.length === 0 && job.description && (
          <p className="text-sm text-gray-600 leading-6 whitespace-pre-line">{job.description}</p>
        )}
        {!job.description && <p className="text-sm text-gray-400">No description available.</p>}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function FindJobs() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [titleQ, setTitleQ] = useState(searchParams.get("title") || "");
  const [cityQ,  setCityQ]  = useState(searchParams.get("city")  || "");
  const [allJobs, setAllJobs]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // Filters state
  const [fTypes,    setFTypes]    = useState([]);
  const [fModes,    setFModes]    = useState([]);
  const [fExps,     setFExps]     = useState([]);
  const [fCities,   setFCities]   = useState([]);
  const [fTitles,   setFTitles]   = useState([]);
  const [fSkills,   setFSkills]   = useState([]);
  const [fCompanies,setFCompanies]= useState([]);
  const [fCategories,setFCategories] = useState([]);
  const [salaryMin, setSalaryMin] = useState(5000);
  const [sortBy, setSortBy] = useState("recent");

  // Fix: watch URL params
  useEffect(() => {
    const t = searchParams.get("title") || "";
    const c = searchParams.get("city")  || "";
    setTitleQ(t); setCityQ(c);
    loadJobs(t, c);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  useEffect(() => {
    if (isLoggedIn) {
      getSavedJobs().then(s => setSavedIds(s.map(sj => sj.job?._id).filter(Boolean))).catch(() => {});
    }
  }, [isLoggedIn]);

  async function loadJobs(t, c) {
    setLoading(true);
    try {
      const data = await searchJobs(t, c);
      setAllJobs(data);
      setSelectedJob(data[0] || null);
    } catch {}
    finally { setLoading(false); }
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearchParams({ title: titleQ, city: cityQ });
  }

  async function handleToggleSave(jobId) {
    if (!isLoggedIn) { navigate("/login"); return; }
    try {
      if (savedIds.includes(jobId)) { await unsaveJob(jobId); setSavedIds(p => p.filter(i => i !== jobId)); }
      else { await saveJob(jobId); setSavedIds(p => [...p, jobId]); }
    } catch {}
  }

  function toggleArr(arr, setArr, val) {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  }

  function resetFilters() {
    setFTypes([]); setFModes([]); setFExps([]);
    setFCities([]); setFTitles([]); setFSkills([]); setFCompanies([]);
    setFCategories([]); setSalaryMin(5000);
  }

  // Dynamic options — case-insensitive dedup
  const uniq = (arr) => {
    const seen = new Map();
    arr.filter(Boolean).forEach(v => {
      const key = v.toLowerCase().trim();
      if (!seen.has(key)) seen.set(key, v);
    });
    return [...seen.values()].sort();
  };
  const countOf     = (jobs, key, val) => jobs.filter(j => j[key]?.toLowerCase().trim() === val.toLowerCase().trim()).length;
  const countSkill  = (jobs, val) => jobs.filter(j => j.skills?.map(s=>s.toLowerCase()).includes(val.toLowerCase())).length;

  const jobTypes   = uniq(allJobs.map(j => j.type));
  const workModes  = uniq(allJobs.map(j => j.workMode));
  const expLevels  = uniq(allJobs.map(j => j.experienceLevel));
  const cities     = uniq(allJobs.map(j => j.city));
  const titles     = uniq(allJobs.map(j => j.title));
  const skills     = uniq(allJobs.flatMap(j => j.skills || []));
  const companies  = uniq(allJobs.map(j => j.company));
  const categories = uniq(allJobs.map(j => j.category));

  const maxSalaryInData = Math.max(1000000, ...allJobs.map(j => parseSalaryNumber(j.salary)));

  let filtered = allJobs.filter(j => {
    if (fTypes.length    && !fTypes.some(v => v.toLowerCase() === j.type?.toLowerCase()))               return false;
    if (fModes.length    && !fModes.some(v => v.toLowerCase() === j.workMode?.toLowerCase()))           return false;
    if (fExps.length     && !fExps.some(v => v.toLowerCase() === j.experienceLevel?.toLowerCase()))     return false;
    if (fCities.length   && !fCities.some(v => v.toLowerCase() === j.city?.toLowerCase()))              return false;
    if (fTitles.length   && !fTitles.some(v => v.toLowerCase() === j.title?.toLowerCase()))             return false;
    if (fSkills.length   && !fSkills.some(s => j.skills?.map(sk=>sk.toLowerCase()).includes(s.toLowerCase()))) return false;
    if (fCompanies.length && !fCompanies.some(v => v.toLowerCase() === j.company?.toLowerCase()))       return false;
    if (fCategories.length && !fCategories.some(v => v.toLowerCase() === j.category?.toLowerCase()))    return false;
    if (salaryMin > 5000 && parseSalaryNumber(j.salary) < salaryMin)                                     return false;
    return true;
  });

  if (sortBy === "salary-high") filtered = [...filtered].sort((a, b) => parseSalaryNumber(b.salary) - parseSalaryNumber(a.salary));
  else if (sortBy === "salary-low") filtered = [...filtered].sort((a, b) => parseSalaryNumber(a.salary) - parseSalaryNumber(b.salary));
  else filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const hasFilters = fTypes.length + fModes.length + fExps.length +
    fCities.length + fTitles.length + fSkills.length + fCompanies.length +
    fCategories.length + (salaryMin > 5000 ? 1 : 0);

  function handleUploadCV() {
    if (!isLoggedIn) { navigate("/login"); return; }
    navigate("/dashboard/resume");
  }

  function handleCreateAlert() {
    if (!isLoggedIn) { navigate("/login"); return; }
    alert("Job alerts are coming soon — you'll be notified when matching jobs are posted.");
  }

  // Page height for sticky columns
  const colHeight = "calc(100vh - 130px)";

  return (
    <main className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      {/* Search bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="w-full px-4 sm:px-6 py-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 focus-within:border-blue-400 transition">
              <HiOutlineMagnifyingGlass className="h-4 w-4 shrink-0 text-gray-400" />
              <input type="text" value={titleQ} onChange={e => setTitleQ(e.target.value)}
                placeholder="Job title, skill or company"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none" />
              {titleQ && <button type="button" onClick={() => setTitleQ("")}><HiOutlineXMark className="h-4 w-4 text-gray-400" /></button>}
            </div>
            <div className="flex flex-1 items-center rounded-xl border border-gray-200 bg-white focus-within:border-blue-400 transition">
              <CityAutocomplete value={cityQ} onChange={setCityQ} placeholder="City e.g. Lahore" />
            </div>
            <button type="submit"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition whitespace-nowrap">
              <HiOutlineMagnifyingGlass className="h-4 w-4" /> Find Jobs
            </button>
            <button type="button" onClick={handleCreateAlert}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition whitespace-nowrap">
              <HiOutlineBell className="h-4 w-4" /> Create Alert
            </button>
          </form>
        </div>
      </div>

      {/* 3-col layout */}
      <div className="w-full px-4 sm:px-6 py-4 flex gap-4 items-start">

        {/* ── LEFT: Filters (sticky + scrollable) ── */}
        <div className="hidden lg:flex flex-col w-80 shrink-0 sticky top-4" style={{ height: colHeight }}>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col h-full overflow-hidden">
            {/* Filter header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <p className="text-sm font-bold text-gray-900">Filters</p>
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                Reset All{hasFilters > 0 ? ` (${hasFilters})` : ""}
                <HiOutlineArrowPath className="h-3.5 w-3.5" />
              </button>
            </div>
            {/* Scrollable filter list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0">
              {/* Salary Range */}
              <div className="border-b border-gray-100 pb-3 mb-3">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Salary Range</p>
                <input
                  type="range"
                  min={5000}
                  max={maxSalaryInData}
                  step={5000}
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                  <span>PKR {salaryMin.toLocaleString()}</span>
                  <span>PKR {maxSalaryInData.toLocaleString()}+</span>
                </div>
              </div>

              {jobTypes.length > 0   && <FilterSection title="Job Type"    options={jobTypes}   counts={jobTypes.reduce((a,t)=>({...a,[t]:countOf(allJobs,'type',t)}),{})}                  selected={fTypes}     onToggle={v=>toggleArr(fTypes,setFTypes,v)} />}
              {workModes.length > 0  && <FilterSection title="Job Shift"   options={workModes}  counts={workModes.reduce((a,m)=>({...a,[m]:countOf(allJobs,'workMode',m)}),{})}              selected={fModes}     onToggle={v=>toggleArr(fModes,setFModes,v)} />}
              {expLevels.length > 0  && <FilterSection title="Experience"  options={expLevels}  counts={expLevels.reduce((a,e)=>({...a,[e]:countOf(allJobs,'experienceLevel',e)}),{})}      selected={fExps}      onToggle={v=>toggleArr(fExps,setFExps,v)} />}
              {categories.length > 0 && <FilterSection title="Categories"  options={categories} counts={categories.reduce((a,c)=>({...a,[c]:countOf(allJobs,'category',c)}),{})}            selected={fCategories} onToggle={v=>toggleArr(fCategories,setFCategories,v)} />}
              {cities.length > 0     && <FilterSection title="City"        options={cities}     counts={cities.reduce((a,c)=>({...a,[c]:countOf(allJobs,'city',c)}),{})}                    selected={fCities}    onToggle={v=>toggleArr(fCities,setFCities,v)} />}
              {titles.length > 0     && <FilterSection title="Job Title"   options={titles}     counts={titles.reduce((a,t)=>({...a,[t]:countOf(allJobs,'title',t)}),{})}                  selected={fTitles}    onToggle={v=>toggleArr(fTitles,setFTitles,v)} />}
              {skills.length > 0     && <FilterSection title="Skills"      options={skills}     counts={skills.reduce((a,s)=>({...a,[s]:countSkill(allJobs,s)}),{})}                       selected={fSkills}    onToggle={v=>toggleArr(fSkills,setFSkills,v)} />}
              {companies.length > 0  && <FilterSection title="Company"     options={companies}  counts={companies.reduce((a,c)=>({...a,[c]:countOf(allJobs,'company',c)}),{})}             selected={fCompanies} onToggle={v=>toggleArr(fCompanies,setFCompanies,v)} />}
            </div>

            {/* Apply / Reset */}
            <div className="shrink-0 flex items-center gap-2 border-t border-gray-100 px-4 py-3">
              <button
                onClick={resetFilters}
                className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Reset
              </button>
              <button
                className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* ── MIDDLE: Job list (scrollable) ── */}
        <div className="flex-1 min-w-0 flex flex-col sticky top-4" style={{ height: colHeight }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">
                {cityQ ? `Jobs in ${cityQ}, Pakistan` : "All Jobs"}
                <span className="ml-2 text-sm font-normal text-gray-400">
                  {filtered.length} jobs found
                </span>
              </p>
              {titleQ && (
                <p className="text-xs text-blue-600 mt-0.5">for "{titleQ}"</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400 hidden sm:inline">Sort by:</span>
              <Dropdown value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
            </div>
          </div>

          {/* Promo banner */}
          <div className="shrink-0 mb-3 flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-5">
            <div>
              <p className="text-white font-bold text-base leading-snug">Find the right job.</p>
              <p className="text-white font-bold text-base leading-snug">Build your <span className="text-blue-300">future.</span></p>
            </div>
            <button
              onClick={handleUploadCV}
              className="flex items-center gap-2 shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition whitespace-nowrap"
            >
              <HiOutlineArrowUpTray className="h-4 w-4" /> Upload CV
            </button>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                <HiOutlineBriefcase className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                <p className="text-gray-500 text-sm font-medium">No jobs found</p>
                <p className="text-gray-400 text-xs mt-1">Try different keywords or city</p>
              </div>
            )}

            {filtered.map(job => {
              const isSaved    = savedIds.includes(job._id);
              const isSelected = selectedJob?._id === job._id;
              const color      = avatarColor(job.company || "");
              const initial    = (job.company || "C")[0].toUpperCase();
              const salary     = formatSalary(job.salary);

              return (
                <div key={job._id}
                  onClick={() => setSelectedJob(job)}
                  className={`rounded-2xl border bg-white px-4 py-4 cursor-pointer transition shadow-sm ${
                    isSelected
                      ? "border-blue-500 shadow-blue-100 shadow-md"
                      : "border-gray-100 hover:border-blue-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white ${color}`}>
                      {job.companyRef?.logo ? (
                        <img src={`${FILE_BASE}${job.companyRef.logo}`} alt={job.company} className="h-full w-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Title + save */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-gray-900 leading-tight flex items-center gap-2">
                          {job.title}
                          {isNewJob(job.createdAt) && (
                            <span className="rounded-full bg-green-50 border border-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-600">New</span>
                          )}
                        </p>
                        <button onClick={e => { e.stopPropagation(); handleToggleSave(job._id); }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition">
                          {isSaved ? <HiBookmark className="h-4 w-4 text-blue-600" /> : <HiOutlineBookmark className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Company + location */}
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{job.company}</p>
                      {job.city && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                          <HiOutlineMapPin className="h-3 w-3" />{job.city}
                        </span>
                      )}

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <HiOutlineCalendarDays className="h-3 w-3" />{timeAgo(job.createdAt)}
                        </span>
                        {job.experienceLevel && (
                          <span className="flex items-center gap-1">
                            <HiOutlineClock className="h-3 w-3" />{job.experienceLevel}
                          </span>
                        )}
                        {salary && (
                          <span className="flex items-center gap-1 font-medium text-gray-600">
                            <HiOutlineCurrencyDollar className="h-3 w-3" />{salary}
                          </span>
                        )}
                      </div>

                      {/* Chips */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {job.type     && <span className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">{job.type}</span>}
                        {job.workMode && <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">{job.workMode}</span>}
                        {job.skills?.slice(0, 3).map(s => (
                          <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Job detail (sticky + scrollable) ── */}
        <div className="hidden lg:flex flex-col w-[480px] shrink-0 sticky top-4" style={{ height: colHeight }}>
          <JobPanel
            job={selectedJob}
            saved={savedIds.includes(selectedJob?._id)}
            onSave={handleToggleSave}
            onApply={job => navigate(`/jobs/${job._id}`)}
            onClose={() => setSelectedJob(null)}
          />
        </div>
      </div>
    </main>
  );
}
