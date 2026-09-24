import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineUserPlus, HiOutlineMagnifyingGlass,
  HiOutlinePaperAirplane, HiOutlineTrophy,
  HiOutlineArrowRight, HiOutlineBriefcase,
  HiOutlineDocumentText, HiOutlineChartBar,
  HiOutlineShieldCheck, HiOutlineLightBulb,
  HiOutlineBuildingOffice2, HiOutlineRocketLaunch,
  HiOutlineEnvelope, HiOutlineChatBubbleBottomCenterText, HiOutlineMapPin, HiOutlineArrowUp,
} from "react-icons/hi2";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import Navbar from "../components/Navbar";

const HERO_GUEST_IMAGE = "/images/hero-guest.jpg";

const STEPS_CANDIDATE = [
  { step: "01", title: "Create Your Profile",    desc: "Sign up in seconds and build a profile that highlights your skills, experience, and goals.",  icon: HiOutlineUserPlus },
  { step: "02", title: "Explore Opportunities",  desc: "Browse thousands of jobs filtered by role, city, and category — tailored just for you.",        icon: HiOutlineMagnifyingGlass },
  { step: "03", title: "Apply with One Click",   desc: "Submit your application instantly with your saved CV. No long forms, no hassle.",                icon: HiOutlinePaperAirplane },
  { step: "04", title: "Get Hired",              desc: "Connect with top employers, ace your interview, and land your dream job.",                        icon: HiOutlineTrophy },
];

const STEPS_HR = [
  { step: "01", title: "Register Your Company",  desc: "Set up your company profile and get verified on Tekky Job in minutes.",                          icon: HiOutlineBuildingOffice2 },
  { step: "02", title: "Post a Job",             desc: "Create detailed job listings with salary, requirements, and type — reach the right candidates.",   icon: HiOutlineDocumentText },
  { step: "03", title: "Review Applications",    desc: "Browse applicants, check CVs, and shortlist the best talent with our AI-powered ranking.",         icon: HiOutlineChartBar },
  { step: "04", title: "Hire the Best",          desc: "Schedule interviews, send offers, and grow your team with confidence.",                            icon: HiOutlineRocketLaunch },
];

const FEATURES = [
  { icon: HiOutlineShieldCheck,  title: "Verified Listings",   desc: "Every job is reviewed before going live so you only see real opportunities." },
  { icon: HiOutlineLightBulb,    title: "Smart Matching",       desc: "Our system matches your skills to the right jobs automatically." },
  { icon: HiOutlineBriefcase,    title: "CV Builder",           desc: "Upload or build your CV right inside the platform — no extra tools needed." },
  { icon: HiOutlineChartBar,     title: "Track Applications",   desc: "Monitor every application in real time from one clean dashboard." },
];

