import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineBriefcase,
  HiOutlineBookmark,
  HiOutlineCalendarDays,
  HiOutlineEye,
  HiOutlineVideoCamera,
  HiOutlineDocumentCheck,
  HiOutlineStar,
  HiOutlineDocumentText,
  HiOutlineNewspaper,
  HiOutlineLifebuoy,
  HiOutlineBell,
} from "react-icons/hi2";
import CandidateLayout from "../layouts/CandidateLayout";
import Dropdown from "../components/Dropdown";
import { getCandidateDashboard } from "../services/dashboardService";
import { getMyApplications } from "../services/applicationService";
import { searchJobs } from "../services/jobService";
import { useAuth } from "../context/AuthContext";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const PIPELINE_STAGES = [
  { key: "applied", label: "Applied", color: "#2563eb" },
  { key: "under_review", label: "Under Review", color: "#f59e0b" },
  { key: "shortlisted", label: "Shortlisted", color: "#8b5cf6" },
  { key: "interviewed", label: "Interview", color: "#06b6d4" },
  { key: "selected", label: "Selected", color: "#22c55e" },
  { key: "rejected", label: "Rejected", color: "#ef4444" },
];

const CHECKLIST_LABELS = {
  basicInfo: "Basic Info",
  workExperience: "Work Experience",
  education: "Education",
  skills: "Skills",
  portfolio: "Portfolio / Projects",
  resume: "CV Upload",
};

const STATUS_STYLES = {
  applied: "bg-blue-50 text-blue-600",
  under_review: "bg-amber-50 text-amber-600",
  shortlisted: "bg-purple-50 text-purple-600",
  interviewed: "bg-cyan-50 text-cyan-600",
  selected: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-600",
};

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function avatarColor(name = "") {
  const colors = ["bg-blue-600", "bg-violet-600", "bg-emerald-600", "bg-rose-600", "bg-amber-600", "bg-cyan-600"];
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return colors[n % colors.length];
}

function comingSoon(feature) {
  alert(`${feature} are coming soon.`);
}

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

