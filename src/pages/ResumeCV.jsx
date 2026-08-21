import { useEffect, useState } from "react";
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
} from "react-icons/hi2";
import CandidateLayout from "../layouts/CandidateLayout";
import {
  getMyCVs,
  uploadCV,
  updateCV,
  toggleCVLock,
  deleteCV,
} from "../services/cvService";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");
const MAX_CVS = 5;

export default function ResumeCV() {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  async function load() {
    try {
      const data = await getMyCVs();
      setCvs(data);
    } finally {
      setLoading(false);
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
      await load();
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
  }

  async function handleEditSave() {
    setEditError("");
    setEditSaving(true);
    try {
      await updateCV(editCv._id, { label: editLabel, file: editFile || undefined });
      setEditCv(null);
      await load();
    } catch (err) {
      setEditError(err.response?.data?.message || "Could not update CV.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleToggleLock(id) {
    try {
      await toggleCVLock(id);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not toggle lock.");
    }
  }

  function handleDelete(cv) {
    setDeleteConfirmCv(cv);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteCV(deleteConfirmCv._id);
      setDeleteConfirmCv(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete CV.");
    } finally {
      setDeleting(false);
    }
  }

  // Opens in a single new tab and downloads
  function handleDownload(cv) {
    const url = `${FILE_BASE}${cv.url}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = cv.originalName || cv.label || "cv";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const canUpload = cvs.length < MAX_CVS;

  return (
    <CandidateLayout
      title="Resume / CV"
      subtitle={`Manage up to ${MAX_CVS} CVs. View, edit, download, lock, or delete them anytime.`}
    >
      {/* Upload box */}
      <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <HiOutlineCloudArrowUp className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold">Upload a new CV</h2>
          <span className="ml-auto text-sm text-gray-400">{cvs.length}/{MAX_CVS} used</span>
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
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="text-sm font-medium text-gray-700">CV file (PDF, DOC, DOCX — max 5MB)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files[0])}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Label (optional)</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={file?.name || "e.g. Frontend Dev CV 2026"}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CV list */}
      {loading && <p className="text-gray-500">Loading your CVs...</p>}

      {!loading && cvs.length === 0 && (
        <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
          <HiOutlineDocumentText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          No CVs uploaded yet.
        </div>
      )}

      {!loading && cvs.length > 0 && (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Uploaded</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cvs.map((cv) => (
                <tr key={cv._id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <HiOutlineDocumentText className="h-5 w-5 shrink-0 text-blue-400" />
                      <span className="font-medium">{cv.label || cv.originalName}</span>
                    </div>
                    <p className="mt-0.5 pl-7 text-xs text-gray-400">{cv.originalName}</p>
                  </td>

                  <td className="px-5 py-4 text-gray-500">
                    {new Date(cv.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cv.locked ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
                      {cv.locked ? "Locked" : "Active"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* View */}
                      <a
                        href={`${FILE_BASE}${cv.url}`}
                        target="_blank"
                        rel="noreferrer"
                        title="View"
                        className="rounded-lg border p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <HiOutlineEye className="h-4 w-4" />
                      </a>

                      {/* Download (opens in new tab AND downloads) */}
                      <button
                        onClick={() => handleDownload(cv)}
                        title="Download"
                        className="rounded-lg border p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <HiOutlineArrowDownTray className="h-4 w-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEdit(cv)}
                        disabled={cv.locked}
                        title={cv.locked ? "Unlock to edit" : "Edit"}
                        className="rounded-lg border p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <HiOutlinePencil className="h-4 w-4" />
                      </button>

                      {/* Lock / Unlock */}
                      <button
                        onClick={() => handleToggleLock(cv._id)}
                        title={cv.locked ? "Unlock" : "Lock"}
                        className={`rounded-lg border p-2 hover:bg-amber-50 hover:text-amber-600 ${cv.locked ? "text-amber-600" : "text-gray-500"}`}
                      >
                        {cv.locked ? <HiOutlineLockClosed className="h-4 w-4" /> : <HiOutlineLockOpen className="h-4 w-4" />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(cv)}
                        disabled={cv.locked}
                        title={cv.locked ? "Unlock to delete" : "Delete"}
                        className="rounded-lg border p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
