import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { searchJobs } from "../services/jobService";
import { saveJob, unsaveJob, getSavedJobs } from "../services/savedJobService";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineMagnifyingGlass, HiOutlineMapPin, HiOutlineBriefcase,
  HiOutlineBookmark, HiBookmark, HiOutlineCheckCircle,
  HiOutlineClock, HiOutlineCurrencyDollar, HiOutlineCalendarDays,
  HiOutlineBuildingOffice2, HiOutlineShare, HiOutlineXMark,
} from "react-icons/hi2";

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
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? options : options.slice(0, 6);
  return (
    <div className="border-b border-gray-100 pb-3 mb-3 last:border-0 last:mb-0 last:pb-0">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">{title}</p>
      {visible.map(opt => (
        <Checkbox key={opt} label={opt} count={counts?.[opt]}
          checked={selected.includes(opt)}
          onChange={() => onToggle(opt)} />
      ))}
      {options.length > 6 && (
        <button onClick={() => setShowAll(s => !s)}
          className="mt-1 text-[11px] text-blue-600 hover:underline">
          {showAll ? "Show Less" : `+${options.length - 6} More`}
        </button>
      )}
    </div>
  );
}

// ── Right panel ─────────────────────────────────────────────────────────────
async function shareJob(job) {
  const shareData = {
    title: job?.title ? `${job.title} — ${job.company}` : "Job listing",
    text: job?.title ? `Check out this job: ${job.title} at ${job.company}` : "Check out this job",
    url: `${window.location.origin}/jobs/${job._id}`,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
  } catch (err) {
    // user cancelled — fall through to clipboard
  }

  try {
    await navigator.clipboard.writeText(shareData.url);
    alert("Job link copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy link:", err);
  }
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
  const { about, responsibilities, requirements } = parseDesc(job.description);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white ${avatarColor(job.company)}`}>
              {initial}
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
          <button onClick={() => onApply(job)}
            className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 transition">
            Apply Now
          </button>
          <button
            onClick={() => shareJob(job)}
            title="Share this job"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 transition"
          >
            <HiOutlineShare className="h-4 w-4" />
          </button>
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

  const filtered = allJobs.filter(j => {
    if (fTypes.length    && !fTypes.some(v => v.toLowerCase() === j.type?.toLowerCase()))               return false;
    if (fModes.length    && !fModes.some(v => v.toLowerCase() === j.workMode?.toLowerCase()))           return false;
    if (fExps.length     && !fExps.some(v => v.toLowerCase() === j.experienceLevel?.toLowerCase()))     return false;
    if (fCities.length   && !fCities.some(v => v.toLowerCase() === j.city?.toLowerCase()))              return false;
    if (fTitles.length   && !fTitles.some(v => v.toLowerCase() === j.title?.toLowerCase()))             return false;
    if (fSkills.length   && !fSkills.some(s => j.skills?.map(sk=>sk.toLowerCase()).includes(s.toLowerCase()))) return false;
    if (fCompanies.length && !fCompanies.some(v => v.toLowerCase() === j.company?.toLowerCase()))       return false;
    return true;
  });

  const hasFilters = fTypes.length + fModes.length + fExps.length +
    fCities.length + fTitles.length + fSkills.length + fCompanies.length;

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
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 focus-within:border-blue-400 transition">
              <HiOutlineMapPin className="h-4 w-4 shrink-0 text-gray-400" />
              <input type="text" value={cityQ} onChange={e => setCityQ(e.target.value)}
                placeholder="City e.g. Lahore"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none" />
              {cityQ && <button type="button" onClick={() => setCityQ("")}><HiOutlineXMark className="h-4 w-4 text-gray-400" /></button>}
            </div>
            <button type="submit"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition whitespace-nowrap">
              <HiOutlineMagnifyingGlass className="h-4 w-4" /> Find Jobs
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
              {hasFilters > 0 && (
                <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">
                  Reset All ({hasFilters})
                </button>
              )}
            </div>
            {/* Scrollable filter list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0">
              {jobTypes.length > 0   && <FilterSection title="Job Type"    options={jobTypes}   counts={jobTypes.reduce((a,t)=>({...a,[t]:countOf(allJobs,'type',t)}),{})}                  selected={fTypes}     onToggle={v=>toggleArr(fTypes,setFTypes,v)} />}
              {workModes.length > 0  && <FilterSection title="Job Shift"   options={workModes}  counts={workModes.reduce((a,m)=>({...a,[m]:countOf(allJobs,'workMode',m)}),{})}              selected={fModes}     onToggle={v=>toggleArr(fModes,setFModes,v)} />}
              {expLevels.length > 0  && <FilterSection title="Experience"  options={expLevels}  counts={expLevels.reduce((a,e)=>({...a,[e]:countOf(allJobs,'experienceLevel',e)}),{})}      selected={fExps}      onToggle={v=>toggleArr(fExps,setFExps,v)} />}
              {cities.length > 0     && <FilterSection title="City"        options={cities}     counts={cities.reduce((a,c)=>({...a,[c]:countOf(allJobs,'city',c)}),{})}                    selected={fCities}    onToggle={v=>toggleArr(fCities,setFCities,v)} />}
              {titles.length > 0     && <FilterSection title="Job Title"   options={titles}     counts={titles.reduce((a,t)=>({...a,[t]:countOf(allJobs,'title',t)}),{})}                  selected={fTitles}    onToggle={v=>toggleArr(fTitles,setFTitles,v)} />}
              {skills.length > 0     && <FilterSection title="Skills"      options={skills}     counts={skills.reduce((a,s)=>({...a,[s]:countSkill(allJobs,s)}),{})}                       selected={fSkills}    onToggle={v=>toggleArr(fSkills,setFSkills,v)} />}
              {companies.length > 0  && <FilterSection title="Company"     options={companies}  counts={companies.reduce((a,c)=>({...a,[c]:countOf(allJobs,'company',c)}),{})}             selected={fCompanies} onToggle={v=>toggleArr(fCompanies,setFCompanies,v)} />}
            </div>
          </div>
        </div>

        {/* ── MIDDLE: Job list (scrollable) ── */}
        <div className="flex-1 min-w-0 flex flex-col sticky top-4" style={{ height: colHeight }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-800">{filtered.length}</span> jobs found
              {(cityQ || titleQ) && (
                <span className="text-blue-600">
                  {titleQ ? ` for "${titleQ}"` : ""}
                  {cityQ  ? ` in ${cityQ}` : ""}
                </span>
              )}
            </p>
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
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${color}`}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Title + save */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-gray-900 leading-tight">{job.title}</p>
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
