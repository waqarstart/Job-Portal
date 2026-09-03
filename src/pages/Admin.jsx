import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  searchJobs,
  createJob,
  deleteJob,
} from "../services/jobService";
import {
  getAllApplications,
  submitManualRating,
} from "../services/applicationService";

// Strip the trailing /api so we can build absolute links to uploaded files
const FILE_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/api$/, "");

const emptyForm = {
  title: "",
  company: "",
  city: "",
  description: "",
  salary: "",
  type: "Full Time",
};

export default function Admin() {
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  // Manual interview rating
  const [ratingInputs, setRatingInputs] = useState({});
  const [savingRating, setSavingRating] = useState(null);

  async function loadJobs() {
    setJobs(await searchJobs());
  }

  async function loadApplications() {
    setApplications(await getAllApplications());
  }

  useEffect(() => {
    loadJobs();
    loadApplications();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();

    setError("");
    setPosting(true);

    try {
      await createJob(form);

      setForm(emptyForm);

      await loadJobs();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not post job."
      );
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this job?")) return;

    await deleteJob(id);

    loadJobs();
  }

  async function handleSaveRating(applicationId) {
    const value = ratingInputs[applicationId];

    if (!value) return;

    try {
      setSavingRating(applicationId);

      await submitManualRating(applicationId, {
        rating: Number(value),
      });

      await loadApplications();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Could not save rating."
      );
    } finally {
      setSavingRating(null);
    }
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">
          Admin Dashboard
        </h1>

        {/* Tabs */}
        <div className="mt-6 flex gap-6 border-b">
          <button
            onClick={() => setTab("jobs")}
            className={`pb-3 ${
              tab === "jobs"
                ? "border-b-2 border-blue-600 font-semibold text-blue-600"
                : "text-gray-500"
            }`}
          >
            Jobs
          </button>

          <button
            onClick={() => setTab("applications")}
            className={`pb-3 ${
              tab === "applications"
                ? "border-b-2 border-blue-600 font-semibold text-blue-600"
                : "text-gray-500"
            }`}
          >
            Applications &amp; CVs ({applications.length})
          </button>
        </div>

        {/* ========================= */}
        {/* JOBS TAB */}
        {/* ========================= */}

        {tab === "jobs" && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            {/* Create Job */}
            <form
              onSubmit={handleCreate}
              className="space-y-3 rounded-xl border bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">
                Post a new job
              </h2>

              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <input
                required
                placeholder="Job title"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-600"
              />

              <input
                required
                placeholder="Company"
                value={form.company}
                onChange={(e) =>
                  setForm({
                    ...form,
                    company: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-600"
              />

              <input
                required
                placeholder="City"
                value={form.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    city: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-600"
              />

              <input
                placeholder="Salary (optional)"
                value={form.salary}
                onChange={(e) =>
                  setForm({
                    ...form,
                    salary: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-600"
              />

              <select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-600"
              >
                <option>Full Time</option>
                <option>Part Time</option>
                <option>Internship</option>
                <option>Contract</option>
                <option>Freelance</option>
              </select>

              <textarea
                required
                rows={4}
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-600"
              />

              <button
                type="submit"
                disabled={posting}
                className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {posting
                  ? "Posting..."
                  : "Post Job"}
              </button>
            </form>

            {/* Job List */}
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm"
                >
                  <div>
                    <h3 className="font-semibold">
                      {job.title}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {job.company} • {job.city} •{" "}
                      {job.type}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      handleDelete(job._id)
                    }
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              ))}

              {jobs.length === 0 && (
                <p className="text-gray-500">
                  No jobs posted yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ========================= */}
        {/* APPLICATIONS TAB */}
        {/* ========================= */}

        {tab === "applications" && (
          <div className="mt-8 space-y-4">
            {applications.map((app) => (
              <div
                key={app._id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {app.job?.title}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {app.user?.name} •{" "}
                      {app.user?.email}
                    </p>

                    <p className="text-xs text-gray-400">
                      Applied{" "}
                      {new Date(
                        app.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {/* Interview Rating */}
                    {typeof app.interviewRating ===
                      "number" && (
                      <span className="rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700">
                        Interview:{" "}
                        {app.interviewRating}/10
                      </span>
                    )}

                    {/* View CV */}
                    <a
                      href={`${FILE_BASE}${app.cvUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      View CV
                    </a>
                  </div>
                </div>

                {/* ========================= */}
                {/* AI CV EVALUATION */}
                {/* ========================= */}

                <div className="mt-4 rounded-xl border bg-blue-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        AI CV Evaluation
                      </h4>

                      <p className="text-xs text-gray-500">
                        Automatically evaluated against
                        the job description
                      </p>
                    </div>

                    {typeof app.cvRating ===
                    "number" ? (
                      <div className={`rounded-full px-4 py-2 text-lg font-bold text-white ${
                        app.cvRating >= 50 ? "bg-green-600" : "bg-red-600"
                      }`}>
                        {app.cvRating}/100
                      </div>
                    ) : (
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          app.cvEvaluationStatus ===
                          "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {app.cvEvaluationStatus ===
                        "failed"
                          ? "Evaluation failed"
                          : "Evaluation pending"}
                      </span>
                    )}
                  </div>

                  {/* AI Summary */}
                  {app.cvMatchSummary && (
                    <div className="mt-4 rounded-lg bg-white p-3">
                      <p className="text-sm leading-6 text-gray-600">
                        {app.cvMatchSummary}
                      </p>
                    </div>
                  )}

                  {/* Matched Skills */}
                  {app.cvMatchedSkills?.length >
                    0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Matched Skills
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {app.cvMatchedSkills.map(
                          (skill, index) => (
                            <span
                              key={index}
                              className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                            >
                              ✓ {skill}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {app.cvMissingSkills?.length >
                    0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Missing Skills
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {app.cvMissingSkills.map(
                          (skill, index) => (
                            <span
                              key={index}
                              className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                            >
                              • {skill}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ========================= */}
                {/* INTERVIEW SUMMARY */}
                {/* ========================= */}

                {app.interviewSummary && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    <strong>
                      Interview summary:
                    </strong>{" "}
                    {app.interviewSummary}
                  </div>
                )}

                {/* ========================= */}
                {/* MANUAL INTERVIEW RATING */}
                {/* ========================= */}

                {typeof app.interviewRating !==
                  "number" && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                    <span className="text-xs text-gray-400">
                      No interview rating yet —
                      enter manually:
                    </span>

                    <input
                      type="number"
                      min="1"
                      max="10"
                      placeholder="1-10"
                      value={
                        ratingInputs[app._id] ||
                        ""
                      }
                      onChange={(e) =>
                        setRatingInputs({
                          ...ratingInputs,
                          [app._id]:
                            e.target.value,
                        })
                      }
                      className="w-20 rounded-lg border px-2 py-1 text-sm"
                    />

                    <button
                      onClick={() =>
                        handleSaveRating(
                          app._id
                        )
                      }
                      disabled={
                        savingRating ===
                        app._id
                      }
                      className="rounded-lg bg-gray-800 px-3 py-1 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-60"
                    >
                      {savingRating === app._id
                        ? "Saving..."
                        : "Save"}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {applications.length === 0 && (
              <p className="text-gray-500">
                No applications yet.
              </p>
            )}
          </div>
        )}
      </main>
    </>
  );
}