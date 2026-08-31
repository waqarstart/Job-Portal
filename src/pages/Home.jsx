import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineMagnifyingGlass, HiOutlineMapPin, HiOutlineBookmark,
  HiBookmark, HiOutlineBriefcase, HiOutlineComputerDesktop,
  HiOutlineMegaphone, HiOutlineChartBar, HiOutlineCube,
  HiOutlinePaintBrush, HiOutlineArrowRight, HiOutlineSquares2X2,
  HiOutlineUsers, HiOutlineCurrencyDollar, HiOutlineDocumentArrowUp,
  HiOutlineStar, HiOutlineArrowUpTray, HiOutlineChatBubbleBottomCenterText,
  HiOutlineEnvelope, HiOutlineCheckCircle, HiOutlineArrowUp,
  HiOutlineChevronLeft, HiOutlineChevronRight,
} from "react-icons/hi2";
import {
  FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram,
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import { searchJobs, getTopCompanies } from "../services/jobService";
import { getSavedJobs, saveJob, unsaveJob } from "../services/savedJobService";
import { subscribeNewsletter } from "../services/newsletterService";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  { label: "Software Development", short: "Software Development", count: "250+", icon: HiOutlineComputerDesktop, color: "bg-blue-50 text-blue-600" },
  { label: "Design & UI/UX",        short: "Design",               count: "120+", icon: HiOutlinePaintBrush,      color: "bg-purple-50 text-purple-600" },
  { label: "Marketing",             short: "Marketing",             count: "180+", icon: HiOutlineMegaphone,       color: "bg-rose-50 text-rose-600" },
  { label: "Data Science",          short: "Data",                  count: "95+",  icon: HiOutlineChartBar,        color: "bg-green-50 text-green-600" },
  { label: "Finance",               short: "Finance",                count: "150+", icon: HiOutlineCurrencyDollar,  color: "bg-amber-50 text-amber-600" },
  { label: "HR & Admin",            short: "HR",                     count: "100+", icon: HiOutlineUsers,           color: "bg-cyan-50 text-cyan-600" },
];

const POPULAR_SEARCHES = [
  "Software Engineer", "Frontend Developer", "UI/UX Designer",
  "Data Analyst", "Product Manager", "Digital Marketing",
];

const RESOURCES = [
  { tag: "Career Tips", tagColor: "text-blue-600", gradient: "from-blue-500 to-indigo-600", icon: HiOutlineChatBubbleBottomCenterText, title: "10 Tips to Ace Your Next Job Interview", readTime: "5 min read" },
  { tag: "Job Search", tagColor: "text-green-600", gradient: "from-emerald-500 to-teal-600", icon: HiOutlineDocumentArrowUp, title: "How to Write a CV That Gets You Hired", readTime: "7 min read" },
  { tag: "Career Growth", tagColor: "text-purple-600", gradient: "from-purple-500 to-fuchsia-600", icon: HiOutlineChartBar, title: "Top Skills Employers Are Looking for This Year", readTime: "6 min read" },
  { tag: "Workplace", tagColor: "text-amber-600", gradient: "from-amber-500 to-orange-600", icon: HiOutlineBriefcase, title: "How to Build a Successful Remote Career", readTime: "6 min read" },
];

