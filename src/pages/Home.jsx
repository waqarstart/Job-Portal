import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineMagnifyingGlass, HiOutlineMapPin, HiOutlineBookmark,
  HiBookmark, HiOutlineBriefcase, HiOutlineComputerDesktop,
  HiOutlineMegaphone, HiOutlineChartBar,
  HiOutlinePaintBrush, HiOutlineArrowRight, HiOutlineArrowDown, HiOutlineSquares2X2,
  HiOutlineUsers, HiOutlineCurrencyDollar, HiOutlineDocumentArrowUp,
  HiOutlineDocumentText,
  HiOutlineArrowUpTray, HiOutlineChatBubbleBottomCenterText,
  HiOutlineEnvelope, HiOutlineCheckCircle, HiOutlineArrowUp,
  HiOutlineUserCircle, HiOutlineBuildingOffice2, HiOutlineLockClosed, HiOutlineEye,
  HiOutlineUserPlus, HiOutlinePaperAirplane, HiOutlineTrophy,
  HiOutlineArrowTrendingUp, HiOutlineChevronLeft, HiOutlineChevronRight,
} from "react-icons/hi2";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import Dropdown from "../components/Dropdown";
import CityAutocomplete from "../components/CityAutocomplete";
import { searchJobs, getTopCompanies, getPublicStats } from "../services/jobService";
import { getSavedJobs, saveJob, unsaveJob } from "../services/savedJobService";
import { subscribeNewsletter } from "../services/newsletterService";
import { getCandidateDashboard } from "../services/dashboardService";
import { getHRDashboard } from "../services/hrService";
import { getAdminDashboard } from "../services/adminService";
import { getMyApplications } from "../services/applicationService";
import { useAuth } from "../context/AuthContext";

const HERO_GUEST_IMAGE = "/images/hero-guest.jpg";
const HERO_CANDIDATE_IMAGE = "/images/hero-login.jpg";
const PATH_JOBSEEKER_IMAGE = "/images/path-jobseeker.jpg";
const PATH_HIRE_IMAGE = "/images/path-hire.jpg";

// Curated shortcut chips — not derived from real search-analytics (we don't
// track query frequency), so these are sensible defaults, not claimed data.
const POPULAR_SEARCHES = [
  "Software Engineer", "Frontend Developer", "UI/UX Designer", "Data Analyst",
];

const HOW_IT_WORKS = [
  { step: "01", title: "Create Profile",      desc: "Sign up and build a profile that highlights your skills.", icon: HiOutlineUserPlus },
  { step: "02", title: "Find Opportunities",  desc: "Explore jobs that match your skills and interests.",       icon: HiOutlineMagnifyingGlass },
  { step: "03", title: "Apply Easily",        desc: "Apply to jobs with a single click and get noticed.",       icon: HiOutlinePaperAirplane },
  { step: "04", title: "Get Hired",           desc: "Connect with employers and start your journey.",           icon: HiOutlineTrophy },
];

// Generic career-advice teasers — informational placeholders (no CMS/blog
// exists yet), not attributed to any real author, so nothing here claims to
// be real data. Clicking through is wired to the same "coming soon" pattern
// used elsewhere in the app until a real articles backend exists.
const RESOURCES = [
  { tag: "Career Tips",   gradient: "from-blue-500 to-indigo-600",     icon: HiOutlineChatBubbleBottomCenterText, title: "10 Tips to Ace Your Next Job Interview",              readTime: "5 min read" },
  { tag: "Job Search",    gradient: "from-emerald-500 to-teal-600",    icon: HiOutlineDocumentArrowUp,             title: "How to Write a CV That Gets You Hired",                readTime: "7 min read" },
  { tag: "Career Growth", gradient: "from-purple-500 to-fuchsia-600",  icon: HiOutlineChartBar,                    title: "Top Skills Employers Are Looking for This Year",       readTime: "6 min read" },
  { tag: "Workplace",     gradient: "from-amber-500 to-orange-600",    icon: HiOutlineBriefcase,                   title: "How to Build a Successful Remote Career",              readTime: "6 min read" },
];

