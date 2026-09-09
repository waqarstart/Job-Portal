import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  HiOutlineBriefcase, HiOutlineMapPin, HiOutlineCalendarDays,
  HiOutlinePlus, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineXMark,
  HiOutlineArrowLeft,
} from "react-icons/hi2";
import HRLayout from "../../layouts/HRLayout";
import Dropdown from "../../components/Dropdown";
import CityAutocomplete from "../../components/CityAutocomplete";
import { getHRJob, updateHRJob } from "../../services/hrService";

const JOB_TYPES   = ["Full Time", "Part Time", "Internship", "Contract", "Freelance"].map((v) => ({ value: v, label: v }));
const WORK_MODES  = ["On-site", "Remote", "Hybrid"].map((v) => ({ value: v, label: v }));
const EXP_LEVELS  = ["Entry Level", "1 - 2 Years", "3 - 5 Years", "5 - 8 Years", "8+ Years"].map((v) => ({ value: v, label: v }));
const PAY_PERIODS = ["Monthly", "Yearly", "Hourly", "Fixed"].map((v) => ({ value: v, label: v }));
const CATEGORIES  = ["Sales", "Marketing", "IT & Software", "Customer Support", "Finance", "Design", "HR & Admin", "Data Science"].map((v) => ({ value: v, label: v }));

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
        {label} {required && <span className="text-blue-600">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] font-medium text-red-500">⚠ {error}</p>}
    </div>
  );
}

function Input(props) {
  const { hasError, ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-xl border px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:ring-2 ${
        hasError
          ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-100"
          : "border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-100"
      }`}
    />
  );
}

function Textarea(props) {
  const { rows = 4, ...rest } = props;
  return (
    <textarea
      rows={rows}
      {...rest}
      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
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
        <Input
          placeholder="e.g. React, Node.js, Figma"
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
              <button type="button" onClick={() => onChange(value.filter((v) => v !== s))} className="hover:text-blue-900">
                <HiOutlineXMark className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HREditJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getHRJob(id)
      .then((job) => {
        if (cancelled) return;
        const salaryMatch = String(job.salary || "").match(/PKR\s*(\d[\d,]*)(?:\s*-\s*(\d[\d,]*))?\s*(.*)?/i);
        const parts = String(job.description || "").split(/\n\n+/);
        setForm({
          title: job.title || "",
          company: job.company || "",
          type: job.type || "Full Time",
          workMode: job.workMode || "On-site",
          city: job.city || "",
          experienceLevel: job.experienceLevel || "1 - 2 Years",
          category: job.category || CATEGORIES[0].value,
          salaryMin: salaryMatch?.[1]?.replace(/,/g, "") || "",
          salaryMax: salaryMatch?.[2]?.replace(/,/g, "") || "",
          salaryPeriod: (salaryMatch?.[3] || "Monthly").trim() || "Monthly",
          deadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().slice(0, 10) : "",
          aboutRole: job.aboutRole || parts[0] || "",
          responsibilities: job.responsibilities || parts[1] || "",
          requirements: job.requirements || parts[2] || "",
          skills: Array.isArray(job.skills) ? job.skills : [],
          interviewQuestions: Array.isArray(job.interviewQuestions) && job.interviewQuestions.length ? job.interviewQuestions : [""],
        });
      })
      .catch((err) => !cancelled && setError(err.response?.data?.message || "Could not load this job."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function addQ() { if (form.interviewQuestions.length < 20) set("interviewQuestions", [...form.interviewQuestions, ""]); }
  function updateQ(i, v) { set("interviewQuestions", form.interviewQuestions.map((q, idx) => idx === i ? v : q)); }
  function removeQ(i) { if (form.interviewQuestions.length > 1) set("interviewQuestions", form.interviewQuestions.filter((_, idx) => idx !== i)); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError("");
    const payload = {
      title: form.title,
      company: form.company,
      type: form.type,
      workMode: form.workMode,
      experienceLevel: form.experienceLevel,
      category: form.category,
      skills: form.skills,
      city: form.city,
      description: [form.aboutRole, form.responsibilities, form.requirements].filter(Boolean).join("\n\n"),
      aboutRole: form.aboutRole,
      responsibilities: form.responsibilities,
      requirements: form.requirements,
      salary: form.salaryMin ? `PKR ${form.salaryMin}${form.salaryMax ? ` - ${form.salaryMax}` : ""} ${form.salaryPeriod}` : "",
      applicationDeadline: form.deadline || undefined,
      interviewQuestions: form.interviewQuestions.filter((q) => q.trim()),
    };
    try {
      await updateHRJob(id, payload);
      setSaved(true);
      setTimeout(() => navigate("/hr/jobs"), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <HRLayout title="Edit Job" subtitle="Update your job posting — candidates who already applied will be notified.">
      <Link to="/hr/jobs" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition">
        <HiOutlineArrowLeft className="h-4 w-4" /> Back to My Jobs
      </Link>

      {loading && <p className="text-gray-400">Loading job…</p>}

      {!loading && error && !form && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">{error}</div>
      )}

      {!loading && form && (
        <form onSubmit={handleSave} className="max-w-3xl space-y-6">
          {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
          {saved && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
              <HiOutlineCheckCircle className="h-4 w-4" /> Saved — candidates who applied will see this update.
            </div>
          )}

          {/* Job details */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900">Job Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Job Title" required>
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
              </Field>
              <Field label="Company">
                <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
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
              <Field label="Application Deadline" required>
                <div className="relative">
                  <HiOutlineCalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input className="pl-9" type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
                </div>
              </Field>
            </div>

            <Field label="Salary Range (PKR)" required>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Min e.g. 150000" value={form.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} />
                <Input placeholder="Max (optional)" value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} />
                <Dropdown fullWidth value={form.salaryPeriod} onChange={(v) => set("salaryPeriod", v)} options={PAY_PERIODS} />
              </div>
            </Field>

            <Field label="Required Skills">
              <SkillsInput value={form.skills} onChange={(v) => set("skills", v)} />
            </Field>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900">Description & Requirements</h2>
            <Field label="About the Role" required>
              <Textarea value={form.aboutRole} onChange={(e) => set("aboutRole", e.target.value)} />
            </Field>
            <Field label="Key Responsibilities" required>
              <Textarea value={form.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} />
            </Field>
            <Field label="Requirements" required>
              <Textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
            </Field>
          </div>

          {/* Interview questions */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
            <h2 className="font-bold text-gray-900">AI Interview Questions</h2>
            {form.interviewQuestions.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">{i + 1}</span>
                <Input value={q} onChange={(e) => updateQ(i, e.target.value)} placeholder="Type an interview question…" />
                {form.interviewQuestions.length > 1 && (
                  <button type="button" onClick={() => removeQ(i)} className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {form.interviewQuestions.length < 20 && (
              <button type="button" onClick={addQ}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition">
                <HiOutlinePlus className="h-4 w-4" /> Add Question
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
            <Link to="/hr/jobs" className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </Link>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition shadow-sm shadow-blue-200">
              <HiOutlineCheckCircle className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </HRLayout>
  );
}
