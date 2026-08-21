import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getJob } from "../services/jobService";
import { applyToJob } from "../services/applicationService";
import { saveJob, unsaveJob, getSavedJobs } from "../services/savedJobService";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineMapPin, HiOutlineClock, HiOutlineBriefcase,
  HiOutlineCurrencyDollar, HiOutlineCalendarDays,
  HiOutlineBookmark, HiBookmark, HiOutlineShare,
  HiOutlineArrowLeft, HiOutlineCheckCircle,
  HiOutlineBuildingOffice2,
} from "react-icons/hi2";

function parseDescription(desc = "") {
  if (!desc) return { about: "", responsibilities: [], requirements: [] };
  const lines = desc.split("\n");
  let about = "", responsibilities = [], requirements = [], mode = "about";
  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    if (/responsibilit/i.test(l)) { mode = "resp"; continue; }
    if (/requirement|qualification/i.test(l)) { mode = "req"; continue; }
    if (mode === "about") about += (about ? " " : "") + l;
    else if (mode === "resp") responsibilities.push(l.replace(/^[-•*]\s*/, ""));
    else if (mode === "req")  requirements.push(l.replace(/^[-•*]\s*/, ""));
  }
  return { about, responsibilities, requirements };
}

export default function JobDetail() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { isLoggedIn } = useAuth();

  const [job, setJob]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("Job Description");
  const [saved, setSaved]     = useState(false);
  const [applied, setApplied] = useState(false);
  const [showApply, setShowApply]   = useState(false);
  const [cvFile, setCvFile]         = useState(null);
  const [applying, setApplying]     = useState(false);
  const [applyError, setApplyError] = useState("");

  useEffect(() => {
    getJob(id).then(setJob).catch(() => navigate("/")).finally(() => setLoading(false));
    if (isLoggedIn) {
      getSavedJobs().then((s) => setSaved(s.some((sj) => sj.job?._id === id))).catch(() => {});
    }
  }, [id, isLoggedIn, navigate]);

  async function handleToggleSave() {
    if (!isLoggedIn) { navigate("/login"); return; }
    try {
      if (saved) { await unsaveJob(id); setSaved(false); }
      else       { await saveJob(id);   setSaved(true);  }
    } catch {}
  }

  function handleApply() {
    if (!isLoggedIn) { navigate("/login"); return; }
    setShowApply(true); setCvFile(null); setApplyError("");
  }

  async function handleApplySubmit(e) {
    e.preventDefault();
    if (!cvFile) { setApplyError("Please attach your CV (PDF, DOC or DOCX)."); return; }
    try {
      setApplying(true); setApplyError("");
      const application = await applyToJob(id, cvFile);
      setApplied(true); setShowApply(false);
      navigate(`/interview/${id}`, { state: { job, applicationId: application._id } });
    } catch (err) {
      setApplyError(err.response?.data?.message || "Could not submit application.");
    } finally { setApplying(false); }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6fa]">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </main>
    );
  }
  if (!job) return null;

  const { about, responsibilities, requirements } = parseDescription(job.description);
  const initial = (job.company || "C")[0].toUpperCase();

  return (
    <main className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition mb-5">
          <HiOutlineArrowLeft className="h-4 w-4" /> Back to Jobs
        </button>

        {/* Top card */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">

            {/* Company info */}
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-2xl font-bold text-white">
                {initial}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-0.5">{job.company}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">Featured</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                  {job.city && (
                    <span className="flex items-center gap-1.5">
                      <HiOutlineMapPin className="h-4 w-4 text-gray-400" />{job.city}
                    </span>
                  )}
                  {job.workMode && (
                    <span className="flex items-center gap-1.5">
                      <HiOutlineBuildingOffice2 className="h-4 w-4 text-gray-400" />{job.workMode}
                    </span>
                  )}
                </div>
                {job.salary && <p className="mt-2 text-sm font-bold text-gray-800">{job.salary}</p>}
              </div>
            </div>

            {/* Apply + heart + Share */}
            <div className="flex flex-col gap-2 sm:min-w-[160px]">
              <div className="flex items-center gap-2">
                <button onClick={handleApply} disabled={applied}
                  className="flex-1 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition">
                  {applied ? "Applied ✓" : "Apply Now"}
                </button>
                <button onClick={handleToggleSave} title={saved ? "Unsave" : "Save job"}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition">
                  {saved
                    ? <HiBookmark className="h-5 w-5 text-blue-600" />
                    : <HiOutlineBookmark className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                <HiOutlineShare className="h-4 w-4" /> Share
              </button>
            </div>
          </div>
        </div>

        {/* Main 2-col */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px] items-start">

          {/* Left: tabs + description */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100 px-6 gap-6">
              {["Job Description", "About Company"].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`py-4 text-sm font-medium border-b-2 -mb-px transition ${
                    tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {tab === "Job Description" && (
                <>
                  {about && (
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-2">About the Role</h3>
                      <p className="text-sm text-gray-600 leading-7">{about}</p>
                    </div>
                  )}
                  {responsibilities.length > 0 && (
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-3">Responsibilities</h3>
                      <ul className="space-y-2.5">
                        {responsibilities.map((r, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                            <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {requirements.length > 0 && (
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-3">Requirements</h3>
                      <ul className="space-y-2.5">
                        {requirements.map((r, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                            <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {!about && responsibilities.length === 0 && requirements.length === 0 && job.description && (
                    <p className="text-sm text-gray-600 leading-7 whitespace-pre-line">{job.description}</p>
                  )}
                  {!job.description && <p className="text-sm text-gray-400">No description provided.</p>}
                </>
              )}
              {tab === "About Company" && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">{initial}</div>
                    <div>
                      <p className="font-bold text-gray-900">{job.company}</p>
                      <p className="text-xs text-gray-400">Hiring for {job.title}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-6">No company description available yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: STICKY overview + skills */}
          <div className="space-y-4 lg:sticky lg:top-6">

            {/* Job Overview */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Job Overview</h3>
              <div className="space-y-4">
                {[
                  { icon: HiOutlineClock,         label: "Experience",           value: job.experienceLevel || "Not specified" },
                  { icon: HiOutlineBriefcase,      label: "Job Type",             value: job.type || "—" },
                  { icon: HiOutlineMapPin,         label: "Location",             value: job.city || "—" },
                  { icon: HiOutlineCurrencyDollar, label: "Salary",               value: job.salary || "Not disclosed" },
                  { icon: HiOutlineCalendarDays,   label: "Posted On",            value: new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                  ...(job.deadline ? [{ icon: HiOutlineCalendarDays, label: "Application Deadline", value: new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
                      <row.icon className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                      <p className="text-xs text-gray-400 whitespace-nowrap shrink-0">{row.label}</p>
                      <p className="text-sm font-semibold text-gray-800 text-right truncate">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            {job.skills?.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <span key={s} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply modal */}
      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">Apply to {job.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{job.company} • {job.city}</p>
            <p className="mt-3 text-sm text-gray-500 leading-6">After you submit your CV, you'll go straight into a short AI interview for this role.</p>
            <form onSubmit={handleApplySubmit} className="mt-5 space-y-4">
              {applyError && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-600">{applyError}</div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Upload your CV (PDF, DOC, DOCX — max 5MB)</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files[0])}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1 file:text-xs file:font-medium file:text-gray-700" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowApply(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={applying}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition">
                  {applying ? "Submitting..." : "Submit & Start Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
