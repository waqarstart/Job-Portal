import { useEffect, useRef, useState } from "react";
import {
  HiOutlineCamera,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineXMark,
} from "react-icons/hi2";
import CandidateLayout from "../layouts/CandidateLayout";
import { getMyProfile, updateMyProfile, uploadProfilePicture } from "../services/userService";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");
const EDUCATION_LEVELS = ["School", "Intermediate", "Undergraduate", "Master", "PhD"];
const EXPERIENCE_OPTIONS = Array.from({ length: 21 }, (_, i) => i);

const emptyExp = { title: "", company: "", startDate: "", endDate: "", description: "" };
const emptyEdu = { level: "Undergraduate", institution: "", degree: "", startDate: "", endDate: "" };

export default function CandidateProfile() {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [picUploading, setPicUploading] = useState(false);
  const picRef = useRef();

  // Section-level edit state
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingPro, setEditingPro] = useState(false);
  const [basicDraft, setBasicDraft] = useState({});
  const [proDraft, setProDraft] = useState({});

  // Skills
  const [skillInput, setSkillInput] = useState("");

  // Languages
  const [langInput, setLangInput] = useState("");

  // Experience edit state
  const [editingExpIndex, setEditingExpIndex] = useState(null);
  const [expDraft, setExpDraft] = useState({});
  const [addingExp, setAddingExp] = useState(false);

  // Education edit state
  const [editingEduIndex, setEditingEduIndex] = useState(null);
  const [eduDraft, setEduDraft] = useState({});
  const [addingEdu, setAddingEdu] = useState(false);

  // Social edit
  const [editingSocial, setEditingSocial] = useState(false);
  const [socialDraft, setSocialDraft] = useState({});

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const d = await getMyProfile();
    setProfile(d);
  }

  async function save(updates) {
    setSaving(true);
    try {
      const updated = await updateMyProfile(updates);
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.response?.data?.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePicChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPicUploading(true);
    try {
      const updated = await uploadProfilePicture(file);
      setProfile(updated);
    } catch (err) {
      alert(err.response?.data?.message || "Could not upload picture.");
    } finally {
      setPicUploading(false);
    }
  }

  // ── Skills ──
  async function addSkill() {
    const s = skillInput.trim();
    if (!s || profile.skills?.includes(s)) return;
    await save({ skills: [...(profile.skills || []), s] });
    setSkillInput("");
  }
  async function removeSkill(s) {
    await save({ skills: profile.skills.filter((x) => x !== s) });
  }

  // ── Languages ──
  async function addLang() {
    const l = langInput.trim();
    if (!l || profile.languages?.includes(l)) return;
    await save({ languages: [...(profile.languages || []), l] });
    setLangInput("");
  }
  async function removeLang(l) {
    await save({ languages: profile.languages.filter((x) => x !== l) });
  }

  // ── Experience ──
  async function saveExp() {
    const list = [...(profile.workExperience || [])];
    if (addingExp) list.push(expDraft);
    else list[editingExpIndex] = expDraft;
    await save({ workExperience: list });
    setEditingExpIndex(null);
    setAddingExp(false);
  }
  async function deleteExp(i) {
    await save({ workExperience: profile.workExperience.filter((_, j) => j !== i) });
  }

  // ── Education ──
  async function saveEdu() {
    const list = [...(profile.education || [])];
    if (addingEdu) list.push(eduDraft);
    else list[editingEduIndex] = eduDraft;
    await save({ education: list });
    setEditingEduIndex(null);
    setAddingEdu(false);
  }
  async function deleteEdu(i) {
    await save({ education: profile.education.filter((_, j) => j !== i) });
  }

  if (!profile) return (
    <CandidateLayout title="My Profile">
      <p className="text-gray-500">Loading...</p>
    </CandidateLayout>
  );

  const initials = (profile.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <CandidateLayout title="My Profile" subtitle="Keep your profile complete to stand out to employers." profilePicture={profile.profilePicture}>
      {saved && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 flex items-center gap-2">
          <HiOutlineCheck className="h-4 w-4" /> Saved successfully.
        </div>
      )}

      <div className="space-y-5">

        {/* ── Basic Info ── */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Basic Info</h2>
            {!editingBasic && (
              <button onClick={() => { setBasicDraft({ name: profile.name, phone: profile.phone, location: profile.location }); setEditingBasic(true); }}
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                <HiOutlinePencil className="h-4 w-4" /> Edit
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="relative shrink-0">
              {profile.profilePicture ? (
                <img src={`${FILE_BASE}${profile.profilePicture}`} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">{initials}</div>
              )}
              <button onClick={() => picRef.current?.click()} className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow">
                <HiOutlineCamera className="h-4 w-4" />
              </button>
              <input ref={picRef} type="file" accept="image/*" onChange={handlePicChange} className="hidden" />
            </div>
            {picUploading && <p className="text-sm text-gray-400">Uploading...</p>}
          </div>

          {!editingBasic ? (
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Full name" value={profile.name} />
              <Row label="Phone" value={profile.phone} />
              <Row label="Location" value={profile.location} />
            </dl>
          ) : (
            <div className="mt-4 space-y-3">
              <Field label="Full name" value={basicDraft.name || ""} onChange={(v) => setBasicDraft({ ...basicDraft, name: v })} />
              <Field label="Phone" value={basicDraft.phone || ""} onChange={(v) => setBasicDraft({ ...basicDraft, phone: v })} />
              <Field label="Location" value={basicDraft.location || ""} onChange={(v) => setBasicDraft({ ...basicDraft, location: v })} />
              <SaveCancel saving={saving} onSave={async () => { await save(basicDraft); setEditingBasic(false); }} onCancel={() => setEditingBasic(false)} />
            </div>
          )}
        </section>

        {/* ── Professional Info ── */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Professional Information</h2>
            {!editingPro && (
              <button onClick={() => { setProDraft({ professionalTitle: profile.professionalTitle, bio: profile.bio, yearsOfExperience: profile.yearsOfExperience, currentPosition: profile.currentPosition, expectedSalary: profile.expectedSalary }); setEditingPro(true); }}
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                <HiOutlinePencil className="h-4 w-4" /> Edit
              </button>
            )}
          </div>

          {!editingPro ? (
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Title" value={profile.professionalTitle} />
              <Row label="Current position" value={profile.currentPosition} />
              <Row label="Experience" value={profile.yearsOfExperience !== undefined ? `${profile.yearsOfExperience} year(s)` : null} />
              <Row label="Expected salary" value={profile.expectedSalary} />
              {profile.bio && <div className="mt-3"><p className="text-xs text-gray-400 uppercase tracking-wide">Bio</p><p className="mt-1 text-gray-700">{profile.bio}</p></div>}
            </dl>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Professional title" value={proDraft.professionalTitle || ""} onChange={(v) => setProDraft({ ...proDraft, professionalTitle: v })} />
              <Field label="Current position" value={proDraft.currentPosition || ""} onChange={(v) => setProDraft({ ...proDraft, currentPosition: v })} />
              <div>
                <label className="text-sm font-medium text-gray-700">Years of experience</label>
                <select value={proDraft.yearsOfExperience ?? ""} onChange={(e) => setProDraft({ ...proDraft, yearsOfExperience: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600">
                  <option value="">Select</option>
                  {EXPERIENCE_OPTIONS.map((n) => <option key={n} value={n}>{n === 0 ? "Less than 1 year" : `${n} year(s)`}</option>)}
                </select>
              </div>
              <Field label="Expected salary" value={proDraft.expectedSalary || ""} onChange={(v) => setProDraft({ ...proDraft, expectedSalary: v })} placeholder="e.g. PKR 80,000/month" />
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <textarea rows={3} value={proDraft.bio || ""} onChange={(e) => setProDraft({ ...proDraft, bio: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
              </div>
              <div className="sm:col-span-2"><SaveCancel saving={saving} onSave={async () => { await save(proDraft); setEditingPro(false); }} onCancel={() => setEditingPro(false)} /></div>
            </div>
          )}
        </section>

        {/* ── Experience ── */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Experience</h2>
            <button onClick={() => { setExpDraft({ ...emptyExp }); setAddingExp(true); setEditingExpIndex(null); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
              <HiOutlinePlus className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 divide-y">
            {(profile.workExperience || []).map((exp, i) => (
              <div key={i} className="py-4">
                {editingExpIndex === i && !addingExp ? (
                  <ExpForm draft={expDraft} setDraft={setExpDraft} onSave={saveExp} onCancel={() => setEditingExpIndex(null)} saving={saving} />
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{exp.title}</p>
                      <p className="text-sm font-semibold text-blue-600">{exp.company}</p>
                      <p className="text-sm font-medium text-gray-700">{exp.startDate}{exp.endDate ? ` - ${exp.endDate}` : ""}{exp.location ? ` | ${exp.location}` : ""}</p>
                      {exp.description && <p className="mt-1 text-sm text-gray-600">{exp.description}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2 ml-4">
                      <button onClick={() => { setExpDraft({ ...exp }); setEditingExpIndex(i); setAddingExp(false); }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
                        <HiOutlinePencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteExp(i)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100">
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {addingExp && (
              <div className="pt-4">
                <ExpForm draft={expDraft} setDraft={setExpDraft} onSave={saveExp} onCancel={() => setAddingExp(false)} saving={saving} />
              </div>
            )}

            {!profile.workExperience?.length && !addingExp && (
              <p className="py-4 text-sm text-gray-400">No experience added yet. Click + to add.</p>
            )}
          </div>
        </section>

        {/* ── Skills ── */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-lg">Skills</h2>
          {(!profile.skills?.length) && <p className="mt-3 text-sm text-gray-400">No skills have been added yet.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {(profile.skills || []).map((s) => (
              <span key={s} className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                {s}
                <button onClick={() => removeSkill(s)} className="text-blue-400 hover:text-blue-600"><HiOutlineXMark className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="Type a skill and press Enter" className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
            <button onClick={addSkill} className="rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">Add</button>
          </div>
        </section>

        {/* ── Education ── */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Education</h2>
            <button onClick={() => { setEduDraft({ ...emptyEdu }); setAddingEdu(true); setEditingEduIndex(null); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
              <HiOutlinePlus className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 divide-y">
            {(profile.education || []).map((edu, i) => (
              <div key={i} className="py-4">
                {editingEduIndex === i && !addingEdu ? (
                  <EduForm draft={eduDraft} setDraft={setEduDraft} onSave={saveEdu} onCancel={() => setEditingEduIndex(null)} saving={saving} />
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{edu.institution}</p>
                      <p className="text-sm font-semibold text-gray-800">{edu.level}{edu.degree ? `/${edu.degree}` : ""}</p>
                      <p className="text-sm font-medium text-gray-700">{edu.degree}</p>
                      {edu.startDate && <p className="text-sm text-gray-500">{edu.startDate}{edu.endDate ? ` - ${edu.endDate}` : ""}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2 ml-4">
                      <button onClick={() => { setEduDraft({ ...edu }); setEditingEduIndex(i); setAddingEdu(false); }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
                        <HiOutlinePencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteEdu(i)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100">
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {addingEdu && (
              <div className="pt-4">
                <EduForm draft={eduDraft} setDraft={setEduDraft} onSave={saveEdu} onCancel={() => setAddingEdu(false)} saving={saving} />
              </div>
            )}

            {!profile.education?.length && !addingEdu && (
              <p className="py-4 text-sm text-gray-400">No education added yet. Click + to add.</p>
            )}
          </div>
        </section>

        {/* ── Languages ── */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-lg">Languages</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(profile.languages || []).map((l) => (
              <span key={l} className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-700">
                {l}
                <button onClick={() => removeLang(l)} className="text-teal-400 hover:text-teal-600"><HiOutlineXMark className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={langInput} onChange={(e) => setLangInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLang())}
              placeholder="Type a language and press Enter" className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
            <button onClick={addLang} className="rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">Add</button>
          </div>
        </section>

        {/* ── Portfolio & Social ── */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Portfolio & Social Links</h2>
            {!editingSocial && (
              <button onClick={() => { setSocialDraft({ portfolioUrl: profile.portfolioUrl, linkedinUrl: profile.linkedinUrl, githubUrl: profile.githubUrl }); setEditingSocial(true); }}
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                <HiOutlinePencil className="h-4 w-4" /> Edit
              </button>
            )}
          </div>

          {!editingSocial ? (
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Portfolio" value={profile.portfolioUrl} link />
              <Row label="LinkedIn" value={profile.linkedinUrl} link />
              <Row label="GitHub" value={profile.githubUrl} link />
            </dl>
          ) : (
            <div className="mt-4 space-y-3">
              <Field label="Portfolio URL" value={socialDraft.portfolioUrl || ""} onChange={(v) => setSocialDraft({ ...socialDraft, portfolioUrl: v })} placeholder="https://yoursite.com" />
              <Field label="LinkedIn" value={socialDraft.linkedinUrl || ""} onChange={(v) => setSocialDraft({ ...socialDraft, linkedinUrl: v })} placeholder="https://linkedin.com/in/yourname" />
              <Field label="GitHub" value={socialDraft.githubUrl || ""} onChange={(v) => setSocialDraft({ ...socialDraft, githubUrl: v })} placeholder="https://github.com/yourname" />
              <SaveCancel saving={saving} onSave={async () => { await save(socialDraft); setEditingSocial(false); }} onCancel={() => setEditingSocial(false)} />
            </div>
          )}
        </section>
      </div>
    </CandidateLayout>
  );
}

// ── Reusable sub-components ────────────────────────────────────────────────────

function Row({ label, value, link }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <dt className="w-36 shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm font-semibold text-gray-900 break-all">
        {link ? <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{value}</a> : value}
      </dd>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
    </div>
  );
}

function SaveCancel({ onSave, onCancel, saving }) {
  return (
    <div className="flex gap-2">
      <button onClick={onCancel} className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
        <HiOutlineXMark className="h-4 w-4" /> Cancel
      </button>
      <button onClick={onSave} disabled={saving} className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        <HiOutlineCheck className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function ExpForm({ draft, setDraft, onSave, onCancel, saving }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Job title" value={draft.title || ""} onChange={(v) => setDraft({ ...draft, title: v })} />
        <Field label="Company" value={draft.company || ""} onChange={(v) => setDraft({ ...draft, company: v })} />
        <Field label="Start date" value={draft.startDate || ""} onChange={(v) => setDraft({ ...draft, startDate: v })} placeholder="e.g. Jan 2022" />
        <Field label="End date" value={draft.endDate || ""} onChange={(v) => setDraft({ ...draft, endDate: v })} placeholder="e.g. Dec 2023 or Present" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea rows={2} value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
      </div>
      <SaveCancel saving={saving} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

function EduForm({ draft, setDraft, onSave, onCancel, saving }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700">Level</label>
          <select value={draft.level || "Undergraduate"} onChange={(e) => setDraft({ ...draft, level: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600">
            {["School", "Intermediate", "Undergraduate", "Master", "PhD"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <Field label="Institution" value={draft.institution || ""} onChange={(v) => setDraft({ ...draft, institution: v })} />
        <Field label="Degree / Subject" value={draft.degree || ""} onChange={(v) => setDraft({ ...draft, degree: v })} />
        <Field label="Start year" value={draft.startDate || ""} onChange={(v) => setDraft({ ...draft, startDate: v })} placeholder="e.g. 2018" />
        <Field label="End year" value={draft.endDate || ""} onChange={(v) => setDraft({ ...draft, endDate: v })} placeholder="e.g. 2022 or Present" />
      </div>
      <SaveCancel saving={saving} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}
