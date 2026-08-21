import { useEffect, useRef, useState } from "react";
import { HiOutlineCamera } from "react-icons/hi2";
import HRLayout from "../../layouts/HRLayout";
import { getHRCompany, saveHRCompany } from "../../services/hrService";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "500+"];

export default function HRCompanyProfile() {
  const [form, setForm] = useState({
    name: "", description: "", industry: "", website: "", location: "", size: "",
  });
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const logoRef = useRef();

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
        });
        if (c.logo) setPreview(`${FILE_BASE}${c.logo}`);
      }
    });
  }, []);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logo) fd.append("logo", logo);
      await saveHRCompany(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save company profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <HRLayout title="Company Profile" subtitle="Set up your company information visible to candidates">
      <div className="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
          {saved && <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">Company profile saved.</div>}

          {/* Logo */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="font-semibold">Company Logo</h2>
            <div className="mt-4 flex items-center gap-5">
              <div className="relative">
                {preview ? (
                  <img src={preview} alt="Logo" className="h-20 w-20 rounded-xl object-cover border" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-100 text-2xl font-bold text-gray-400 border">
                    {form.name ? form.name[0].toUpperCase() : "?"}
                  </div>
                )}
                <button type="button" onClick={() => logoRef.current?.click()}
                  className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow">
                  <HiOutlineCamera className="h-4 w-4" />
                </button>
                <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </div>
              <div>
                <p className="text-sm font-medium">Upload company logo</p>
                <p className="text-xs text-gray-400">JPG, PNG or SVG — max 2MB</p>
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-semibold">Company Information</h2>
            <Field label="Company Name *" value={form.name} onChange={(v) => set("name", v)} required />
            <Field label="Industry" value={form.industry} onChange={(v) => set("industry", v)} placeholder="e.g. Information Technology" />
            <Field label="Location" value={form.location} onChange={(v) => set("location", v)} placeholder="e.g. Lahore, Pakistan" />
            <Field label="Website" value={form.website} onChange={(v) => set("website", v)} placeholder="https://yourcompany.com" />

            <div>
              <label className="text-sm font-medium text-gray-700">Company Size</label>
              <select value={form.size} onChange={(e) => set("size", e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600">
                <option value="">Select size</option>
                {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="Tell candidates about your company..."
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? "Saving..." : "Save Company Profile"}
          </button>
        </form>
      </div>
    </HRLayout>
  );
}

function Field({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
    </div>
  );
}
