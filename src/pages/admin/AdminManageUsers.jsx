import { useEffect, useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminUsers, updateUserRole, deleteAdminUser } from "../../services/adminService";

const ROLE_COLORS = {
  user: "bg-blue-50 text-blue-700",
  hr: "bg-green-50 text-green-700",
  admin: "bg-purple-50 text-purple-700",
};

export default function AdminManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    getAdminUsers({ search, role: roleFilter })
      .then(setUsers)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [search, roleFilter]);

  async function handleRoleChange(id, role) {
    const updated = await updateUserRole(id, role);
    setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
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

  return (
    <AdminLayout title="Manage Users" subtitle="View, edit roles, and remove user accounts">
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-600 w-64"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600">
          <option value="">All roles</option>
          <option value="user">Candidate</option>
          <option value="hr">HR</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border-0 outline-none cursor-pointer ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>
                    <option value="user">Candidate</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-5 py-4 text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-right">
                  <button onClick={() => setDeleteModal(u)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 ml-auto">
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && users.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">No users found.</p>
        )}
      </div>

      {/* Delete modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-bold">Delete User</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <strong>{deleteModal.name}</strong>? This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteModal(null)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
