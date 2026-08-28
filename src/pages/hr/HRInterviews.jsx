import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineCalendarDays, HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineMagnifyingGlass, HiOutlineUserGroup,
  HiOutlineEllipsisVertical, HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlinePlus, HiOutlineXMark, HiOutlineSparkles, HiOutlineEnvelope,
  HiOutlineVideoCamera,
} from "react-icons/hi2";
import HRLayout from "../../layouts/HRLayout";
import Dropdown from "../../components/Dropdown";
import { getHRInterviews, getSchedulableApplicants } from "../../services/hrService";
import { scheduleInterview } from "../../services/applicationService";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const h = String(i + 1);
  return { value: h, label: h };
});
const MINUTE_OPTIONS = ["00", "15", "30", "45"].map((m) => ({ value: m, label: m }));
const PERIOD_OPTIONS = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

const APP_STATUS_META = {
  applied: { label: "Applied", badge: "bg-gray-100 text-gray-700" },
  under_review: { label: "Under Review", badge: "bg-amber-50 text-amber-700" },
  shortlisted: { label: "Shortlisted", badge: "bg-blue-50 text-blue-700" },
  interviewed: { label: "Interviewed", badge: "bg-indigo-50 text-indigo-700" },
  offered: { label: "Offered", badge: "bg-cyan-50 text-cyan-700" },
  selected: { label: "Selected", badge: "bg-cyan-50 text-cyan-700" },
  hired: { label: "Hired", badge: "bg-green-50 text-green-700" },
  rejected: { label: "Rejected", badge: "bg-red-50 text-red-700" },
};

const PAGE_SIZE = 5;

