import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineTrash,
  HiOutlineDocumentText,
  HiOutlineCloudArrowUp,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineMagnifyingGlass,
  HiOutlineEllipsisVertical,
  HiStar,
  HiOutlineStar,
  HiOutlineChartBarSquare,
  HiOutlineBriefcase,
} from "react-icons/hi2";
import CandidateLayout from "../layouts/CandidateLayout";
import Dropdown from "../components/Dropdown";
import {
  getMyCVs,
  uploadCV,
  updateCV,
  toggleCVLock,
  deleteCV,
  setPrimaryCV,
  getCVStats,
  getCVUsage,
} from "../services/cvService";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");
const MAX_CVS = 10;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name", label: "Name" },
];

function fileType(name = "") {
  const ext = name.split(".").pop()?.toUpperCase();
  return ext || "FILE";
}

export default function ResumeCV() {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCVs: 0, primaryCV: 0, applicationsUsingCVs: 0, profileViews: 0 });
  const [usage, setUsage] = useState({});

  // Search / sort
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Upload state
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Edit modal state
  const [editCv, setEditCv] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete confirm modal
  const [deleteConfirmCv, setDeleteConfirmCv] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Row "more actions" menu
  const [openMenuId, setOpenMenuId] = useState(null);

  async function load(silent = false) {
    try {
      if (!silent) setLoading(true);
      const [cvData, statsData, usageData] = await Promise.all([
        getMyCVs(),
        getCVStats().catch(() => null),
        getCVUsage().catch(() => ({})),
      ]);

      setCvs(cvData);
      setUsage(usageData || {});

      setStats(
        statsData || {
          totalCVs: cvData.length,
          primaryCV: cvData.filter((c) => c.isPrimary).length,
          applicationsUsingCVs: 0,
          profileViews: 0,
        }
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleUpload() {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      await uploadCV(file, label || file.name);
      setFile(null);
      setLabel("");
      await load(true);
    } catch (err) {
      setUploadError(err.response?.data?.message || "Could not upload CV.");
    } finally {
      setUploading(false);
    }
  }

  function openEdit(cv) {
    setEditCv(cv);
    setEditLabel(cv.label || cv.originalName);
    setEditFile(null);
    setEditError("");
    setOpenMenuId(null);
  }

  async function handleEditSave() {
    setEditError("");
    setEditSaving(true);
    try {
      await updateCV(editCv._id, { label: editLabel, file: editFile || undefined });
      setEditCv(null);
      await load(true);
    } catch (err) {
      setEditError(err.response?.data?.message || "Could not update CV.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleToggleLock(id) {
    setOpenMenuId(null);
    try {
      await toggleCVLock(id);
      await load(true);
    } catch (err) {
      alert(err.response?.data?.message || "Could not toggle lock.");
    }
  }

  async function handleSetPrimary(id) {
    setOpenMenuId(null);
    try {
      await setPrimaryCV(id);
      await load(true);
    } catch (err) {
      alert(err.response?.data?.message || "Could not set primary CV.");
    }
  }

  function handleDelete(cv) {
    setOpenMenuId(null);
    setDeleteConfirmCv(cv);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteCV(deleteConfirmCv._id);
      setDeleteConfirmCv(null);
      await load(true);
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete CV.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownload(cv) {
    setOpenMenuId(null);
    const url = `${FILE_BASE}${cv.url}`;
    const filename = cv.originalName || cv.label || "cv";

    try {
      // Cross-origin URLs are ignored by the `download` attribute in most
      // browsers (it just opens a new tab instead) — fetching the file as a
      // blob and downloading that (same-origin blob: URL) forces a real
      // download every time.
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed.");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert("Could not download this CV. Please try again.");
    }
  }

  const canUpload = cvs.length < MAX_CVS;

  const visibleCvs = useMemo(() => {
    let list = [...cvs];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (cv) =>
          (cv.label || "").toLowerCase().includes(q) ||
          (cv.originalName || "").toLowerCase().includes(q)
      );
    }

    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "name") {
      list.sort((a, b) => (a.label || a.originalName).localeCompare(b.label || b.originalName));
    }

    return list;
  }, [cvs, search, sortBy]);

  const STAT_CARDS = [
    { icon: HiOutlineDocumentText, iconBg: "bg-blue-50", iconColor: "text-blue-600", value: stats.totalCVs, label: "Total CVs", sub: "Uploaded" },
    { icon: HiStar, iconBg: "bg-green-50", iconColor: "text-green-600", value: stats.primaryCV, label: "Primary CV", sub: "Set as default" },
    { icon: HiOutlineBriefcase, iconBg: "bg-purple-50", iconColor: "text-purple-600", value: stats.applicationsUsingCVs, label: "Applications", sub: "Using CVs" },
    { icon: HiOutlineChartBarSquare, iconBg: "bg-amber-50", iconColor: "text-amber-600", value: stats.profileViews, label: "Profile Views", sub: "This month" },
  ];

  const TIPS = [
    "Keep your CV updated with latest experience.",
    "Use keywords from the job description.",
    "Tailor your CV for the specific role.",
    "Highlight your top skills and achievements.",
  ];

  return (
    <CandidateLayout
      title="Resume / CV"
      subtitle="Manage your resumes and customize them for different jobs."
    >
      <div className="flex items-center justify-end mb-4">
        <span className="text-sm font-semibold text-blue-600">
          {stats.totalCVs} / {MAX_CVS} CVs Used
        </span>
      </div>

      <div className="space-y-6">

        {/* Main content — full width */}
        <div className="space-y-6">

          {/* Upload box */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <HiOutlineCloudArrowUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Upload New CV</h2>
                <p className="text-sm text-gray-500">Upload your resume in PDF, DOC, or DOCX format. Max file size: 5MB</p>
              </div>
            </div>

            {!canUpload && (
              <div className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
                You've reached the {MAX_CVS}-CV limit. Delete one to upload another.
              </div>
            )}

            {uploadError && (
              <div className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{uploadError}</div>
            )}

            {canUpload && (
              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    &nbsp;
                  </label>
                  <label className="flex items-center rounded-xl border overflow-hidden text-sm">
                    <span className="px-4 py-2.5 bg-blue-600 text-white font-medium cursor-pointer whitespace-nowrap hover:bg-blue-700 transition">
                      Choose File
                    </span>
                    <span className="px-3 py-2.5 text-gray-400 truncate">
                      {file ? file.name : "No file chosen"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Label (Optional)</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Frontend Developer CV 2026"
                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60 whitespace-nowrap"
                >
                  {uploading ? "Uploading..." : "Upload CV"}
                </button>
              </div>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STAT_CARDS.map((s) => (
              <div key={s.label} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg} ${s.iconColor} mb-3`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm font-medium text-gray-700">{s.label}</p>
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Search + sort */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your CVs by name or label..."
                className="w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Sort by:</span>
              <Dropdown value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
            </div>
          </div>

          {/* CV list */}
          {loading && <p className="text-gray-500">Loading your CVs...</p>}

          {!loading && visibleCvs.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm border">
              <HiOutlineDocumentText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              {cvs.length === 0 ? "No CVs uploaded yet." : "No CVs match your search."}
            </div>
          )}

          {!loading && visibleCvs.length > 0 && (
            <div className="overflow-visible rounded-2xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">CV / Label</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Uploaded</th>
                    <th className="px-5 py-3">Used In</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visibleCvs.map((cv) => (
                    <tr key={cv._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <HiOutlineDocumentText className="h-5 w-5 shrink-0 text-red-400" />
                          <span className="font-medium text-gray-900">{cv.label || cv.originalName}</span>
                          {cv.isPrimary && (
                            <span className="rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 pl-7 text-xs text-gray-400">{cv.originalName}</p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                          {fileType(cv.originalName)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        <div>{new Date(cv.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(cv.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {usage[cv._id] ?? 0} Applications
                      </td>

                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cv.locked ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
                          {cv.locked ? "Locked" : "Active"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5 relative">
                          <a
                            href={`${FILE_BASE}${cv.url}`}
                            target="_blank"
                            rel="noreferrer"
                            title="View"
                            className="rounded-lg p-2 text-gray-500 transition-all duration-150 hover:scale-110 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <HiOutlineEye className="h-4 w-4" />
                          </a>

                          <button
                            onClick={() => handleDownload(cv)}
                            title="Download"
                            className="rounded-lg p-2 text-gray-500 transition-all duration-150 hover:scale-110 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <HiOutlineArrowDownTray className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => openEdit(cv)}
                            disabled={cv.locked}
                            title={cv.locked ? "Unlock to edit" : "Edit"}
                            className="rounded-lg p-2 text-gray-500 transition-all duration-150 hover:scale-110 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                          >
                            <HiOutlinePencil className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleToggleLock(cv._id)}
                            title={cv.locked ? "Unlock" : "Lock"}
                            className={`rounded-lg p-2 transition-all duration-150 hover:scale-110 hover:bg-amber-50 hover:text-amber-600 ${cv.locked ? "text-amber-600" : "text-gray-500"}`}
                          >
                            {cv.locked ? <HiOutlineLockClosed className="h-4 w-4" /> : <HiOutlineLockOpen className="h-4 w-4" />}
                          </button>

                          <button
                            onClick={() => setOpenMenuId(openMenuId === cv._id ? null : cv._id)}
                            title="More"
                            className="rounded-lg p-2 text-gray-500 transition-all duration-150 hover:scale-110 hover:bg-gray-100"
                          >
                            <HiOutlineEllipsisVertical className="h-4 w-4" />
                          </button>

                          {openMenuId === cv._id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-gray-100 bg-white shadow-xl z-20 py-1 text-left">
                                <button
                                  onClick={() => handleSetPrimary(cv._id)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <HiOutlineStar className="h-4 w-4" />
                                  {cv.isPrimary ? "Unmark as Primary" : "Set as Primary"}
                                </button>
                                <button
                                  onClick={() => handleDelete(cv)}
                                  disabled={cv.locked}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <HiOutlineTrash className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
        </div>

        {/* Tips + Accepted Formats — full width row below */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineChartBarSquare className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-gray-900 text-sm">Tips to Get Noticed</h3>
            </div>
            <ul className="space-y-3">
              {TIPS.map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 text-[10px]">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-1">Accepted Formats</h3>
            <p className="text-xs text-gray-400 mb-3">Files we accept for your resume</p>

            <div className="flex items-center gap-3">
              {[
                { ext: "PDF", color: "bg-red-50 text-red-500 border-red-100" },
                { ext: "DOC", color: "bg-blue-50 text-blue-500 border-blue-100" },
                { ext: "DOCX", color: "bg-indigo-50 text-indigo-500 border-indigo-100" },
              ].map((f) => (
                <div key={f.ext} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold ${f.color}`}>
                  <HiOutlineDocumentText className="h-4 w-4" />
                  {f.ext}
                </div>
              ))}

              <span className="ml-auto text-xs text-gray-400">Max 5MB per CV</span>
            </div>
          </div>
        </div>

      </div>

      {/* Edit modal */}
      {editCv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Edit CV</h3>
              <button onClick={() => setEditCv(null)} className="text-gray-400 hover:text-gray-600">
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {editError && (
                <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{editError}</div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Label / Name</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Replace file <span className="text-xs font-normal text-gray-400">(optional — leave empty to keep current file)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setEditFile(e.target.files[0])}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
                {editFile && (
                  <p className="mt-1 text-xs text-green-600">New file selected: {editFile.name}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditCv(null)}
                  className="flex-1 rounded-lg border py-2.5 font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmCv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <HiOutlineExclamationTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete CV</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-700">
              Are you sure you want to delete{" "}
              <strong>"{deleteConfirmCv.label || deleteConfirmCv.originalName}"</strong>?
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteConfirmCv(null)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CandidateLayout>
  );
}
