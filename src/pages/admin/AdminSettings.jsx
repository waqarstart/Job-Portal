import { useState } from "react";
import { HiOutlineChevronRight } from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { changePassword } from "../../services/userService";

export default function AdminSettings() {
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(null);

  return (
    <AdminLayout title="Settings" subtitle="Manage your admin account">
      <div className="max-w-2xl space-y-6">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-gray-50 px-5 py-4">
            <h2 className="font-semibold">Account</h2>
          </div>
          <div className="divide-y">
            <div className="flex justify-between px-5 py-4 text-sm">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between px-5 py-4 text-sm">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between px-5 py-4 text-sm">
              <span className="text-gray-500">Role</span>
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">System Admin</span>
            </div>

            <div>
              <button onClick={() => setExpanded(expanded === "pw" ? null : "pw")}
                className="flex w-full items-center justify-between px-5 py-4 text-sm hover:bg-gray-50">
                <span className="text-gray-700">Change Password</span>
                <HiOutlineChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${expanded === "pw" ? "rotate-90" : ""}`} />
              </button>
              {expanded === "pw" && (
                <div className="border-t bg-gray-50 px-5 py-4">
                  <ChangePasswordForm onDone={() => setExpanded(null)} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-red-50 px-5 py-4">
            <h2 className="font-semibold text-red-700">Danger Zone</h2>
          </div>
          <button onClick={logout} className="w-full px-5 py-4 text-left text-sm text-red-600 hover:bg-red-50">
            Logout
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

function ChangePasswordForm({ onDone }) {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handle() {
    setError("");
    setLoading(true);
    try {
      await changePassword(current, newPass);
      setSuccess(true);
      setTimeout(onDone, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  if (success) return <p className="text-sm text-green-600">Password updated.</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
      <input type="password" placeholder="New password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
      <button onClick={handle} disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {loading ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
}