function initials(name = "") {
  return (name.trim()[0] || "?").toUpperCase();
}

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(date) {
  return new Date(date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function HRInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, scheduled: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulable, setSchedulable] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function emptyForm() {
    return {
      applicationId: "",
      date: "",
      hour: "10",
      minute: "00",
      period: "AM",
      durationMinutes: 45,
      type: "Technical Round",
      interviewerCount: 2,
    };
  }

  function load() {
    setLoading(true);
    getHRInterviews()
      .then((data) => { setInterviews(data.interviews); setStats(data.stats); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    let list = [...interviews];

    if (statusFilter !== "all") {
      list = list.filter((i) => i.interviewStatus === statusFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.user?.name?.toLowerCase().includes(q) ||
          i.user?.email?.toLowerCase().includes(q) ||
          i.job?.title?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [interviews, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [statusFilter, search]);

  async function markCompleted(app) {
    setOpenMenuId(null);
    await scheduleInterview(app._id, { interviewStatus: "completed" });
    load();
  }

  async function cancelInterview(app) {
    setOpenMenuId(null);
    const reason = prompt("Reason for cancelling this interview?");
    if (reason === null) return;
    await scheduleInterview(app._id, { interviewStatus: "cancelled", interviewCancelReason: reason });
    load();
  }

  async function reopenInterview(app) {
    setOpenMenuId(null);
    await scheduleInterview(app._id, { interviewStatus: "pending" });
    load();
  }

  async function openScheduleModal() {
    setForm(emptyForm());
    setFormError("");
    setShowScheduleModal(true);
    const apps = await getSchedulableApplicants();
    setSchedulable(apps);
  }

  async function submitSchedule() {
    setFormError("");

    if (!form.applicationId || !form.date) {
      setFormError("Please pick a candidate and date.");
      return;
    }

    // Convert 12-hour (hour/minute/period) into 24-hour "HH:mm" for the Date constructor
    let hour24 = Number(form.hour) % 12;
    if (form.period === "PM") hour24 += 12;
    const time24 = `${String(hour24).padStart(2, "0")}:${form.minute}`;

    const interviewDate = new Date(`${form.date}T${time24}`);
    if (isNaN(interviewDate.getTime())) {
      setFormError("Invalid date/time.");
      return;
    }

    setSaving(true);
    try {
      await scheduleInterview(form.applicationId, {
        interviewDate: interviewDate.toISOString(),
        interviewDurationMinutes: Number(form.durationMinutes) || 45,
        interviewType: form.type,
        interviewMode: "AI Interview",
        interviewerCount: Number(form.interviewerCount) || 1,
        interviewStatus: "pending",
      });
      setShowScheduleModal(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not schedule interview.");
    } finally {
      setSaving(false);
    }
  }

  const STAT_CARDS = [
    { icon: HiOutlineCalendarDays, bg: "bg-blue-50", color: "text-blue-600", value: stats.total, label: "Total Interviews" },
    { icon: HiOutlineClock, bg: "bg-amber-50", color: "text-amber-600", value: stats.scheduled, label: "Scheduled" },
    { icon: HiOutlineCheckCircle, bg: "bg-green-50", color: "text-green-600", value: stats.completed, label: "Completed" },
    { icon: HiOutlineXCircle, bg: "bg-red-50", color: "text-red-600", value: stats.cancelled, label: "Cancelled" },
  ];

  return (
    <HRLayout
      title="Interviews"
      subtitle="View and manage all interviews"
      headerExtra={
        <button
          onClick={openScheduleModal}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 whitespace-nowrap"
        >
          <HiOutlinePlus className="h-4 w-4" />
          Schedule Interview
        </button>
      }
    >
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} ${c.color} mb-3`}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-sm font-medium text-gray-700">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-5">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search interviews..."
            className="w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Dropdown value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} buttonClassName="w-full sm:w-auto" />
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {/* Interview cards */}
      <div className="space-y-4">
        {pageItems.map((app) => {
          const meta = APP_STATUS_META[app.status] || APP_STATUS_META.applied;
          const isCancelled = app.interviewStatus === "cancelled";
          const isCompleted = app.interviewStatus === "completed";

          return (
            <div key={app._id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {initials(app.user?.name)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{app.user?.name}</p>
                    <p className="flex items-center gap-1.5 text-sm text-gray-500">
                      <HiOutlineEnvelope className="h-3.5 w-3.5" />
                      {app.user?.email}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-semibold text-blue-600">Job:</span> {app.job?.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>{meta.label}</span>

                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === app._id ? null : app._id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                      <HiOutlineEllipsisVertical className="h-5 w-5" />
                    </button>

                    {openMenuId === app._id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-gray-100 bg-white shadow-xl z-20 py-1">
                          {app.interviewStatus === "pending" && (
                            <>
                              <button onClick={() => markCompleted(app)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                Mark Completed
                              </button>
                              <button onClick={() => cancelInterview(app)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                Cancel Interview
                              </button>
                            </>
                          )}
                          {(isCancelled || isCompleted) && (
                            <button onClick={() => reopenInterview(app)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              Reopen as Scheduled
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="flex items-center gap-1.5 rounded-lg border bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                  <HiOutlineCalendarDays className="h-3.5 w-3.5 text-blue-500" />
                  {formatDate(app.interviewDate)}
                </span>
                <span className="flex items-center gap-1.5 rounded-lg border bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                  <HiOutlineClock className="h-3.5 w-3.5 text-blue-500" />
                  {formatTime(app.interviewDate)}
                </span>
                <span className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                  <HiOutlineVideoCamera className="h-3.5 w-3.5" />
                  AI Interview
                </span>
                <span className="flex items-center gap-1.5 rounded-lg border bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                  <HiOutlineUserGroup className="h-3.5 w-3.5 text-blue-500" />
                  {app.interviewerCount || 1} Interviewer{(app.interviewerCount || 1) > 1 ? "s" : ""}
                </span>
              </div>

              {isCancelled && app.interviewCancelReason && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  Reason: {app.interviewCancelReason}
                </p>
              )}
            </div>
          );
        })}

        {!loading && pageItems.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm border">
            {interviews.length === 0
              ? "No interviews scheduled yet — click \"Schedule Interview\" to set one up."
              : "No interviews match your search/filter."}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-1 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <HiOutlineChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium ${
                p === page ? "bg-blue-600 text-white" : "border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <HiOutlineChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Streamline Hiring promo */}
      <div className="mt-8 rounded-2xl border bg-blue-50/60 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <HiOutlineSparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Streamline Hiring</p>
            <p className="text-sm text-gray-600">Manage interviews efficiently and build your dream team.</p>
          </div>
        </div>
        <button
          onClick={openScheduleModal}
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Schedule Interview
        </button>
      </div>

      {/* Schedule Interview modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Schedule Interview</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600">
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{formError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Candidate</label>
                <Dropdown
                  value={form.applicationId}
                  onChange={(v) => setForm({ ...form, applicationId: v })}
                  options={[
                    { value: "", label: "-- Select candidate --" },
                    ...schedulable.map((a) => ({
                      value: a._id,
                      label: `${a.user?.name} — ${a.job?.title}`,
                    })),
                  ]}
                  fullWidth
                  buttonClassName="w-full"
                />
                {schedulable.length === 0 && (
                  <p className="mt-1 text-xs text-gray-400">All candidates already have interviews scheduled.</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Time</label>
                <div className="flex items-center gap-1.5">
                  <Dropdown
                    value={form.hour}
                    onChange={(v) => setForm({ ...form, hour: v })}
                    options={HOUR_OPTIONS}
                    className="flex-1 min-w-0"
                    fullWidth
                    buttonClassName="w-full px-2"
                  />
                  <span className="shrink-0 text-gray-400 font-semibold">:</span>
                  <Dropdown
                    value={form.minute}
                    onChange={(v) => setForm({ ...form, minute: v })}
                    options={MINUTE_OPTIONS}
                    className="flex-1 min-w-0"
                    fullWidth
                    buttonClassName="w-full px-2"
                  />
                  <Dropdown
                    value={form.period}
                    onChange={(v) => setForm({ ...form, period: v })}
                    options={PERIOD_OPTIONS}
                    className="flex-1 min-w-0"
                    fullWidth
                    buttonClassName="w-full px-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Duration (min)</label>
                  <input
                    type="number"
                    min="15"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Interviewers</label>
                  <input
                    type="number"
                    min="1"
                    value={form.interviewerCount}
                    onChange={(e) => setForm({ ...form, interviewerCount: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Interview Type</label>
                <input
                  type="text"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  placeholder="e.g. Technical Round, Technical + HR Round"
                  className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <HiOutlineSparkles className="h-4 w-4 shrink-0" />
                The candidate completes this as an AI video interview — no meeting link needed.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 rounded-lg border py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitSchedule}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Scheduling..." : "Schedule Interview"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
}
