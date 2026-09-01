import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import HRLayout from "../../layouts/HRLayout";
import { createHRJob, getHRJob, updateHRJob } from "../../services/hrService";
import {
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineChatBubbleLeftRight,
  HiOutlineEye,
  HiOutlineMapPin,
  HiOutlineCalendarDays,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineBuildingOffice2,
  HiOutlineSparkles,
  HiOutlineInformationCircle,
  HiOutlinePencilSquare,
  HiOutlineXMark,
} from "react-icons/hi2";

// ── Steps — 4 total (Description + Requirements merged) ───────────────────────
const STEPS = [
  { id: 1, label: "Job Details",     sub: "Basic information",        icon: HiOutlineBriefcase },
  { id: 2, label: "Description",     sub: "Roles & requirements",     icon: HiOutlineDocumentText },
  { id: 3, label: "AI Questions",    sub: "Interview questions",      icon: HiOutlineChatBubbleLeftRight },
  { id: 4, label: "Preview",         sub: "Review and publish",       icon: HiOutlineEye },
];

const JOB_TYPES   = ["Full Time", "Part Time", "Internship", "Contract", "Freelance"];
const WORK_MODES  = ["On-site", "Remote", "Hybrid"];
const EXP_LEVELS  = ["Entry Level", "1 - 2 Years", "3 - 5 Years", "5 - 8 Years", "8+ Years"];
const PAY_PERIODS = ["Per Month", "Per Year", "Per Hour", "Fixed"];
const CATEGORIES  = ["Sales", "Marketing", "IT & Software", "Customer Support", "Finance", "Design", "HR & Admin", "Data Science"];

const INIT = {
  title: "", company: "", type: "Full Time", workMode: "On-site",
  city: "", experienceLevel: "1 - 2 Years", category: CATEGORIES[0],
  salaryMin: "", salaryMax: "", salaryPeriod: "Per Month",
  deadline: "", aboutRole: "", responsibilities: "", requirements: "",
  skills: [],
  interviewQuestions: [""],
};

// ── Validation per step ────────────────────────────────────────────────────────
function validate(step, form) {
  const errs = {};
  if (step === 1) {
    if (!form.title.trim())       errs.title       = "Job title is required";
    if (!form.company.trim())     errs.company     = "Company name is required";
    if (!form.city.trim())        errs.city        = "Location is required";
    if (!form.salaryMin.trim())   errs.salaryMin   = "Minimum salary is required";
    if (!form.deadline.trim())    errs.deadline    = "Application deadline is required";
  }
  if (step === 2) {
    if (!form.aboutRole.trim())        errs.aboutRole       = "About the role is required";
    if (!form.responsibilities.trim()) errs.responsibilities = "Key responsibilities are required";
    if (!form.requirements.trim())     errs.requirements    = "Requirements are required";
  }
  return errs;
}

