import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineXMark, HiOutlineArrowLeft } from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";
import Dropdown from "../../components/Dropdown";
import CityAutocomplete from "../../components/CityAutocomplete";
import { createAdminJob } from "../../services/adminService";

const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));
const JOB_TYPES   = toOptions(["Full Time", "Part Time", "Internship", "Contract", "Freelance"]);
const WORK_MODES  = toOptions(["On-site", "Remote", "Hybrid"]);
const EXP_LEVELS  = toOptions(["Entry Level", "1 - 2 Years", "3 - 5 Years", "5 - 8 Years", "8+ Years"]);
const PAY_PERIODS = toOptions(["Monthly", "Yearly", "Hourly", "Fixed"]);
const CATEGORIES  = toOptions(["Sales", "Marketing", "IT & Software", "Customer Support", "Finance", "Design", "HR & Admin", "Data Science"]);

const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-blue-600">*</span>}
      </label>
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

export default function AdminPostJob() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", company: "", type: "Full Time", workMode: "On-site", city: "",
    experienceLevel: "1 - 2 Years", category: CATEGORIES[0].value,
    salaryMin: "", salaryMax: "", salaryPeriod: "Monthly", deadline: "",
    aboutRole: "", responsibilities: "", requirements: "",
    skills: [], interviewQuestions: [""],
  });

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function addQ() { if (form.interviewQuestions.length < 20) set("interviewQuestions", [...form.interviewQuestions, ""]); }
  function updateQ(i, v) { set("interviewQuestions", form.interviewQuestions.map((q, idx) => (idx === i ? v : q))); }
  function removeQ(i) { if (form.interviewQuestions.length > 1) set("interviewQuestions", form.interviewQuestions.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const description = [form.aboutRole, form.responsibilities, form.requirements].filter(Boolean).join("\n\n");
    if (!form.title || !form.company || !form.city || !description) {
      setError("Title, company, city and a description are required.");
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
      skills: form.skills,
      description,
      aboutRole: form.aboutRole,
      responsibilities: form.responsibilities,
      requirements: form.requirements,
      salary: form.salaryMin
        ? `PKR ${form.salaryMin}${form.salaryMax ? ` - ${form.salaryMax}` : ""} ${form.salaryPeriod}`
        : "",
      applicationDeadline: form.deadline || undefined,
      interviewQuestions: form.interviewQuestions.filter((q) => q.trim()),
    };

    setSaving(true);
    try {
      await createAdminJob(payload);
      navigate("/admin/jobs");
    } catch (err) {
      setError(err.response?.data?.message || "Could not post the job.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title="Post New Job">
      <Link to="/admin/jobs" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
        <HiOutlineArrowLeft className="h-4 w-4" /> Back to Manage Jobs
      </Link>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-gray-900">Job Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Job Title" required>
              <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Company" required>
              <input className={inputCls} value={form.company} onChange={(e) => set("company", e.target.value)} />
            </Field>
            <Field label="Job Type">
              <Dropdown fullWidth value={form.type} onChange={(v) => set("type", v)} options={JOB_TYPES} />
            </Field>
            <Field label="Work Mode">
              <Dropdown fullWidth value={form.workMode} onChange={(v) => set("workMode", v)} options={WORK_MODES} />
            </Field>
            <Field label="Location" required>
              <div className="rounded-xl border border-gray-200 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <CityAutocomplete value={form.city} onChange={(v) => set("city", v)} />
              </div>
            </Field>
            <Field label="Experience Level">
              <Dropdown fullWidth value={form.experienceLevel} onChange={(v) => set("experienceLevel", v)} options={EXP_LEVELS} />
            </Field>
            <Field label="Category">
              <Dropdown fullWidth value={form.category} onChange={(v) => set("category", v)} options={CATEGORIES} />
            </Field>
            <Field label="Application Deadline">
              <input className={inputCls} type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
            </Field>
          </div>

          <Field label="Salary Range (PKR)">
            <div className="grid grid-cols-3 gap-2">
              <input className={inputCls} placeholder="Min e.g. 150000" value={form.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} />
              <input className={inputCls} placeholder="Max (optional)" value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} />
              <Dropdown fullWidth value={form.salaryPeriod} onChange={(v) => set("salaryPeriod", v)} options={PAY_PERIODS} />
            </div>
          </Field>

          <Field label="Required Skills">
            <SkillsInput value={form.skills} onChange={(v) => set("skills", v)} />
          </Field>
        </div>

        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-gray-900">Description & Requirements</h2>
          <Field label="About the Role" required>
            <textarea rows={4} className={`${inputCls} resize-none`} value={form.aboutRole} onChange={(e) => set("aboutRole", e.target.value)} />
          </Field>
          <Field label="Key Responsibilities">
            <textarea rows={4} className={`${inputCls} resize-none`} value={form.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} />
          </Field>
          <Field label="Requirements">
            <textarea rows={4} className={`${inputCls} resize-none`} value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
          </Field>
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-gray-900">AI Interview Questions</h2>
          {form.interviewQuestions.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">{i + 1}</span>
              <input className={inputCls} value={q} onChange={(e) => updateQ(i, e.target.value)} placeholder="Type an interview question…" />
              {form.interviewQuestions.length > 1 && (
                <button type="button" onClick={() => removeQ(i)} className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <HiOutlineTrash className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {form.interviewQuestions.length < 20 && (
            <button type="button" onClick={addQ}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50">
              <HiOutlinePlus className="h-4 w-4" /> Add Question
            </button>
          )}
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
          <Link to="/admin/jobs" className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            <HiOutlineCheckCircle className="h-4 w-4" />
            {saving ? "Posting..." : "Post Job"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}