const TESTIMONIALS = [
  { name: "Ayesha Khan", role: "Frontend Developer at Teckdev", quote: "HireHub helped me find the perfect job within a week. The platform is easy to use and very effective!" },
  { name: "Bilal Ahmed", role: "Backend Engineer at GCS", quote: "I got more interviews through HireHub than any other job portal. Highly recommended!" },
  { name: "Sara Malik", role: "UI/UX Designer at InnovateX", quote: "The job recommendations are spot on! It saved me so much time in my search." },
  { name: "Omar Farooq", role: "Data Analyst at Soft Solutions", quote: "Clean interface, real jobs, and a straightforward application process. Exactly what I needed." },
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
  const [category, setCategory] = useState("");
  const [jobs, setJobs]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [testimonialStart, setTestimonialStart] = useState(0);

  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState(""); // "", "loading", "done", "error"
  const [subMessage, setSubMessage] = useState("");

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
    getTopCompanies(6).then(setCompanies).catch(() => setCompanies([]));
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
    const q = category ? `${title} ${category}`.trim() : title;
    navigate(`/find-jobs?title=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}`);
  }

  function handleUploadCV() {
    if (!isLoggedIn) { navigate("/login"); return; }
    navigate("/dashboard/resume");
  }

  async function handleSubscribe(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setSubStatus("loading");
    setSubMessage("");
    try {
      const data = await subscribeNewsletter(email.trim());
      setSubStatus("done");
      setSubMessage(data.message || "Subscribed!");
      setEmail("");
    } catch (err) {
      setSubStatus("error");
      setSubMessage(err.response?.data?.message || "Could not subscribe. Please try again.");
    }
  }

  const visibleTestimonials = useMemo(() => {
    const list = [];
    for (let i = 0; i < 3; i++) {
      list.push(TESTIMONIALS[(testimonialStart + i) % TESTIMONIALS.length]);
    }
    return list;
  }, [testimonialStart]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="bg-gray-50 px-6 pt-16 pb-10 relative overflow-hidden">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 items-center gap-12">

          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              Your Next Career<br />Starts <span className="text-blue-600">Here</span>
            </h1>
            <p className="mt-4 text-gray-500 text-base sm:text-lg max-w-md">
              Find opportunities, build your future and grow your career with top employers.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate("/find-jobs")}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Find Jobs
              </button>
              <button
                onClick={handleUploadCV}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                <HiOutlineArrowUpTray className="h-4 w-4" />
                Upload CV
              </button>
            </div>
          </div>

          {/* Decorative illustration */}
          <div className="relative hidden lg:flex items-center justify-center h-72">
            <div className="absolute h-56 w-40 rounded-2xl bg-white shadow-lg border border-gray-100 -rotate-6" />
            <div className="absolute h-40 w-56 rounded-2xl bg-blue-900 shadow-xl flex items-center justify-center">
              <HiOutlineBriefcase className="h-16 w-16 text-white/90" />
            </div>
            <div className="absolute -top-2 right-10 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 shadow-md">
              <HiOutlineChartBar className="h-6 w-6 text-green-600" />
            </div>
            <div className="absolute bottom-2 right-0 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 shadow-md rotate-12">
              <HiOutlineChatBubbleBottomCenterText className="h-5 w-5 text-orange-500" />
            </div>
            <div className="absolute top-6 left-4 h-3 w-3 rounded-full bg-blue-300" />
            <div className="absolute bottom-10 left-0 h-2.5 w-2.5 rounded-full bg-amber-300" />
          </div>
        </div>

        {/* Search bar */}
        <div className="mx-auto max-w-5xl mt-10 relative">
          <form onSubmit={handleSearch}
            className="flex flex-col md:flex-row items-stretch gap-2 rounded-2xl bg-white p-2 shadow-xl border border-gray-100">
            <div className="flex flex-1 items-center gap-2 px-4 py-2.5">
              <HiOutlineMagnifyingGlass className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Job title, keywords or company"
                className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
            </div>

            <div className="hidden md:block w-px bg-gray-200 my-2" />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl md:rounded-none bg-transparent px-4 py-2.5 text-sm text-gray-600 outline-none border border-gray-200 md:border-none"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.label} value={c.short}>{c.label}</option>
              ))}
            </select>

            <div className="hidden md:block w-px bg-gray-200 my-2" />

            <div className="flex flex-1 items-center gap-2 px-4 py-2.5">
              <HiOutlineMapPin className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                type="text" value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="City, province or remote"
                className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
            </div>

            <button type="submit"
              className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition whitespace-nowrap">
              Search Jobs
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-400">Popular Searches:</span>
            {POPULAR_SEARCHES.map((s) => (
              <button
                key={s}
                onClick={() => navigate(`/find-jobs?title=${encodeURIComponent(s)}`)}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* ── Top Categories ── */}
        <div className="pt-12 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Top Categories</h2>
            <button
              onClick={() => navigate("/find-jobs")}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View All Categories <HiOutlineArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => navigate(`/find-jobs?title=${encodeURIComponent(cat.short)}`)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-5 shadow-sm hover:border-blue-300 hover:shadow-md transition text-center"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${cat.color}`}>
                  <cat.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-gray-800 leading-snug">{cat.label}</p>
                <p className="text-[11px] text-gray-400">{cat.count} Jobs</p>
              </button>
            ))}
            <button
              onClick={() => navigate("/find-jobs")}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-5 shadow-sm hover:bg-gray-50 transition text-center"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                <HiOutlineSquares2X2 className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-gray-800">More Categories</p>
            </button>
          </div>
        </div>

        {/* ── Featured Jobs ── */}
        <div className="pt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Featured Jobs</h2>
            <button onClick={() => navigate("/find-jobs")}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
              View All Jobs <HiOutlineArrowRight className="h-4 w-4" />
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          )}

          {!loading && jobs.length === 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
              <HiOutlineBriefcase className="mx-auto mb-3 h-10 w-10 text-gray-200" />
              <p className="text-gray-400 text-sm">No jobs found. Try a different search.</p>
            </div>
          )}

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-100 overflow-hidden">
            {jobs.slice(0, 5).map((job) => {
              const isSaved = savedIds.includes(job._id);
              const color   = avatarColor(job.company || "");
              const initial = (job.company || "C")[0].toUpperCase();

              return (
                <div
                  key={job._id}
                  onClick={() => navigate(`/jobs/${job._id}`)}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${color}`}>
                    {initial}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-400 truncate">{job.company}</p>
                  </div>

                  {job.city && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <HiOutlineMapPin className="h-3.5 w-3.5" />{job.city}
                    </span>
                  )}

                  {job.salary && (
                    <span className="text-sm font-bold text-gray-800 shrink-0 sm:w-40">{job.salary}</span>
                  )}

                  {job.type && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 shrink-0 w-fit">
                      {job.type}
                    </span>
                  )}

                  <span className="text-[11px] text-gray-300 shrink-0">{timeAgo(job.createdAt)}</span>

                  <button
                    onClick={(e) => handleToggleSave(e, job._id)}
                    className="shrink-0 text-gray-400 hover:text-blue-600 transition"
                  >
                    {isSaved
                      ? <HiBookmark className="h-5 w-5 text-blue-600" />
                      : <HiOutlineBookmark className="h-5 w-5" />}
                  </button>
                </div>
              );
            })}
          </div>

          {!loading && jobs.length > 0 && (
            <div className="text-center mt-4">
              <button onClick={() => navigate("/find-jobs")}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                View All Jobs <HiOutlineArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Top Companies Hiring ── */}
        <div id="top-companies" className="pt-16 scroll-mt-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Top Companies Hiring</h2>
            <button onClick={() => navigate("/find-jobs")}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
              View All Companies <HiOutlineArrowRight className="h-4 w-4" />
            </button>
          </div>

          {companies.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
              <HiOutlineUsers className="mx-auto mb-3 h-8 w-8 text-gray-200" />
              <p className="text-gray-400 text-sm">No active job postings yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {companies.map((c) => {
                const color = avatarColor(c.company || "");
                const initial = (c.company || "C")[0].toUpperCase();
                return (
                  <button
                    key={c.company}
                    onClick={() => navigate(`/find-jobs?title=${encodeURIComponent("")}&company=${encodeURIComponent(c.company)}`)}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-5 shadow-sm hover:border-blue-300 hover:shadow-md transition text-center"
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-base font-bold text-white ${color}`}>
                      {initial}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 truncate w-full">{c.company}</p>
                    <p className="text-[11px] text-gray-400">{c.jobCount}+ Jobs</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Career Resources ── */}
        <div id="career-resources" className="pt-16 scroll-mt-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Career Resources</h2>
            <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
              View All Articles <HiOutlineArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {RESOURCES.map((r) => (
              <div key={r.title} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer">
                <div className={`h-32 bg-gradient-to-br ${r.gradient} flex items-center justify-center`}>
                  <r.icon className="h-10 w-10 text-white/90" />
                </div>
                <div className="p-4">
                  <p className={`text-xs font-semibold ${r.tagColor}`}>{r.tag}</p>
                  <p className="mt-1 text-sm font-bold text-gray-900 leading-snug">{r.title}</p>
                  <p className="mt-2 text-xs text-gray-400">{r.readTime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Testimonials ── */}
        <div className="pt-16 pb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What Our Users Say</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {visibleTestimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-3xl text-blue-100 leading-none mb-1">"</p>
                <p className="text-sm text-gray-600 leading-relaxed">{t.quote}</p>
                <div className="flex items-center gap-3 mt-5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(t.name)}`}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialStart(i)}
                className={`h-2 rounded-full transition-all ${i === testimonialStart ? "w-6 bg-blue-600" : "w-2 bg-gray-300"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Newsletter ── */}
      <section className="bg-blue-600 px-6 py-8">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-white">
            <HiOutlineEnvelope className="h-9 w-9 shrink-0" />
            <div>
              <p className="font-bold">Get the latest job opportunities</p>
              <p className="text-sm text-blue-100">delivered to your inbox.</p>
            </div>
          </div>

          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto items-center gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 md:w-72 rounded-xl px-4 py-2.5 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={subStatus === "loading"}
              className="rounded-xl bg-blue-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-950 transition disabled:opacity-60 whitespace-nowrap"
            >
              {subStatus === "loading" ? "..." : "Subscribe"}
            </button>
          </form>
        </div>

        {subMessage && (
          <p className={`mx-auto max-w-5xl mt-3 flex items-center gap-1.5 text-sm ${subStatus === "error" ? "text-red-100" : "text-white"}`}>
            {subStatus === "done" && <HiOutlineCheckCircle className="h-4 w-4" />}
            {subMessage}
          </p>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0b1526] text-gray-300 px-6 pt-12 pb-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">H</div>
              <span className="text-lg font-bold text-white">HireHub</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your trusted partner in finding the perfect job. Explore opportunities, connect with top companies, and build your future.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {[FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram].map((Icon, i) => (
                <a key={i} href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition text-gray-300">
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white font-semibold mb-3">For Job Seekers</p>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate("/find-jobs")} className="hover:text-white transition">Browse Jobs</button></li>
              <li><button onClick={() => navigate("/find-jobs")} className="hover:text-white transition">Advanced Search</button></li>
              <li><button onClick={() => document.getElementById("career-resources")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition">Career Advice</button></li>
              <li><button onClick={() => navigate(isLoggedIn ? "/dashboard" : "/register")} className="hover:text-white transition">Create Profile</button></li>
              <li><button onClick={() => navigate(isLoggedIn ? "/dashboard/settings" : "/register")} className="hover:text-white transition">Job Alerts</button></li>
            </ul>
          </div>

          <div>
            <p className="text-white font-semibold mb-3">For Employers</p>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate("/login")} className="hover:text-white transition">Post a Job</button></li>
              <li><button onClick={() => navigate("/login")} className="hover:text-white transition">Browse Candidates</button></li>
              <li><button onClick={() => alert("Pricing plans are coming soon.")} className="hover:text-white transition">Pricing Plans</button></li>
              <li><button onClick={() => navigate("/login")} className="hover:text-white transition">Employer Login</button></li>
            </ul>
          </div>

          <div>
            <p className="text-white font-semibold mb-3">Company</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">About Us</a></li>
              <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Help Center</a></li>
            </ul>
          </div>

          <div>
            <p className="text-white font-semibold mb-3">Contact Us</p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <HiOutlineEnvelope className="h-4 w-4 shrink-0" /> support@hirehub.com
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineChatBubbleBottomCenterText className="h-4 w-4 shrink-0" /> +92 300 1234567
              </li>
              <li className="flex items-start gap-2">
                <HiOutlineMapPin className="h-4 w-4 shrink-0 mt-0.5" /> 123 Business Avenue, Lahore, Pakistan
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-6xl mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} HireHub. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Sitemap</a>
          </div>
        </div>
      </footer>

      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition"
        title="Back to top"
      >
        <HiOutlineArrowUp className="h-5 w-5" />
      </button>
    </main>
  );
}