// ── Skills tag input ────────────────────────────────────────────────────────
function SkillsInput({ value, onChange }) {
  const [text, setText] = useState("");

  function addSkill() {
    const v = text.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setText("");
  }

  function removeSkill(s) {
    onChange(value.filter((v) => v !== s));
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="e.g. React, Node.js, Figma"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); }
          }}
        />
        <button
          type="button"
          onClick={addSkill}
          className="shrink-0 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Add
        </button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map((s) => (
            <span key={s} className="flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium">
              {s}
              <button type="button" onClick={() => removeSkill(s)} className="hover:text-blue-900">
                <HiOutlineXMark className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────────────
function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
        {label} {required && <span className="text-blue-600">*</span>}
      </label>
      {children}
      {error  && <p className="mt-1 text-[11px] font-medium text-red-500">⚠ {error}</p>}
      {!error && hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────────
function Input({ icon: Icon, hasError, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />}
      <input
        {...props}
        className={`w-full rounded-xl border py-2.5 text-sm text-gray-800 outline-none transition focus:ring-2 ${
          hasError
            ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-100"
            : "border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-100"
        } ${Icon ? "pl-9 pr-3" : "px-3"}`}
      />
    </div>
  );
}

// ── Select — custom dropdown with type + search ────────────────────────────────
function Select({ icon: Icon, options, value, onChange, searchable = false }) {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState("");

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
  );

  function pick(opt) {
    onChange({ target: { value: opt } });
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <div
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm text-gray-800 outline-none transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 ${Icon ? "pl-9 pr-8" : "pl-3 pr-8"}`}
      >
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />}
        {searchable && open ? (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Type to search..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
          />
        ) : (
          <span className="flex-1 truncate">{value}</span>
        )}
      </div>

      {/* Chevron */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setQuery(""); }} />
          <div className="absolute left-0 right-0 z-20 mt-1 rounded-xl border border-gray-100 bg-white py-1 shadow-xl overflow-hidden">
            {filtered.length === 0 ? (
              <p className="px-4 py-2.5 text-sm text-gray-400">No options found</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => pick(opt)}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-blue-50 ${
                    value === opt ? "font-semibold text-blue-600 bg-blue-50/60" : "text-gray-700"
                  }`}
                >
                  {value === opt && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />}
                  {value !== opt && <span className="h-1.5 w-1.5 rounded-full bg-transparent shrink-0" />}
                  {opt}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────────────────────────
function Textarea({ hasError, rows = 5, ...props }) {
  return (
    <textarea
      rows={rows}
      {...props}
      className={`w-full rounded-xl border py-2.5 px-3 text-sm text-gray-800 outline-none transition focus:ring-2 resize-none ${
        hasError
          ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-100"
          : "border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-100"
      }`}
    />
  );
}

// ── Step bar ───────────────────────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, i) => {
        const done   = current > s.id;
        const active = current === s.id;
        const last   = i === STEPS.length - 1;
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                done   ? "border-blue-600 bg-blue-600 text-white"
                : active ? "border-blue-600 bg-white text-blue-600 shadow-md shadow-blue-100"
                : "border-gray-200 bg-white text-gray-400"
              }`}>
                {done ? <HiOutlineCheckCircle className="h-5 w-5" /> : s.id}
              </div>
              <div className="mt-1.5 text-center hidden sm:block">
                <p className={`text-xs font-semibold ${active ? "text-blue-600" : done ? "text-gray-700" : "text-gray-400"}`}>{s.label}</p>
                <p className="text-[10px] text-gray-400">{s.sub}</p>
              </div>
            </div>
            {!last && (
              <div className={`flex-1 h-0.5 mx-2 mb-6 transition-all duration-500 ${done ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Live preview panel ─────────────────────────────────────────────────────────
function PreviewPanel({ form, onEdit }) {
  const initial = form.company?.[0]?.toUpperCase() || "C";
  return (
    <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-700">Job Preview</p>
        <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
          <HiOutlineCheckCircle className="h-3.5 w-3.5" /> Draft
        </span>
      </div>
      <div className="p-5 space-y-4">
        {/* Company + title */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">{initial}</div>
          <div>
            <p className="text-sm text-gray-500">{form.company || "Company Name"}</p>
            <p className="text-base font-bold text-gray-900">{form.title || "Job Title"}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-gray-500">
          {form.city         && <span className="flex items-center gap-1"><HiOutlineMapPin className="h-3.5 w-3.5 text-blue-500" />{form.city}</span>}
          {form.experienceLevel && <span className="flex items-center gap-1"><HiOutlineClock className="h-3.5 w-3.5 text-blue-500" />{form.experienceLevel}</span>}
          {form.workMode     && <span className="flex items-center gap-1"><HiOutlineBuildingOffice2 className="h-3.5 w-3.5 text-blue-500" />{form.workMode}</span>}
        </div>

        {/* Salary + type */}
        <div className="flex flex-wrap items-center gap-2">
          {(form.salaryMin || form.salaryMax) && (
            <span className="text-sm font-semibold text-gray-800">
              PKR {form.salaryMin}{form.salaryMax ? ` – ${form.salaryMax}` : ""} / {form.salaryPeriod}
            </span>
          )}
          {form.type && <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">{form.type}</span>}
        </div>

        {/* About */}
        {form.aboutRole && (
          <div>
            <p className="text-xs font-bold text-gray-800 mb-1">About the Role</p>
            <p className="text-xs text-gray-500 leading-5 line-clamp-3">{form.aboutRole}</p>
          </div>
        )}

        {/* Responsibilities */}
        {form.responsibilities && (
          <div>
            <p className="text-xs font-bold text-gray-800 mb-1.5">Key Responsibilities</p>
            <ul className="space-y-1">
              {form.responsibilities.split("\n").filter(Boolean).slice(0, 4).map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  {r.replace(/^[-•*]\s*/, "")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Requirements */}
        {form.requirements && (
          <div>
            <p className="text-xs font-bold text-gray-800 mb-1.5">Requirements</p>
            <ul className="space-y-1">
              {form.requirements.split("\n").filter(Boolean).slice(0, 3).map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  {r.replace(/^[-•*]\s*/, "")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3">
          <HiOutlineInformationCircle className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
          <p className="text-[11px] text-blue-600 leading-4">You can complete all steps and publish the job. It will be visible to candidates once published.</p>
        </div>

        {/* Edit sections — only on step 4 preview */}
        {onEdit && (
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 pt-1">Edit Sections</p>
            {[
              { label: "Job Details",   step: 1 },
              { label: "Description",   step: 2 },
              { label: "AI Questions",  step: 3 },
            ].map((s) => (
              <button key={s.step} onClick={() => onEdit(s.step)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition group">
                {s.label}
                <HiOutlinePencilSquare className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function HRPostJob() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState(INIT);
  const [errors, setErrors]   = useState({});
  const [posting, setPosting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [apiError, setApiError] = useState("");
  const [direction, setDirection] = useState("forward");

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    setLoadingEdit(true);
    getHRJob(editId)
      .then((job) => {
        if (cancelled) return;
        const salaryMatch = String(job.salary || "").match(
          /PKR\s*(\d[\d,]*)(?:\s*-\s*(\d[\d,]*))?\s*(.*)?/i
        );
        const parts = String(job.description || "").split(/\n\n+/);
        setForm({
          title: job.title || "",
          company: job.company || "",
          type: job.type || "Full Time",
          workMode: job.workMode || "On-site",
          city: job.city || "",
          experienceLevel: job.experienceLevel || "1 - 2 Years",
          category: job.category || CATEGORIES[0],
          salaryMin: salaryMatch?.[1]?.replace(/,/g, "") || "",
          salaryMax: salaryMatch?.[2]?.replace(/,/g, "") || "",
          salaryPeriod: (salaryMatch?.[3] || "Per Month").trim() || "Per Month",
          deadline: job.applicationDeadline
            ? new Date(job.applicationDeadline).toISOString().slice(0, 10)
            : "",
          aboutRole: parts[0] || "",
          responsibilities: parts[1] || "",
          requirements: parts[2] || "",
          skills: Array.isArray(job.skills) ? job.skills : [],
          interviewQuestions:
            Array.isArray(job.interviewQuestions) &&
            job.interviewQuestions.length
              ? job.interviewQuestions
              : [""],
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setApiError(err.response?.data?.message || "Could not load job for editing.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingEdit(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  // Questions
  function addQ()        { if (form.interviewQuestions.length < 20) set("interviewQuestions", [...form.interviewQuestions, ""]); }
  function updateQ(i, v) { set("interviewQuestions", form.interviewQuestions.map((q, idx) => idx === i ? v : q)); }
  function removeQ(i)    { if (form.interviewQuestions.length > 1) set("interviewQuestions", form.interviewQuestions.filter((_, idx) => idx !== i)); }

  function next() {
    const errs = validate(step, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setDirection("forward");
    setStep((s) => Math.min(s + 1, 4));
    setApiError("");
  }

  function prev() {
    setDirection("back");
    setStep((s) => Math.max(s - 1, 1));
    setErrors({});
  }

  function goEdit(s) {
    setDirection("back");
    setStep(s);
    setErrors({});
  }

  async function handleSubmit() {
    setPosting(true); setApiError("");
    const payload = {
      title:    form.title,
      company:  form.company,
      type:     form.type,
      workMode: form.workMode,
      experienceLevel: form.experienceLevel,
      category: form.category,
      skills:   form.skills,
      city:     form.city,
      description: [form.aboutRole, form.responsibilities, form.requirements].filter(Boolean).join("\n\n"),
      salary:   form.salaryMin ? `PKR ${form.salaryMin}${form.salaryMax ? ` - ${form.salaryMax}` : ""} ${form.salaryPeriod}` : "",
      applicationDeadline: form.deadline || undefined,
      interviewQuestions: form.interviewQuestions.filter((q) => q.trim()),
    };
    try {
      if (editId) {
        await updateHRJob(editId, payload);
      } else {
        await createHRJob(payload);
      }
      navigate("/hr/jobs");
    } catch (err) {
      setApiError(err.response?.data?.message || (editId ? "Could not update job." : "Could not post job."));
    } finally {
      setPosting(false);
    }
  }

  const slideClass = direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left";

  return (
    <HRLayout
      title={editId ? "Edit Job" : "Post a New Job"}
      subtitle={
        editId
          ? "Update job details and AI interview questions"
          : "Provide job details to attract the right candidates"
      }
    >
      <style>{`
        @keyframes slideInRight { from { opacity:0; transform:translateX(36px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInLeft  { from { opacity:0; transform:translateX(-36px); } to { opacity:1; transform:translateX(0); } }
        .animate-slide-in-right { animation: slideInRight 0.32s cubic-bezier(.4,0,.2,1) both; }
        .animate-slide-in-left  { animation: slideInLeft  0.32s cubic-bezier(.4,0,.2,1) both; }
      `}</style>

      {loadingEdit ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          Loading job…
        </div>
      ) : (
      <>
      <StepBar current={step} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">

        {/* ── Form card ── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">

          {/* Step header */}
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <p className="text-lg font-bold text-gray-900">{STEPS[step - 1].label}</p>
            <p className="text-sm text-gray-400 mt-0.5">{STEPS[step - 1].sub}</p>
          </div>

          {/* Content */}
          <div key={step} className={`px-6 py-6 ${slideClass}`}>

            {apiError && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{apiError}</div>
            )}

            {/* ── STEP 1: Job Details ── */}
            {step === 1 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Job Title" required error={errors.title}>
                  <Input icon={HiOutlineBriefcase} placeholder="e.g. Senior React Developer"
                    hasError={!!errors.title} value={form.title} onChange={(e) => set("title", e.target.value)} />
                </Field>
                <Field label="Company" required error={errors.company}>
                  <Input icon={HiOutlineBuildingOffice2} placeholder="e.g. TechNova Solutions"
                    hasError={!!errors.company} value={form.company} onChange={(e) => set("company", e.target.value)} />
                </Field>
                <Field label="Job Type" required>
                  <Select icon={HiOutlineBriefcase} options={JOB_TYPES} value={form.type} onChange={(e) => set("type", e.target.value)} />
                </Field>
                <Field label="Work Mode" required>
                  <Select icon={HiOutlineBuildingOffice2} options={WORK_MODES} value={form.workMode} onChange={(e) => set("workMode", e.target.value)} />
                </Field>
                <Field label="Location" required error={errors.city}>
                  <Input icon={HiOutlineMapPin} placeholder="e.g. Lahore, Pakistan"
                    hasError={!!errors.city} value={form.city} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field label="Experience Level" required>
                  <Select icon={HiOutlineClock} options={EXP_LEVELS} searchable value={form.experienceLevel} onChange={(e) => set("experienceLevel", e.target.value)} />
                </Field>
                <Field label="Category" required>
                  <Select icon={HiOutlineBriefcase} options={CATEGORIES} searchable value={form.category} onChange={(e) => set("category", e.target.value)} />
                </Field>
                <Field label="Salary Range (PKR)" required error={errors.salaryMin}
                  hint="Enter minimum and maximum salary">
                  <div className="flex items-center gap-2">
                    <Input placeholder="Min e.g. 150000" hasError={!!errors.salaryMin}
                      value={form.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} />
                    <span className="shrink-0 text-gray-400 font-medium">—</span>
                    <Input placeholder="Max e.g. 220000"
                      value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} />
                  </div>
                </Field>
                <Field label="Pay Period" required>
                  <Select options={PAY_PERIODS} value={form.salaryPeriod} onChange={(e) => set("salaryPeriod", e.target.value)} />
                </Field>
                <Field label="Application Deadline" required error={errors.deadline}
                  hint="You can select only one date">
                  <Input icon={HiOutlineCalendarDays} type="date" hasError={!!errors.deadline}
                    value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Skills" hint="Press Enter to add a skill">
                    <SkillsInput value={form.skills} onChange={(skills) => set("skills", skills)} />
                  </Field>
                </div>
              </div>
            )}

            {/* ── STEP 2: Description + Requirements merged ── */}
            {step === 2 && (
              <div className="space-y-5">
                <Field label="About the Role" required error={errors.aboutRole}
                  hint="Give candidates an overview of the role and team">
                  <Textarea rows={4} hasError={!!errors.aboutRole}
                    placeholder="We are looking for a skilled developer to join our team..."
                    value={form.aboutRole} onChange={(e) => set("aboutRole", e.target.value)} />
                </Field>
                <Field label="Key Responsibilities" required error={errors.responsibilities}
                  hint="List each responsibility on a new line (use - or • to start)">
                  <Textarea rows={5} hasError={!!errors.responsibilities}
                    placeholder={"- Develop and maintain applications\n- Collaborate with cross-functional teams\n- Optimize components for performance"}
                    value={form.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} />
                </Field>
                <Field label="Requirements & Qualifications" required error={errors.requirements}
                  hint="List each requirement on a new line">
                  <Textarea rows={5} hasError={!!errors.requirements}
                    placeholder={"- 3+ years of experience with React\n- Strong knowledge of JavaScript, TypeScript\n- Experience with REST APIs"}
                    value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
                </Field>
              </div>
            )}

            {/* ── STEP 3: AI Questions ── */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
                  <HiOutlineSparkles className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-700">AI Interview Questions</p>
                    <p className="text-xs text-blue-500 mt-0.5">These will be asked by the AI avatar during the candidate's video interview. Add up to 20 questions.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {form.interviewQuestions.map((q, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">{i + 1}</div>
                      <input type="text" value={q} onChange={(e) => updateQ(i, e.target.value)}
                        placeholder={`Question ${i + 1}...`}
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                      <button type="button" onClick={() => removeQ(i)} disabled={form.interviewQuestions.length <= 1}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition disabled:opacity-30">
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {form.interviewQuestions.length < 20 && (
                  <button type="button" onClick={addQ}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition">
                    <HiOutlinePlus className="h-4 w-4" /> Add Question
                  </button>
                )}
              </div>
            )}

            {/* ── STEP 4: Preview ── */}
            {step === 4 && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                  <HiOutlineCheckCircle className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">
                      {editId ? "Ready to Save Changes!" : "Ready to Publish!"}
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5">Review your job posting. Click any edit button to go back and make changes.</p>
                  </div>
                </div>

                {/* Section: Job Details */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Job Details</p>
                    <button onClick={() => goEdit(1)}
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition">
                      <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[
                      { label: "Job Title",   value: form.title },
                      { label: "Company",     value: form.company },
                      { label: "Job Type",    value: form.type },
                      { label: "Work Mode",   value: form.workMode },
                      { label: "Location",    value: form.city },
                      { label: "Experience",  value: form.experienceLevel },
                      { label: "Category",    value: form.category },
                      { label: "Skills",      value: form.skills.length ? form.skills.join(", ") : "—" },
                      { label: "Salary",      value: form.salaryMin ? `PKR ${form.salaryMin}${form.salaryMax ? ` - ${form.salaryMax}` : ""} ${form.salaryPeriod}` : "—" },
                      { label: "Deadline",    value: form.deadline || "—" },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-xs text-gray-500">{row.label}</span>
                        <span className="text-sm font-semibold text-gray-800">{row.value || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Description */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description & Requirements</p>
                    <button onClick={() => goEdit(2)}
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition">
                      <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    {form.aboutRole && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">About the Role</p>
                        <p className="text-sm text-gray-700 leading-6">{form.aboutRole}</p>
                      </div>
                    )}
                    {form.responsibilities && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Responsibilities</p>
                        <ul className="space-y-1">
                          {form.responsibilities.split("\n").filter(Boolean).map((r, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                              {r.replace(/^[-•*]\s*/, "")}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {form.requirements && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Requirements</p>
                        <ul className="space-y-1">
                          {form.requirements.split("\n").filter(Boolean).map((r, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                              {r.replace(/^[-•*]\s*/, "")}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: AI Questions */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">AI Interview Questions</p>
                    <button onClick={() => goEdit(3)}
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition">
                      <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {form.interviewQuestions.filter((q) => q.trim()).length === 0 ? (
                      <p className="text-sm text-gray-400">No questions added.</p>
                    ) : (
                      form.interviewQuestions.filter((q) => q.trim()).map((q, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 mt-0.5">{i + 1}</span>
                          <p className="text-sm text-gray-700">{q}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Bottom bar ── */}
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50/40">
            <button type="button" onClick={() => navigate("/hr/jobs")}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button type="button" onClick={prev}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                  <HiOutlineArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
              {step < 4 ? (
                <button type="button" onClick={next}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm shadow-blue-200">
                  Save & Continue <HiOutlineArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={posting}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition shadow-sm shadow-blue-200">
                  <HiOutlineCheckCircle className="h-4 w-4" />
                  {posting
                    ? editId
                      ? "Saving..."
                      : "Publishing..."
                    : editId
                      ? "Save Changes"
                      : "Publish Job"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Preview panel ── */}
        <div className="hidden lg:block">
          <PreviewPanel form={form} onEdit={step === 4 ? goEdit : null} />
        </div>
      </div>
      </>
      )}
    </HRLayout>
  );
}


