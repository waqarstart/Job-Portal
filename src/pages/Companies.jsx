import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineMagnifyingGlass, HiOutlineMapPin, HiOutlineUsers,
  HiOutlineBriefcase, HiOutlineBuildingOffice2, HiOutlineChevronLeft,
  HiOutlineChevronRight, HiOutlineListBullet, HiOutlineSquares2X2,
} from "react-icons/hi2";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Dropdown from "../components/Dropdown";
import Reveal from "../components/Reveal";
import { getAllCompanies, getCompanyIndustries, getPublicStats } from "../services/jobService";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const SIZE_OPTIONS = [
  { value: "",        label: "All Company Sizes" },
  { value: "1-10",    label: "1-10 employees" },
  { value: "11-50",   label: "11-50 employees" },
  { value: "51-200",  label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+",    label: "500+ employees" },
];

const SORT_OPTIONS = [
  { value: "popular", label: "Sort By: Popular" },
  { value: "az",       label: "Sort By: Name (A-Z)" },
];

const AVATAR_COLORS = [
  "bg-blue-600", "bg-violet-600", "bg-emerald-600",
  "bg-rose-600", "bg-amber-600", "bg-cyan-600", "bg-indigo-600",
];

function avatarColor(name = "") {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

export default function Companies() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);

  const [industries, setIndustries] = useState([]);
  const [stats, setStats] = useState(null);
  const [data, setData] = useState({ companies: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState("grid");     // "grid" | "list"
  const [fading, setFading] = useState(false);   // true while crossfading between views

  function changeView(next) {
    if (next === view) return;
    setFading(true);
    setTimeout(() => {
      setView(next);
      setFading(false);
    }, 180);
  }

  // Debounce the free-text search box before it hits the API.
  useEffect(() => {
    const t = setTimeout(() => { setQ(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    getCompanyIndustries().then(setIndustries).catch(() => setIndustries([]));
    getPublicStats().then(setStats).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    setLoading(true);
    getAllCompanies({ q, industry, size, sort, page, limit: 12 })
      .then(setData)
      .catch(() => setData({ companies: [], total: 0, totalPages: 1 }))
      .finally(() => setLoading(false));
  }, [q, industry, size, sort, page]);

  const industryOptions = [
    { value: "", label: "All Industries" },
    ...industries.map((i) => ({ value: i, label: i })),
  ];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <section className="relative overflow-hidden border-b border-gray-100 min-h-[360px] sm:min-h-[440px] flex items-center">
        <div className="absolute inset-0">
          <img
            src="/images/companies-hero.png"
            alt=""
            className="h-full w-full object-cover object-right"
            loading="eager"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-14 w-full">
          <Reveal>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              Explore Top <span className="text-blue-600">Companies</span>
            </h1>
            <p className="mt-4 max-w-2xl text-gray-500 text-[15px] leading-6">
              Discover top companies hiring right now and explore opportunities that match your skills and goals.
            </p>
          </Reveal>

          <Reveal delay={100} className="mt-8 flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <HiOutlineBuildingOffice2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats ? `${stats.companies}+` : "—"}</p>
                <p className="text-xs text-gray-400">Companies</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <HiOutlineBriefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats ? `${stats.jobsPosted}+` : "—"}</p>
                <p className="text-xs text-gray-400">Active Jobs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <HiOutlineUsers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats ? `${stats.jobSeekers}+` : "—"}</p>
                <p className="text-xs text-gray-400">Hired Candidates</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════ FILTER BAR ══════════════════════════ */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search companies by name, industry or keyword..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Dropdown value={industry} onChange={(v) => { setIndustry(v); setPage(1); }} options={industryOptions} />
            <Dropdown value={size} onChange={(v) => { setSize(v); setPage(1); }} options={SIZE_OPTIONS} />
            <Dropdown value={sort} onChange={(v) => { setSort(v); setPage(1); }} options={SORT_OPTIONS} />

            {/* List / Grid view toggle — smoothly cross-fades the results below
                instead of snapping instantly (see changeView). */}
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => changeView("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
                className={`flex h-[34px] w-[34px] items-center justify-center rounded-lg transition-all duration-300 ${
                  view === "list" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-white hover:text-gray-700"
                }`}
              >
                <HiOutlineListBullet className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => changeView("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                className={`flex h-[34px] w-[34px] items-center justify-center rounded-lg transition-all duration-300 ${
                  view === "grid" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-white hover:text-gray-700"
                }`}
              >
                <HiOutlineSquares2X2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ COMPANY GRID ══════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : data.companies.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-14 text-center shadow-sm">
            <HiOutlineBuildingOffice2 className="mx-auto mb-3 h-9 w-9 text-gray-200" />
            <p className="text-gray-400 text-sm">No companies match your search.</p>
          </div>
        ) : (
          <div
            className={`transition-opacity duration-200 ease-out ${fading ? "opacity-0" : "opacity-100"} ${
              view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "flex flex-col gap-4"
            }`}
          >
            {data.companies.map((c) => {
              const color = avatarColor(c.name || "");
              const initial = (c.name || "C")[0].toUpperCase();

              // ── List row ──
              if (view === "list") {
                return (
                  <div
                    key={c._id || c.name}
                    className="group relative overflow-hidden flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200"
                  >
                    {c.logo ? (
                      <img src={`${FILE_BASE}${c.logo}`} alt={c.name} className="h-14 w-14 shrink-0 rounded-xl object-cover border border-gray-100" />
                    ) : (
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white ${color}`}>
                        {initial}
                      </div>
                    )}

                    <div className="min-w-0 w-full sm:w-56 shrink-0">
                      <p className="font-bold text-gray-900 truncate">{c.name}</p>
                      {c.industry && <p className="text-xs text-gray-400 truncate">{c.industry}</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
                        {c.location && (
                          <span className="flex items-center gap-1"><HiOutlineMapPin className="h-3.5 w-3.5" />{c.location}</span>
                        )}
                        {c.size && (
                          <span className="flex items-center gap-1"><HiOutlineUsers className="h-3.5 w-3.5" />{c.size} employees</span>
                        )}
                      </div>
                    </div>

                    <p className="flex-1 min-w-0 text-sm text-gray-500 leading-relaxed line-clamp-2 sm:line-clamp-1">
                      {c.description || "This company hasn't added a description yet."}
                    </p>

                    <div className="flex shrink-0 items-center gap-4 sm:pl-4 sm:border-l sm:border-gray-50">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 whitespace-nowrap">
                        <HiOutlineBriefcase className="h-4 w-4" />
                        {c.jobCount}+ Jobs
                      </span>
                      <button
                        onClick={() => navigate(`/companies/${encodeURIComponent(c.name)}`)}
                        className="whitespace-nowrap rounded-lg border border-blue-200 px-3.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                      >
                        View Company
                      </button>
                    </div>
                    <span className="absolute bottom-0 left-0 right-0 h-1 origin-center scale-x-0 bg-blue-600 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                  </div>
                );
              }

              // ── Grid card ──
              return (
                <div
                  key={c._id || c.name}
                  className="group relative overflow-hidden flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200"
                >
                  <div className="flex items-start gap-3">
                    {c.logo ? (
                      <img src={`${FILE_BASE}${c.logo}`} alt={c.name} className="h-12 w-12 shrink-0 rounded-xl object-cover border border-gray-100" />
                    ) : (
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white ${color}`}>
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{c.name}</p>
                      {c.industry && <p className="text-xs text-gray-400 truncate">{c.industry}</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
                        {c.location && (
                          <span className="flex items-center gap-1"><HiOutlineMapPin className="h-3.5 w-3.5" />{c.location}</span>
                        )}
                        {c.size && (
                          <span className="flex items-center gap-1"><HiOutlineUsers className="h-3.5 w-3.5" />{c.size} employees</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-2 flex-1">
                    {c.description || "This company hasn't added a description yet."}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
                      <HiOutlineBriefcase className="h-4 w-4" />
                      {c.jobCount}+ Jobs Open
                    </span>
                    <button
                      onClick={() => navigate(`/companies/${encodeURIComponent(c.name)}`)}
                      className="rounded-lg border border-blue-200 px-3.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                      View Company
                    </button>
                  </div>
                  <span className="absolute bottom-0 left-0 right-0 h-1 origin-center scale-x-0 bg-blue-600 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && data.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <HiOutlineChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium ${
                  p === page ? "bg-blue-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <HiOutlineChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
