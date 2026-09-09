import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineCamera, HiOutlineCalendarDays, HiOutlineGlobeAlt,
  HiOutlineMapPin, HiOutlineXMark, HiOutlinePlus, HiOutlineEye,
  HiOutlineBuildingOffice2, HiOutlineUsers, HiOutlineChevronRight,
  HiOutlineBriefcase,
} from "react-icons/hi2";
import { FaLinkedinIn, FaFacebookF } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import HRLayout from "../../layouts/HRLayout";
import Dropdown from "../../components/Dropdown";
import { getHRCompany, saveHRCompany, getHRJobs } from "../../services/hrService";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const SIZE_OPTIONS = ["1-10", "11-50", "51-100", "101-500", "500+"];
const INDUSTRY_OPTIONS = [
  "Software & Technology", "Finance & Banking", "Healthcare", "Education",
  "E-commerce & Retail", "Manufacturing", "Telecommunications", "Marketing & Advertising",
  "Real Estate", "Other",
];
const INDUSTRY_DROPDOWN_OPTIONS = INDUSTRY_OPTIONS.map((s) => ({ value: s, label: s }));

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => {
  const y = String(CURRENT_YEAR - i);
  return { value: y, label: y };
});

const JOB_ICON_COLORS = [
  "bg-blue-100 text-blue-600", "bg-violet-100 text-violet-600",
  "bg-emerald-100 text-emerald-600", "bg-amber-100 text-amber-600",
];

function emptyForm() {
  return {
    name: "", description: "", industry: "", website: "", location: "",
    size: "", foundedYear: "", mission: "", culture: "",
    socialLinks: { linkedin: "", website: "", facebook: "", twitter: "" },
  };
}

