import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getJob } from "../services/jobService";
import { applyToJob } from "../services/applicationService";
import { saveJob, unsaveJob, getSavedJobs } from "../services/savedJobService";
import { getMyProfile } from "../services/userService";
import { getMyCVs } from "../services/cvService";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineBriefcase,
  HiOutlineCurrencyDollar,
  HiOutlineCalendarDays,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineShare,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineBuildingOffice2,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineArrowRight,
  HiOutlineCloudArrowUp,
  HiOutlineUser,
  HiOutlineIdentification,
  HiOutlineDocumentText,
  HiOutlineEye,
  HiOutlinePaperAirplane,
  HiXMark,
} from "react-icons/hi2";

// ─────────────────────────────────────────────────────────────────────────────
// Parse job description
// ─────────────────────────────────────────────────────────────────────────────

function parseDescription(desc = "") {
  if (!desc) {
    return {
      about: "",
      responsibilities: [],
      requirements: [],
    };
  }

  const lines = desc.split("\n");

  let about = "";
  let responsibilities = [];
  let requirements = [];
  let mode = "about";

  for (const line of lines) {
    const l = line.trim();

    if (!l) continue;

    if (/responsibilit/i.test(l)) {
      mode = "resp";
      continue;
    }

    if (/requirement|qualification/i.test(l)) {
      mode = "req";
      continue;
    }

    if (mode === "about") {
      about += (about ? " " : "") + l;
    } else if (mode === "resp") {
      responsibilities.push(
        l.replace(/^[-•*]\s*/, "")
      );
    } else if (mode === "req") {
      requirements.push(
        l.replace(/^[-•*]\s*/, "")
      );
    }
  }

  return {
    about,
    responsibilities,
    requirements,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Format salary
// ─────────────────────────────────────────────────────────────────────────────

function formatSalary(salary) {
  if (!salary) return null;

  const toK = (num) => {
    const n = parseInt(
      num.toString().replace(/,/g, "")
    );

    if (isNaN(n)) return num;

    if (n >= 1000) {
      return `${Math.round(n / 1000)}K`;
    }

    return n.toString();
  };

  let s = salary
    .replace(
      /\s*(per\s*(month|year|hour)|\/month|\/year|\/hr|fixed)/gi,
      ""
    )
    .trim();

  if (/pkr/i.test(s)) {
    return s
      .replace(/\b(\d[\d,]*)\b/g, (m) => toK(m))
      .trim();
  }

  return (
    "PKR " +
    s.replace(/\b(\d[\d,]*)\b/g, (m) => toK(m))
  ).trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply steps
// ─────────────────────────────────────────────────────────────────────────────

const APPLY_STEPS = [
  {
    id: 1,
    label: "Personal Info",
    sub: "Tell us about yourself",
    icon: HiOutlineUser,
  },
  {
    id: 2,
    label: "Professional Info",
    sub: "Your work and professional details",
    icon: HiOutlineIdentification,
  },
  {
    id: 3,
    label: "Resume & Skills",
    sub: "Upload your resume and add key skills",
    icon: HiOutlineDocumentText,
  },
  {
    id: 4,
    label: "Review",
    sub: "Please review your details before submitting",
    icon: HiOutlineEye,
  },
  {
    id: 5,
    label: "Submit",
    sub: "Application submitted!",
    icon: HiOutlinePaperAirplane,
  },
];

const EXP_OPTIONS = [
  "0-1",
  "1-2",
  "2-3",
  "3-5",
  "5-8",
  "8-10",
  "10+",
];

// ─────────────────────────────────────────────────────────────────────────────
// Stepper
// ─────────────────────────────────────────────────────────────────────────────

function StepBar({ current }) {
  return (
    <div className="flex items-center mb-6">
      {APPLY_STEPS.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        const last = i === APPLY_STEPS.length - 1;

        return (
          <div
            key={s.id}
            className="flex items-center flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                  done
                    ? "border-blue-600 bg-blue-600 text-white"
                    : active
                    ? "border-blue-600 bg-white text-blue-600 shadow-md shadow-blue-100"
                    : "border-gray-200 bg-white text-gray-400"
                }`}
              >
                {done ? (
                  <HiOutlineCheckCircle className="h-5 w-5" />
                ) : (
                  s.id
                )}
              </div>

              <p
                className={`mt-1 text-[10px] font-semibold text-center hidden sm:block ${
                  active
                    ? "text-blue-600"
                    : done
                    ? "text-gray-600"
                    : "text-gray-400"
                }`}
              >
                {s.label}
              </p>
            </div>

            {!last && (
              <div
                className={`flex-1 h-0.5 mx-1.5 mb-4 transition-all duration-500 ${
                  done
                    ? "bg-blue-600"
                    : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form field
// ─────────────────────────────────────────────────────────────────────────────

function AField({
  label,
  required,
  error,
  children,
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}{" "}
        {required && (
          <span className="text-blue-600">*</span>
        )}
      </label>

      {children}

      {error && (
        <p className="mt-1 text-[11px] text-red-500">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────────────────────

function AInput({ hasError, ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border py-2.5 px-3 text-sm text-gray-800 outline-none transition focus:ring-2 ${
        hasError
          ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-100"
          : "border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-100"
      }`}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Share dropdown
// ─────────────────────────────────────────────────────────────────────────────

function ShareDropdown({ jobTitle, jobId }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const jobUrl = `${window.location.origin}/jobs/${jobId}`;
  const text = encodeURIComponent(
    `Check out this job: ${jobTitle}`
  );
  const url = encodeURIComponent(jobUrl);

  const options = [
    {
      label: "Copy Link",
      color: "text-gray-700",
      bg: "hover:bg-gray-50",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      ),
      action: () => {
        navigator.clipboard.writeText(jobUrl);
        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      },
    },

    {
      label: "WhatsApp",
      color: "text-green-600",
      bg: "hover:bg-green-50",
      icon: (
        <svg
          className="h-4 w-4"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.528 5.845L0 24l6.335-1.508A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.875 9.875 0 01-5.031-1.374l-.36-.214-3.733.888.936-3.638-.235-.374A9.87 9.87 0 012.118 12C2.118 6.533 6.533 2.118 12 2.118S21.882 6.533 21.882 12 17.467 21.882 12 21.882z" />
        </svg>
      ),
      action: () =>
        window.open(
          `https://wa.me/?text=${text}%20${url}`,
          "_blank"
        ),
    },

    {
      label: "LinkedIn",
      color: "text-blue-700",
      bg: "hover:bg-blue-50",
      icon: (
        <svg
          className="h-4 w-4"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      action: () =>
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
          "_blank"
        ),
    },

    {
      label: "Facebook",
      color: "text-blue-600",
      bg: "hover:bg-blue-50",
      icon: (
        <svg
          className="h-4 w-4"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      action: () =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${url}`,
          "_blank"
        ),
    },

    {
      label: "Instagram",
      color: "text-pink-600",
      bg: "hover:bg-pink-50",
      icon: (
        <svg
          className="h-4 w-4"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.28-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919C8.333.014 8.741 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
      action: () => {
        navigator.clipboard.writeText(jobUrl);
        alert(
          "Link copied! Paste it in your Instagram story or bio."
        );
      },
    },
  ];

  return (
    <div className="relative w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition-all duration-150 hover:scale-[1.03] hover:bg-blue-50 hover:text-blue-600"
      >
        <HiOutlineShare className="h-4 w-4" />
        {copied ? "Copied!" : "Share"}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
            {options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  opt.action();

                  if (opt.label !== "Copy Link") {
                    setOpen(false);
                  }
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition ${opt.color} ${opt.bg}`}
              >
                {opt.icon}

                {opt.label === "Copy Link" && copied
                  ? "Copied!"
                  : opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CV dropdown
// ─────────────────────────────────────────────────────────────────────────────

function CvDropdown({
  cvs,
  selectedId,
  onSelect,
  onClear,
}) {
  const [open, setOpen] = useState(false);

  const selected = cvs.find(
    (c) => c._id === selectedId
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none ${
          selectedId
            ? "border-blue-400 bg-blue-50 text-blue-700"
            : "border-gray-200 bg-white text-gray-400 hover:border-blue-300"
        }`}
      >
        <div className="flex items-center gap-2">
          <HiOutlineDocumentText
            className={`h-4 w-4 shrink-0 ${
              selectedId
                ? "text-blue-500"
                : "text-gray-300"
            }`}
          />

          <span>
            {selected
              ? selected.label || "My CV"
              : "-- Select a saved CV --"}
          </span>
        </div>

        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          } ${
            selectedId
              ? "text-blue-400"
              : "text-gray-400"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 right-0 z-20 mt-1 rounded-xl border border-gray-100 bg-white py-1 shadow-xl overflow-hidden">
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-gray-50 ${
                !selectedId
                  ? "font-semibold text-blue-600 bg-blue-50/50"
                  : "text-gray-400"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-transparent shrink-0" />

              -- Select a saved CV --
            </button>

            {cvs.map((cv) => (
              <button
                key={cv._id}
                type="button"
                onClick={() => {
                  onSelect(cv);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-blue-50 ${
                  selectedId === cv._id
                    ? "font-semibold text-blue-600 bg-blue-50/60"
                    : "text-gray-700"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    selectedId === cv._id
                      ? "bg-blue-600"
                      : "bg-transparent"
                  }`}
                />

                <HiOutlineDocumentText
                  className={`h-4 w-4 shrink-0 ${
                    selectedId === cv._id
                      ? "text-blue-500"
                      : "text-gray-400"
                  }`}
                />

                {cv.label || "My CV"}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // If we arrived here from the candidate's "My Applications" page, the
  // back button should return there (not to the public job listing).
  const cameFromApplications = location.state?.from === "applications";

  const { isLoggedIn, user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("Job Description");

  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);

  // ───────────────────────────────────────────────────────────────────────────
  // Apply stepper
  // ───────────────────────────────────────────────────────────────────────────

  const [showApply, setShowApply] = useState(false);
  const [applyStep, setApplyStep] = useState(1);
  const [applying, setApplying] = useState(false);

  const [applyError, setApplyError] = useState("");
  const [stepErrors, setStepErrors] = useState({});

  const [direction, setDirection] = useState("forward");

  const [applyForm, setApplyForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    phone2: "",
    jobTitle: "",
    yearsExp: "0-1",
    location: "",
    linkedin: "",
    cvFile: null,
    skills: [],
  });

  // Saved CVs
  const [savedCVs, setSavedCVs] = useState([]);

  // ID of selected saved CV
  const [selectedCvId, setSelectedCvId] =
    useState(null);

  const [previewUrl, setPreviewUrl] = useState(null);

  const [skillInput, setSkillInput] = useState("");

  // ───────────────────────────────────────────────────────────────────────────
  // Load job
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    getJob(id)
      .then(setJob)
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));

    if (isLoggedIn) {
      getSavedJobs()
        .then((s) =>
          setSaved(
            s.some(
              (sj) => sj.job?._id === id
            )
          )
        )
        .catch(() => {});
    }
  }, [id, isLoggedIn, navigate]);

  // ───────────────────────────────────────────────────────────────────────────
  // Pre-fill application form from profile
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoggedIn) return;

    getMyProfile()
      .then((profile) => {
        setApplyForm((f) => ({
          ...f,
          fullName: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          location: profile.location || "",
        }));
      })
      .catch(() => {
        if (user) {
          setApplyForm((f) => ({
            ...f,
            fullName: user.name || "",
            email: user.email || "",
          }));
        }
      });
  }, [isLoggedIn, user]);

  // ───────────────────────────────────────────────────────────────────────────
  // Save / unsave job
  // ───────────────────────────────────────────────────────────────────────────

  async function handleToggleSave() {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      if (saved) {
        await unsaveJob(id);
        setSaved(false);
      } else {
        await saveJob(id);
        setSaved(true);
      }
    } catch {}
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Open application modal
  // ───────────────────────────────────────────────────────────────────────────

  function handleApply() {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    setShowApply(true);
    setApplyStep(1);
    setStepErrors({});
    setApplyError("");

    setSelectedCvId(null);
    setPreviewUrl(null);

    document.body.style.overflow = "hidden";

    // Load saved CVs
    getMyCVs()
      .then(setSavedCVs)
      .catch(() => {});
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Close application modal
  // ───────────────────────────────────────────────────────────────────────────

  function closeApply() {
    setShowApply(false);

    document.body.style.overflow = "";
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Form setter
  // ───────────────────────────────────────────────────────────────────────────

  function setF(field, val) {
    setApplyForm((f) => ({
      ...f,
      [field]: val,
    }));

    if (stepErrors[field]) {
      setStepErrors((e) => {
        const n = { ...e };

        delete n[field];

        return n;
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Skills
  // ───────────────────────────────────────────────────────────────────────────

  function addSkill() {
    const s = skillInput.trim();

    if (
      s &&
      !applyForm.skills.includes(s)
    ) {
      setF("skills", [
        ...applyForm.skills,
        s,
      ]);

      setSkillInput("");
    }
  }

  function removeSkill(s) {
    setF(
      "skills",
      applyForm.skills.filter(
        (sk) => sk !== s
      )
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Validate step
  // ───────────────────────────────────────────────────────────────────────────

  function validateStep(step) {
    const errs = {};

    if (step === 1) {
      if (!applyForm.fullName.trim()) {
        errs.fullName =
          "Full name is required";
      }

      if (!applyForm.email.trim()) {
        errs.email =
          "Email is required";
      }

      if (!applyForm.phone.trim()) {
        errs.phone =
          "Phone number is required";
      }
    }

    if (step === 2) {
      if (!applyForm.location.trim()) {
        errs.location =
          "Current location is required";
      }
    }

    if (step === 3) {
      if (
        !applyForm.cvFile &&
        !selectedCvId
      ) {
        errs.cvFile =
          "Please upload or select your resume";
      }
    }

    return errs;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Next step
  // ───────────────────────────────────────────────────────────────────────────

  function nextStep() {
    const errs = validateStep(applyStep);

    if (Object.keys(errs).length) {
      setStepErrors(errs);
      return;
    }

    setStepErrors({});
    setDirection("forward");

    setApplyStep((s) =>
      Math.min(s + 1, 5)
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Previous step
  // ───────────────────────────────────────────────────────────────────────────

  function prevStep() {
    setDirection("back");

    setApplyStep((s) =>
      Math.max(s - 1, 1)
    );

    setStepErrors({});
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Submit application
  //
  // IMPORTANT:
  // The third argument is selectedCvId.
  //
  // New uploaded CV:
  //   applyToJob(id, file, null)
  //
  // Saved CV:
  //   applyToJob(id, null, selectedCvId)
  //
  // ───────────────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    try {
      setApplying(true);
      setApplyError("");

      const application = await applyToJob(
        id,
        applyForm.cvFile,
        selectedCvId
      );

      console.log(
        "Application submitted:",
        application
      );

      setApplied(true);
      setApplyStep(5);
    } catch (err) {
      console.error(
        "Application submission error:",
        err
      );

      setApplyError(
        err.response?.data?.message ||
          "Could not submit application."
      );
    } finally {
      setApplying(false);
    }
  }

  const slideClass =
    direction === "forward"
      ? "animate-slide-in-right"
      : "animate-slide-in-left";

  // ───────────────────────────────────────────────────────────────────────────
  // Loading
  // ───────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6fa]">
        <Navbar />

        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </main>
    );
  }

  if (!job) return null;

  const {
    about,
    responsibilities,
    requirements,
  } = parseDescription(job.description);

  const initial = (
    job.company || "C"
  )[0].toUpperCase();

  const salary = formatSalary(
    job.salary
  );

  const displaySkills =
    job.skills?.length > 0
      ? job.skills
      : [];

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(.4,0,.2,1) both;
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.3s cubic-bezier(.4,0,.2,1) both;
        }
      `}</style>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">

        {/* Back */}
        {cameFromApplications ? (
          <button
            onClick={() => navigate("/dashboard/applications")}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition mb-5"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        ) : (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition mb-5"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back to Jobs
          </button>
        )}

        {/* ── Top card ── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">

            {/* Company info */}
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-2xl font-bold text-white">
                {initial}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-0.5">
                  {job.company}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">
                    {job.title}
                  </h1>

                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                    Featured
                  </span>
                </div>

                {/* Location */}
                {job.city && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500">
                    <HiOutlineMapPin className="h-4 w-4 text-gray-400" />

                    {job.city}

                    {job.workMode && (
                      <span className="ml-2 flex items-center gap-1">
                        <HiOutlineBuildingOffice2 className="h-4 w-4 text-gray-400" />

                        {job.workMode}
                      </span>
                    )}
                  </div>
                )}

                {/* Salary */}
                {salary && (
                  <p className="mt-1.5 text-sm font-bold text-gray-800">
                    {salary}
                  </p>
                )}
              </div>
            </div>

            {/* Apply + Bookmark + Share */}
            <div className="flex flex-col gap-2 sm:min-w-[170px]">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApply}
                  disabled={applied}
                  className="flex-1 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition"
                >
                  {applied
                    ? "Applied ✓"
                    : "Apply Now"}
                </button>

                <button
                  onClick={handleToggleSave}
                  title={
                    saved
                      ? "Unsave"
                      : "Save job"
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition"
                >
                  {saved ? (
                    <HiBookmark className="h-5 w-5 text-blue-600" />
                  ) : (
                    <HiOutlineBookmark className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              <ShareDropdown
                jobTitle={job.title}
                jobId={id}
              />
            </div>
          </div>
        </div>

        {/* ── Main 2-col ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px] items-start">

          {/* Left */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">

            <div className="flex border-b border-gray-100 px-6 gap-6">
              {[
                "Job Description",
                "About Company",
              ].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`py-4 text-sm font-medium border-b-2 -mb-px transition ${
                    tab === t
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">

              {tab === "Job Description" && (
                <>
                  {about && (
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-2">
                        About the Role
                      </h3>

                      <p className="text-sm text-gray-600 leading-7">
                        {about}
                      </p>
                    </div>
                  )}

                  {responsibilities.length > 0 && (
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-3">
                        Responsibilities
                      </h3>

                      <ul className="space-y-2.5">
                        {responsibilities.map(
                          (r, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 text-sm text-gray-600"
                            >
                              <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />

                              {r}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {requirements.length > 0 && (
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-3">
                        Requirements
                      </h3>

                      <ul className="space-y-2.5">
                        {requirements.map(
                          (r, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 text-sm text-gray-600"
                            >
                              <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />

                              {r}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {!about &&
                    responsibilities.length ===
                      0 &&
                    requirements.length ===
                      0 &&
                    job.description && (
                      <p className="text-sm text-gray-600 leading-7 whitespace-pre-line">
                        {job.description}
                      </p>
                    )}

                  {!job.description && (
                    <p className="text-sm text-gray-400">
                      No description provided.
                    </p>
                  )}
                </>
              )}

              {tab === "About Company" && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
                      {initial}
                    </div>

                    <div>
                      <p className="font-bold text-gray-900">
                        {job.company}
                      </p>

                      <p className="text-xs text-gray-400">
                        Hiring for {job.title}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 leading-6">
                    No company description available yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-4 lg:sticky lg:top-6">

            {/* Job Overview */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">
                Job Overview
              </h3>

              <div className="space-y-4">
                {[
                  {
                    icon: HiOutlineClock,
                    label: "Experience",
                    value:
                      job.experienceLevel ||
                      "Not specified",
                  },
                  {
                    icon: HiOutlineBriefcase,
                    label: "Job Type",
                    value: job.type || "—",
                  },
                  {
                    icon: HiOutlineMapPin,
                    label: "Location",
                    value: job.city || "—",
                  },
                  {
                    icon: HiOutlineCurrencyDollar,
                    label: "Salary",
                    value:
                      salary ||
                      "Not disclosed",
                  },
                  {
                    icon: HiOutlineCalendarDays,
                    label: "Posted On",
                    value: new Date(
                      job.createdAt
                    ).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    ),
                  },
                  {
                    icon: HiOutlineCalendarDays,
                    label:
                      "Application Deadline",
                    value: job.deadline
                      ? new Date(
                          job.deadline
                        ).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                      : "Not specified",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
                      <row.icon className="h-4 w-4 text-gray-400" />
                    </div>

                    <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                      <p className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                        {row.label}
                      </p>

                      <p className="text-sm font-semibold text-gray-800 text-right truncate">
                        {row.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                Skills
              </h3>

              {displaySkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {displaySkills.map(
                    (s) => (
                      <span
                        key={s}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700"
                      >
                        {s}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  No specific skills listed for this role.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          Apply stepper modal
      ───────────────────────────────────────────────────────────────────── */}

      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400">
                  Applying for
                </p>

                <p className="text-sm font-bold text-gray-800">
                  {job.title} — {job.company}
                </p>
              </div>

              {applyStep < 5 && (
                <button
                  onClick={closeApply}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 transition"
                >
                  <HiXMark className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Step bar */}
            <div className="px-6 pt-5">
              <StepBar current={applyStep} />
            </div>

            {/* Step content */}
            <div
              key={applyStep}
              className={`px-6 pb-2 overflow-y-auto flex-1 ${slideClass}`}
            >

              {/* Error */}
              {applyError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-600">
                  {applyError}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 1
              ───────────────────────────────────────────────────────────── */}

              {applyStep === 1 && (
                <div className="space-y-4">

                  <div>
                    <p className="text-base font-bold text-gray-900">
                      Personal Information
                    </p>

                    <p className="text-xs text-gray-400 mt-0.5">
                      Tell us about yourself
                    </p>
                  </div>

                  <AField
                    label="Full Name"
                    required
                    error={stepErrors.fullName}
                  >
                    <AInput
                      hasError={
                        !!stepErrors.fullName
                      }
                      placeholder="Ahmad Sohail"
                      value={
                        applyForm.fullName
                      }
                      onChange={(e) =>
                        setF(
                          "fullName",
                          e.target.value
                        )
                      }
                    />
                  </AField>

                  <AField
                    label="Email Address"
                    required
                    error={stepErrors.email}
                  >
                    <AInput
                      hasError={
                        !!stepErrors.email
                      }
                      type="email"
                      placeholder="ahmad@email.com"
                      value={
                        applyForm.email
                      }
                      onChange={(e) =>
                        setF(
                          "email",
                          e.target.value
                        )
                      }
                    />
                  </AField>

                  <AField
                    label="Phone Number"
                    required
                    error={stepErrors.phone}
                  >
                    <AInput
                      hasError={
                        !!stepErrors.phone
                      }
                      placeholder="+92 300 1234567"
                      value={
                        applyForm.phone
                      }
                      onChange={(e) =>
                        setF(
                          "phone",
                          e.target.value
                        )
                      }
                    />
                  </AField>

                  <AField label="Alternate Phone (Optional)">
                    <AInput
                      placeholder="+92 321 0000000"
                      value={
                        applyForm.phone2
                      }
                      onChange={(e) =>
                        setF(
                          "phone2",
                          e.target.value
                        )
                      }
                    />
                  </AField>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 2
              ───────────────────────────────────────────────────────────── */}

              {applyStep === 2 && (
                <div className="space-y-4">

                  <div>
                    <p className="text-base font-bold text-gray-900">
                      Professional Information
                    </p>

                    <p className="text-xs text-gray-400 mt-0.5">
                      Your work and professional details
                    </p>
                  </div>

                  <AField label="Current Job Title">
                    <AInput
                      placeholder="React Developer"
                      value={
                        applyForm.jobTitle
                      }
                      onChange={(e) =>
                        setF(
                          "jobTitle",
                          e.target.value
                        )
                      }
                    />
                  </AField>

                  <AField label="Years of Experience" required>
                    <div className="relative">
                      <select
                        value={
                          applyForm.yearsExp
                        }
                        onChange={(e) =>
                          setF(
                            "yearsExp",
                            e.target.value
                          )
                        }
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        {EXP_OPTIONS.map(
                          (o) => (
                            <option
                              key={o}
                              value={o}
                            >
                              {o}
                            </option>
                          )
                        )}
                      </select>

                      <svg
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </AField>

                  <AField
                    label="Current Location"
                    required
                    error={stepErrors.location}
                  >
                    <AInput
                      hasError={
                        !!stepErrors.location
                      }
                      placeholder="Lahore, Pakistan"
                      value={
                        applyForm.location
                      }
                      onChange={(e) =>
                        setF(
                          "location",
                          e.target.value
                        )
                      }
                    />
                  </AField>

                  <AField label="LinkedIn Profile">
                    <AInput
                      placeholder="linkedin.com/in/ahmadsohail"
                      value={
                        applyForm.linkedin
                      }
                      onChange={(e) =>
                        setF(
                          "linkedin",
                          e.target.value
                        )
                      }
                    />
                  </AField>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 3 — Resume & Skills
              ───────────────────────────────────────────────────────────── */}

              {applyStep === 3 && (
                <div className="space-y-4">

                  <div>
                    <p className="text-base font-bold text-gray-900">
                      Resume & Skills
                    </p>

                    <p className="text-xs text-gray-400 mt-0.5">
                      Upload your resume and add key skills
                    </p>
                  </div>

                  {/* Saved CVs */}
                  {savedCVs.length > 0 && (
                    <div>

                      <p className="text-sm font-medium text-gray-700 mb-1.5">
                        Your Saved CVs{" "}
                        <span className="text-gray-400 font-normal">
                          (from profile)
                        </span>
                      </p>

                      <CvDropdown
                        cvs={savedCVs}
                        selectedId={selectedCvId}
                        onSelect={(cv) => {

                          // IMPORTANT:
                          // Store the saved CV's ID.
                          setSelectedCvId(cv._id);

                          // Make sure an uploaded CV is not also submitted.
                          setF("cvFile", null);

                          const FILE_BASE = (
                            import.meta.env
                              .VITE_API_URL ||
                            "http://localhost:5000/api"
                          ).replace(
                            /\/api$/,
                            ""
                          );

                          setPreviewUrl(
                            `${FILE_BASE}${cv.url}`
                          );
                        }}
                        onClear={() => {
                          setSelectedCvId(null);
                          setPreviewUrl(null);
                        }}
                      />

                      {/* Preview selected saved CV */}
                      {previewUrl &&
                        selectedCvId && (
                          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/40 overflow-hidden">

                            <div className="flex items-center justify-between px-4 py-2 border-b border-blue-100">
                              <p className="text-xs font-semibold text-blue-700">
                                CV Preview
                              </p>

                              <a
                                href={previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Open in new tab
                              </a>
                            </div>

                            <iframe
                              src={previewUrl}
                              title="CV Preview"
                              className="w-full h-56"
                              style={{
                                border: "none",
                              }}
                            />
                          </div>
                        )}

                      <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-gray-200" />

                        <span className="text-xs text-gray-400 font-medium">
                          OR upload new
                        </span>

                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    </div>
                  )}

                  {/* Upload new CV */}
                  <AField
                    label={
                      savedCVs.length > 0
                        ? "Upload a Different Resume"
                        : "Upload Resume"
                    }
                    required={!selectedCvId}
                    error={stepErrors.cvFile}
                  >
                    <div
                      className={`relative rounded-xl border-2 border-dashed p-5 text-center transition ${
                        stepErrors.cvFile
                          ? "border-red-300 bg-red-50/30"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/20"
                      }`}
                    >

                      {applyForm.cvFile ? (
                        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">

                          <div className="flex items-center gap-2">
                            <HiOutlineDocumentText className="h-5 w-5 text-blue-500" />

                            <div className="text-left">
                              <p className="text-sm font-medium text-gray-700">
                                {applyForm.cvFile.name}
                              </p>

                              <p className="text-[10px] text-gray-400">
                                {(
                                  applyForm.cvFile
                                    .size /
                                  1024 /
                                  1024
                                ).toFixed(1)}{" "}
                                MB
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">

                            {/* Preview uploaded file */}
                            <button
                              type="button"
                              onClick={() => {
                                const url =
                                  URL.createObjectURL(
                                    applyForm.cvFile
                                  );

                                setPreviewUrl(
                                  url
                                );

                                setSelectedCvId(
                                  null
                                );
                              }}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Preview
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setF(
                                  "cvFile",
                                  null
                                );

                                setPreviewUrl(
                                  null
                                );
                              }}
                              className="text-gray-400 hover:text-red-500 transition"
                            >
                              <HiOutlineTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <HiOutlineCloudArrowUp className="mx-auto mb-2 h-8 w-8 text-gray-300" />

                          <p className="text-sm text-gray-500">
                            Drag & drop your file here
                            <br />

                            <span className="text-blue-600 font-medium">
                              or click to browse
                            </span>
                          </p>

                          <p className="mt-1 text-[10px] text-gray-400">
                            PDF, DOC, DOCX (Max 5MB)
                          </p>

                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={(e) => {
                              const file =
                                e.target.files[0];

                              setF(
                                "cvFile",
                                file
                              );

                              // Selecting a new file
                              // clears saved CV selection.
                              setSelectedCvId(
                                null
                              );

                              if (file) {
                                setPreviewUrl(
                                  URL.createObjectURL(
                                    file
                                  )
                                );
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </AField>

                  {/* Preview uploaded CV */}
                  {previewUrl &&
                    !selectedCvId &&
                    applyForm.cvFile && (
                      <div className="rounded-xl border border-gray-200 overflow-hidden">

                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-600">
                            CV Preview
                          </p>

                          <button
                            onClick={() =>
                              setPreviewUrl(
                                null
                              )
                            }
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Hide
                          </button>
                        </div>

                        <iframe
                          src={previewUrl}
                          title="CV Preview"
                          className="w-full h-64"
                          style={{
                            border: "none",
                          }}
                        />
                      </div>
                    )}

                  {/* Skills */}
                  <AField label="Skills (Add your top skills)">
                    <div className="flex gap-2">
                      <input
                        value={skillInput}
                        onChange={(e) =>
                          setSkillInput(
                            e.target.value
                          )
                        }
                        onKeyDown={(e) => {
                          if (
                            e.key ===
                            "Enter"
                          ) {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                        placeholder="e.g. React, TypeScript..."
                        className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <button
                        type="button"
                        onClick={addSkill}
                        className="rounded-xl border border-blue-200 bg-blue-50 px-3 text-blue-600 hover:bg-blue-100 transition"
                      >
                        <HiOutlinePlus className="h-4 w-4" />
                      </button>
                    </div>

                    {applyForm.skills
                      .length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {applyForm.skills.map(
                          (s) => (
                            <span
                              key={s}
                              className="flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700"
                            >
                              {s}

                              <button
                                onClick={() =>
                                  removeSkill(
                                    s
                                  )
                                }
                                className="ml-0.5 hover:text-red-500"
                              >
                                <HiXMark className="h-3 w-3" />
                              </button>
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </AField>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 4 — Review
                  
                  NOTE:
                  CV evaluation is intentionally NOT shown here.
              ───────────────────────────────────────────────────────────── */}

              {applyStep === 4 && (
                <div className="space-y-4">

                  <div>
                    <p className="text-base font-bold text-gray-900">
                      Review Application
                    </p>

                    <p className="text-xs text-gray-400 mt-0.5">
                      Please review your details before submitting
                    </p>
                  </div>

                  {[
                    {
                      title:
                        "Personal Information",
                      step: 1,
                      rows: [
                        {
                          label:
                            applyForm.fullName,
                        },
                        {
                          label:
                            applyForm.email,
                        },
                        {
                          label:
                            applyForm.phone,
                        },
                      ],
                    },

                    {
                      title:
                        "Professional Information",
                      step: 2,
                      rows: [
                        {
                          label:
                            applyForm.jobTitle ||
                            "—",
                        },
                        {
                          label: `${applyForm.yearsExp} Years of Experience`,
                        },
                        {
                          label:
                            applyForm.location,
                        },
                        ...(applyForm.linkedin
                          ? [
                              {
                                label:
                                  applyForm.linkedin,
                              },
                            ]
                          : []),
                      ],
                    },

                    {
                      title: "Resume",
                      step: 3,
                      rows: [
                        {
                          label: selectedCvId
                            ? savedCVs.find(
                                (c) =>
                                  c._id ===
                                  selectedCvId
                              )?.label ||
                              "Saved CV"
                            : applyForm.cvFile
                            ? `${applyForm.cvFile.name} (${(
                                applyForm.cvFile
                                  .size /
                                1024 /
                                1024
                              ).toFixed(
                                1
                              )} MB)`
                            : "No file uploaded",
                        },
                      ],
                    },

                    ...(applyForm.skills
                      .length > 0
                      ? [
                          {
                            title:
                              "Skills",
                            step: 3,
                            rows: [
                              {
                                label:
                                  applyForm.skills.join(
                                    ", "
                                  ),
                              },
                            ],
                          },
                        ]
                      : []),
                  ].map((section) => (
                    <div
                      key={section.title}
                      className="rounded-xl border border-gray-100 overflow-hidden"
                    >
                      <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-100">

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {section.title}
                        </p>

                        <button
                          onClick={() => {
                            setDirection(
                              "back"
                            );

                            setApplyStep(
                              section.step
                            );
                          }}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition"
                        >
                          Edit
                        </button>
                      </div>

                      <div className="px-4 py-3 space-y-1">
                        {section.rows.map(
                          (r, i) => (
                            <p
                              key={i}
                              className="text-sm text-gray-700"
                            >
                              {r.label}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 5 — Success
                  
                  CV evaluation is intentionally NOT shown here.
              ───────────────────────────────────────────────────────────── */}

              {applyStep === 5 && (
                <div className="py-8 text-center space-y-4">

                  <div className="flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                      <HiOutlineCheckCircle className="h-9 w-9 text-emerald-500" />
                    </div>
                  </div>

                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      Application Submitted!
                    </p>

                    <p className="text-sm text-gray-500 mt-1 leading-6">
                      Thank you for applying.
                      We will review your
                      application and get back
                      to you soon.
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-left space-y-2">

                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      What happens next?
                    </p>

                    {[
                      "Our team will review your application",
                      "If shortlisted, we will contact you",
                      "You can track your application in My Applications",
                    ].map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />

                        {t}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={closeApply}
                    className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* ───────────────────────────────────────────────────────────────
                Bottom buttons
            ─────────────────────────────────────────────────────────────── */}

            {applyStep < 5 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50/40">

                <button
                  type="button"
                  onClick={
                    applyStep === 1
                      ? closeApply
                      : prevStep
                  }
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  {applyStep === 1 ? (
                    "Cancel"
                  ) : (
                    <>
                      <HiOutlineArrowLeft className="h-4 w-4" />

                      Back
                    </>
                  )}
                </button>

                {applyStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
                  >
                    Save & Continue

                    <HiOutlineArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={applying}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
                  >
                    <HiOutlinePaperAirplane className="h-4 w-4" />

                    {applying
                      ? "Submitting..."
                      : "Submit Application"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}