export default function HowItWorks() {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > window.innerHeight);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar overlay />
      {/* ── HERO ── full screen height */}
      <section className="relative min-h-screen flex items-center" style={{ clipPath: "inset(0)" }}>
        {/* Background image — same as logout homepage */}
        <div className="absolute inset-0">
          <img src={HERO_GUEST_IMAGE} alt="" className="h-full w-full object-cover object-[center_25%]" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent" />
        </div>

        {/* Content — left side */}
        <div className="relative z-10 mx-auto max-w-7xl w-full px-8 lg:px-16 pt-24 pb-16">
          <div className="max-w-[480px]">
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              How does{" "}
              <span className="text-blue-600">Tekky Job</span>{" "}
              work?
            </h1>

            <div className="mt-5 inline-block rounded-2xl bg-white/85 backdrop-blur-sm px-5 py-4 shadow-sm max-w-[360px]">
              <p className="text-gray-700 text-sm leading-relaxed">
                A simple and smart platform that connects the right talent with the right opportunities.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="rounded-xl bg-white/90 px-7 py-3 text-sm font-semibold text-gray-800 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg transition-all duration-200"
              >
                Login
              </button>
              <button
                onClick={() => { navigate("/"); setTimeout(() => document.getElementById("choose-path")?.scrollIntoView({ behavior: "smooth" }), 300); }}
                className="rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── STEPS: FOR CANDIDATES ── */}
      <section id="how-it-works-steps" className="flex min-h-screen items-center bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <div className="flex flex-col items-center gap-2 mb-3">
              <span className="inline-block h-6 w-[3px] rounded-full bg-blue-600" />
              
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">For Candidates</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Candidate Journey </h2>
            <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">
              Four simple steps stand between you and your next opportunity — start today.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-20 relative">
            {STEPS_CANDIDATE.map((step, i) => (
              <div key={step.step} className="group relative flex min-h-[230px] flex-col items-center overflow-hidden rounded-2xl border border-blue-100 bg-white px-4 py-6 text-center transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-lg">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-200">
                  <step.icon className="h-7 w-7" />
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white">
                    {step.step}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500 mt-1.5 max-w-[180px]">{step.desc}</p>
                {/* Hover bar — grows outward from the center, matching the Choose-the-Path cards */}
                <span className="absolute bottom-0 left-0 right-0 h-1 origin-center scale-x-0 bg-blue-600 transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STEPS: FOR HR ── */}
      <section className="flex min-h-screen items-center bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <div className="flex flex-col items-center gap-2 mb-3">
              <span className="inline-block h-6 w-[3px] rounded-full bg-emerald-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">For HR</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">HR Journey </h2>
            <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">
              Post jobs, manage applications, and build your dream team — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-20 relative">
            {STEPS_HR.map((step, i) => (
              <div key={step.step} className="group relative flex min-h-[230px] flex-col items-center overflow-hidden rounded-2xl border border-emerald-100 bg-gray-50 px-4 py-6 text-center transition-all duration-300 ease-out hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-lg">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4 transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-200">
                  <step.icon className="h-7 w-7" />
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white ring-2 ring-white">
                    {step.step}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500 mt-1.5 max-w-[180px]">{step.desc}</p>
                {/* Hover bar — grows outward from the center, matching the Choose-the-Path cards */}
                <span className="absolute bottom-0 left-0 right-0 h-1 origin-center scale-x-0 bg-emerald-600 transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="flex min-h-screen items-center bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <div className="flex flex-col items-center gap-2 mb-3">
              <span className="inline-block h-6 w-[3px] rounded-full bg-blue-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Why Tekky Job</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Everything You Need, All in One Place</h2>
            <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">
              We make hiring and job searching simple, secure and effective for everyone.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-lg">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-200">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                {/* Hover bar — grows outward from the center, matching the Choose-the-Path cards */}
                <span className="absolute bottom-0 left-0 right-0 h-1 origin-center scale-x-0 bg-blue-600 transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-blue-600 py-6">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to Get Started?</h2>
          <p className="text-blue-100 text-sm mb-8">Join thousands of professionals already growing their careers on Tekky Job.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button onClick={() => navigate("/register")}
              className="rounded-xl bg-white px-8 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 transition">
              Create Free Account
            </button>
            <button onClick={() => navigate("/find-jobs")}
              className="rounded-xl border border-white/40 px-8 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
              Browse Jobs
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-[#0b1526] px-6 pt-12 pb-6 text-gray-300">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <img src="/images/tekky-icon.png" alt="Tekky Job" className="h-9 w-9 object-contain" />
              <span className="text-lg font-bold text-white">Tekky Job</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Your trusted partner in finding the perfect job. Explore opportunities, connect with top companies, and build your future.
            </p>
            <div className="mt-4 flex items-center gap-3">
              {[FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram].map((Icon, i) => (
                <a key={i} href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-300 transition-all duration-300 hover:scale-110 hover:bg-blue-600 hover:text-white">
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 font-semibold text-white">For Job Seekers</p>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate("/find-jobs")} className="transition-all duration-300 hover:translate-x-1 hover:text-white">Browse Jobs</button></li>
              <li><button onClick={() => navigate("/find-jobs")} className="transition-all duration-300 hover:translate-x-1 hover:text-white">Advanced Search</button></li>
              <li><button onClick={() => navigate("/")} className="transition-all duration-300 hover:translate-x-1 hover:text-white">Career Advice</button></li>
              <li><button onClick={() => navigate("/register")} className="transition-all duration-300 hover:translate-x-1 hover:text-white">Create Profile</button></li>
              <li><button onClick={() => navigate("/register")} className="transition-all duration-300 hover:translate-x-1 hover:text-white">Job Alerts</button></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 font-semibold text-white">For Employers</p>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate("/login")} className="transition-all duration-300 hover:translate-x-1 hover:text-white">Post a Job</button></li>
              <li><button onClick={() => navigate("/login")} className="transition-all duration-300 hover:translate-x-1 hover:text-white">Browse Candidates</button></li>
              <li><button onClick={() => alert("Pricing plans are coming soon.")} className="transition-all duration-300 hover:translate-x-1 hover:text-white">Pricing Plans</button></li>
              <li><button onClick={() => navigate("/login")} className="transition-all duration-300 hover:translate-x-1 hover:text-white">Employer Login</button></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 font-semibold text-white">Company</p>
            <ul className="space-y-2 text-sm">
              {['About Us', 'Contact Us', 'Terms of Service', 'Privacy Policy', 'Help Center'].map((label) => (
                <li key={label}><a href="#" className="inline-block transition-all duration-300 hover:translate-x-1 hover:text-white">{label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 font-semibold text-white">Contact Us</p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><HiOutlineEnvelope className="h-4 w-4 shrink-0" /> support@tekkyjob.com</li>
              <li className="flex items-center gap-2"><HiOutlineChatBubbleBottomCenterText className="h-4 w-4 shrink-0" /> +92 300 1234567</li>
              <li className="flex items-start gap-2"><HiOutlineMapPin className="mt-0.5 h-4 w-4 shrink-0" /> 123 Business Avenue, Lahore, Pakistan</li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Tekky Job. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="transition-all duration-300 hover:translate-x-1 hover:text-white">Privacy Policy</a>
            <a href="#" className="transition-all duration-300 hover:translate-x-1 hover:text-white">Terms of Service</a>
            <a href="#" className="transition-all duration-300 hover:translate-x-1 hover:text-white">Sitemap</a>
          </div>
        </div>
      </footer>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 ease-out hover:bg-blue-700 ${
          showScrollTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
        title="Back to top"
      >
        <HiOutlineArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}
