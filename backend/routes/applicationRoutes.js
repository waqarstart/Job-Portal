import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import Application from "../models/Application.js";
import Job from "../models/Job.js";
import CV from "../models/CV.js";

import {
  requireAuth,
  requireAdmin,
  requireHR,
} from "../middleware/auth.js";

import { extractCvText } from "../services/cvExtractor.js";
import {
  evaluateCvAgainstJob,
} from "../services/cvEvaluator.js";

const router = express.Router();


// ─────────────────────────────────────────────────────────────
// Application CV upload directory
// ─────────────────────────────────────────────────────────────

const uploadDir = path.join(
  process.cwd(),
  "uploads",
  "cvs"
);

fs.mkdirSync(uploadDir, { recursive: true });


// ─────────────────────────────────────────────────────────────
// Multer configuration
// ─────────────────────────────────────────────────────────────

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


// ─────────────────────────────────────────────────────────────
// Apply to a job
//
// Supports:
//
// 1. New uploaded CV
//    form field: cv
//
// 2. Saved CV from CV library
//    form field: cvId
// ─────────────────────────────────────────────────────────────

router.post(
  "/:jobId",
  requireAuth,
  upload.single("cv"),
  async (req, res) => {
    try {

      // ───────────────────────────────────────────────────────
      // Check whether user already applied
      // ───────────────────────────────────────────────────────

      const existing = await Application.findOne({
        job: req.params.jobId,
        user: req.user.id,
      });

      if (existing) {
        // If a new CV was uploaded but application already exists,
        // remove the unnecessary uploaded file.
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(400).json({
          message:
            "You have already applied to this job.",
        });
      }


      // ───────────────────────────────────────────────────────
      // Find job
      // ───────────────────────────────────────────────────────

      const job = await Job.findById(
        req.params.jobId
      );

      if (!job) {

        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(404).json({
          message: "Job not found.",
        });
      }


      // ───────────────────────────────────────────────────────
      // Determine which CV is being used
      // ───────────────────────────────────────────────────────

      let cvFilePath = null;
      let cvOriginalName = null;
      let cvUrl = null;


      // =======================================================
      // OPTION 1: NEWLY UPLOADED CV
      // =======================================================

      if (req.file) {

        cvFilePath = req.file.path;

        cvOriginalName =
          req.file.originalname;

        cvUrl =
          `/uploads/cvs/${req.file.filename}`;
      }


      // =======================================================
      // OPTION 2: SAVED CV
      // =======================================================

      else if (req.body.cvId) {

        const savedCV = await CV.findOne({
          _id: req.body.cvId,
          user: req.user.id,
        });

        if (!savedCV) {
          return res.status(404).json({
            message:
              "Saved CV not found or you do not have access to it.",
          });
        }


        // savedCV.url looks like:
        //
        // /uploads/cvs-library/filename.pdf
        //
        // Convert it to the actual path on disk.

        cvFilePath = path.join(
          process.cwd(),
          savedCV.url
        );

        cvOriginalName =
          savedCV.originalName;

        cvUrl =
          savedCV.url;


        // Make sure the physical file actually exists

        if (!fs.existsSync(cvFilePath)) {

          console.error(
            "Saved CV file does not exist:",
            cvFilePath
          );

          return res.status(404).json({
            message:
              "The saved CV file could not be found on the server.",
          });
        }
      }


      // =======================================================
      // No CV supplied
      // =======================================================

      else {

        return res.status(400).json({
          message:
            "A CV file or saved CV is required.",
        });
      }


      // ───────────────────────────────────────────────────────
      // AI CV Evaluation
      // ───────────────────────────────────────────────────────

      let cvRating = null;
      let cvMatchSummary = "";
      let cvMatchedSkills = [];
      let cvMissingSkills = [];
      let cvEvaluationStatus = "pending";
      let cvExtractedText = "";

      const CV_TEXT_MAX_CHARS = 8000;

      try {

        console.log(
          `Extracting CV: ${cvOriginalName}`
        );

        console.log(
          `CV file path: ${cvFilePath}`
        );


        // Extract text from either:
        //
        // - newly uploaded CV
        // - saved CV
        //
        // Both use exactly the same extractor.

        const cvText =
          await extractCvText(
            cvFilePath
          );

        cvExtractedText =
          typeof cvText === "string"
            ? cvText.slice(0, CV_TEXT_MAX_CHARS)
            : "";

        console.log(
          `CV extracted: ${cvText.length} characters`
        );


        // ─────────────────────────────────────────────
        // Evaluate CV against job using OpenRouter
        // ─────────────────────────────────────────────

        console.log(
          `Evaluating CV against job: ${job.title}`
        );


        const evaluation =
          await evaluateCvAgainstJob({
            cvText,

            jobDescription:
              job.description,

            jobTitle:
              job.title,
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

        cvEvaluationStatus =
          "failed";
      }


      // ───────────────────────────────────────────────────────
      // Create application
      // ───────────────────────────────────────────────────────

      const application =
        await Application.create({

          job:
            req.params.jobId,

          user:
            req.user.id,

          cvUrl,

          cvOriginalName,

          cvExtractedText,

          cvRating,

          cvMatchSummary,

          cvMatchedSkills,

          cvMissingSkills,

          cvEvaluationStatus,
        });


      // ───────────────────────────────────────────────────────
      // Response
      // ───────────────────────────────────────────────────────

      res.status(201).json(
        application
      );

    } catch (err) {

      console.error(
        "Application creation error:",
        err
      );


      // If multer uploaded a file but something
      // failed later, clean it up.

      if (
        req.file?.path &&
        fs.existsSync(req.file.path)
      ) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error(
            "Failed to clean up uploaded CV:",
            cleanupError
          );
        }
      }


      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// ─────────────────────────────────────────────────────────────
// HR/Admin: schedule, complete, or cancel an interview
// ─────────────────────────────────────────────────────────────

router.patch("/:id/interview", requireAuth, requireHR, async (req, res) => {
  try {
    const {
      interviewDate,
      interviewDurationMinutes,
      interviewType,
      interviewMode,
      interviewLocationDetail,
      interviewerCount,
      interviewStatus,
      interviewCancelReason,
    } = req.body;

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    if (interviewDate !== undefined) application.interviewDate = interviewDate;
    if (interviewDurationMinutes !== undefined) application.interviewDurationMinutes = interviewDurationMinutes;
    if (interviewType !== undefined) application.interviewType = interviewType;
    if (interviewMode !== undefined) application.interviewMode = interviewMode;
    if (interviewLocationDetail !== undefined) application.interviewLocationDetail = interviewLocationDetail;
    if (interviewerCount !== undefined) application.interviewerCount = interviewerCount;
    if (interviewStatus !== undefined) application.interviewStatus = interviewStatus;
    if (interviewCancelReason !== undefined) application.interviewCancelReason = interviewCancelReason;

    await application.save();

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Logged-in user: a single application they own (for interview room)
// ─────────────────────────────────────────────────────────────

router.get(
  "/mine/:id",
  requireAuth,
  async (req, res) => {
    try {
      const app = await Application.findOne({
        _id: req.params.id,
        user: req.user.id,
      }).populate("job");

      if (!app) {
        return res.status(404).json({ message: "Application not found." });
      }

      res.json(app);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// Logged-in user: their own applications
// ─────────────────────────────────────────────────────────────

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
          .sort({
            createdAt: -1,
          });


      res.json(apps);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


// ─────────────────────────────────────────────────────────────
// Admin only: every application
// ─────────────────────────────────────────────────────────────

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
          .sort({
            createdAt: -1,
          });


      res.json(apps);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


export default router;