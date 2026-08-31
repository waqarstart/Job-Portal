import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineMapPin,
  HiOutlineVideoCamera,
  HiOutlineUserGroup,
  HiOutlineEllipsisVertical,
  HiOutlineSparkles,
} from "react-icons/hi2";
import CandidateLayout from "../layouts/CandidateLayout";
import { getMyApplications } from "../services/applicationService";

const AVATAR_COLORS = [
  "bg-indigo-700",
  "bg-orange-500",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-rose-600",
  "bg-gray-900",
];

function avatarColor(name = "") {
  let n = 0;

  for (let i = 0; i < name.length; i++) {
    n += name.charCodeAt(i);
  }

  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function companyInitials(name = "") {
  const words = name.trim().split(/\s+/);

  if (!name.trim()) return "CO";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}

const STATUS_META = {
  applied: {
    label: "Applied",
    badge: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },

  shortlisted: {
    label: "Shortlisted",
    badge: "bg-green-50 text-green-700",
    dot: "bg-green-500",
  },

  interviewed: {
    label: "Interviewed",
    badge: "bg-purple-50 text-purple-700",
    dot: "bg-purple-500",
  },

  rejected: {
    label: "Rejected",
    badge: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },

  pending: {
    label: "Pending",
    badge: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },

  completed: {
    label: "Completed",
    badge: "bg-green-50 text-green-700",
    dot: "bg-green-500",
  },

  cancelled: {
    label: "Cancelled",
    badge: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
};

function formatDate(date) {
  if (!date) {
    return {
      date: "Not scheduled",
      weekday: "",
      time: "",
    };
  }

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return {
      date: "Not scheduled",
      weekday: "",
      time: "",
    };
  }

  return {
    date: d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),

    weekday: d.toLocaleDateString(undefined, {
      weekday: "long",
    }),

    time: d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export default function Interviews() {
  const navigate = useNavigate();

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [startingInterview, setStartingInterview] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await getMyApplications();

      console.log("Candidate applications:", data);

      setApps(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load applications:", error);
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * ============================================================
   * APPLICATION STATUS
   * ============================================================
   *
   * The application status comes from the backend.
   *
   * Example:
   *
   * Applied
   * Shortlisted
   * Interviewed
   *
   * We do NOT change the status in the frontend.
   */

  const applicationStatus = (app) => {
    return app.status || "applied";
  };

  /*
   * ============================================================
   * INTERVIEW AVAILABILITY
   * ============================================================
   *
   * An interview becomes available automatically when:
   *
   * CV rating > 50
   *
   * We intentionally don't require interviewDate here.
   *
   * This means an old application such as:
   *
   * test4
   * Laravel Developer
   * CV Rating: 65
   * status: applied
   *
   * will still appear in Interviews.
   */

  const interviewApplications = useMemo(() => {
    return apps.filter((app) => {
      const rating = Number(app.cvRating);

      return (
        Number.isFinite(rating) &&
        rating > 50 &&
        applicationStatus(app) !== "rejected"
      );
    });
  }, [apps]);

  /*
   * ============================================================
   * COUNTS
   * ============================================================
   *
   * Keep the existing dashboard-style cards, but count the
   * applications that qualify for interviews.
   */

  const counts = useMemo(() => {
    const result = {
      all: interviewApplications.length,
      pending: 0,
      completed: 0,
      cancelled: 0,
    };

    interviewApplications.forEach((app) => {
      /*
       * If the application is already interviewed, count it
       * as completed.
       */

      if (app.status === "interviewed") {
        result.completed += 1;
        return;
      }

      /*
       * Existing scheduled interview statuses are respected.
       */

      if (app.interviewStatus === "cancelled") {
        result.cancelled += 1;
        return;
      }

      /*
       * Everything else with CV > 50 is available/pending.
       */

      result.pending += 1;
    });

    return result;
  }, [interviewApplications]);

  /*
   * ============================================================
   * FILTER
   * ============================================================
   */

  const visible = useMemo(() => {
    let list = [...interviewApplications];

    if (filter === "pending") {
      list = list.filter(
        (app) =>
          app.status !== "interviewed" &&
          app.interviewStatus !== "cancelled"
      );
    }

    if (filter === "completed") {
      list = list.filter(
        (app) =>
          app.status === "interviewed" ||
          app.interviewStatus === "completed"
      );
    }

    if (filter === "cancelled") {
      list = list.filter(
        (app) => app.interviewStatus === "cancelled"
      );
    }

    /*
     * Scheduled interviews first.
     * Unscheduled AI interviews come afterwards.
     */

    list.sort((a, b) => {
      if (a.interviewDate && !b.interviewDate) return -1;
      if (!a.interviewDate && b.interviewDate) return 1;

      if (a.interviewDate && b.interviewDate) {
        return (
          new Date(a.interviewDate) -
          new Date(b.interviewDate)
        );
      }

      return (
        Number(b.cvRating || 0) -
        Number(a.cvRating || 0)
      );
    });

    return list;
  }, [interviewApplications, filter]);

  /*
   * ============================================================
   * TABS
   * ============================================================
   */

  const TABS = [
    {
      key: "all",
      label: "All Interviews",
      count: counts.all,
      icon: HiOutlineCalendarDays,
    },

    {
      key: "pending",
      label: "Pending",
      count: counts.pending,
      icon: HiOutlineClock,
    },

    {
      key: "completed",
      label: "Completed",
      count: counts.completed,
      icon: HiOutlineCheckCircle,
    },

    {
      key: "cancelled",
      label: "Cancelled",
      count: counts.cancelled,
      icon: HiOutlineXCircle,
    },
  ];

  /*
   * ============================================================
   * STAT CARDS
   * ============================================================
   */

  const STAT_CARDS = [
    {
      icon: HiOutlineCalendarDays,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      cardBg: "bg-blue-50/40",
      value: counts.all,
      label: "Total Interviews",
      sub: "CV rating above 50",
    },

    {
      icon: HiOutlineClock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      cardBg: "bg-amber-50/40",
      value: counts.pending,
      label: "Pending",
      sub: "Awaiting your interview",
    },

    {
      icon: HiOutlineCheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      cardBg: "bg-green-50/40",
      value: counts.completed,
      label: "Completed",
      sub: "Interviews completed",
    },

    {
      icon: HiOutlineXCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      cardBg: "bg-red-50/40",
      value: counts.cancelled,
      label: "Cancelled",
      sub: "Interviews cancelled",
    },
  ];

  /*
   * ============================================================
   * START INTERVIEW
   * ============================================================
   *
   * This keeps your existing Interview.jsx / LiveAvatar
   * implementation.
   *
   * No iframe is used.
   *
   * autoStart tells Interview.jsx to start LiveAvatar
   * automatically when the page opens.
   */

  const handleStartInterview = (app) => {
    if (!app?._id) {
      console.error("Application ID is missing.");
      return;
    }

    const rating = Number(app.cvRating);

    if (!Number.isFinite(rating) || rating <= 50) {
      alert(
        "This interview is not available because your CV rating is 50 or below."
      );
      return;
    }

    console.log(
      "Starting interview for application:",
      app._id
    );

    setStartingInterview(app._id);

    navigate(`/interview/${app._id}`, {
      state: {
        job: app.job,
        applicationId: app._id,
        autoStart: true,
      },
    });
  };

  return (
    <CandidateLayout
      title="Interviews"
      subtitle="Track and manage your upcoming and past interviews."
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

      <div className="flex flex-wrap gap-1 mb-5 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition ${
              filter === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="w-4 h-4" />

            {t.label}

            <span
              className={`rounded-full px-1.5 text-xs ${
                filter === t.key
                  ? "bg-blue-50 text-blue-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-gray-500">
          Loading...
        </p>
      )}

      {/* =====================================================
          INTERVIEW CARDS
      ====================================================== */}

      {!loading && (
        <div className="space-y-4">
          {visible.map((app) => {
            const currentStatus = applicationStatus(app);

            /*
             * Use the application status at the top.
             *
             * If the old application has:
             *
             * status = applied
             * cvRating = 65
             *
             * it will say "Applied" while still providing
             * the AI interview.
             */

            const status =
              STATUS_META[currentStatus] ||
              STATUS_META.pending;

            const dt = formatDate(app.interviewDate);

            const company =
              app.job?.company || "Company";

            const rating = Number(app.cvRating);

            const isCompleted =
              currentStatus === "interviewed" ||
              app.interviewStatus === "completed";

            const isCancelled =
              app.interviewStatus === "cancelled";

            return (
              <div
                key={app._id}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

                  {/* =================================================
                      COMPANY + ROLE
                  ================================================== */}

                  <div className="flex items-start gap-4 lg:w-1/3">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-white font-bold ${avatarColor(
                        company
                      )}`}
                    >
                      <span className="text-lg leading-none">
                        {companyInitials(company)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {app.job?.title || "Job title"}
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

                        <span>·</span>

                        <span className="flex items-center gap-1">
                          <HiOutlineVideoCamera className="w-3.5 h-3.5" />
                          AI Interview
                        </span>
                      </div>

                      {/* CV RATING */}

                      {Number.isFinite(rating) && (
                        <div className="mt-3">
                          <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            CV Rating: {rating}/100
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* =================================================
                      DATE / TIME / TYPE
                  ================================================== */}

                  <div className="lg:flex-1">
                    <div className="flex flex-wrap items-center gap-6">

                      <div className="flex items-center gap-2">
                        <HiOutlineCalendarDays className="w-4 h-4 text-gray-400" />

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {dt.date}
                          </p>

                          {dt.weekday && (
                            <p className="text-xs text-gray-400">
                              {dt.weekday}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <HiOutlineClock className="w-4 h-4 text-gray-400" />

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {dt.time || "Available now"}
                          </p>

                          {app.interviewDurationMinutes && (
                            <p className="text-xs text-gray-400">
                              ({app.interviewDurationMinutes} min)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI INTERVIEW BANNER */}

                    {!isCompleted &&
                      !isCancelled && (
                        <div className="flex items-center gap-2 px-3 py-2 mt-3 text-sm text-blue-700 rounded-lg bg-blue-50">
                          <HiOutlineVideoCamera className="w-4 h-4 shrink-0" />

                          <span>
                            AI interview available
                          </span>
                        </div>
                      )}

                    {isCancelled && (
                      <div className="flex items-center gap-2 px-3 py-2 mt-3 text-sm text-red-700 rounded-lg bg-red-50">
                        <HiOutlineUserGroup className="w-4 h-4 shrink-0" />

                        Reason:{" "}
                        {app.interviewCancelReason ||
                          "Not specified"}
                      </div>
                    )}

                    {app.interviewType && (
                      <div
                        className={`flex items-center gap-2 px-3 py-2 mt-3 text-sm rounded-lg ${
                          isCompleted
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {app.interviewType
                          .toLowerCase()
                          .includes("hr") ? (
                          <HiOutlineUserGroup className="w-4 h-4 shrink-0" />
                        ) : (
                          <HiOutlineVideoCamera className="w-4 h-4 shrink-0" />
                        )}

                        Interview type:{" "}
                        {app.interviewType}
                      </div>
                    )}

                    {/* FEEDBACK */}

                    {expandedId === app._id && (
                      <div className="pt-3 mt-3 space-y-2 text-sm text-gray-600 border-t">
                        {typeof app.interviewRating ===
                          "number" && (
                          <p>
                            <strong className="text-gray-800">
                              Rating:
                            </strong>{" "}
                            {app.interviewRating}/10
                          </p>
                        )}

                        {app.interviewSummary && (
                          <p>
                            <strong className="text-gray-800">
                              Feedback:
                            </strong>{" "}
                            {app.interviewSummary}
                          </p>
                        )}

                        {!app.interviewSummary &&
                          typeof app.interviewRating !==
                            "number" && (
                            <p className="text-gray-400">
                              No feedback details available
                              yet.
                            </p>
                          )}
                      </div>
                    )}
                  </div>

                  {/* =================================================
                      STATUS + ACTION
                  ================================================== */}

                  <div className="flex items-start gap-2 shrink-0 lg:flex-col lg:items-end">

                    {/* STATUS */}

                    <div className="flex items-center gap-2">
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
                          className="p-1.5 text-gray-400 rounded-lg hover:bg-gray-100"
                        >
                          <HiOutlineEllipsisVertical className="w-5 h-5" />
                        </button>

                        {openMenuId === app._id && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border bg-white py-1 shadow-lg">
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
                        )}
                      </div>
                    </div>

                    {/* START INTERVIEW */}

                    {!isCompleted &&
                      !isCancelled &&
                      rating > 50 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStartInterview(app)
                          }
                          disabled={
                            startingInterview ===
                            app._id
                          }
                          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {startingInterview === app._id
                            ? "Starting Interview..."
                            : "Start Interview"}
                        </button>
                      )}

                    {/* COMPLETED */}

                    {isCompleted && (
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === app._id
                              ? null
                              : app._id
                          )
                        }
                        className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                      >
                        {expandedId === app._id
                          ? "Hide Feedback"
                          : "View Feedback"}
                      </button>
                    )}

                    {/* CANCELLED */}

                    {isCancelled && (
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === app._id
                              ? null
                              : app._id
                          )
                        }
                        className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                      >
                        {expandedId === app._id
                          ? "Hide Details"
                          : "View Details"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* EMPTY STATE */}

          {visible.length === 0 && (
            <div className="rounded-2xl border bg-white p-10 text-center text-gray-500 shadow-sm">
              <HiOutlineCalendarDays className="w-10 h-10 mx-auto mb-3 text-gray-300" />

              {interviewApplications.length === 0 ? (
                <>
                  <p>
                    No interviews are currently available.
                  </p>

                  <p className="mt-2 text-sm text-gray-400">
                    An AI interview becomes available when
                    your CV rating is greater than 50.
                  </p>
                </>
              ) : (
                "No interviews in this category."
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          TIPS BANNER
      ====================================================== */}

      <div className="flex flex-col gap-4 p-5 mt-6 border rounded-2xl bg-blue-50/60 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-9 h-9 text-white bg-blue-600 rounded-full shrink-0">
            <HiOutlineSparkles className="w-5 h-5" />
          </div>

          <div>
            <p className="font-bold text-gray-900">
              Stay prepared for your next interview
            </p>

            <p className="text-sm text-gray-600">
              View tips and resources to ace your interviews.
            </p>
          </div>
        </div>

        <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shrink-0">
          View Resources
        </button>
      </div>
    </CandidateLayout>
  );
}
