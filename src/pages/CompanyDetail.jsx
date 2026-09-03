import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  HiOutlineArrowLeft, HiOutlineMapPin, HiOutlineBriefcase,
  HiOutlineGlobeAlt, HiOutlineUsers, HiOutlineBuildingOffice2,
  HiOutlineBookmark, HiBookmark, HiOutlineDocumentText,
} from "react-icons/hi2";
import Navbar from "../components/Navbar";
import { getCompanyDetail } from "../services/jobService";
import { saveJob, unsaveJob, getSavedJobs } from "../services/savedJobService";
import { useAuth } from "../context/AuthContext";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const AVATAR_COLORS = [
  "bg-blue-600","bg-violet-600","bg-emerald-600",
  "bg-rose-600","bg-amber-600","bg-cyan-600","bg-indigo-600",
];

function avatarColor(name = "") {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function formatSalary(salary = "") {
  if (!salary) return "";
  return salary.replace(/\d{4,}/g, (n) => Number(n).toLocaleString("en-US"));
}

function timeAgo(date) {
  const h = Math.floor((Date.now() - new Date(date)) / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

export default function CompanyDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    setLoading(true);
    setError("");
    getCompanyDetail(name)
      .then(setData)
      .catch(() => setError("Could not load this company's details."))
      .finally(() => setLoading(false));

    if (isLoggedIn) {
      getSavedJobs()
        .then((s) => setSavedIds(s.map((sj) => sj.job?._id).filter(Boolean)))
        .catch(() => {});
    }
  }, [name, isLoggedIn]);

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

  const companyName = data?.company?.name || name;
  const initial = (companyName || "C")[0].toUpperCase();
  const color = avatarColor(companyName || "");

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition mb-5"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Company header card */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                {data.company?.logo ? (
                  <img
                    src={`${FILE_BASE}${data.company.logo}`}
                    alt={companyName}
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover border border-gray-100"
                  />
                ) : (
                  <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white ${color}`}>
                    {initial}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>

                  {data.company ? (
                    <>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                        {data.company.industry && (
                          <span className="flex items-center gap-1">
                            <HiOutlineBuildingOffice2 className="h-4 w-4" />
                            {data.company.industry}
                          </span>
                        )}
                        {data.company.location && (
                          <span className="flex items-center gap-1">
                            <HiOutlineMapPin className="h-4 w-4" />
                            {data.company.location}
                          </span>
                        )}
                        {data.company.size && (
                          <span className="flex items-center gap-1">
                            <HiOutlineUsers className="h-4 w-4" />
                            {data.company.size} employees
                          </span>
                        )}
                        {data.company.website && (
                          <a
                            href={data.company.website.startsWith("http") ? data.company.website : `https://${data.company.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                          >
                            <HiOutlineGlobeAlt className="h-4 w-4" />
                            Website
                          </a>
                        )}
                      </div>

                      {data.company.description && (
                        <p className="mt-4 text-sm text-gray-600 leading-relaxed">{data.company.description}</p>
                      )}
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-gray-400">No records — this company hasn't added their profile details yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Jobs from this company */}
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Open Positions {data.jobs?.length > 0 && `(${data.jobs.length})`}
            </h2>

            {data.jobs?.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                <HiOutlineBriefcase className="mx-auto mb-3 h-9 w-9 text-gray-200" />
                <p className="text-gray-400 text-sm">No active job postings from this company right now.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-100 overflow-hidden">
                {data.jobs?.map((job) => {
                  const isSaved = savedIds.includes(job._id);
                  return (
                    <div
                      key={job._id}
                      onClick={() => navigate(`/jobs/${job._id}`)}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{job.title}</p>
                        {job.city && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <HiOutlineMapPin className="h-3.5 w-3.5" />{job.city}
                          </span>
                        )}
                      </div>

                      {job.salary && (
                        <span className="text-sm font-bold text-gray-800 shrink-0 sm:w-44">{formatSalary(job.salary)}</span>
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
            )}
          </>
        )}
      </div>
    </main>
  );
}
