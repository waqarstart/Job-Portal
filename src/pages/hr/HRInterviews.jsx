import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  HiOutlineCalendarDays, HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineMagnifyingGlass, HiOutlineUserGroup,
  HiOutlineEllipsisVertical, HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlinePlus, HiOutlineXMark, HiOutlineSparkles, HiOutlineEnvelope,
  HiOutlineVideoCamera, HiOutlineExclamationTriangle,
  HiOutlineChatBubbleLeftRight, HiOutlineChevronDown, HiOutlineTrash,
} from "react-icons/hi2";
import HRLayout from "../../layouts/HRLayout";
import Dropdown from "../../components/Dropdown";
import InterviewFeedbackPanel from "../../components/InterviewFeedbackPanel";
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

const INTERVIEW_STATUS_BADGE = {
  pending:   { label: "Pending",   badge: "bg-amber-50 text-amber-700" },
  completed: { label: "Completed", badge: "bg-green-50 text-green-700" },
  cancelled: { label: "Cancelled", badge: "bg-red-50 text-red-700" },
};

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
  const [expandedFeedbackId, setExpandedFeedbackId] = useState(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [modalDataReady, setModalDataReady] = useState(false);
  const [schedulable, setSchedulable] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [cancelTarget, setCancelTarget] = useState(null); // the app pending cancel confirmation
  const [cancelReason, setCancelReason] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null); // the app pending remove confirmation

  function emptyForm() {
    return {
      applicationId: "",
      date: "",
      hour: "10",
      minute: "00",
      period: "AM",
      type: "Technical Round",
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

  // Lock background page scroll while the modal (or its loading state) is open.
  useLayoutEffect(() => {
    if (!showScheduleModal) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [showScheduleModal]);

  const filtered = useMemo(() => {
    let list = [...interviews];

    if (statusFilter === "removed") {
      list = list.filter((i) => Boolean(i.interviewRemovalRequestedAt));
    } else if (statusFilter !== "all") {
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
    setCancelReason("");
    setCancelTarget(app);
  }

  async function confirmCancelInterview() {
    const app = cancelTarget;
    setCancelTarget(null);
    if (!app) return;
    await scheduleInterview(app._id, {
      interviewStatus: "cancelled",
      interviewCancelReason: cancelReason.trim(),
    });
    load();
  }

  async function reopenInterview(app) {
    setOpenMenuId(null);
    await scheduleInterview(app._id, { interviewStatus: "pending" });
    load();
  }

  async function confirmRemoveInterview() {
    const app = removeTarget;
    setRemoveTarget(null);
    if (!app) return;
    await scheduleInterview(app._id, { interviewRemovalRequestedAt: new Date().toISOString() });
    load();
  }

  async function undoRemoval(app) {
    setOpenMenuId(null);
    await scheduleInterview(app._id, { interviewRemovalRequestedAt: null });
    load();
  }

  async function openScheduleModal() {
    setForm(emptyForm());
    setFormError("");
    setSchedulable([]);
    setModalDataReady(false);
    setShowScheduleModal(true);
    const apps = await getSchedulableApplicants();
    setSchedulable(apps);
    setModalDataReady(true);
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
        interviewType: form.type,
        interviewMode: "AI Interview",
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

  const removedCount = useMemo(
    () => interviews.filter((i) => Boolean(i.interviewRemovalRequestedAt)).length,
    [interviews]
  );

  const STAT_CARDS = [
    { key: "all",       icon: HiOutlineCalendarDays, bg: "bg-blue-50",  color: "text-blue-600",  value: stats.total,     label: "All" },
    { key: "pending",   icon: HiOutlineClock,        bg: "bg-amber-50", color: "text-amber-600", value: stats.scheduled, label: "Scheduled" },
    { key: "completed", icon: HiOutlineCheckCircle,  bg: "bg-green-50", color: "text-green-600", value: stats.completed, label: "Completed" },
    { key: "cancelled", icon: HiOutlineXCircle,      bg: "bg-red-50",   color: "text-red-600",   value: stats.cancelled, label: "Cancelled" },
    { key: "removed",   icon: HiOutlineTrash,        bg: "bg-gray-100", color: "text-gray-600",  value: removedCount,    label: "Removed" },
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
      {/* Status tabs (also filter the list below) */}
      <div className="mb-0 flex gap-0 border-b border-gray-200 overflow-x-auto hide-scrollbar">
        {STAT_CARDS.map((c) => {
          const active = statusFilter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setStatusFilter(c.key)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                active ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {c.label}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {c.value}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mt-5 mb-5">
        <div className="relative">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search interviews..."
            className="w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {/* Interview cards */}
      <div className="space-y-4">
        {pageItems.map((app) => {
          const meta = INTERVIEW_STATUS_BADGE[app.interviewStatus] || INTERVIEW_STATUS_BADGE.pending;
          const isCancelled = app.interviewStatus === "cancelled";
          const isCompleted = app.interviewStatus === "completed";
          const isMarkedForRemoval = Boolean(app.interviewRemovalRequestedAt);
          const removalDaysLeft = isMarkedForRemoval
            ? Math.max(0, 2 - Math.floor((Date.now() - new Date(app.interviewRemovalRequestedAt)) / 86400000))
            : null;

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
                  {isMarkedForRemoval && (
                    <span className="flex items-center gap-1 rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-white" title="This will disappear from the Interviews list automatically">
                      Removed{removalDaysLeft > 0 ? ` · ${removalDaysLeft}d left` : ""}
                    </span>
                  )}

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
                          {(isCancelled || isCompleted) && !app.interviewRemovalRequestedAt && (
                            <>
                              <button onClick={() => reopenInterview(app)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                Reopen as Scheduled
                              </button>
                              <button onClick={() => { setOpenMenuId(null); setRemoveTarget(app); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                Remove
                              </button>
                            </>
                          )}
                          {app.interviewRemovalRequestedAt && (
                            <button onClick={() => undoRemoval(app)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              Undo Removal
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
              </div>

              {isCancelled && app.interviewCancelReason && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  Reason: {app.interviewCancelReason}
                </p>
              )}

              {isCompleted && (
                <div className="mt-4 border-t border-gray-50 pt-3">
                  <button
                    onClick={() => setExpandedFeedbackId(expandedFeedbackId === app._id ? null : app._id)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
                  >
                    <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
                    {expandedFeedbackId === app._id ? "Hide Feedback" : "View Feedback"}
                    <HiOutlineChevronDown className={`h-4 w-4 transition-transform ${expandedFeedbackId === app._id ? "rotate-180" : ""}`} />
                  </button>

                  {expandedFeedbackId === app._id && (
                    <InterviewFeedbackPanel application={app} />
                  )}
                </div>
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

            {!modalDataReady ? (
              // Show a lightweight, fixed-size loading state until the
              // candidate list has loaded — this guarantees the modal's
              // real height is never measured/changed after the form
              // mounts, which is what caused the scrollbar to flash.
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <p className="mt-3 text-sm text-gray-400">Loading candidates...</p>
              </div>
            ) : (
              <>

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
                  <p className="mt-1 text-xs text-gray-400">
                    No candidates available — only applicants with a CV rating above 50 (and no interview scheduled yet) show up here.
                  </p>
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

              <div>
                <label className="text-sm font-medium text-gray-700">Interview Type</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  placeholder="e.g. Technical Round, Technical + HR Round"
                  className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <HiOutlineSparkles className="h-4 w-4 shrink-0" />
                The candidate completes this as a short (~2 min) AI video interview — no meeting link needed.
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
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Cancel confirmation popup ── */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <HiOutlineExclamationTriangle className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900">Cancel this interview?</h3>
            <p className="mt-1 text-sm text-gray-500">
              {cancelTarget.user?.name || "This candidate"} will no longer see it as scheduled.
            </p>

            <div className="mt-4 text-left">
              <label className="text-sm font-medium text-gray-700">Reason (optional)</label>
              <textarea
                autoFocus
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Candidate requested a reschedule, position on hold..."
                className="mt-1 w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Keep It
              </button>
              <button
                onClick={confirmCancelInterview}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove confirmation popup ── */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600">
              <HiOutlineTrash className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900">Remove this interview?</h3>
            <p className="mt-1 text-sm text-gray-500">
              It'll be marked as removed and automatically disappear from this list in 2 days. You can undo this any time before then.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setRemoveTarget(null)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveInterview}
                className="flex-1 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-900 transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
}
