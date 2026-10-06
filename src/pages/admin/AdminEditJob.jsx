import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineXMark, HiOutlineArrowLeft } from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";
import Dropdown from "../../components/Dropdown";
import CityAutocomplete from "../../components/CityAutocomplete";
import { getAdminJobs, updateAdminJob } from "../../services/adminService";

const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));
const JOB_TYPES  = toOptions(["Full Time", "Part Time", "Internship", "Contract", "Freelance"]);
const WORK_MODES = toOptions(["On-site", "Remote", "Hybrid"]);
const EXP_LEVELS = toOptions(["Entry Level", "1 - 2 Years", "3 - 5 Years", "5 - 8 Years", "8+ Years"]);
const CATEGORIES = toOptions(["Sales", "Marketing", "IT & Software", "Customer Support", "Finance", "Design", "HR & Admin", "Data Science"]);
const STATUSES   = toOptions(["active", "pending", "closed"]);

const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function SkillsInput({ value, onChange }) {
  const [text, setText] = useState("");
  function addSkill() {
    const v = text.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setText("");
  }
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          className={inputCls}
          placeholder="e.g. React, Node.js"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); } }}
        />
        <button type="button" onClick={addSkill}
          className="shrink-0 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((s) => (
            <span key={s} className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {s}
              <button type="button" onClick={() => onChange(value.filter((v) => v !== s))}>
                <HiOutlineXMark className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminEditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminJobs()
      .then((jobs) => {
        const job = jobs.find((j) => j._id === id);
        if (!job) { setError("Job not found."); return; }
        setForm({
          title: job.title || "",
          company: job.company || "",
          city: job.city || "",
          type: job.type || "Full Time",
          workMode: job.workMode || "On-site",
          experienceLevel: job.experienceLevel || "1 - 2 Years",
          category: job.category || CATEGORIES[0].value,
          status: job.status || "active",
          salary: job.salary || "",
          deadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().slice(0, 10) : "",
          description: job.description || "",
          aboutRole: job.aboutRole || String(job.description || "").split(/\n\n+/)[0] || "",
          responsibilities: job.responsibilities || String(job.description || "").split(/\n\n+/)[1] || "",
          requirements: job.requirements || String(job.description || "").split(/\n\n+/)[2] || "",
          skills: Array.isArray(job.skills) ? job.skills : [],
          interviewQuestions: Array.isArray(job.interviewQuestions) && job.interviewQuestions.length ? job.interviewQuestions : [""],
        });
      })
      .catch(() => setError("Could not load this job."))
      .finally(() => setLoading(false));
  }, [id]);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function addQ() { if (form.interviewQuestions.length < 20) set("interviewQuestions", [...form.interviewQuestions, ""]); }
  function updateQ(i, v) { set("interviewQuestions", form.interviewQuestions.map((q, idx) => (idx === i ? v : q))); }
  function removeQ(i) { if (form.interviewQuestions.length > 1) set("interviewQuestions", form.interviewQuestions.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.title || !form.company || !form.city || !form.aboutRole) {
      setError("Title, company, city and description are required.");
      return;
    }
    const payload = {
      title: form.title,
      company: form.company,
      city: form.city,
      type: form.type,
      workMode: form.workMode,
      experienceLevel: form.experienceLevel,
      category: form.category,
      status: form.status,
      salary: form.salary,
      skills: form.skills,
      description: [form.aboutRole, form.responsibilities, form.requirements].filter(Boolean).join("\n\n"),
      aboutRole: form.aboutRole,
      responsibilities: form.responsibilities,
      requirements: form.requirements,
      applicationDeadline: form.deadline || undefined,
      interviewQuestions: form.interviewQuestions.filter((q) => q.trim()),
    };
    setSaving(true);
    try {
      await updateAdminJob(id, payload);
      navigate("/admin/jobs");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title="Edit Job">
      <Link
        to="/admin/jobs"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <HiOutlineArrowLeft className="h-4 w-4" /> Back to Manage Jobs
      </Link>

      {loading && <p className="text-gray-400">Loading job…</p>}
      {!loading && error && !form && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && form && (
        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-gray-900">Job Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Job Title *">
                <input
                  className={inputCls}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </Field>
              <Field label="Company *">
                <input
                  className={inputCls}
                  value={form.company}
                  onChange={(e) => set("company", e.target.value)}
                />
              </Field>
              <Field label="Job Type">
                <Dropdown
                  fullWidth
                  value={form.type}
                  onChange={(v) => set("type", v)}
                  options={JOB_TYPES}
                />
              </Field>
              <Field label="Work Mode">
                <Dropdown
                  fullWidth
                  value={form.workMode}
                  onChange={(v) => set("workMode", v)}
                  options={WORK_MODES}
                />
              </Field>
              <Field label="Location *">
                <div className="rounded-xl border border-gray-200 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <CityAutocomplete
                    value={form.city}
                    onChange={(v) => set("city", v)}
                  />
                </div>
              </Field>
              <Field label="Experience Level">
                <Dropdown
                  fullWidth
                  value={form.experienceLevel}
                  onChange={(v) => set("experienceLevel", v)}
                  options={EXP_LEVELS}
                />
              </Field>
              <Field label="Category">
                <Dropdown
                  fullWidth
                  value={form.category}
                  onChange={(v) => set("category", v)}
                  options={CATEGORIES}
                />
              </Field>
              <Field label="Status">
                <Dropdown
                  fullWidth
                  value={form.status}
                  onChange={(v) => set("status", v)}
                  options={STATUSES}
                />
              </Field>
              <Field label="Application Deadline">
                <input
                  className={inputCls}
                  type="date"
                  value={form.deadline}
                  onChange={(e) => set("deadline", e.target.value)}
                />
              </Field>
              <Field label="Salary">
                <input
                  className={inputCls}
                  placeholder="PKR 120000 - 150000 Monthly"
                  value={form.salary}
                  onChange={(e) => set("salary", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Required Skills">
              <SkillsInput
                value={form.skills}
                onChange={(v) => set("skills", v)}
              />
            </Field>
          </div>

          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-gray-900">
              Description & Requirements
            </h2>
            <Field label="About the Role *">
              <textarea
                rows={4}
                className={`${inputCls} resize-none`}
                value={form.aboutRole}
                onChange={(e) => set("aboutRole", e.target.value)}
              />
            </Field>
            <Field label="Key Responsibilities">
              <textarea
                rows={4}
                className={`${inputCls} resize-none`}
                value={form.responsibilities}
                onChange={(e) => set("responsibilities", e.target.value)}
              />
            </Field>
            <Field label="Requirements">
              <textarea
                rows={4}
                className={`${inputCls} resize-none`}
                value={form.requirements}
                onChange={(e) => set("requirements", e.target.value)}
              />
            </Field>
          </div>

          <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-gray-900">AI Interview Questions</h2>
            {form.interviewQuestions.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                  {i + 1}
                </span>
                <input
                  className={inputCls}
                  value={q}
                  onChange={(e) => updateQ(i, e.target.value)}
                  placeholder="Type an interview question…"
                />
                {form.interviewQuestions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQ(i)}
                    className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {form.interviewQuestions.length < 20 && (
              <button
                type="button"
                onClick={addQ}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                <HiOutlinePlus className="h-4 w-4" /> Add Question
              </button>
            )}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
            <Link
              to="/admin/jobs"
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <HiOutlineCheckCircle className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}