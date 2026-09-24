import express from "express";
import Job from "../models/Job.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Application from "../models/Application.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { escapeRegex } from "../utils/security.js";

const router = express.Router();

// Public: homepage hero stats (job seekers / companies / active jobs posted)
router.get("/stats/public", async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [jobSeekers, companyGroups, jobsPosted, jobsThisMonth, applications] = await Promise.all([
      User.countDocuments({ role: "user" }),
      // "Companies" = distinct companies actually hiring right now (grouped
      // case-insensitively so "GCS" / "gcs" count as one), not just the ones
      // that filled in an HR company profile — matches the Top Companies /
      // Explore Companies lists, and updates the moment a new company posts
      // its first active job.
      Job.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: { $toLower: "$company" } } },
        { $count: "count" },
      ]),
      Job.countDocuments({ status: "active" }),
      Job.countDocuments({ status: "active", createdAt: { $gte: startOfMonth } }),
      Application.countDocuments(),
    ]);

    const companies = companyGroups?.[0]?.count || 0;

    res.json({ jobSeekers, companies, jobsPosted, jobsThisMonth, applications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: list / search jobs
router.get("/", async (req, res) => {
  try {
    const { title = "", city = "" } = req.query;

    const filter = {
      status: "active",
    };

    if (title) {
      filter.title = {
        $regex: escapeRegex(title),
        $options: "i",
      };
    }

    if (city) {
      filter.city = {
        $regex: escapeRegex(city),
        $options: "i",
      };
    }

    const jobs = await Job.find(filter)
      .populate("companyRef", "logo coverImage")
      .sort({
        createdAt: -1,
      });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// Public: top companies currently hiring
router.get("/companies/top", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 6;

    const results = await Job.aggregate([
      {
        $match: {
          status: "active",
        },
      },
      {
        // Group case-insensitively ("GCS" / "gcs" / "Gcs" are the same
        // company) so it doesn't show duplicate cards for the same
        // company — keep the most recent posting's original casing to
        // display, since that's most likely to match how HR spells it now.
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: { $toLower: "$company" },
          displayName: { $first: "$company" },
          jobCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          jobCount: -1,
        },
      },
      {
        $limit: limit,
      },
      // Pull in the matching Company doc (case-insensitive name match) so
      // the frontend can show the real uploaded logo instead of initials.
      {
        $lookup: {
          from: "companies",
          let: { companyName: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toLower: "$name" },
                    "$$companyName",
                  ],
                },
              },
            },
            { $project: { name: 1, logo: 1, coverImage: 1 } },
          ],
          as: "companyDoc",
        },
      },
    ]);

    res.json(
      results.map((r) => ({
        company: r.companyDoc?.[0]?.name || r.displayName,
        jobCount: r.jobCount,
        logo: r.companyDoc?.[0]?.logo || null,
        coverImage: r.companyDoc?.[0]?.coverImage || null,
      }))
    );
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// Public: browse / search all companies, with active-job counts, for the
// dedicated "Explore Top Companies" page (search, industry/size filters,
// sort, pagination).
//
// Sourced from active Job postings (grouped case-insensitively), not just
// companies that filled in an HR profile — so this always matches the
// "Top Companies Hiring" list on the homepage, and a brand-new company
// shows up here automatically the moment they post their first active job.
// The (optional) Company profile is left-joined in purely for the extra
// display details — logo, industry, location, size, description.
router.get("/companies", async (req, res) => {
  try {
    const {
      q = "",
      industry = "",
      size = "",
      sort = "popular",
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum  = Math.max(1, Number(page) || 1);
    const perPage  = Math.min(50, Math.max(1, Number(limit) || 12));

    const sortStage =
      sort === "az"    ? { name: 1 } :
      /* popular / jobs */ { jobCount: -1, name: 1 };

    const pipeline = [
      { $match: { status: "active" } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $toLower: "$company" },
          displayName: { $first: "$company" },
          jobCount: { $sum: 1 },
        },
      },
      // Left-join the matching Company profile, if HR filled one in.
      {
        $lookup: {
          from: "companies",
          let: { companyName: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toLower: "$name" }, "$$companyName"] } } },
            { $limit: 1 },
          ],
          as: "profile",
        },
      },
      { $addFields: { profile: { $arrayElemAt: ["$profile", 0] } } },
      {
        $addFields: {
          name:        { $ifNull: ["$profile.name", "$displayName"] },
          description: "$profile.description",
          industry:    "$profile.industry",
          location:    "$profile.location",
          size:        "$profile.size",
          logo:        "$profile.logo",
          coverImage:  "$profile.coverImage",
        },
      },
      { $project: { profile: 0, displayName: 0 } },
      {
        $match: {
          ...(q ? { $or: [
            { name: { $regex: escapeRegex(q), $options: "i" } },
            { industry: { $regex: escapeRegex(q), $options: "i" } },
            { location: { $regex: escapeRegex(q), $options: "i" } },
          ] } : {}),
          ...(industry ? { industry: { $regex: `^${escapeRegex(industry)}$`, $options: "i" } } : {}),
          ...(size ? { size } : {}),
        },
      },
      { $sort: sortStage },
      {
        $facet: {
          data: [
            { $skip: (pageNum - 1) * perPage },
            { $limit: perPage },
          ],
          total: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await Job.aggregate(pipeline);
    const companies = result?.data || [];
    const total = result?.total?.[0]?.count || 0;

    res.json({
      companies,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: distinct list of industries (for the Companies page filter dropdown)
router.get("/companies/industries", async (req, res) => {
  try {
    const industries = await Company.distinct("industry", { industry: { $nin: [null, ""] } });
    res.json(industries.sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: a single company's profile (if HR filled one in) + its active jobs
router.get("/companies/:name", async (req, res) => {
  try {
    const name = req.params.name;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const [company, jobs] = await Promise.all([
      Company.findOne({ name: { $regex: `^${escaped}$`, $options: "i" } }),
      Job.find({
        company: { $regex: `^${escaped}$`, $options: "i" },
        status: "active",
      }).sort({ createdAt: -1 }),
    ]);

    res.json({
      name,
      company: company || null,
      jobs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: get single job
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      {
        $inc: {
          views: 1,
        },
      },
      {
        new: true,
      }
    ).populate("companyRef", "logo coverImage description website industry size");

    if (!job) {
      return res.status(404).json({
        message: "Job not found.",
      });
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// Admin only: create a job
router.post(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        title,
        company,
        city,
        description,
        salary,
        type,
        workMode,
        experienceLevel,
        skills,
        category,
        applicationDeadline,

        // IMPORTANT
        interviewQuestions,
      } = req.body;

      if (
        !title ||
        !company ||
        !city ||
        !description
      ) {
        return res.status(400).json({
          message:
            "Title, company, city and description are required.",
        });
      }

      const job = await Job.create({
        title,
        company,
        city,
        description,
        salary,
        type,
        workMode,
        experienceLevel,
        skills,
        category,
        applicationDeadline,

        // IMPORTANT
        interviewQuestions: Array.isArray(
          interviewQuestions
        )
          ? interviewQuestions.filter(
              (q) =>
                typeof q === "string" &&
                q.trim().length > 0
            )
          : [],

        postedBy: req.user.id,
      });

      console.log(
        "Job created with interview questions:",
        job.interviewQuestions
      );

      res.status(201).json(job);
    } catch (err) {
      console.error(
        "Create job error:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// Admin: update job
router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const job =
        await Job.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
          }
        );

      if (!job) {
        return res.status(404).json({
          message: "Job not found.",
        });
      }

      res.json(job);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// Admin: delete job
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const job =
        await Job.findByIdAndDelete(
          req.params.id
        );

      if (!job) {
        return res.status(404).json({
          message: "Job not found.",
        });
      }

      res.json({
        message: "Job deleted.",
      });
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

export default router;