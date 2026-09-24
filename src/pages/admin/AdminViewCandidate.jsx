import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  HiOutlineArrowLeft, HiOutlineBriefcase, HiOutlineAcademicCap,
  HiOutlineLanguage, HiOutlineLink, HiOutlineDocumentText,
  HiOutlineMapPin, HiOutlinePhone, HiOutlineEnvelope,
  HiOutlineSparkles,
} from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";
import { getUserById } from "../../services/userService";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

function Section({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="font-semibold text-lg text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, link }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-1.5">
      <dt className="w-40 shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm font-semibold text-gray-900 break-all">
        {link ? <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{value}</a> : value}
      </dd>
    </div>
  );
}

export default function AdminViewCandidate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getUserById(id)
      .then(setProfile)
      .catch(() => setError("Could not load this candidate's profile."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AdminLayout title="Candidate Profile">
      <button
        onClick={() => navigate("/admin/users")}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-blue-600"
      >
        <HiOutlineArrowLeft className="h-4 w-4" /> Back to Manage Users
      </button>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading candidate profile…</div>
      ) : error ? (
        <div className="py-16 text-center text-sm text-red-500">{error}</div>
      ) : !profile ? null : (
        <div className="space-y-6">
          {/* Header card */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              {profile.profilePicture ? (
                <img src={`${FILE_BASE}${profile.profilePicture}`} alt={profile.name} className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold text-white">
                  {profile.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-sm text-gray-500">{profile.professionalTitle || profile.primaryProfession || "Candidate"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><HiOutlineEnvelope className="h-4 w-4" /> {profile.email}</span>
                  {profile.phone && <span className="flex items-center gap-1.5"><HiOutlinePhone className="h-4 w-4" /> {profile.phone}</span>}
                  {(profile.city || profile.country || profile.location) && (
                    <span className="flex items-center gap-1.5"><HiOutlineMapPin className="h-4 w-4" /> {profile.location || [profile.city, profile.country].filter(Boolean).join(", ")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <Section icon={HiOutlineSparkles} title="About">
              <p className="text-sm leading-relaxed text-gray-700">{profile.bio}</p>
            </Section>
          )}

          {/* Basic info */}
          <Section icon={HiOutlineSparkles} title="Basic Information">
            <dl>
              <Row label="Gender" value={profile.gender} />
              <Row label="Nationality" value={profile.nationality} />
              <Row label="Date of Birth" value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : ""} />
              <Row label="Years of Experience" value={profile.yearsOfExperience !== undefined ? String(profile.yearsOfExperience) : ""} />
              <Row label="Current Position" value={profile.currentPosition} />
              <Row label="Employment Status" value={profile.currentEmploymentStatus} />
              <Row label="Availability" value={profile.availability} />
              <Row label="Expected Salary" value={profile.expectedSalary ? `${profile.expectedSalary} ${profile.salaryCurrency || ""}` : ""} />
            </dl>
          </Section>

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <Section icon={HiOutlineSparkles} title="Skills">
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span key={s} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">{s}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Languages */}
          {profile.languages?.length > 0 && (
            <Section icon={HiOutlineLanguage} title="Languages">
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((l) => (
                  <span key={l} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">{l}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Work Experience */}
          {profile.workExperience?.length > 0 && (
            <Section icon={HiOutlineBriefcase} title="Work Experience">
              <div className="space-y-4">
                {profile.workExperience.map((exp, i) => (
                  <div key={i} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <p className="font-semibold text-gray-900">{exp.title}</p>
                    <p className="text-sm text-gray-600">{exp.company}</p>
                    <p className="text-xs text-gray-400">{exp.startDate} — {exp.endDate || "Present"}</p>
                    {exp.description && <p className="mt-1 text-sm text-gray-700">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Education */}
          {profile.education?.length > 0 && (
            <Section icon={HiOutlineAcademicCap} title="Education">
              <div className="space-y-4">
                {profile.education.map((edu, i) => (
                  <div key={i} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <p className="font-semibold text-gray-900">{edu.degree || edu.level}</p>
                    <p className="text-sm text-gray-600">{edu.institution}</p>
                    <p className="text-xs text-gray-400">{edu.startDate} — {edu.endDate || "Present"}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Links */}
          {(profile.portfolioUrl || profile.linkedinUrl || profile.githubUrl) && (
            <Section icon={HiOutlineLink} title="Portfolio & Social">
              <dl>
                <Row label="Portfolio" value={profile.portfolioUrl} link />
                <Row label="LinkedIn" value={profile.linkedinUrl} link />
                <Row label="GitHub" value={profile.githubUrl} link />
              </dl>
            </Section>
          )}

          {/* Resume / CV */}
          {profile.resumeUrl && (
            <Section icon={HiOutlineDocumentText} title="Resume / CV">
              <a
                href={`${FILE_BASE}${profile.resumeUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition"
              >
                <HiOutlineDocumentText className="h-4 w-4" /> View Resume
              </a>
            </Section>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