function withinRange(dateStr, range) {
  const d = new Date(dateStr);
  const now = new Date();
  if (range === "all") return true;
  if (range === "today") return d.toDateString() === now.toDateString();
  if (range === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return d >= weekAgo;
  }
  if (range === "month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  if (range === "year") return d.getFullYear() === now.getFullYear();
  return true;
}

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [allApplications, setAllApplications] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusRange, setStatusRange] = useState("month");

  useEffect(() => {
    getCandidateDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  // Full application list (dashboard endpoint only returns the latest 5) —
  // used for the recent-activity timeline and to exclude already-applied
  // jobs from recommendations.
  useEffect(() => {
    getMyApplications()
      .then(setAllApplications)
      .catch(() => {});
  }, []);

  // Real "recommended" jobs — active listings the candidate hasn't applied
  // to yet, most recent first.
  useEffect(() => {
    searchJobs()
      .then((jobs) => {
        const appliedIds = new Set(allApplications.map((a) => a.job?._id).filter(Boolean));
        const open = jobs
          .filter((j) => j.status !== "closed" && !appliedIds.has(j._id))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 4);
        setRecommended(open);
      })
      .catch(() => {});
  }, [allApplications]);

  const firstName = user?.name?.split(" ")[0] || "there";
  const maxPipelineValue = data ? Math.max(1, ...PIPELINE_STAGES.map((s) => data.pipeline[s.key])) : 1;

  // Real activity feed — derived from each application's submission time
  // and (if it changed) its latest status-update time. Not a full audit
  // log (we don't store granular history like "profile viewed at X"),
  // just what the data actually tells us.
  const activity = useMemo(() => {
    const events = [];
    for (const app of allApplications) {
      events.push({
        time: app.createdAt,
        message: `Your application for ${app.job?.title || "a job"} has been submitted`,
        company: app.job?.company,
        icon: HiOutlineDocumentCheck,
        color: "text-blue-600 bg-blue-50",
      });
      if (app.status !== "applied" && app.updatedAt && app.updatedAt !== app.createdAt) {
        const label = app.status.replace("_", " ");
        events.push({
          time: app.updatedAt,
          message:
            app.status === "selected"
              ? `You were selected for ${app.job?.title || "a role"}`
              : app.status === "rejected"
                ? `Your application for ${app.job?.title || "a role"} was rejected`
                : `Your application for ${app.job?.title || "a role"} is now ${label}`,
          company: app.job?.company,
          icon: app.status === "selected" ? HiOutlineStar : app.status === "rejected" ? HiOutlineDocumentText : HiOutlineBell,
          color:
            app.status === "selected"
              ? "text-green-600 bg-green-50"
              : app.status === "rejected"
                ? "text-red-600 bg-red-50"
                : "text-amber-600 bg-amber-50",
        });
      }
    }
    return events.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);
  }, [allApplications]);

  // "Application Status Overview" respects the selected time range — computed
  // client-side from the full application list (already fetched above), so
  // switching Today/Week/Month/Year/All Time needs no extra API call.
  const rangedPipeline = useMemo(() => {
    const p = { applied: 0, under_review: 0, shortlisted: 0, interviewed: 0, selected: 0, rejected: 0 };
    for (const app of allApplications) {
      if (!withinRange(app.createdAt, statusRange)) continue;
      if (p[app.status] !== undefined) p[app.status]++;
    }
    return p;
  }, [allApplications, statusRange]);

  const rangedTotal = useMemo(
    () => PIPELINE_STAGES.reduce((s, st) => s + rangedPipeline[st.key], 0),
    [rangedPipeline]
  );

  // Donut chart built with a CSS conic-gradient — no charting library needed.
  const donutGradient = useMemo(() => {
    if (rangedTotal === 0) return "#e5e7eb";
    let acc = 0;
    const stops = [];
    for (const stage of PIPELINE_STAGES) {
      const count = rangedPipeline[stage.key];
      if (count === 0) continue;
      const start = (acc / rangedTotal) * 360;
      acc += count;
      const end = (acc / rangedTotal) * 360;
      stops.push(`${stage.color} ${start}deg ${end}deg`);
    }
    return `conic-gradient(${stops.join(", ")})`;
  }, [rangedPipeline, rangedTotal]);

  return (
    <CandidateLayout title="Dashboard" subtitle={`Welcome back, ${firstName}! Here's what's happening with your job search.`}>

      {loading && <p className="mt-8 text-gray-500">Loading your dashboard...</p>}

      {data && (
        <>
          {/* Stat cards */}
          <div className="mt-2 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={HiOutlineBriefcase} color="blue" label="Applications" value={data.stats.applications}
              linkText="Active Applications" to="/dashboard/applications"
            />
            <StatCard
              icon={HiOutlineBookmark} color="purple" label="Saved Jobs" value={data.stats.savedJobs}
              linkText="Jobs saved" to="/dashboard/saved-jobs"
            />
            <StatCard
              icon={HiOutlineCalendarDays} color="teal" label="Interviews Pending" value={data.stats.interviewsPending}
              linkText="Upcoming Interviews" to="/dashboard/interviews"
            />
            <StatCard
              icon={HiOutlineEye} color="amber" label="Profile Views" value={data.stats.profileViews}
              linkText="User view" linkColor="text-orange-500"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr_1fr]">
            {/* Profile completion */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Profile Completion</h2>
                <span className="text-lg font-bold text-blue-600">{data.profileCompletion.percent}%</span>
              </div>

              <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${data.profileCompletion.percent}%` }}
                />
              </div>

              <ul className="mt-5 space-y-2.5">
                {Object.entries(CHECKLIST_LABELS).map(([key, label]) => {
                  const done = data.profileCompletion.checklist[key];
                  return (
                    <li key={key} className="flex items-center gap-2 text-sm">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                          done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {done ? "✓" : ""}
                      </span>
                      <span className={done ? "text-gray-700" : "text-gray-400"}>{label}</span>
                    </li>
                  );
                })}
              </ul>

              <Link
                to="/dashboard/profile"
                className="mt-5 block rounded-lg border py-2.5 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50"
              >
                Complete Profile
              </Link>
            </div>

            {/* Next interview */}
            <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-sm">
              <div className="flex items-center gap-2">
                <HiOutlineCalendarDays className="h-5 w-5" />
                <h2 className="font-semibold">Next Interview</h2>
              </div>

              {data.nextInterview ? (
                <>
                  <h3 className="mt-4 text-xl font-bold">{data.nextInterview.job?.title}</h3>
                  <p className="text-blue-100">{data.nextInterview.job?.company}</p>

                  <dl className="mt-5 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-blue-100">Type</dt>
                      <dd className="font-medium">AI Video Interview</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-blue-100">Availability</dt>
                      <dd className="font-medium">On-demand, anytime</dd>
                    </div>
                  </dl>

                  <Link
                    to={`/interview/${data.nextInterview.applicationId}`}
                    state={{
                      job: data.nextInterview.job,
                      applicationId: data.nextInterview.applicationId,
                      autoStart: true,
                    }}
                    className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-center font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    <HiOutlineVideoCamera className="h-4 w-4" />
                    Start Interview
                  </Link>

                  <Link
                    to="/dashboard/interviews"
                    className="mt-2 block rounded-lg border border-blue-400 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Reschedule
                  </Link>
                </>
              ) : (
                <p className="mt-6 text-blue-100">
                  No interviews waiting right now — apply to a job to get started.
                </p>
              )}
            </div>

            {/* Application pipeline */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="font-semibold">Application Pipeline</h2>

              <div className="mt-5 space-y-4">
                {PIPELINE_STAGES.map((stage) => {
                  const count = data.pipeline[stage.key];
                  return (
                    <div key={stage.key}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{stage.label}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${(count / maxPipelineValue) * 100}%`, background: stage.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status overview donut + Top recommendations */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Application Status Overview</h2>
                <Dropdown
                  value={statusRange}
                  onChange={setStatusRange}
                  options={RANGE_OPTIONS}
                  buttonClassName="!py-1.5 !text-xs"
                />
              </div>

              {rangedTotal === 0 ? (
                <p className="mt-10 text-center text-sm text-gray-400">
                  No applications {statusRange === "all" ? "yet" : `in this period`} — try a wider range.
                </p>
              ) : (
                <div className="mt-6 flex items-center gap-8">
                  <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
                    <div className="h-full w-full rounded-full" style={{ background: donutGradient }} />
                    <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-2xl font-bold text-gray-900">{rangedTotal}</span>
                      <span className="text-xs text-gray-400">Total</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {PIPELINE_STAGES.map((stage) => {
                      const count = rangedPipeline[stage.key];
                      const pct = rangedTotal ? ((count / rangedTotal) * 100).toFixed(1) : "0.0";
                      return (
                        <div key={stage.key} className="flex items-center gap-2 text-sm">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: stage.color }} />
                          <span className="text-gray-600 w-28">{stage.label}</span>
                          <span className="font-semibold text-gray-800">{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Top Job Recommendations</h2>
                <Link to="/find-jobs" className="text-sm font-medium text-blue-600">View All</Link>
              </div>

              <div className="mt-4 divide-y">
                {recommended.map((job) => (
                  <Link
                    key={job._id}
                    to={`/jobs/${job._id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white ${avatarColor(job.company)}`}>
                        {job.companyRef?.logo ? (
                          <img src={`${FILE_BASE}${job.companyRef.logo}`} alt={job.company} className="h-full w-full object-cover" />
                        ) : (
                          (job.company || "?")[0]?.toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{job.title}</p>
                        <p className="truncate text-xs text-gray-500">{job.company} · {job.city}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">{job.type || "Full Time"}</span>
                      {Date.now() - new Date(job.createdAt).getTime() < 3 * 86400000 ? (
                        <span className="text-[10px] font-semibold text-green-600">New</span>
                      ) : (
                        <span className="text-[10px] text-gray-400">{timeAgo(job.createdAt)}</span>
                      )}
                    </div>
                  </Link>
                ))}

                {recommended.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-400">No new recommendations right now.</p>
                )}
              </div>

              <Link
                to="/find-jobs"
                className="mt-4 block rounded-lg border py-2.5 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50"
              >
                View All Recommendations →
              </Link>
            </div>
          </div>

          {/* Recent applications + Recent activity */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Recent Applications</h2>
                <Link to="/dashboard/applications" className="text-sm font-medium text-blue-600">View All</Link>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      <th className="pb-2 font-bold">Job Title</th>
                      <th className="pb-2 font-bold">Company</th>
                      <th className="pb-2 font-bold">Applied On</th>
                      <th className="pb-2 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.recentApplications.map((app) => (
                      <tr key={app._id}>
                        <td className="py-3 pr-2 font-medium text-gray-800">{app.job?.title}</td>
                        <td className="py-3 pr-2">
                          <div className="flex items-center gap-2">
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md text-[10px] font-bold text-white ${avatarColor(app.job?.company)}`}>
                              {app.job?.companyRef?.logo ? (
                                <img src={`${FILE_BASE}${app.job.companyRef.logo}`} alt="" className="h-full w-full object-cover" />
                              ) : (
                                (app.job?.company || "?")[0]?.toUpperCase()
                              )}
                            </div>
                            <span className="text-gray-600">{app.job?.company}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-2 text-gray-500">
                          {new Date(app.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[app.status] || "bg-gray-50 text-gray-600"}`}>
                            {app.status.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {data.recentApplications.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-400">No applications yet.</p>
                )}
              </div>

              <Link
                to="/dashboard/applications"
                className="mt-4 block rounded-lg border py-2.5 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50"
              >
                View All Applications →
              </Link>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Recent Activity</h2>
                <Link to="/dashboard/applications" className="text-sm font-medium text-blue-600">View All</Link>
              </div>

              <div className="mt-4 space-y-4">
                {activity.map((ev, i) => {
                  const Icon = ev.icon;
                  return (
                    <div key={i} className="flex gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ev.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800">{ev.message}</p>
                        <p className="text-xs text-gray-400">
                          {ev.company ? `${ev.company} · ` : ""}{timeAgo(ev.time)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {activity.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-400">No activity yet — apply to a job to get started.</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <QuickLink
              icon={HiOutlineBell} color="text-blue-600 bg-blue-50" title="Job Alerts"
              desc="Get notified about new jobs that match your profile."
              actionLabel="Manage Alerts" onClick={() => comingSoon("Job alerts")}
            />
            <QuickLink
              icon={HiOutlineStar} color="text-emerald-600 bg-emerald-50" title="Skill Tests"
              desc="Take tests to validate your skills and stand out."
              actionLabel="View Tests" onClick={() => comingSoon("Skill tests")}
            />
            <QuickLink
              icon={HiOutlineDocumentText} color="text-purple-600 bg-purple-50" title="Resume Builder"
              desc="Create or update your resume easily."
              actionLabel="Edit Resume" to="/dashboard/resume"
            />
            <QuickLink
              icon={HiOutlineNewspaper} color="text-amber-600 bg-amber-50" title="Career Resources"
              desc="Explore tips and guides to boost your career."
              actionLabel="Explore Now" onClick={() => comingSoon("Career resources")}
            />
            <QuickLink
              icon={HiOutlineLifebuoy} color="text-cyan-600 bg-cyan-50" title="Help Center"
              desc="Get help with your account or applications."
              actionLabel="Visit Help Center" onClick={() => comingSoon("Help Center")}
            />
          </div>
        </>
      )}
    </CandidateLayout>
  );
}

function StatCard({ icon: Icon, color, label, value, linkText, to, linkColor }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    teal: "bg-teal-50 text-teal-600",
    amber: "bg-amber-50 text-amber-600",
  };

  const linkClass = linkColor || "text-blue-600";

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      {to ? (
        <Link to={to} className={`mt-1 block text-sm font-medium hover:underline ${linkClass}`}>{linkText}</Link>
      ) : (
        <p className={`mt-1 text-sm font-medium ${linkClass}`}>{linkText}</p>
      )}
    </div>
  );
}

function QuickLink({ icon: Icon, color, title, desc, actionLabel, to, onClick }) {
  const Action = to ? Link : "button";
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-bold text-gray-900">{title}</p>
      <p className="mt-1 text-xs text-gray-500 leading-5">{desc}</p>
      <Action to={to} onClick={onClick} className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline">
        {actionLabel} →
      </Action>
    </div>
  );
}
