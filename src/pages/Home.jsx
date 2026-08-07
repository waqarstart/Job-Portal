import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
} from "react-icons/hi2";

import Navbar from "../components/Navbar";
import { searchJobs } from "../services/jobService";
import { applyToJob } from "../services/applicationService";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [applyJob, setApplyJob] = useState(null); // job currently in the apply modal
  const [cvFile, setCvFile] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [appliedIds, setAppliedIds] = useState([]);

  async function loadJobs(e) {
    e?.preventDefault();

    try {
      setLoading(true);
      const data = await searchJobs(title, city);
      setJobs(data);
    } catch (err) {
      console.error(err);
      alert("Unable to fetch jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clicking a job (card or button) — not logged in? straight to login,
  // and bring them back here afterward. Logged in? open the apply modal.
  function handleJobClick(job) {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/" } });
      return;
    }
    setApplyJob(job);
    setCvFile(null);
    setApplyError("");
  }

  async function handleApplySubmit(e) {
    e.preventDefault();
    if (!cvFile) {
      setApplyError("Please attach your CV (PDF, DOC or DOCX).");
      return;
    }

    try {
      setApplying(true);
      setApplyError("");

      const application = await applyToJob(applyJob._id, cvFile);
      setAppliedIds((prev) => [...prev, applyJob._id]);

      const job = applyJob;
      setApplyJob(null);

      // Straight into the interview, carrying the application id so the
      // HeyGen webhook can later attach the rating/summary to it.
      navigate(`/interview/${job._id}`, {
        state: { job, applicationId: application._id },
      });
    } catch (err) {
      setApplyError(err.response?.data?.message || "Could not submit application.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-blue-600">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h1 className="text-center text-5xl font-bold text-white">
            Find Your Next Job
          </h1>

          <p className="mt-4 text-center text-lg text-blue-100">
            Search jobs by title and city.
          </p>

          <form
            onSubmit={loadJobs}
            className="mx-auto mt-10 grid max-w-5xl gap-4 rounded-2xl bg-white p-4 shadow-xl md:grid-cols-[1fr_1fr_auto]"
          >
            <div className="flex items-center rounded-xl border px-4">
              <HiOutlineMagnifyingGlass className="mr-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Job title"
                className="h-14 w-full outline-none"
              />
            </div>

            <div className="flex items-center rounded-xl border px-4">
              <HiOutlineMapPin className="mr-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="h-14 w-full outline-none"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-8 font-semibold text-white transition hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-8 text-3xl font-bold">Available Jobs</h2>

        {loading && (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            Loading jobs...
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            No jobs found. Try a different search, or check back soon.
          </div>
        )}

        <div className="space-y-5">
          {jobs.map((job) => (
            <button
              key={job._id}
              onClick={() => handleJobClick(job)}
              disabled={appliedIds.includes(job._id)}
              className="w-full rounded-xl border bg-white p-6 text-left shadow-sm transition duration-200 hover:border-blue-600 hover:shadow-lg disabled:cursor-default disabled:opacity-60"
            >
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-semibold">{job.title}</h3>
                  <p className="mt-2 text-gray-600">
                    {job.company} • 📍 {job.city} • {job.type}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <span className="shrink-0 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white">
                  {appliedIds.includes(job._id) ? "Applied ✓" : "Apply Now →"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Apply modal */}
      {applyJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold">Apply to {applyJob.title}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {applyJob.company} • {applyJob.city}
            </p>
            <p className="mt-3 text-sm text-gray-500">
              After you submit your CV, you'll go straight into a short AI
              interview for this role.
            </p>

            <form onSubmit={handleApplySubmit} className="mt-6 space-y-4">
              {applyError && (
                <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                  {applyError}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Upload your CV (PDF, DOC, DOCX — max 5MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCvFile(e.target.files[0])}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setApplyJob(null)}
                  className="flex-1 rounded-lg border py-2.5 font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={applying}
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
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
