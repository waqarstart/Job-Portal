import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Company from "../models/Company.js";
import { requireAuth, requireHR } from "../middleware/auth.js";

const router = express.Router();

// Logo upload
const logoDir = path.join(process.cwd(), "uploads", "logos");
fs.mkdirSync(logoDir, { recursive: true });

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, logoDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = [".jpg", ".jpeg", ".png", ".webp", ".svg"].includes(
      path.extname(file.originalname).toLowerCase()
    );
    cb(ok ? null : new Error("Only image files are allowed."), ok);
  },
});

// ── Dashboard stats ──────────────────────────────────────────────────────────
router.get("/dashboard", requireAuth, requireHR, async (req, res) => {
  try {
    const myJobs = await Job.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
    const jobIds = myJobs.map((j) => j._id);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Hiring Pipeline period filter — "week" | "month" (default "month")
    const period = req.query.period === "week" ? "week" : "month";
    const pipelineSince = period === "week" ? oneWeekAgo : thirtyDaysAgo;
    const pipelineFilter = { job: { $in: jobIds }, createdAt: { $gte: pipelineSince } };

    const [
      totalApplicants,
      newApplicationsThisWeek,
      underReview,
      shortlisted,
      interviewsScheduled,
      offered,
      hired,
      allApps,
      pipelineApplied,
      pipelineUnderReview,
      pipelineShortlisted,
      pipelineInterviews,
      pipelineOffered,
      pipelineHired,
    ] = await Promise.all([
      Application.countDocuments({ job: { $in: jobIds } }),
      Application.countDocuments({ job: { $in: jobIds }, createdAt: { $gte: oneWeekAgo } }),
      Application.countDocuments({ job: { $in: jobIds }, status: "under_review" }),
      Application.countDocuments({ job: { $in: jobIds }, status: { $in: ["shortlisted", "interviewed", "offered", "selected", "hired"] } }),
      Application.countDocuments({ job: { $in: jobIds }, interviewStatus: { $in: ["pending", "completed"] } }),
      Application.countDocuments({ job: { $in: jobIds }, status: { $in: ["offered", "selected"] } }),
      Application.countDocuments({ job: { $in: jobIds }, status: "hired" }),
      Application.find({ job: { $in: jobIds } })
        .populate("job", "title company city type")
        .populate("user", "name email")
        .sort({ createdAt: -1 }),
      Application.countDocuments(pipelineFilter),
      Application.countDocuments({ ...pipelineFilter, status: "under_review" }),
      Application.countDocuments({ ...pipelineFilter, status: { $in: ["shortlisted", "interviewed", "offered", "selected", "hired"] } }),
      Application.countDocuments({ ...pipelineFilter, interviewStatus: { $in: ["pending", "completed"] } }),
      Application.countDocuments({ ...pipelineFilter, status: { $in: ["offered", "selected"] } }),
      Application.countDocuments({ ...pipelineFilter, status: "hired" }),
    ]);

    // Applications overview — daily counts for the last 30 days
    const overviewMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      overviewMap[d.toISOString().slice(0, 10)] = 0;
    }
    allApps.forEach((a) => {
      const key = new Date(a.createdAt).toISOString().slice(0, 10);
      if (overviewMap[key] !== undefined) overviewMap[key]++;
    });
    const applicationsOverview = Object.entries(overviewMap).map(([date, count]) => ({ date, count }));

    // Applications by source
    const sourceCounts = {};
    allApps.forEach((a) => {
      const src = a.source || "Other";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    const applicationsBySource = Object.entries(sourceCounts).map(([source, count]) => ({ source, count }));

    // Recent job postings with per-job funnel counts
    const recentJobPostings = await Promise.all(
      myJobs.slice(0, 6).map(async (job) => {
        const jobApps = allApps.filter((a) => String(a.job?._id) === String(job._id));
        return {
          _id: job._id,
          title: job.title,
          company: job.company,
          city: job.city,
          type: job.type,
          status: job.status,
          applications: jobApps.length,
          shortlisted: jobApps.filter((a) => ["shortlisted", "interviewed", "offered", "selected", "hired"].includes(a.status)).length,
          interviews: jobApps.filter((a) => a.interviewStatus).length,
          hired: jobApps.filter((a) => a.status === "hired").length,
        };
      })
    );

    // Upcoming interviews (pending, scheduled in the future, soonest first)
    const now = new Date();
    const upcomingInterviews = allApps
      .filter((a) => a.interviewStatus === "pending" && a.interviewDate && new Date(a.interviewDate) >= now)
      .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate))
      .slice(0, 4)
      .map((a) => ({
        _id: a._id,
        candidateName: a.user?.name,
        jobTitle: a.job?.title,
        interviewDate: a.interviewDate,
        interviewStatus: a.interviewStatus,
      }));

    // Recent applications
    const recentApplications = allApps.slice(0, 4).map((a) => ({
      _id: a._id,
      candidateName: a.user?.name,
      jobTitle: a.job?.title,
      status: a.status,
      createdAt: a.createdAt,
    }));

    // Tasks derived from real data
    const newToReview = allApps.filter((a) => a.status === "applied").length;
    const shortlistedNeedingInterview = allApps.filter(
      (a) => ["shortlisted", "offered", "selected"].includes(a.status) && !a.interviewDate
    ).length;

    res.json({
      activeJobs: myJobs.filter((j) => j.status === "active").length,
      totalJobs: myJobs.length,
      totalApplicants,
      newApplicationsThisWeek,
      underReview,
      shortlisted,
      interviewsScheduled,
      offered,
      hired,
      pipeline: {
        applied: pipelineApplied,
        underReview: pipelineUnderReview,
        shortlisted: pipelineShortlisted,
        interviews: pipelineInterviews,
        offered: pipelineOffered,
        hired: pipelineHired,
      },
      pipelinePeriod: period,
      applicationsOverview,
      applicationsBySource,
      recentJobPostings,
      upcomingInterviews,
      recentApplications,
      tasks: {
        newToReview,
        shortlistedNeedingInterview,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Jobs ─────────────────────────────────────────────────────────────────────
router.get("/jobs", requireAuth, requireHR, async (req, res) => {
  try {
    const {
      tab = "all",           // all | active | draft | closed
      location = "all",
      type = "all",
      sort = "newest",       // newest | oldest
      search = "",
      page = 1,
      limit = 7,
    } = req.query;

    const baseFilter = { postedBy: req.user.id };
    if (tab !== "all") baseFilter.status = tab;
    if (location !== "all") baseFilter.city = location;
    if (type !== "all") baseFilter.type = type;
    if (search) baseFilter.title = { $regex: search, $options: "i" };

    const allMyJobs = await Job.find({ postedBy: req.user.id });
    const jobIds = allMyJobs.map((j) => j._id);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const [allApps, matchingJobs, totalCount] = await Promise.all([
      Application.find({ job: { $in: jobIds } }),
      Job.find(baseFilter)
        .sort({ createdAt: sort === "oldest" ? 1 : -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Job.countDocuments(baseFilter),
    ]);

    const jobs = matchingJobs.map((job) => {
      const jobApps = allApps.filter((a) => String(a.job) === String(job._id));
      const newThisWeek = jobApps.filter((a) => new Date(a.createdAt) >= oneWeekAgo).length;

      return {
        _id: job._id,
        title: job.title,
        company: job.company,
        city: job.city,
        type: job.type,
        salary: job.salary,
        status: job.status,
        createdAt: job.createdAt,
        views: job.views || 0,
        applications: jobApps.length,
        newThisWeek,
        interviews: jobApps.filter((a) => a.interviewStatus).length,
      };
    });

    // Overall stats (across ALL of this HR's jobs, not just the current page)
    const activeJobs = allMyJobs.filter((j) => j.status === "active").length;
    const closedJobs = allMyJobs.filter((j) => j.status === "closed").length;
    const totalApplications = allApps.length;
    const newApplicationsThisMonth = allApps.filter((a) => new Date(a.createdAt) >= oneMonthAgo).length;
    const interviewsScheduled = allApps.filter((a) => a.interviewStatus).length;

    res.json({
      jobs,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / Number(limit))),
      page: Number(page),
      locations: [...new Set(allMyJobs.map((j) => j.city).filter(Boolean))],
      types: [...new Set(allMyJobs.map((j) => j.type).filter(Boolean))],
      stats: {
        totalJobs: allMyJobs.length,
        activeJobs,
        totalApplications,
        newApplicationsThisMonth,
        interviewsScheduled,
        closedJobs,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/jobs", requireAuth, requireHR, async (req, res) => {
  try {
    const {
      title, company, city, description, salary, type, status,
      workMode, experienceLevel, skills, category, applicationDeadline,
    } = req.body;
    if (!title || !company || !city || !description) {
      return res.status(400).json({ message: "Title, company, city and description are required." });
    }

    const job = await Job.create({
      title, company, city, description, salary, type,
      workMode, experienceLevel, skills, category, applicationDeadline,
      postedBy: req.user.id,
      status: status === "draft" ? "draft" : "active",
    });

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/jobs/:id", requireAuth, requireHR, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user.id });
    if (!job) return res.status(404).json({ message: "Job not found." });

    Object.assign(job, req.body);
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/jobs/:id", requireAuth, requireHR, async (req, res) => {
  try {
    await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user.id });
    res.json({ message: "Job deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Applicants ───────────────────────────────────────────────────────────────
router.get("/applicants", requireAuth, requireHR, async (req, res) => {
  try {
    const myJobs = await Job.find({ postedBy: req.user.id });
    const jobIds = myJobs.map((j) => j._id);

    const applications = await Application.find({ job: { $in: jobIds } })
      .populate("job", "title company city")
      .populate("user", "name email phone location skills")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update application status (shortlist, hire, reject etc.)
router.patch("/applicants/:id/status", requireAuth, requireHR, async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("job").populate("user", "name email");

    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Interviews ───────────────────────────────────────────────────────────────
// Scheduled interviews (date/time set by HR) — powers the Interviews page
router.get("/interviews", requireAuth, requireHR, async (req, res) => {
  try {
    const myJobs = await Job.find({ postedBy: req.user.id });
    const jobIds = myJobs.map((j) => j._id);

    const interviews = await Application.find({
      job: { $in: jobIds },
      interviewDate: { $exists: true, $ne: null },
    })
      .populate("job", "title company city")
      .populate("user", "name email")
      .sort({ interviewDate: -1 });

    const total = interviews.length;
    const scheduled = interviews.filter((i) => i.interviewStatus === "pending").length;
    const completed = interviews.filter((i) => i.interviewStatus === "completed").length;
    const cancelled = interviews.filter((i) => i.interviewStatus === "cancelled").length;

    res.json({
      interviews,
      stats: { total, scheduled, completed, cancelled },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Candidates without a scheduled interview yet — used to populate the
// "Schedule Interview" picker
router.get("/interviews/schedulable", requireAuth, requireHR, async (req, res) => {
  try {
    const myJobs = await Job.find({ postedBy: req.user.id });
    const jobIds = myJobs.map((j) => j._id);

    const applications = await Application.find({
      job: { $in: jobIds },
      $or: [{ interviewDate: { $exists: false } }, { interviewDate: null }],
    })
      .populate("job", "title company")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Company Profile ──────────────────────────────────────────────────────────
router.get("/company", requireAuth, requireHR, async (req, res) => {
  try {
    const company = await Company.findOne({ hr: req.user.id });
    res.json(company || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/company", requireAuth, requireHR, uploadLogo.single("logo"), async (req, res) => {
  try {
    let existing = await Company.findOne({ hr: req.user.id });

    const updates = {
      name: req.body.name,
      description: req.body.description,
      industry: req.body.industry,
      website: req.body.website,
      location: req.body.location,
      size: req.body.size,
      hr: req.user.id,
    };

    if (req.file) {
      updates.logo = `/uploads/logos/${req.file.filename}`;
    }

    if (existing) {
      Object.assign(existing, updates);
      await existing.save();
      return res.json(existing);
    }

    const company = await Company.create(updates);
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
