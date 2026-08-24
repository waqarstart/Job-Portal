import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { getHRManagement, updateUserRole } from "../../services/adminService";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

export default function AdminHRManagement() {
  const [data, setData] = useState({ hrUsers: [], companies: [] });
  const [loading, setLoading] = useState(true);

  async function load() {
    getHRManagement().then(setData).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleRoleChange(id, role) {
    await updateUserRole(id, role);
    load();
  }

  return (
    <AdminLayout title="HR Management" subtitle="Manage HR users and their company profiles">
      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* HR Users */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold mb-4">HR Users ({data.hrUsers.length})</h2>
          <div className="divide-y">
            {data.hrUsers.map((u) => (
              <div key={u._id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">HR</span>
                  <button onClick={() => handleRoleChange(u._id, "user")}
                    className="rounded-lg border px-2 py-1 text-xs text-gray-500 hover:bg-gray-50">
                    Revoke HR
                  </button>
                </div>
              </div>
            ))}
            {data.hrUsers.length === 0 && <p className="py-4 text-sm text-gray-400">No HR users yet.</p>}
          </div>
        </div>

        {/* Companies */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Companies ({data.companies.length})</h2>
          <div className="divide-y">
            {data.companies.map((c) => (
              <div key={c._id} className="flex items-center gap-3 py-3">
                {c.logo ? (
                  <img src={`${FILE_BASE}${c.logo}`} alt={c.name} className="h-10 w-10 rounded-lg object-cover border" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-500">
                    {c.name[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.industry} • {c.location}</p>
                  {c.hr && <p className="text-xs text-gray-400">HR: {c.hr.name}</p>}
                </div>
              </div>
            ))}
            {data.companies.length === 0 && <p className="py-4 text-sm text-gray-400">No companies registered yet.</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
