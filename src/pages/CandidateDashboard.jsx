import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineBriefcase,
  HiOutlineBookmark,
  HiOutlineCalendarDays,
  HiOutlineEye,
} from "react-icons/hi2";
import CandidateLayout from "../layouts/CandidateLayout";
import { getCandidateDashboard } from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";

const PIPELINE_STAGES = [
  { key: "applied", label: "Applied" },
  { key: "under_review", label: "Under Review" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interviewed", label: "Interview" },
  { key: "selected", label: "Selected" },
];

const CHECKLIST_LABELS = {
  basicInfo: "Basic Info",
  workExperience: "Work Experience",
  education: "Education",
  skills: "Skills",
  portfolio: "Portfolio / Projects",
  resume: "CV Upload",
};

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCandidateDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";
  const maxPipelineValue = data ? Math.max(1, ...PIPELINE_STAGES.map((s) => data.pipeline[s.key])) : 1;

  return (
    <CandidateLayout title="Dashboard">
      
      
      {loading && <p className="mt-8 text-gray-500">Loading your dashboard...</p>}

      {data && (
        <>
          {/* Stat cards */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={HiOutlineBriefcase} color="blue" label="Applications" value={data.stats.applications} />
            <StatCard icon={HiOutlineBookmark} color="purple" label="Saved Jobs" value={data.stats.savedJobs} />
            <StatCard
              icon={HiOutlineCalendarDays}
              color="teal"
              label="Interviews Pending"
              value={data.stats.interviewsPending}
            />
            <StatCard icon={HiOutlineEye} color="amber" label="Profile Views" value={data.stats.profileViews} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr_1fr]">
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
                    to={`/interview/${data.nextInterview.job?._id}`}
                    state={{ job: data.nextInterview.job, applicationId: data.nextInterview.applicationId }}
                    className="mt-6 block rounded-lg bg-white py-2.5 text-center font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    Start Interview
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
                          className="h-1.5 rounded-full bg-blue-600"
                          style={{ width: `${(count / maxPipelineValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent applications */}
          <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Recent Applications</h2>
              <Link to="/dashboard/applications" className="text-sm font-medium text-blue-600">
                View All →
              </Link>
            </div>

            <div className="mt-4 divide-y">
              {data.recentApplications.map((app) => (
                <div key={app._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{app.job?.title}</p>
                    <p className="text-sm text-gray-500">{app.job?.company}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-600">
                    {app.status.replace("_", " ")}
                  </span>
                </div>
              ))}

              {data.recentApplications.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-400">No applications yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </CandidateLayout>
  );
}

function StatCard({ icon: Icon, color, label, value }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    teal: "bg-teal-50 text-teal-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
