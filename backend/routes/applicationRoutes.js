import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import Application from "../models/Application.js";
import Job from "../models/Job.js";

import {
  requireAuth,
  requireAdmin,
} from "../middleware/auth.js";

import { extractCvText } from "../services/cvExtractor.js";
import {
  evaluateCvAgainstJob,
} from "../services/cvEvaluator.js";

const router = express.Router();

const uploadDir = path.join(
  process.cwd(),
  "uploads",
  "cvs"
);

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, uploadDir),

  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname.replace(
      /\s+/g,
      "_"
    )}`;

    cb(null, unique);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const ok = [
      ".pdf",
      ".doc",
      ".docx",
    ].includes(
      path
        .extname(file.originalname)
        .toLowerCase()
    );

    cb(
      ok
        ? null
        : new Error(
            "Only PDF, DOC or DOCX files are allowed."
          ),
      ok
    );
  },
});

// Apply to a job with a CV upload
router.post(
  "/:jobId",
  requireAuth,
  upload.single("cv"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "A CV file is required.",
        });
      }

      const existing = await Application.findOne({
        job: req.params.jobId,
        user: req.user.id,
      });

      if (existing) {
        return res.status(400).json({
          message:
            "You have already applied to this job.",
        });
      }

      const job = await Job.findById(
        req.params.jobId
      );

      if (!job) {
        return res.status(404).json({
          message: "Job not found.",
        });
      }

      let cvRating = null;
      let cvMatchSummary = "";
      let cvMatchedSkills = [];
      let cvMissingSkills = [];
      let cvEvaluationStatus = "pending";

      try {
        console.log(
          `Extracting CV: ${req.file.originalname}`
        );

        const cvText = await extractCvText(
          req.file.path
        );

        console.log(
          `CV extracted: ${cvText.length} characters`
        );

        console.log(
          `Evaluating CV against job: ${job.title}`
        );

        const evaluation =
          await evaluateCvAgainstJob({
            cvText,

            jobDescription:
              job.description,

            jobTitle: job.title,
          });

        cvRating =
          evaluation.rating;

        cvMatchSummary =
          evaluation.summary;

        cvMatchedSkills =
          evaluation.matchedSkills;

        cvMissingSkills =
          evaluation.missingSkills;

        cvEvaluationStatus =
          "completed";

        console.log(
          `CV evaluation completed: ${cvRating}/100`
        );
      } catch (evaluationError) {
        console.error(
          "CV evaluation failed:",
          evaluationError
        );

        cvEvaluationStatus = "failed";
      }

      const application =
        await Application.create({
          job: req.params.jobId,

          user: req.user.id,

          cvUrl:
            `/uploads/cvs/${req.file.filename}`,

          cvOriginalName:
            req.file.originalname,

          cvRating,

          cvMatchSummary,

          cvMatchedSkills,

          cvMissingSkills,

          cvEvaluationStatus,
        });

      res.status(201).json(application);
    } catch (err) {
      console.error(
        "Application creation error:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// Logged-in user: their own applications
router.get(
  "/mine",
  requireAuth,
  async (req, res) => {
    try {
      const apps =
        await Application.find({
          user: req.user.id,
        })
          .populate("job")
          .sort({ createdAt: -1 });

      res.json(apps);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// Admin only: every application
router.get(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const apps =
        await Application.find()
          .populate("job")
          .populate(
            "user",
            "name email"
          )
          .sort({ createdAt: -1 });

      res.json(apps);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

export default router;