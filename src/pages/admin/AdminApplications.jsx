import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminApplications } from "../../services/adminService";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const STATUS_STYLES = {
  applied: "bg-gray-100 text-gray-700",
  under_review: "bg-amber-50 text-amber-700",
  shortlisted: "bg-purple-50 text-purple-700",
  interviewed: "bg-blue-50 text-blue-700",
  selected: "bg-green-50 text-green-700",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-50 text-red-700",
};

export default function AdminApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAdminApplications().then(setApps).finally(() => setLoading(false));
  }, []);

  const filtered = apps.filter((a) =>
    !search ||
    a.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.job?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Applications" subtitle="All candidate applications across the platform">
      <div className="mb-6">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by candidate name or job title..."
          className="w-64 rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-600" />
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">Candidate</th>
              <th className="px-5 py-3">Job</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Applied</th>
              <th className="px-5 py-3">CV</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((app) => (
              <tr key={app._id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <p className="font-medium">{app.user?.name}</p>
                  <p className="text-xs text-gray-400">{app.user?.email}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium">{app.job?.title}</p>
                  <p className="text-xs text-gray-400">{app.job?.company}</p>
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[app.status] || "bg-gray-100 text-gray-600"}`}>
                    {app.status?.replace("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-500 text-xs">
                  {new Date(app.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4">
                  {app.cvUrl && (
                    <a href={`${FILE_BASE}${app.cvUrl}`} target="_blank" rel="noreferrer"
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                      View CV
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">No applications found.</p>
        )}
      </div>
    </AdminLayout>
  );
}
