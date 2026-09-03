import express from "express";
import Job from "../models/Job.js";
import Company from "../models/Company.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public: list / search jobs
router.get("/", async (req, res) => {
  try {
    const { title = "", city = "" } = req.query;

    const filter = {
      status: "active",
    };

    if (title) {
      filter.title = {
        $regex: title,
        $options: "i",
      };
    }

    if (city) {
      filter.city = {
        $regex: city,
        $options: "i",
      };
    }

    const jobs = await Job.find(filter).sort({
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
        $group: {
          _id: "$company",
          jobCount: {
            $sum: 1,
          },
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
    ]);

    res.json(
      results.map((r) => ({
        company: r._id,
        jobCount: r.jobCount,
      }))
    );
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
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