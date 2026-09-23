import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineTrash, HiOutlinePencilSquare, HiOutlineMagnifyingGlass,
  HiOutlinePlus, HiChevronLeft, HiChevronRight, HiOutlineEye,
} from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";
import Dropdown from "../../components/Dropdown";
import { getAdminUsers, updateUserRole, deleteAdminUser } from "../../services/adminService";
import { useToast } from "../../context/ToastContext";

const ROLE_LABEL = { user: "Candidate", hr: "HR", admin: "Admin" };

const ROLE_STYLE = {
  user:  "bg-blue-50 text-blue-700",
  hr:    "bg-green-50 text-green-700",
  admin: "bg-purple-50 text-purple-700",
};

const PAGE_SIZE = 8;

export default function AdminManageUsers() {
  const navigate = useNavigate();
  const toast = useToast();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage]             = useState(1);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [editModal, setEditModal]   = useState(null);
  const [modalRole, setModalRole]   = useState("");

  async function load() {
    setLoading(true);
    getAdminUsers({ search, role: roleFilter })
      .then((data) => { setUsers(data); setPage(1); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [search, roleFilter]);

  async function handleRoleChange(id, role) {
    const updated = await updateUserRole(id, role);
    setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
  }

  function handleView(u) {
    if (u.role === "hr") {
      if (!u.company) {
        toast?.showToast?.({ title: "No company yet", message: `${u.name} hasn't set up a company profile yet.` });
        return;
      }
      navigate(`/companies/${encodeURIComponent(u.company)}`);
    } else {
      navigate(`/admin/users/${u._id}/candidate`);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAdminUser(deleteModal._id);
      setUsers((prev) => prev.filter((u) => u._id !== deleteModal._id));
      setDeleteModal(null);
    } finally {
      setDeleting(false);
    }
  }

  // Pagination
  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const paginated  = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminLayout title="Manage Users">
      <p className="mb-6 text-sm text-gray-500">View and manage all users in the system</p>

      {/* ── Toolbar ── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-72">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
        </div>

        {/* All Roles dropdown */}
        <Dropdown
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: "", label: "All Roles" },
            { value: "user", label: "Candidate" },
            { value: "hr", label: "HR" },
            { value: "admin", label: "Admin" },
          ]}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Add New User */}
        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">
          <HiOutlinePlus className="h-4 w-4" />
          Add New User
        </button>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No users found.</td></tr>
            ) : paginated.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50 transition">
                {/* User */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>

                {/* Role — display the user's current role only */}
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${ROLE_STYLE[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </td>

                {/* Joined */}
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                    <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                    Active
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleView(u)}
                      title={u.role === "hr" ? "View company profile" : "View candidate profile"}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                    >
                      <HiOutlineEye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setEditModal(u); setModalRole(u.role); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-blue-500 hover:bg-blue-50 transition"
                    >
                      <HiOutlinePencilSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteModal(u)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 transition"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Pagination ── */}
        {!loading && users.length > 0 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, users.length)} of {users.length} users
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="transition-all duration-200 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <HiChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                    p === page
                      ? "border border-blue-600 bg-white text-blue-600"
                      : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="transition-all duration-200 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <HiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Modal ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-gray-800">Delete User</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete <strong>{deleteModal.name}</strong>? This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteModal(null)}
                className="transition-all duration-200 flex-1 rounded-xl border py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="transition-all duration-200 flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-gray-800">Edit User</h3>
            <p className="mt-1 text-sm text-gray-400">{editModal.email}</p>
            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-500 uppercase">Role</label>
              {editModal.role === "admin" ? (
                <div className="mt-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600">
                  Admin
                </div>
              ) : (
                <Dropdown
                  value={modalRole}
                  onChange={(v) => { setModalRole(v); handleRoleChange(editModal._id, v); }}
                  options={[
                    { value: "user", label: "Candidate" },
                    { value: "hr", label: "HR" },
                  ]}
                  fullWidth
                />
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setEditModal(null)}
                className="transition-all duration-200 flex-1 rounded-xl border py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
