import { useEffect, useState } from "react";
import {
  HiOutlineMagnifyingGlass, HiOutlinePlus, HiChevronLeft,
  HiChevronRight, HiEllipsisVertical, HiOutlineEye,
  HiOutlinePencilSquare, HiOutlineUsers, HiOutlineBriefcase,
  HiOutlineTrash, HiOutlineBuildingOffice2, HiOutlineMapPin,
  HiAdjustmentsHorizontal,
} from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";
import { getHRManagement, updateUserRole } from "../../services/adminService";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");
const PAGE_SIZE = 8;

// Generate short abbreviation + color for company logo
const COLORS = ["#3B82F6","#8B5CF6","#F59E0B","#10B981","#EF4444","#06B6D4","#F97316"];
function abbr(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 3);
}
function colorFor(name = "") {
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return COLORS[h % COLORS.length];
}

export default function AdminHRManagement() {
  const [data, setData]       = useState({ hrUsers: [], companies: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("companies"); // "companies" | "hr"
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [menu, setMenu]       = useState(null);

  async function load() {
    setLoading(true);
    getHRManagement().then(setData).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  // close menu outside click
  useEffect(() => {
    const h = () => setMenu(null);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  async function revokeHR(id) {
    await updateUserRole(id, "user");
    load();
  }

  const companies = data.companies || [];
  const hrUsers   = data.hrUsers   || [];

  // filtered list for current tab
  const filtered = tab === "companies"
    ? companies.filter((c) => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.location?.toLowerCase().includes(search.toLowerCase()))
    : hrUsers.filter((u)   => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminLayout title="HR Management">
      <p className="mb-6 text-sm text-gray-500">Manage users and companies</p>

      {/* ── Top summary cards ── */}
      <div className="mb-6 grid gap-5 lg:grid-cols-2">

        {/* HR Users card */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">HR Users</h2>
          <div className="divide-y divide-gray-50">
            {hrUsers.slice(0, 3).map((u) => (
              <div key={u._id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <HiEllipsisVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            {hrUsers.length === 0 && <p className="py-4 text-sm text-gray-400">No HR users yet.</p>}
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <HiOutlineUsers className="h-5 w-5 text-blue-500" />
              <span className="font-bold text-gray-800">{hrUsers.length}</span> Total HR Users
            </div>
            <div className="text-gray-200 text-4xl select-none">👥</div>
          </div>
        </div>

        {/* Companies card */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">Companies</h2>
          <div className="divide-y divide-gray-50">
            {companies.slice(0, 3).map((c) => (
              <div key={c._id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {c.logo ? (
                    <img src={`${FILE_BASE}${c.logo}`} alt={c.name}
                      className="h-10 w-10 rounded-lg object-contain border p-1 bg-white" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: colorFor(c.name) }}>
                      {abbr(c.name)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.industry}</p>
                    <p className="text-xs text-gray-400">{c.location}</p>
                    {c.hr && <p className="text-xs text-gray-400">HR: {c.hr.name}</p>}
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <HiEllipsisVertical className="h-5 w-5" />
                </button>
              </div>
            ))}
            {companies.length === 0 && <p className="py-4 text-sm text-gray-400">No companies yet.</p>}
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <HiOutlineBuildingOffice2 className="h-5 w-5 text-blue-500" />
              <span className="font-bold text-gray-800">{companies.length}</span> Total Companies
            </div>
            <div className="text-gray-200 text-4xl select-none">🏢</div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="mb-6 flex items-center gap-0 border-b border-gray-200">
        {[["companies", "Companies"], ["hr", "HR Users"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => { setTab(val); setPage(1); setSearch(""); }}
            className={`px-5 pb-3 text-sm font-semibold transition border-b-2 -mb-px ${
              tab === val ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Table header + search ── */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-800">
            {tab === "companies" ? "All Companies" : "All HR Users"}
          </h3>
          <p className="text-xs text-gray-400">
            {tab === "companies" ? "Manage all registered companies in the platform." : "Manage all HR users."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-52">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={tab === "companies" ? "Search companies..." : "Search HR users..."}
              className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>
          {/* Filter icon */}
          <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">
            <HiAdjustmentsHorizontal className="h-4 w-4" />
          </button>
          {/* Add button */}
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
            <HiOutlinePlus className="h-4 w-4" />
            {tab === "companies" ? "Add Company" : "Add HR User"}
          </button>
        </div>
      </div>

      {/* ── Companies Table ── */}
      {tab === "companies" && (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4">Company ↕</th>
                <th className="px-6 py-4">Industry ↕</th>
                <th className="px-6 py-4">Location ↕</th>
                <th className="px-6 py-4">HR ↕</th>
                <th className="px-6 py-4">Members ↕</th>
                <th className="px-6 py-4">Joined At ↕</th>
                <th className="px-6 py-4">Status ↕</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">No companies found.</td></tr>
              ) : paginated.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 transition">
                  {/* Company */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {c.logo ? (
                        <img src={`${FILE_BASE}${c.logo}`} alt={c.name}
                          className="h-10 w-10 rounded-lg border object-contain p-1 bg-white" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                          style={{ backgroundColor: colorFor(c.name) }}>
                          {abbr(c.name)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.tagline || c.description?.slice(0, 30) || ""}</p>
                      </div>
                    </div>
                  </td>
                  {/* Industry */}
                  <td className="px-6 py-4 text-gray-600">{c.industry || "—"}</td>
                  {/* Location */}
                  <td className="px-6 py-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <HiOutlineMapPin className="h-3.5 w-3.5 text-gray-400" />
                      {c.location || "—"}
                    </span>
                  </td>
                  {/* HR */}
                  <td className="px-6 py-4">
                    {c.hr ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: colorFor(c.hr.name) }}>
                          {c.hr.name[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700">{c.hr.name}</span>
                      </div>
                    ) : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  {/* Members */}
                  <td className="px-6 py-4 text-gray-600">{c.membersCount ?? c.employees ?? "—"}</td>
                  {/* Joined */}
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </td>
                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${c.isActive === false ? "text-red-500" : "text-green-600"}`}>
                      <span className={`h-2 w-2 rounded-full ${c.isActive === false ? "bg-red-500" : "bg-green-500"}`} />
                      {c.isActive === false ? "Inactive" : "Active"}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setMenu(menu === c._id ? null : c._id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition"
                      >
                        <HiEllipsisVertical className="h-5 w-5" />
                      </button>
                      {menu === c._id && (
                        <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border bg-white shadow-lg py-1">
                          <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-50">
                            <HiOutlineEye className="h-4 w-4" /> View Details
                          </button>
                          <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-50">
                            <HiOutlinePencilSquare className="h-4 w-4" /> Edit Company
                          </button>
                          <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-50">
                            <HiOutlineUsers className="h-4 w-4" /> Manage Members
                          </button>
                          <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-50">
                            <HiOutlineBriefcase className="h-4 w-4" /> View Jobs
                          </button>
                          <div className="my-1 border-t" />
                          <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-red-500 hover:bg-red-50">
                            <HiOutlineTrash className="h-4 w-4" /> Delete Company
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                  <HiChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                      p === page ? "border border-blue-600 bg-white text-blue-600" : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                  <HiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HR Users Table ── */}
      {tab === "hr" && (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4">HR User</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400">Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400">No HR users found.</td></tr>
              ) : paginated.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{u.company || "—"}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                      <span className="h-2 w-2 rounded-full bg-green-500" /> Active
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => revokeHR(u._id)}
                      className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition">
                      Revoke HR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40">
                  <HiChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                      p === page ? "border border-blue-600 text-blue-600" : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40">
                  <HiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
