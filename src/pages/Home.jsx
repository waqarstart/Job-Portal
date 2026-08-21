import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineMagnifyingGlass, HiOutlineMapPin, HiOutlineBookmark,
  HiBookmark, HiOutlineBriefcase, HiOutlineComputerDesktop,
  HiOutlineMegaphone, HiOutlineChartBar, HiOutlineCube,
  HiOutlinePaintBrush, HiOutlineArrowRight, HiOutlineSquares2X2,
} from "react-icons/hi2";
import Navbar from "../components/Navbar";
import { searchJobs } from "../services/jobService";
import { getSavedJobs, saveJob, unsaveJob } from "../services/savedJobService";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  { label: "Software Development", count: "250+", icon: HiOutlineComputerDesktop, color: "bg-blue-50 text-blue-600" },
  { label: "Design",               count: "120+", icon: HiOutlinePaintBrush,      color: "bg-purple-50 text-purple-600" },
  { label: "Marketing",            count: "85+",  icon: HiOutlineMegaphone,       color: "bg-orange-50 text-orange-600" },
  { label: "Data Science",         count: "95+",  icon: HiOutlineChartBar,        color: "bg-green-50 text-green-600" },
  { label: "Product",              count: "60+",  icon: HiOutlineCube,            color: "bg-pink-50 text-pink-600" },
];

const AVATAR_COLORS = [
  "bg-blue-600","bg-violet-600","bg-emerald-600",
  "bg-rose-600","bg-amber-600","bg-cyan-600","bg-indigo-600",
];

function avatarColor(name = "") {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function timeAgo(date) {
  const days = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function Home() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle]   = useState("");
  const [city, setCity]     = useState("");
  const [jobs, setJobs]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState([]);

  async function loadJobs(t = title, c = city) {
    try {
      setLoading(true);
      const data = await searchJobs(t, c);
      setJobs(data);
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => {
    loadJobs("", "");
    if (isLoggedIn) {
      getSavedJobs()
        .then((s) => setSavedIds(s.map((sj) => sj.job?._id).filter(Boolean)))
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  async function handleToggleSave(e, jobId) {
    e.stopPropagation();
    if (!isLoggedIn) { navigate("/login"); return; }
    try {
      if (savedIds.includes(jobId)) {
        await unsaveJob(jobId);
        setSavedIds((p) => p.filter((id) => id !== jobId));
      } else {
        await saveJob(jobId);
        setSavedIds((p) => [...p, jobId]);
      }
    } catch {}
  }

  function handleSearch(e) {
    e.preventDefault();
    loadJobs(title, city);
  }

  return (
    <main className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[#1a3faa] via-[#2952d9] to-blue-500 px-6 py-16 text-center relative overflow-hidden">
        {/* subtle bg circles */}
        <div className="absolute top-8 left-12 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute bottom-4 right-16 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute top-16 right-32 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Find Your Dream Job
          </h1>
          <p className="mt-3 text-blue-100 text-base sm:text-lg">
            Discover opportunities that match your skills and passion
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch}
            className="mt-8 flex flex-col sm:flex-row items-stretch gap-0 rounded-2xl bg-white p-2 shadow-2xl shadow-blue-900/30">
            <div className="flex flex-1 items-center gap-2 px-4 py-2">
              <HiOutlineMagnifyingGlass className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Job title, keywords or company"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
            </div>
            <div className="hidden sm:block w-px bg-gray-200 my-2" />
            <div className="flex flex-1 items-center gap-2 px-4 py-2">
              <HiOutlineMapPin className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                type="text" value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="Location"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
            </div>
            <button type="submit"
              className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition whitespace-nowrap">
              Search Jobs
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* ── Categories ── */}
        <div className="py-6 flex flex-wrap gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => { setTitle(cat.label.split(" ")[0]); loadJobs(cat.label.split(" ")[0], ""); }}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm hover:border-blue-300 hover:shadow-md transition"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${cat.color}`}>
                <cat.icon className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">{cat.label}</p>
                <p className="text-xs text-gray-400">{cat.count} Jobs</p>
              </div>
            </button>
          ))}
          <button className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition">
            <HiOutlineSquares2X2 className="h-5 w-5 text-gray-400" /> View All
          </button>
        </div>

        {/* ── Jobs header ── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recommended Jobs</h2>
            <p className="text-sm text-gray-400 mt-0.5">Jobs you might be interested in</p>
          </div>
          <button onClick={() => loadJobs("", "")}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition shadow-sm">
            View All Jobs <HiOutlineArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && jobs.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <HiOutlineBriefcase className="mx-auto mb-3 h-10 w-10 text-gray-200" />
            <p className="text-gray-400 text-sm">No jobs found. Try a different search.</p>
          </div>
        )}

        {/* ── Job cards ── */}
        <div className="space-y-3 pb-12">
          {jobs.map((job) => {
            const isSaved = savedIds.includes(job._id);
            const color   = avatarColor(job.company || "");
            const initial = (job.company || "C")[0].toUpperCase();

            return (
              <div
                key={job._id}
                onClick={() => navigate(`/jobs/${job._id}`)}
                className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm hover:border-blue-200 hover:shadow-md transition cursor-pointer group"
              >
                {/* Avatar */}
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white ${color}`}>
                  {initial}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 truncate">{job.company}</p>
                  <p className="text-base font-bold text-gray-900 truncate leading-snug">{job.title}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    {job.city && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <HiOutlineMapPin className="h-3.5 w-3.5" />{job.city}
                      </span>
                    )}
                    {job.workMode && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <HiOutlineBriefcase className="h-3.5 w-3.5" />{job.workMode}
                      </span>
                    )}
                    {/* Skill chips */}
                    {job.skills?.slice(0, 4).map((s) => (
                      <span key={s} className="rounded-lg bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">{s}</span>
                    ))}
                    <span className="text-[11px] text-gray-300">{timeAgo(job.createdAt)}</span>
                  </div>
                </div>

                {/* Right: salary + save + button */}
                <div className="flex shrink-0 items-center gap-2.5">
                  <div className="text-right mr-1 hidden sm:block">
                    {job.salary && <p className="text-sm font-bold text-gray-800">{job.salary}</p>}
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">{job.type}</span>
                  </div>
                  <button
                    onClick={(e) => handleToggleSave(e, job._id)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 transition"
                  >
                    {isSaved
                      ? <HiBookmark className="h-5 w-5 text-blue-600" />
                      : <HiOutlineBookmark className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job._id}`); }}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition whitespace-nowrap"
                  >
                    View Job
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
