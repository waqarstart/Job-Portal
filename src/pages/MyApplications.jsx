import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineMapPin,
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlineEllipsisVertical,
  HiOutlineChevronRight,
  HiOutlineSparkles,
} from "react-icons/hi2";
import CandidateLayout from "../layouts/CandidateLayout";
import { getMyApplications } from "../services/applicationService";

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-orange-500",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-indigo-600",
];

function avatarColor(name = "") {
  let n = 0;

  for (let i = 0; i < name.length; i++) {
    n += name.charCodeAt(i);
  }

  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function companyInitials(name = "") {
  if (!name.trim()) return "CO";

  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}

const STATUS_META = {
  applied: {
    label: "Applied",
    dot: "bg-gray-500",
    badge: "bg-gray-100 text-gray-700",
  },

  under_review: {
    label: "In Review",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700",
  },

  interviewed: {
    label: "In Review",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700",
  },

  shortlisted: {
    label: "Shortlisted",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700",
  },

  selected: {
    label: "Shortlisted",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700",
  },

  hired: {
    label: "Hired",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700",
  },

  rejected: {
    label: "Rejected",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700",
  },
};

/*
 * CV rating determines the displayed application status.
 *
 * CV rating > 50  -> shortlisted
 * CV rating <= 50 -> rejected
 *
 * If CV evaluation has not happened yet, use the
 * status stored in the database.
 */
function getApplicationStatus(app) {
  const rating = Number(app.cvRating);

  if (Number.isFinite(rating)) {
    return rating > 50 ? "shortlisted" : "rejected";
  }

  return app.status || "applied";
}

function bucketOf(status) {
  if (status === "applied") return "applied";

  if (
    status === "under_review" ||
    status === "interviewed"
  ) {
    return "in_review";
  }

  if (
    status === "shortlisted" ||
    status === "selected" ||
    status === "hired"
  ) {
    return "shortlisted";
  }

  if (status === "rejected") return "rejected";

  return "applied";
}

function formatDate(date) {
  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function expectedResponseWindow(createdAt) {
  if (!createdAt) return "—";

  const start = new Date(createdAt);
  start.setDate(start.getDate() + 5);

  const end = new Date(createdAt);
  end.setDate(end.getDate() + 12);

  const sameMonth =
    start.getMonth() === end.getMonth();

  const startStr = start.toLocaleDateString(undefined, {
    day: "numeric",
    month: sameMonth ? undefined : "short",
  });

  const endStr = end.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${startStr} – ${endStr}`;
}

/*
 * Converts OpenRouter skill data into something
 * that can safely be rendered.
 *
 * Handles:
 * - arrays
 * - strings
 * - undefined/null
 */
function normalizeSkills(skills) {
  if (!skills) return [];

  if (Array.isArray(skills)) {
    return skills.filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
}

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [expandedEvaluationId, setExpandedEvaluationId] =
    useState(null);

  useEffect(() => {
    getMyApplications()
      .then((data) => {
        console.log("Applications from backend:", data);

        setApps(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error(
          "Failed to load applications:",
          error
        );

        setApps([]);
      })
      .finally(() => setLoading(false));
  }, []);

  /*
   * Add displayStatus without modifying the backend data.
   */
  const applicationsWithStatus = useMemo(() => {
    return apps.map((app) => ({
      ...app,
      displayStatus: getApplicationStatus(app),
    }));
  }, [apps]);

  const counts = useMemo(() => {
    const c = {
      all: applicationsWithStatus.length,
      applied: 0,
      in_review: 0,
      shortlisted: 0,
      rejected: 0,
    };

    applicationsWithStatus.forEach((app) => {
      c[bucketOf(app.displayStatus)]++;
    });

    return c;
  }, [applicationsWithStatus]);

  const stats = useMemo(
    () => ({
      total: applicationsWithStatus.length,

      shortlisted: applicationsWithStatus.filter(
        (a) =>
          bucketOf(a.displayStatus) ===
          "shortlisted"
      ).length,

      inProgress: applicationsWithStatus.filter(
        (a) =>
          bucketOf(a.displayStatus) ===
          "in_review"
      ).length,

      rejected: applicationsWithStatus.filter(
        (a) =>
          bucketOf(a.displayStatus) ===
          "rejected"
      ).length,
    }),
    [applicationsWithStatus]
  );

  const visibleApps = useMemo(() => {
    if (filter === "all") {
      return applicationsWithStatus;
    }

    return applicationsWithStatus.filter(
      (app) =>
        bucketOf(app.displayStatus) === filter
    );
  }, [applicationsWithStatus, filter]);

  const TABS = [
    {
      key: "all",
      label: "All",
      count: counts.all,
    },
    {
      key: "applied",
      label: "Applied",
      count: counts.applied,
    },
    {
      key: "in_review",
      label: "In Review",
      count: counts.in_review,
    },
    {
      key: "shortlisted",
      label: "Shortlisted",
      count: counts.shortlisted,
    },
    {
      key: "rejected",
      label: "Rejected",
      count: counts.rejected,
    },
  ];

  const STAT_CARDS = [
    {
      icon: HiOutlineDocumentText,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      cardBg: "bg-blue-50/40",
      value: stats.total,
      label: "Total Applications",
      sub: "Jobs you have applied to",
    },

    {
      icon: HiOutlineCheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      cardBg: "bg-green-50/40",
      value: stats.shortlisted,
      label: "Shortlisted",
      sub: "CV rating above 50",
    },

    {
      icon: HiOutlineClock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      cardBg: "bg-amber-50/40",
      value: stats.inProgress,
      label: "In Progress",
      sub: "Under review",
    },

    {
      icon: HiOutlineXCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      cardBg: "bg-red-50/40",
      value: stats.rejected,
      label: "Rejected",
      sub: "CV rating 50 or below",
    },
  ];

  return (
    <CandidateLayout
      title="My Applications"
      subtitle="Track the status of jobs you have applied to."
    >
      {/* =====================================================
          STAT CARDS
      ====================================================== */}

      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        {STAT_CARDS.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border p-5 ${s.cardBg}`}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.iconBg} ${s.iconColor} mb-3`}
            >
              <s.icon className="h-5 w-5" />
            </div>

            <p className="text-3xl font-bold text-gray-900">
              {s.value}
            </p>

            <p className="text-sm font-semibold text-gray-800">
              {s.label}
            </p>

            <p className="text-xs text-gray-500">
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* =====================================================
          TABS
      ====================================================== */}

      <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === t.key
                  ? "bg-blue-600 text-white"
                  : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label}

              <span
                className={`rounded-full px-1.5 text-xs ${
                  filter === t.key
                    ? "bg-white/20"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
          Sort by:
          <span className="font-medium text-gray-700">
            Newest First
          </span>
        </div>
      </div>

      {loading && (
        <p className="text-gray-500">
          Loading...
        </p>
      )}

      {/* =====================================================
          APPLICATION CARDS
      ====================================================== */}

      <div className="space-y-4">
        {visibleApps.map((app) => {
          const status =
            STATUS_META[app.displayStatus] ||
            STATUS_META.applied;

          const bucket = bucketOf(
            app.displayStatus
          );

          const isDecided =
            bucket === "shortlisted" ||
            bucket === "rejected";

          const company =
            app.job?.company || "Company";

          const cvRating = Number(app.cvRating);

          const matchedSkills = normalizeSkills(
            app.cvMatchedSkills
          );

          const missingSkills = normalizeSkills(
            app.cvMissingSkills
          );

          /*
           * OpenRouter evaluation exists if we have
           * at least one evaluation field.
           */
          const hasAiEvaluation =
            Number.isFinite(cvRating) ||
            Boolean(app.cvMatchSummary) ||
            matchedSkills.length > 0 ||
            missingSkills.length > 0;

          const evaluationOpen =
            expandedEvaluationId === app._id;

          return (
            <div
              key={app._id}
              className="relative rounded-2xl border bg-white p-5 shadow-sm"
            >
              {/* =================================================
                  MAIN APPLICATION CONTENT
              ================================================== */}

              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-white font-bold ${avatarColor(
                      company
                    )}`}
                  >
                    <span className="text-lg leading-none">
                      {companyInitials(company)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {app.job?.title ||
                        "Job title"}
                    </h3>

                    <p className="font-medium text-gray-600">
                      {company}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-sm text-gray-500">
                      {(app.job?.city ||
                        app.job?.location) && (
                        <span className="flex items-center gap-1">
                          <HiOutlineMapPin className="w-3.5 h-3.5" />

                          {app.job?.city ||
                            app.job?.location}
                        </span>
                      )}

                      {app.job?.type && (
                        <>
                          <span>·</span>

                          <span className="flex items-center gap-1">
                            <HiOutlineBriefcase className="w-3.5 h-3.5" />

                            {app.job.type}
                          </span>
                        </>
                      )}

                      <span>·</span>

                      <span>
                        Applied on{" "}
                        {formatDate(app.createdAt)}
                      </span>
                    </div>

                    {/* CV RATING */}

                    {Number.isFinite(cvRating) && (
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            cvRating > 50
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          CV Rating: {cvRating}/100
                        </span>

                        {cvRating > 50 && (
                          <span className="text-xs font-medium text-green-600">
                            Interview eligible
                          </span>
                        )}
                      </div>
                    )}

                    {/* JOB SKILLS */}

                    {app.job?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {app.job.skills
                          .slice(0, 4)
                          .map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                            >
                              {s}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* STATUS */}

                <div className="flex items-start gap-2 shrink-0">
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.badge}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                    />

                    {status.label}
                  </span>

                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === app._id
                            ? null
                            : app._id
                        )
                      }
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                      <HiOutlineEllipsisVertical className="h-5 w-5" />
                    </button>

                    {openMenuId === app._id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() =>
                            setOpenMenuId(null)
                          }
                        />

                        <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border bg-white py-1 shadow-xl">
                          <Link
                            to={`/jobs/${app.job?._id}`}
                            onClick={() =>
                              setOpenMenuId(null)
                            }
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            View Job
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* =================================================
                  AI CV EVALUATION
              ================================================== */}

              {bucket === "rejected" &&
                hasAiEvaluation && (
                  <div className="mt-5 border-t pt-4">
                    <button
                      onClick={() =>
                        setExpandedEvaluationId(
                          evaluationOpen
                            ? null
                            : app._id
                        )
                      }
                      className="flex w-full items-center justify-between rounded-xl border bg-gray-50 px-4 py-3 text-left hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <HiOutlineSparkles className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900">
                            AI CV Evaluation
                          </p>

                          <p className="text-xs text-gray-500">
                            Evaluation generated from your CV
                            and the job requirements
                          </p>
                        </div>
                      </div>

                      <HiOutlineChevronRight
                        className={`h-5 w-5 text-gray-400 transition-transform ${
                          evaluationOpen
                            ? "rotate-90"
                            : ""
                        }`}
                      />
                    </button>

                    {evaluationOpen && (
                      <div className="mt-3 rounded-xl border bg-white p-5">
                        {/* Rating */}

                        {Number.isFinite(cvRating) && (
                          <div className="mb-5 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                CV Rating
                              </p>

                              <p className="text-xs text-gray-500">
                                AI evaluation score
                              </p>
                            </div>

                            <div className="rounded-xl bg-red-50 px-4 py-2 text-center">
                              <p className="text-2xl font-bold text-red-600">
                                {cvRating}
                                <span className="text-sm font-medium">
                                  /100
                                </span>
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Summary */}

                        {app.cvMatchSummary && (
                          <div className="mb-5">
                            <p className="mb-2 text-sm font-semibold text-gray-800">
                              AI Evaluation Summary
                            </p>

                            <p className="rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-600">
                              {app.cvMatchSummary}
                            </p>
                          </div>
                        )}

                        {/* Matched Skills */}

                        {matchedSkills.length > 0 && (
                          <div className="mb-5">
                            <p className="mb-2 text-sm font-semibold text-gray-800">
                              Matched Skills
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {matchedSkills.map(
                                (skill, index) => (
                                  <span
                                    key={`${skill}-${index}`}
                                    className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700"
                                  >
                                    {skill}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Missing Skills */}

                        {missingSkills.length > 0 && (
                          <div>
                            <p className="mb-2 text-sm font-semibold text-gray-800">
                              Missing Skills
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {missingSkills.map(
                                (skill, index) => (
                                  <span
                                    key={`${skill}-${index}`}
                                    className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700"
                                  >
                                    {skill}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              {/* =================================================
                  BOTTOM INFORMATION
              ================================================== */}

              <div className="flex flex-col gap-3 pt-4 mt-4 border-t sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <HiOutlineCalendarDays className="w-4 h-4" />

                  {isDecided ? (
                    <span>
                      Responded on{" "}
                      <span className="font-medium text-gray-700">
                        {formatDate(
                          app.updatedAt
                        )}
                      </span>
                    </span>
                  ) : (
                    <span>
                      Expected response{" "}
                      <span className="font-medium text-gray-700">
                        {expectedResponseWindow(
                          app.createdAt
                        )}
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4">
                  {app.cvOriginalName && (
                    <div className="flex items-center gap-2 text-sm">
                      <HiOutlineDocumentText className="w-4 h-4 text-blue-500" />

                      <div>
                        <p className="font-medium leading-tight text-gray-800">
                          Resume
                        </p>

                        <p className="text-xs leading-tight text-gray-400">
                          {app.cvOriginalName}
                        </p>
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/jobs/${app.job?._id}`}
                    className="flex items-center gap-1 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                  >
                    {bucket === "rejected"
                      ? "View Feedback"
                      : "View Details"}

                    <HiOutlineChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && visibleApps.length === 0 && (
          <div className="rounded-2xl border bg-white p-10 text-center text-gray-500 shadow-sm">
            <HiOutlineDocumentText className="w-10 h-10 mx-auto mb-3 text-gray-300" />

            {apps.length === 0
              ? "You haven't applied to any jobs yet."
              : "No applications in this category."}
          </div>
        )}
      </div>
    </CandidateLayout>
  );
}