export default function HRCompanyProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm());

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [existingGallery, setExistingGallery] = useState([]); // saved URLs to keep
  const [newGalleryFiles, setNewGalleryFiles] = useState([]); // { file, preview }

  const [jobs, setJobs] = useState([]);
  const [openJobsCount, setOpenJobsCount] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const logoRef = useRef();
  const coverRef = useRef();
  const galleryRef = useRef();

  useEffect(() => {
    getHRCompany().then((c) => {
      if (c) {
        setForm({
          name: c.name || "",
          description: c.description || "",
          industry: c.industry || "",
          website: c.website || "",
          location: c.location || "",
          size: c.size || "",
          foundedYear: c.foundedYear || "",
          mission: c.mission || "",
          culture: c.culture || "",
          socialLinks: {
            linkedin: c.socialLinks?.linkedin || "",
            website: c.socialLinks?.website || "",
            facebook: c.socialLinks?.facebook || "",
            twitter: c.socialLinks?.twitter || "",
          },
        });
        if (c.logo) setLogoPreview(`${FILE_BASE}${c.logo}`);
        if (c.coverImage) setCoverPreview(`${FILE_BASE}${c.coverImage}`);
        setExistingGallery((c.gallery || []).map((g) => `${FILE_BASE}${g}`));
      }
    });

    getHRJobs({ tab: "active", limit: 50, sort: "newest" })
      .then((res) => {
        setJobs(res.jobs || []);
        setOpenJobsCount(res.stats?.activeJobs ?? (res.jobs || []).length);
      })
      .catch(() => { setJobs([]); setOpenJobsCount(0); });
  }, []);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function setSocial(field, value) {
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [field]: value } }));
  }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleCoverChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleGalleryAdd(e) {
    const files = Array.from(e.target.files || []);
    const totalCount = existingGallery.length + newGalleryFiles.length + files.length;
    if (totalCount > 8) {
      setError("You can have up to 8 gallery images.");
    }
    const room = Math.max(0, 8 - (existingGallery.length + newGalleryFiles.length));
    const toAdd = files.slice(0, room).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setNewGalleryFiles((prev) => [...prev, ...toAdd]);
    e.target.value = "";
  }

  function removeExistingGalleryImage(index) {
    setExistingGallery((prev) => prev.filter((_, i) => i !== index));
  }
  function removeNewGalleryImage(index) {
    setNewGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("industry", form.industry);
      fd.append("website", form.website);
      fd.append("location", form.location);
      fd.append("size", form.size);
      fd.append("foundedYear", form.foundedYear);
      fd.append("mission", form.mission);
      fd.append("culture", form.culture);
      fd.append("socialLinks[linkedin]", form.socialLinks.linkedin);
      fd.append("socialLinks[website]", form.socialLinks.website);
      fd.append("socialLinks[facebook]", form.socialLinks.facebook);
      fd.append("socialLinks[twitter]", form.socialLinks.twitter);

      if (logoFile) fd.append("logo", logoFile);
      if (coverFile) fd.append("coverImage", coverFile);

      // Existing gallery URLs are full FILE_BASE URLs on screen — strip the
      // prefix back off so the server gets the same relative path it gave us.
      existingGallery.forEach((url) => {
        fd.append("existingGallery", url.replace(FILE_BASE, ""));
      });
      newGalleryFiles.forEach(({ file }) => fd.append("gallery", file));

      const result = await saveHRCompany(fd);

      // Reconcile local preview state with what the server actually stored.
      setNewGalleryFiles([]);
      setExistingGallery((result.gallery || []).map((g) => `${FILE_BASE}${g}`));
      setLogoFile(null);
      setCoverFile(null);

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save company profile.");
    } finally {
      setSaving(false);
    }
  }

  const galleryPreviewItems = useMemo(() => ([
    ...existingGallery.map((url, i) => ({ key: `e${i}`, url, onRemove: () => removeExistingGalleryImage(i) })),
    ...newGalleryFiles.map((g, i) => ({ key: `n${i}`, url: g.preview, onRemove: () => removeNewGalleryImage(i) })),
  ]), [existingGallery, newGalleryFiles]);

  const galleryFull = galleryPreviewItems.length >= 8;
  const employeeLabel = form.size ? `${form.size} Employees` : "";

  return (
    <HRLayout
      title="Company Profile"
      subtitle="Manage your company information and how it appears to candidates."
      headerExtra={
        <>
          {form.name && (
            <button
              onClick={() => navigate(`/companies/${encodeURIComponent(form.name)}`)}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
            >
              <HiOutlineEye className="h-4 w-4" />
              Preview Public Profile
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6 items-start">

        {/* ══════════════════ LEFT — Edit form ══════════════════ */}
        <form onSubmit={handleSave} className="space-y-6">
          {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
          {saved && <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">Company profile saved.</div>}

          {/* ── Cover + logo ── */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div
              className="relative h-56 bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900 bg-cover bg-center"
              style={coverPreview ? { backgroundImage: `url(${coverPreview})` } : undefined}
            >
              <div className="absolute inset-0 bg-black/20" />

              <button
                type="button"
                onClick={() => coverRef.current?.click()}
                className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-gray-700 shadow hover:bg-white transition"
              >
                <HiOutlineCamera className="h-4 w-4" /> Change Cover
              </button>
              <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />

              <div className="absolute left-6 bottom-6 flex items-end gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-blue-600">
                      {form.name ? form.name[0].toUpperCase() : "?"}
                    </span>
                  )}
                </div>
                <div className="pb-1.5 text-white">
                  <h2 className="text-2xl font-bold leading-tight">{form.name || "Your Company"}</h2>
                  <p className="text-sm text-blue-100">
                    {[form.industry, form.location].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-gray-700 shadow hover:bg-white transition"
              >
                <HiOutlineCamera className="h-4 w-4" /> Change Logo
              </button>
              <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </div>
          </div>

          {/* ── Company information ── */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
            <h2 className="font-bold text-gray-900">Company Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Company Name" required value={form.name} onChange={(v) => set("name", v)} />

              <div>
                <label className="text-sm font-medium text-gray-700">Industry <span className="text-red-500">*</span></label>
                <Dropdown
                  fullWidth
                  className="mt-1"
                  value={form.industry}
                  onChange={(v) => set("industry", v)}
                  options={[{ value: "", label: "Select industry" }, ...INDUSTRY_DROPDOWN_OPTIONS]}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Company Size <span className="text-red-500">*</span></label>
                <EditableCombobox
                  className="mt-1"
                  value={form.size}
                  onChange={(v) => set("size", v)}
                  options={SIZE_OPTIONS}
                  suffix=" Employees"
                  placeholder="Select or type, e.g. 50-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Founded Year <span className="text-red-500">*</span></label>
                <Dropdown
                  fullWidth
                  className="mt-1"
                  value={form.foundedYear}
                  onChange={(v) => set("foundedYear", v)}
                  options={[{ value: "", label: "Select year" }, ...YEAR_OPTIONS]}
                />
              </div>

              <Field label="Website" value={form.website} onChange={(v) => set("website", v)} placeholder="https://yourcompany.com" />

              <div>
                <label className="text-sm font-medium text-gray-700">Location <span className="text-red-500">*</span></label>
                <div className="relative mt-1">
                  <input required value={form.location} onChange={(e) => set("location", e.target.value)}
                    placeholder="e.g. Lahore, Pakistan"
                    className="w-full rounded-lg border px-3 py-2 pr-9 text-sm outline-none focus:border-blue-600" />
                  <HiOutlineMapPin className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* About company */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-bold text-gray-900 mb-3">About Company</h3>

              <CounterField
                label="Company Description" required maxLength={500}
                value={form.description} onChange={(v) => set("description", v)}
                rows={3} placeholder="Tell candidates about your company..."
              />

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CounterField
                  label="Mission" maxLength={200}
                  value={form.mission} onChange={(v) => set("mission", v)}
                  rows={3} placeholder="What is your company's mission?"
                />
                <CounterField
                  label="Culture" maxLength={200}
                  value={form.culture} onChange={(v) => set("culture", v)}
                  rows={3} placeholder="What's it like to work here?"
                />
              </div>
            </div>

            {/* Social links */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-bold text-gray-900 mb-3">Social Links</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SocialField icon={FaLinkedinIn} iconBg="bg-blue-600" label="LinkedIn"
                  value={form.socialLinks.linkedin} onChange={(v) => setSocial("linkedin", v)}
                  placeholder="https://linkedin.com/company/..." />
                <SocialField icon={HiOutlineGlobeAlt} iconBg="bg-gray-700" label="Website"
                  value={form.socialLinks.website} onChange={(v) => setSocial("website", v)}
                  placeholder="https://yourcompany.com" />
                <SocialField icon={FaFacebookF} iconBg="bg-blue-500" label="Facebook"
                  value={form.socialLinks.facebook} onChange={(v) => setSocial("facebook", v)}
                  placeholder="https://facebook.com/..." />
                <SocialField icon={FaXTwitter} iconBg="bg-black" label="Twitter / X"
                  value={form.socialLinks.twitter} onChange={(v) => setSocial("twitter", v)}
                  placeholder="https://twitter.com/..." />
              </div>
            </div>

            {/* Gallery */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-bold text-gray-900 mb-3">Company Gallery <span className="font-normal text-gray-400">(Optional)</span></h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {galleryPreviewItems.map((g) => (
                  <div key={g.key} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-100">
                    <img src={g.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={g.onRemove}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                    >
                      <HiOutlineXMark className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {!galleryFull && (
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition"
                  >
                    <HiOutlinePlus className="h-5 w-5" />
                    <span className="text-xs font-medium">Add Image</span>
                  </button>
                )}
                <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleGalleryAdd} className="hidden" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60 xl:hidden">
            {saving ? "Saving..." : "Save Company Profile"}
          </button>
        </form>

        {/* ══════════════════ RIGHT — Live public preview ══════════════════ */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden xl:sticky xl:top-4">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">Public Profile Preview</h2>
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
              This is how candidates see your profile
            </span>
          </div>

          <div
            className="relative h-36 bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900 bg-cover bg-center"
            style={coverPreview ? { backgroundImage: `url(${coverPreview})` } : undefined}
          >
            <div className="absolute inset-0 bg-black/20" />
          </div>

          <div className="px-5 pb-5">
            <div className="mt-3 mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white shadow">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-blue-600">{form.name ? form.name[0].toUpperCase() : "?"}</span>
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-900">{form.name || "Your Company"}</h3>
            <p className="text-sm text-gray-500">{form.industry || "Industry"}</p>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
              <HiOutlineMapPin className="h-3.5 w-3.5" />
              {form.location || "Location"}
              {employeeLabel && <span className="ml-1">· {employeeLabel}</span>}
            </p>

            {form.description && (
              <div className="mt-4">
                <p className="text-sm font-bold text-gray-900">About Us</p>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">{form.description}</p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3">
              <PreviewStat icon={HiOutlineCalendarDays} label="Founded" value={form.foundedYear || "—"} />
              <PreviewStat icon={HiOutlineUsers} label="Employees" value={form.size || "—"} />
              <PreviewStat icon={HiOutlineBuildingOffice2} label="Industry" value={form.industry || "—"} />
            </div>

            {form.mission && (
              <div className="mt-4">
                <p className="text-sm font-bold text-gray-900">Our Mission</p>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">{form.mission}</p>
              </div>
            )}

            {form.culture && (
              <div className="mt-4">
                <p className="text-sm font-bold text-gray-900">Our Culture</p>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">{form.culture}</p>
              </div>
            )}

            {/* Open positions — real data from this HR's active jobs */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-900">Open Positions ({openJobsCount})</p>
                {jobs.length > 0 && (
                  <a href="/hr/jobs" className="text-xs font-medium text-blue-600 hover:underline">View All Jobs</a>
                )}
              </div>

              {jobs.length === 0 ? (
                <p className="text-xs text-gray-400">No active job postings yet.</p>
              ) : (
                <div className="space-y-2">
                  {jobs.slice(0, 3).map((j, i) => (
                    <div key={j._id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${JOB_ICON_COLORS[i % JOB_ICON_COLORS.length]}`}>
                        <HiOutlineBriefcase className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800">{j.title}</p>
                        <p className="truncate text-xs text-gray-400">{j.city} · {j.type}</p>
                      </div>
                      <HiOutlineChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Follow us */}
            <div className="mt-5 border-t border-gray-50 pt-4">
              <p className="text-sm font-bold text-gray-900 mb-2">Follow Us</p>
              <div className="flex items-center gap-2">
                <SocialIconLink href={form.socialLinks.linkedin} icon={FaLinkedinIn} bg="bg-blue-600" />
                <SocialIconLink href={form.socialLinks.facebook} icon={FaFacebookF} bg="bg-blue-500" />
                <SocialIconLink href={form.socialLinks.twitter} icon={FaXTwitter} bg="bg-black" />
                <SocialIconLink href={form.socialLinks.website} icon={HiOutlineGlobeAlt} bg="bg-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </HRLayout>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
    </div>
  );
}

function CounterField({ label, value, onChange, placeholder, required, maxLength, rows = 3 }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-xs text-gray-400">{value.length}/{maxLength}</span>
      </div>
      <textarea
        required={required}
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600 resize-none"
      />
    </div>
  );
}

function SocialField({ icon: Icon, iconBg, label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg} text-white`}>
          <Icon className="h-4 w-4" />
        </div>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
      </div>
    </div>
  );
}

function PreviewStat({ icon: Icon, label, value }) {
  return (
    <div className="text-center">
      <Icon className="mx-auto h-4 w-4 text-gray-400" />
      <p className="mt-1 truncate text-xs font-semibold text-gray-800">{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}

function SocialIconLink({ href, icon: Icon, bg }) {
  const active = Boolean(href);
  const content = (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white transition ${active ? bg : "bg-gray-200 text-gray-400"}`}>
      <Icon className="h-3.5 w-3.5" />
    </div>
  );
  return active ? (
    <a href={href} target="_blank" rel="noreferrer">{content}</a>
  ) : content;
}

// A text input with a dropdown of suggestions underneath — the person can
// pick one of the preset options, or just type their own custom value.
function EditableCombobox({ value, onChange, options, placeholder, suffix = "", className = "" }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600"
      />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`flex w-full items-center justify-between px-4 py-2 text-sm transition hover:bg-blue-50 ${
                  opt === value ? "font-semibold text-blue-600 bg-blue-50/60" : "text-gray-700"
                }`}
              >
                {opt}{suffix}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