// Best-effort icon/color for whatever category string HR typed when posting
// a job (it's a free-text field, not an enum) — falls back to a generic tile.
const CATEGORY_VISUALS = [
  { match: /software|it\b|development|engineer|tech/i, icon: HiOutlineComputerDesktop,             color: "bg-blue-50 text-blue-600" },
  { match: /design|ui|ux/i,                              icon: HiOutlinePaintBrush,                  color: "bg-purple-50 text-purple-600" },
  { match: /market/i,                                    icon: HiOutlineMegaphone,                   color: "bg-rose-50 text-rose-600" },
  { match: /data/i,                                      icon: HiOutlineChartBar,                    color: "bg-green-50 text-green-600" },
  { match: /financ|account/i,                            icon: HiOutlineCurrencyDollar,              color: "bg-amber-50 text-amber-600" },
  { match: /hr|admin|human resource/i,                   icon: HiOutlineUsers,                       color: "bg-cyan-50 text-cyan-600" },
  { match: /sales/i,                                     icon: HiOutlineArrowTrendingUp,             color: "bg-indigo-50 text-indigo-600" },
  { match: /support|customer/i,                          icon: HiOutlineChatBubbleBottomCenterText,  color: "bg-teal-50 text-teal-600" },
];

function categoryVisual(name = "") {
  return CATEGORY_VISUALS.find((v) => v.match.test(name)) || { icon: HiOutlineSquares2X2, color: "bg-gray-100 text-gray-500" };
}

const AVATAR_COLORS = [
  "bg-blue-600","bg-violet-600","bg-emerald-600",
  "bg-rose-600","bg-amber-600","bg-cyan-600","bg-indigo-600",
];

function avatarColor(name = "") {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

function timeAgo(date) {
  const days = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function formatCity(city = "") {
  if (!city) return "";
  const titled = city
    .split(/(\s|,)/)
    .map((w) => (w === "," || w === " " ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join("");
  return titled.includes(",") || titled.toLowerCase() === "remote" ? titled : `${titled}, Pakistan`;
}

function formatSalary(salary = "") {
  if (!salary) return "";
  return salary.replace(/\d{4,}/g, (n) => Number(n).toLocaleString("en-US"));
}

function formatCount(n) {
  if (n === null || n === undefined) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K+`;
  return `${n}+`;
}

function HeroStat({ icon: Icon, color, label, value, sub, floatClass = "" }) {
  return (
    <div className={`inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-md whitespace-nowrap ${floatClass}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 leading-none">{label}</p>
        <p className="text-sm font-bold text-gray-900 mt-1">{value}</p>
        {sub}
      </div>
    </div>
  );
}

function SectionEyebrow({ text }) {
  return (
    <div className="flex flex-col items-center gap-2 mb-3">
      <span className="inline-block h-6 w-[3px] rounded-full bg-blue-600" />
      <span className="text-base font-bold text-blue-600 leading-none">{text}</span>
    </div>
  );
}

export default function Home() {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const isCandidate = isLoggedIn && user?.role === "user";
  const isHR = isLoggedIn && user?.role === "hr";
  const isAdmin = isLoggedIn && user?.role === "admin";
  // Any logged-in user (candidate, HR, or admin) sees the "logged in" home
  // layout — search bar, trending searches, Top Categories/Featured Jobs
  // instead of the guest-only Choose-the-Path/How-it-works pitch. Only the
  // candidate-specific personalized stats (profile strength, applications)
  // stay gated to actual candidates, since that data doesn't apply to HR/Admin.
  const showLoggedInLayout = isLoggedIn;

  const [title, setTitle]   = useState("");
  const [city, setCity]     = useState("");
  const [category, setCategory] = useState("");
  const [jobs, setJobs]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [publicStats, setPublicStats] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [hrDashboard, setHrDashboard] = useState(null);
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [jobSlide, setJobSlide] = useState(0);
  const JOBS_PER_SLIDE = 4;
  const [companySlide, setCompanySlide] = useState(0);
  const COMPANIES_PER_SLIDE = 6;
  const [categorySlide, setCategorySlide] = useState(0);
  const CATEGORIES_PER_SLIDE = 6;
  const [resourceSlide, setResourceSlide] = useState(0);
  const RESOURCES_PER_SLIDE = 4;

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
    getTopCompanies(12).then(setCompanies).catch(() => setCompanies([]));
    getPublicStats().then(setPublicStats).catch(() => {});
    if (isLoggedIn) {
      getSavedJobs()
        .then((s) => setSavedIds(s.map((sj) => sj.job?._id).filter(Boolean)))
        .catch(() => {});
    }
    if (isCandidate) {
      getCandidateDashboard().then(setDashboard).catch(() => {});
      getMyApplications().then(setMyApplications).catch(() => {});
    }
    if (isHR) {
      getHRDashboard().then(setHrDashboard).catch(() => {});
    }
    if (isAdmin) {
      getAdminDashboard().then(setAdminDashboard).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isCandidate, isHR, isAdmin]);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > window.innerHeight);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  function handleFindJobs() {
    navigate("/find-jobs");
  }

  function handleImHiring() {
    if (isLoggedIn && user?.role === "hr") { navigate("/hr/post-job"); return; }
    if (isLoggedIn && user?.role === "admin") { navigate("/admin/dashboard"); return; }
    navigate("/register");
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

  const jobSlideCount = Math.max(1, Math.ceil(jobs.length / JOBS_PER_SLIDE));
  const visibleJobs = jobs.slice(jobSlide * JOBS_PER_SLIDE, jobSlide * JOBS_PER_SLIDE + JOBS_PER_SLIDE);
  const companySlideCount = Math.max(1, Math.ceil(companies.length / COMPANIES_PER_SLIDE));
  const visibleCompanies = companies.slice(companySlide * COMPANIES_PER_SLIDE, companySlide * COMPANIES_PER_SLIDE + COMPANIES_PER_SLIDE);
  const resourceSlideCount = Math.max(1, Math.ceil(RESOURCES.length / RESOURCES_PER_SLIDE));
  const visibleResources = RESOURCES.slice(resourceSlide * RESOURCES_PER_SLIDE, resourceSlide * RESOURCES_PER_SLIDE + RESOURCES_PER_SLIDE);

  useEffect(() => { setJobSlide(0); }, [jobs]);
  useEffect(() => { setCompanySlide(0); }, [companies]);
  useEffect(() => { setResourceSlide(0); }, []);

  function nextJobSlide() { setJobSlide((s) => (s + 1) % jobSlideCount); }
  function prevJobSlide() { setJobSlide((s) => (s - 1 + jobSlideCount) % jobSlideCount); }
  function nextCompanySlide() { setCompanySlide((s) => (s + 1) % companySlideCount); }
  function prevCompanySlide() { setCompanySlide((s) => (s - 1 + companySlideCount) % companySlideCount); }
  function nextCategorySlide() { setCategorySlide((s) => (s + 1) % categorySlideCount); }
  function prevCategorySlide() { setCategorySlide((s) => (s - 1 + categorySlideCount) % categorySlideCount); }
  function nextResourceSlide() { setResourceSlide((s) => (s + 1) % resourceSlideCount); }
  function prevResourceSlide() { setResourceSlide((s) => (s - 1 + resourceSlideCount) % resourceSlideCount); }
  function scrollToTop() { window.scrollTo({ top: 0, behavior: "smooth" }); }

  // ── Real personalized numbers for the candidate hero ──────────────────────
  const appliedJobIds = useMemo(
    () => new Set(myApplications.map((a) => a.job?._id).filter(Boolean)),
    [myApplications]
  );
  const newMatches = useMemo(
    () => jobs.filter((j) => !appliedJobIds.has(j._id) && Date.now() - new Date(j.createdAt) < 7 * 86400000).length,
    [jobs, appliedJobIds]
  );
  const applicationsThisWeek = useMemo(
    () => myApplications.filter((a) => Date.now() - new Date(a.createdAt) < 7 * 86400000).length,
    [myApplications]
  );
  const profileStrength = dashboard?.profileCompletion?.percent ?? null;

  // ── Real categories, derived from the live active-jobs list ───────────────
  const topCategories = useMemo(() => {
    const counts = {};
    for (const j of jobs) {
      if (!j.category) continue;
      counts[j.category] = (counts[j.category] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [jobs]);

  const CATEGORY_OPTIONS = useMemo(() => [
    { value: "", label: "All Categories" },
    ...topCategories.map((c) => ({ value: c.name, label: c.name })),
  ], [topCategories]);

  const categorySlideCount = Math.max(1, Math.ceil(topCategories.length / CATEGORIES_PER_SLIDE));
  const visibleCategories = topCategories.slice(categorySlide * CATEGORIES_PER_SLIDE, categorySlide * CATEGORIES_PER_SLIDE + CATEGORIES_PER_SLIDE);

  useEffect(() => { setCategorySlide(0); }, [topCategories]);

  return (
    <main className="min-h-screen bg-white">

      {/* Navbar rendered outside the hero section: the hero has clip-path
          set on it below, and CSS creates a new containing block for any
          `position: fixed` descendant of an element with clip-path/transform.
          That trapped the navbar inside the hero, so it scrolled away with
          it instead of staying fixed to the viewport. Keeping Navbar as a
          sibling here keeps it truly fixed regardless of what the hero does. */}
      <Navbar overlay />

      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <section className="relative min-h-screen flex flex-col" style={{ clipPath: "inset(0)" }}>
        <div className="absolute inset-0">
          <img
            src={showLoggedInLayout ? HERO_CANDIDATE_IMAGE : HERO_GUEST_IMAGE}
            alt=""
            className="h-full w-full object-cover object-[center_25%]"
            loading="eager"
          />
          {/* No fade — the photo stays crisp all the way down, matching the
              reference exactly; the hero ends with a clean hard edge into
              the stats band below rather than bleeding into white. */}
        </div>

        {/* ── HERO INNER ── */}
        <div className="relative flex-1 flex flex-col min-h-screen">

          {/* Content row — left text, right is the photo */}
          <div className={`flex-1 flex items-center px-6 sm:px-12 lg:px-32 py-16 ${showLoggedInLayout ? "-translate-y-16" : ""}`}>

            {/* LEFT — text content, max ~420px wide */}
            <div className={`w-full z-10 ${showLoggedInLayout ? "max-w-[500px]" : "max-w-[420px]"}`}>
              <h1 className={`font-bold text-[#1a2540] leading-[1.02] ${showLoggedInLayout ? "max-w-[500px] text-5xl sm:text-[56px]" : "max-w-[460px] text-5xl sm:text-6xl"}`}>
                {showLoggedInLayout ? (
                  <>Find Your Next<br /><span className="text-blue-600">Career Opportunity.</span></>
                ) : (
                  <>The Right Job<br />Can Change<br /><span className="text-blue-600">Everything.</span></>
                )}
              </h1>
 
              <div className={`mt-5 inline-block w-full sm:w-fit rounded-2xl bg-white/90 backdrop-blur-sm px-5 py-4 shadow-sm ${showLoggedInLayout ? "sm:max-w-none" : "max-w-[340px]"}`}>
                <p className="text-gray-700 text-[15px] leading-6">
                  {showLoggedInLayout
                    ? <>Explore matched jobs, track applications, and grow your<br />career.</>
                    : <>Connect with leading companies, discover meaningful opportunities, and advance your<br />career with Tekky Job.</>}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {showLoggedInLayout ? (
                  <>
                    <button onClick={handleFindJobs}
                      className="group flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30">
                      Find Jobs <HiOutlineArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                    {isCandidate ? (
                      <button onClick={handleUploadCV}
                        className="group flex items-center gap-2 rounded-xl bg-white/90 px-5 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg">
                        <HiOutlineArrowUpTray className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-1" /> Upload CV
                      </button>
                    ) : (
                      <button onClick={handleImHiring}
                        className="rounded-xl bg-white/90 px-6 py-3 text-sm font-semibold text-gray-800 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg">
                        Post a Job
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => document.getElementById("choose-path")?.scrollIntoView({ behavior: "smooth" })}
                      className="group flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30">
                      Get Started <HiOutlineArrowDown className="h-5 w-5 rounded-full bg-white/20 p-1 transition-transform duration-200 group-hover:translate-y-1" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* FLOATING CARDS — absolute over the photo, right side, wavy */}
          {isAdmin ? (
            /* Admin homepage: platform user and job overview */
            <>
              <div className="absolute top-[19%] left-[58%] animate-float z-20">
                <HeroStat icon={HiOutlineBriefcase} color="bg-blue-50 text-blue-600"
                  label="All Jobs"
                  value={adminDashboard ? adminDashboard.stats.totalJobs : "—"} />
              </div>
              <div className="absolute top-[32%] left-[68%] -translate-x-1/2 animate-float float-delay-1 z-20">
                <HeroStat icon={HiOutlineBuildingOffice2} color="bg-green-50 text-green-600"
                  label="HR Users"
                  value={adminDashboard ? adminDashboard.stats.hrUsers : "—"} />
              </div>
              <div className="absolute top-[25%] right-[10%] animate-float float-delay-2 z-20">
                <HeroStat icon={HiOutlineUsers} color="bg-blue-50 text-blue-600"
                  label="Candidates"
                  value={adminDashboard ? adminDashboard.stats.candidateUsers : "—"} />
              </div>
            </>
          ) : isHR ? (
            /* HR homepage: owned job activity metrics */
            <>
              <div className="absolute top-[20%] left-[52%] animate-float z-20">
                <HeroStat icon={HiOutlineBriefcase} color="bg-blue-50 text-blue-600"
                  label="Your Jobs Posted"
                  value={hrDashboard ? hrDashboard.totalJobs : "—"} />
              </div>
              <div className="absolute top-[32%] left-[68%] -translate-x-1/2 animate-float float-delay-1 z-20">
                <HeroStat icon={HiOutlineEye} color="bg-green-50 text-green-600"
                  label="Views on Your Jobs"
                  value={hrDashboard ? hrDashboard.totalJobViews : "—"} />
              </div>
              <div className="absolute top-[28%] right-[4%] animate-float float-delay-2 z-20">
                <HeroStat icon={HiOutlineDocumentText} color="bg-blue-50 text-blue-600"
                  label="Applications Received"
                  value={hrDashboard ? hrDashboard.totalApplicants : "—"} />
              </div>
            </>
          ) : showLoggedInLayout ? (
            /* Candidate and admin homepage: personalized activity metrics */
            <>
              <div className="absolute top-[20%] left-[52%] animate-float z-20">
                <HeroStat icon={HiOutlineBriefcase} color="bg-blue-50 text-blue-600"
                  label="Job Matches For You"
                  value={dashboard ? `${newMatches} New Jobs` : "—"} />
              </div>
              <div className="absolute top-[32%] left-[68%] -translate-x-1/2 animate-float float-delay-1 z-20">
                <HeroStat icon={HiOutlineChartBar} color="bg-green-50 text-green-600"
                  label="Your Profile Strength"
                  value={profileStrength !== null ? `${profileStrength}%` : "—"}
                  sub={profileStrength !== null && (
                    <div className="mt-1.5 h-1 w-full rounded-full bg-gray-100">
                      <div className="h-1 rounded-full bg-green-500" style={{ width: `${profileStrength}%` }} />
                    </div>
                  )} />
              </div>
              <div className="absolute top-[28%] right-[4%] animate-float float-delay-2 z-20">
                <HeroStat icon={HiOutlineArrowTrendingUp} color="bg-blue-50 text-blue-600"
                  label="Applications This Week"
                  value={dashboard ? applicationsThisWeek : "—"} />
              </div>
            </>
          ) : (
            /* Guest page: right side — above left male, center female, right male */
            <>
              <div className="absolute top-[47%] right-[8%] animate-float z-20">
                <HeroStat icon={HiOutlineUsers} color="bg-blue-50 text-blue-600"
                  label="Job Seekers"
                  value={publicStats ? `${publicStats.jobSeekers}+ and growing` : "—"} />
              </div>
              <div className="absolute top-[60%] right-[8%] animate-float float-delay-1 z-20">
                <HeroStat icon={HiOutlineBuildingOffice2} color="bg-green-50 text-green-600"
                  label="Trusted Companies"
                  value={publicStats ? `${publicStats.companies}+ Hiring` : "—"} />
              </div>
              <div className="absolute top-[73%] right-[8%] animate-float float-delay-2 z-20">
                <HeroStat icon={HiOutlineBriefcase} color="bg-blue-50 text-blue-600"
                  label="Jobs Posted"
                  value={publicStats ? `${publicStats.jobsThisMonth}+ This Month` : "—"} />
              </div>
            </>
          )}

          {/* SEARCH BAR — logged in only, bottom of hero, normal width like 4th pic */}
          {showLoggedInLayout && (
            <div className="absolute bottom-[14%] left-1/2 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2">
              <form onSubmit={handleSearch}
                className="flex flex-col md:flex-row items-stretch rounded-full bg-white shadow-lg p-1.5 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <div className="flex flex-1 items-center gap-2 px-5 py-3">
                  <HiOutlineMagnifyingGlass className="h-4 w-4 shrink-0 text-gray-400" />
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Job title, keyword or company"
                    className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none" />
                </div>
                <div className="flex flex-1 items-center px-1">
                  <CityAutocomplete value={city} onChange={setCity} />
                </div>
                <div className="flex items-center px-1">
                  <Dropdown value={category} onChange={setCategory} options={CATEGORY_OPTIONS}
                    fullWidth className="md:w-44"
                    buttonClassName="border-transparent hover:!border-transparent shadow-none" />
                </div>
                <div className="pt-1.5 md:pt-0 md:pl-1.5">
                  <button type="submit"
                    className="flex w-full items-center justify-center rounded-full bg-blue-600 px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 md:w-auto whitespace-nowrap">
                    Search Jobs
                  </button>
                </div>
              </form>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-black/90 text-xs" style={{ textShadow: "0 1px 3px rgba(0,0,0,.35)" }}>
                  Trending Searches:
                </span>
                {POPULAR_SEARCHES.map((s) => (
                  <button key={s}
                    onClick={() => navigate(`/find-jobs?title=${encodeURIComponent(s)}`)}
                    className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-white hover:text-blue-600 transition">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ══════════════════════════ PLATFORM STATS BAND (real) ══════════════════════════ */}
      <section className="bg-blue-600">
        <div className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { icon: HiOutlineUsers,        label: "Job Seekers", value: publicStats?.jobSeekers },
            { icon: HiOutlineBuildingOffice2, label: "Companies",   value: publicStats?.companies },
            { icon: HiOutlineDocumentText,  label: "Applications", value: publicStats?.applications },
            { icon: HiOutlineBriefcase,     label: "Jobs Posted",  value: publicStats?.jobsPosted },
          ].map((s) => (
            <Reveal key={s.label} className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white mb-3">
                <s.icon className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold text-white">{formatCount(s.value)}</p>
              <p className="text-sm text-blue-100 mt-1">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {!showLoggedInLayout && (
        <>
          {/* ══════════════════════════ CHOOSE THE PATH (guest) ══════════════════════════ */}
          <div id="choose-path" className="mx-auto max-w-7xl px-4 sm:px-6 pt-16">
            <Reveal className="text-center mb-10">
              <SectionEyebrow text="Start here" />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Choose the Path</h2>
              <p className="text-gray-500 text-sm mt-2">Two paths, two sets of steps — pick the one that fits and start in about a minute.</p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Reveal className="group relative pt-6">
                <div className="absolute top-0 left-1/2 lg:left-[calc(50%+120px)] -translate-x-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg ring-4 ring-white transition-transform duration-300 group-hover:scale-110">
                  <HiOutlineUserCircle className="h-6 w-6" />
                </div>
                <div className="relative rounded-3xl bg-blue-50 overflow-hidden flex flex-col lg:flex-row items-center transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                  <div className="h-80 w-full lg:w-64 shrink-0 overflow-hidden">
                    <img src={PATH_JOBSEEKER_IMAGE} alt="Job seeker working on a laptop" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="text-center sm:text-left p-8 pt-10">
                    <h3 className="text-lg font-bold text-gray-900">I'm Looking for a Job</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-4">Find jobs that match your skills and kickstart your career.</p>
                    <button
                      onClick={() => navigate("/login")}
                      className="group/btn inline-flex w-full sm:w-auto sm:min-w-[200px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 hover:shadow-md transition"
                    >
                      Sign Up as a Candidate <HiOutlineArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                  {/* Hover bar — grows outward from the center, matching the nav-link underline */}
                  <span className="absolute bottom-0 left-0 right-0 h-1 origin-center scale-x-0 bg-blue-600 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </div>
              </Reveal>

              <Reveal delay={120} className="group relative pt-6">
                <div className="absolute top-0 left-1/2 lg:left-[calc(50%-120px)] -translate-x-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg ring-4 ring-white transition-transform duration-300 group-hover:scale-110">
                  <HiOutlineLockClosed className="h-6 w-6" />
                </div>
                <div className="relative rounded-3xl bg-emerald-50 overflow-hidden flex flex-col lg:flex-row-reverse items-center transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                  <div className="h-80 w-full lg:w-64 shrink-0 overflow-hidden">
                    <img src={PATH_HIRE_IMAGE} alt="Employer hiring a candidate" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="text-center sm:text-left p-8 pt-10">
                    <h3 className="text-lg font-bold text-gray-900">I'm Looking to Hire</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-4">Post jobs, find candidates and build your dream team.</p>
                    <button
                      onClick={() => navigate("/login")}
                      className="group/btn inline-flex w-full sm:w-auto sm:min-w-[200px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700 hover:shadow-md transition"
                    >
                      Sign Up as HR <HiOutlineArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                  {/* Hover bar — grows outward from the center, matching the nav-link underline */}
                  <span className="absolute bottom-0 left-0 right-0 h-1 origin-center scale-x-0 bg-emerald-600 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </div>
              </Reveal>
            </div>
          </div>
        </>
      )}

      {!showLoggedInLayout && (
        <section id="how-it-works" className="bg-gray-50 py-24 mt-8 min-h-[520px] flex items-center scroll-mt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal className="text-center mb-10">
              <SectionEyebrow text="Simple Steps" />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How Tekky Job Works?</h2>
              <p className="text-gray-500 text-sm mt-2">Four simple steps stand between you and your next opportunity — start today.</p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16 relative">
              {HOW_IT_WORKS.map((step, i) => (
                <Reveal key={step.step} delay={i * 100} className="relative flex flex-col items-center text-center">
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-1/2 w-full border-t-2 border-dashed border-blue-200" />
                  )}
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4 cursor-default transition-all duration-300 hover:bg-blue-600 hover:text-white hover:scale-110 hover:shadow-lg hover:shadow-blue-200">
                    <step.icon className="h-7 w-7" />
                    <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-gray-50">
                      {step.step}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-1.5 max-w-[180px]">{step.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {showLoggedInLayout && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6">

          {/* ══════════════════════════ TOP CATEGORIES (real) ══════════════════════════ */}
          <div className="pt-16">
            <Reveal className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Top Categories</h2>
              <button
                onClick={handleFindJobs}
                className="group flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors duration-300 hover:text-blue-700"
              >
                View All Categories <HiOutlineArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Reveal>

            {topCategories.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                <HiOutlineSquares2X2 className="mx-auto mb-3 h-8 w-8 text-gray-200" />
                <p className="text-gray-400 text-sm">No categorized jobs yet.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                  {visibleCategories.map((cat) => {
                    const { icon: Icon, color } = categoryVisual(cat.name);
                    return (
                      <button
                        key={cat.name}
                        onClick={() => navigate(`/find-jobs?category=${encodeURIComponent(cat.name)}`)}
                        className="group relative overflow-hidden flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg text-center"
                      >
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-semibold text-gray-800 leading-snug">{cat.name}</p>
                        <p className="text-[11px] text-gray-400">{cat.count} Jobs</p>
                        <span className="absolute bottom-0 left-0 right-0 h-1 origin-center scale-x-0 bg-blue-600 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                      </button>
                    );
                  })}
                  <button
                    onClick={handleFindJobs}
                    className="group relative overflow-hidden flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg text-center"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-transform duration-300 group-hover:scale-110">
                      <HiOutlineSquares2X2 className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800">More Categories</p>
                    <span className="absolute bottom-0 left-0 right-0 h-1 origin-center scale-x-0 bg-blue-600 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                  </button>
                </div>

                {categorySlideCount > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-4">
                    <button onClick={prevCategorySlide} aria-label="Previous categories" className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:scale-110">
                      <HiOutlineChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: categorySlideCount }).map((_, i) => (
                        <button key={i} onClick={() => setCategorySlide(i)} aria-label={`Show categories page ${i + 1}`} className={`h-2 rounded-full transition-all ${i === categorySlide ? "w-6 bg-blue-600" : "w-2 bg-gray-300"}`} />
                      ))}
                    </div>
                    <button onClick={nextCategorySlide} aria-label="Next categories" className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:scale-110">
                      <HiOutlineChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ══════════════════════════ FEATURED JOBS (real) ══════════════════════════ */}
          <div className="pt-16">
            <Reveal className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Featured Job Opportunities</h2>
              <button onClick={handleFindJobs} className="group flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors duration-300 hover:text-blue-700">
                View All Jobs <HiOutlineArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Reveal>

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

            {!loading && jobs.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {visibleJobs.map((job) => {
                    const isSaved = savedIds.includes(job._id);
                    const color   = avatarColor(job.company || "");
                    const initial = (job.company || "C")[0].toUpperCase();

                    return (
                      <div
                        key={job._id}
                        onClick={() => navigate(`/jobs/${job._id}`)}
                        className="group relative overflow-hidden flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-blue-300 cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white ${color}`}>
                            {job.companyRef?.logo ? (
                              <img src={`${FILE_BASE}${job.companyRef.logo}`} alt={job.company} className="h-full w-full object-cover" />
                            ) : (
                              initial
                            )}
                          </div>
                          <button onClick={(e) => handleToggleSave(e, job._id)} className="shrink-0 text-gray-300 hover:text-blue-600 transition">
                            {isSaved ? <HiBookmark className="h-5 w-5 text-blue-600" /> : <HiOutlineBookmark className="h-5 w-5" />}
                          </button>
                        </div>

                        <p className="text-sm font-bold text-gray-900 leading-snug">{job.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{job.company}</p>

                        {job.city && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                            <HiOutlineMapPin className="h-3.5 w-3.5" />{formatCity(job.city)}
                          </span>
                        )}

                        {job.salary && <p className="text-sm font-bold text-gray-800 mt-2">{formatSalary(job.salary)}</p>}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                          {job.type ? (
                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 w-fit">{job.type}</span>
                          ) : <span />}
                          <span className="text-[11px] text-gray-300">{timeAgo(job.createdAt)}</span>
                        </div>
                        <span className="absolute bottom-0 left-0 right-0 h-1 origin-center scale-x-0 bg-blue-600 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                      </div>
                    );
                  })}
                </div>

                {jobSlideCount > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button onClick={prevJobSlide} aria-label="Previous jobs" className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:scale-110">
                      <HiOutlineChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: jobSlideCount }).map((_, i) => (
                        <button key={i} onClick={() => setJobSlide(i)} className={`h-2 rounded-full transition-all ${i === jobSlide ? "w-6 bg-blue-600" : "w-2 bg-gray-300"}`} />
                      ))}
                    </div>
                    <button onClick={nextJobSlide} aria-label="Next jobs" className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:scale-110">
                      <HiOutlineChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ══════════════════════════ TOP COMPANIES (real) ══════════════════════════ */}
          <div id="top-companies" className="pt-16 scroll-mt-20">
            <Reveal className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Top Companies Hiring</h2>
              <button onClick={() => navigate("/companies")} className="group flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors duration-300 hover:text-blue-700">
                View All Companies <HiOutlineArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Reveal>

            {companies.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                <HiOutlineUsers className="mx-auto mb-3 h-8 w-8 text-gray-200" />
                <p className="text-gray-400 text-sm">No active job postings yet.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {visibleCompanies.map((c) => {
                  const color = avatarColor(c.company || "");
                  const initial = (c.company || "C")[0].toUpperCase();
                  return (
                    <button
                      key={c.company}
                      onClick={() => navigate(`/companies/${encodeURIComponent(c.company)}`)}
                      className="group relative overflow-hidden flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg text-center"
                    >
                      <div className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl text-base font-bold text-white transition-transform duration-300 group-hover:scale-110 ${color}`}>
                        {c.logo ? <img src={`${FILE_BASE}${c.logo}`} alt={c.company} className="h-full w-full object-cover" /> : initial}
                      </div>
                      <p className="text-xs font-semibold text-gray-800 truncate w-full">{c.company}</p>
                      <p className="text-[11px] text-gray-400">{c.jobCount}+ Jobs</p>
                      <span className="absolute bottom-0 left-0 right-0 h-1 origin-center scale-x-0 bg-blue-600 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                    </button>
                  );
                  })}
                </div>

                {companySlideCount > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-4">
                    <button onClick={prevCompanySlide} aria-label="Previous companies" className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:scale-110">
                      <HiOutlineChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: companySlideCount }).map((_, i) => (
                        <button key={i} onClick={() => setCompanySlide(i)} aria-label={`Show companies page ${i + 1}`} className={`h-2 rounded-full transition-all ${i === companySlide ? "w-6 bg-blue-600" : "w-2 bg-gray-300"}`} />
                      ))}
                    </div>
                    <button onClick={nextCompanySlide} aria-label="Next companies" className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:scale-110">
                      <HiOutlineChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ══════════════════════════ CAREER RESOURCES (candidate) ══════════════════════════ */}
          <div id="career-resources" className="pt-16 pb-16 scroll-mt-20">
            <Reveal className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Career Resources</h2>
              <button
                onClick={() => alert("Career resources are coming soon.")}
                className="group flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors duration-300 hover:text-blue-700"
              >
                View All Articles <HiOutlineArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {visibleResources.map((r) => (
                <button
                  key={r.title}
                  onClick={() => alert("Career resources are coming soon.")}
                  className="group relative overflow-hidden text-left rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-blue-300"
                >
                  <div className={`relative h-32 bg-gradient-to-br ${r.gradient} flex items-center justify-center overflow-hidden`}>
                    <r.icon className="h-10 w-10 text-white/90 transition-transform duration-300 group-hover:scale-110" />
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-gray-800">{r.tag}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-bold text-gray-900 leading-snug">{r.title}</p>
                    <p className="mt-2 text-xs text-gray-400">{r.readTime}</p>
                  </div>
                  <span className="absolute bottom-0 left-0 right-0 h-1 origin-center scale-x-0 bg-blue-600 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </button>
              ))}
            </div>

            {resourceSlideCount > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <button onClick={prevResourceSlide} aria-label="Previous resources" className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:scale-110">
                  <HiOutlineChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: resourceSlideCount }).map((_, i) => (
                    <button key={i} onClick={() => setResourceSlide(i)} aria-label={`Show resources page ${i + 1}`} className={`h-2 rounded-full transition-all ${i === resourceSlide ? "w-6 bg-blue-600" : "w-2 bg-gray-300"}`} />
                  ))}
                </div>
                <button onClick={nextResourceSlide} aria-label="Next resources" className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:scale-110">
                  <HiOutlineChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════ NEWSLETTER ══════════════════════════ */}
      <section className={`bg-blue-600 px-6 py-8 ${!showLoggedInLayout ? "mt-16" : ""}`}>
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
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 md:w-72 rounded-xl px-4 py-2.5 text-sm outline-none"
            />
            <button
              type="submit" disabled={subStatus === "loading"}
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

      {/* ══════════════════════════ FOOTER ══════════════════════════ */}
      <Footer />

      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 ease-out hover:bg-blue-700 ${
          showScrollTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
        title="Back to top"
      >
        <HiOutlineArrowUp className="h-5 w-5" />
      </button>
    </main>
  );
}
