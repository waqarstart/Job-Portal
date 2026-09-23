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
import { safeOriginalName } from "../utils/security.js";

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
    const unique = `${Date.now()}-${safeOriginalName(file.originalname)}`;

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

      // HR and admin accounts can browse jobs but shouldn't submit
      // applications as a "candidate" — this mirrors the frontend guard.
      if (req.user.role === "hr" || req.user.role === "admin") {
        return res.status(403).json({
          message: "HR and admin accounts can't apply to jobs.",
        });
      }

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
      // Create the application immediately with "pending" status.
      //
      // CV text extraction + AI evaluation are CPU/network-heavy and
      // used to run inline here, making the whole request wait on them.
      // Under a burst of applicants that made every apply request slow.
      // Now we save the application and respond right away — the
      // frontend already shows a "pending" spinner for this status
      // (see CvEvalPanel), so nothing about the UI needs to change.
      // Evaluation then continues in the background and updates this
      // same document when it finishes.
      // ───────────────────────────────────────────────────────

      const CV_TEXT_MAX_CHARS = 8000;

      const application = await Application.create({
        job: req.params.jobId,
        user: req.user.id,
        cvUrl,
        cvOriginalName,
        cvExtractedText: "",
        cvRating: null,
        cvMatchSummary: "",
        cvMatchedSkills: [],
        cvMissingSkills: [],
        cvEvaluationStatus: "pending",
      });

      // ───────────────────────────────────────────────────────
      // Response — sent now, before evaluation runs
      // ───────────────────────────────────────────────────────

      res.status(201).json(application);

      // ───────────────────────────────────────────────────────
      // Background CV evaluation (not awaited — runs after the
      // response has already been sent). Errors here must never
      // crash the process; they just leave/mark the application as
      // "failed" the same way the old inline code did.
      // ───────────────────────────────────────────────────────

      (async () => {
        try {
          console.log(`Extracting CV: ${cvOriginalName}`);
          console.log(`CV file path: ${cvFilePath}`);

          const cvText = await extractCvText(cvFilePath);
          const cvExtractedText =
            typeof cvText === "string" ? cvText.slice(0, CV_TEXT_MAX_CHARS) : "";

          console.log(`CV extracted: ${cvText.length} characters`);
          console.log(`Evaluating CV against job: ${job.title}`);

          const evaluation = await evaluateCvAgainstJob({
            cvText,
            jobDescription: job.description,
            jobTitle: job.title,
          });

          console.log(`CV evaluation completed: ${evaluation.rating}/100`);

          await Application.findByIdAndUpdate(application._id, {
            cvExtractedText,
            cvRating: evaluation.rating,
            cvMatchSummary: evaluation.summary,
            cvMatchedSkills: evaluation.matchedSkills,
            cvMissingSkills: evaluation.missingSkills,
            cvEvaluationStatus: "completed",
          });
        } catch (evaluationError) {
          console.error("CV evaluation failed:", evaluationError);
          try {
            await Application.findByIdAndUpdate(application._id, {
              cvEvaluationStatus: "failed",
            });
          } catch (updateError) {
            console.error("Failed to mark CV evaluation as failed:", updateError);
          }
        }
      })();
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
      interviewRemovalRequestedAt,
      startNewRound,
    } = req.body;

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    // Scheduling a brand-new round for a candidate who already has a
    // completed/cancelled interview — archive the current round's data
    // into interviewHistory before overwriting it, so past CV/interview
    // feedback isn't lost.
    if (startNewRound && application.interviewDate) {
      application.interviewHistory.push({
        interviewDate: application.interviewDate,
        interviewDurationMinutes: application.interviewDurationMinutes,
        interviewType: application.interviewType,
        interviewMode: application.interviewMode,
        interviewLocationDetail: application.interviewLocationDetail,
        interviewerCount: application.interviewerCount,
        interviewStatus: application.interviewStatus,
        interviewCancelReason: application.interviewCancelReason,
        interviewSummary: application.interviewSummary,
        interviewAudioUrl: application.interviewAudioUrl,
        interviewRating: application.interviewRating,
        interviewTechnicalRating: application.interviewTechnicalRating,
        interviewTranscript: application.interviewTranscript,
        interviewTranscriptRaw: application.interviewTranscriptRaw,
        interviewTurns: application.interviewTurns,
        interviewStartedAt: application.interviewStartedAt,
        interviewCompletedAt: application.interviewCompletedAt,
      });

      // Clear this round's feedback so the new round starts fresh —
      // a new AI interview session will populate these again.
      application.interviewSummary = undefined;
      application.interviewAudioUrl = undefined;
      application.interviewRating = undefined;
      application.interviewTechnicalRating = undefined;
      application.interviewTranscript = undefined;
      application.interviewTranscriptRaw = undefined;
      application.interviewTurns = [];
      application.interviewStartedAt = undefined;
      application.interviewCompletedAt = undefined;
      application.interviewCancelReason = undefined;
      application.currentQuestionIndex = 0;
      application.interviewRemovalRequestedAt = null;
    }

    if (interviewDate !== undefined) application.interviewDate = interviewDate;
    if (interviewDurationMinutes !== undefined) application.interviewDurationMinutes = interviewDurationMinutes;
    if (interviewType !== undefined) application.interviewType = interviewType;
    if (interviewMode !== undefined) application.interviewMode = interviewMode;
    if (interviewLocationDetail !== undefined) application.interviewLocationDetail = interviewLocationDetail;
    if (interviewerCount !== undefined) application.interviewerCount = interviewerCount;
    if (interviewStatus !== undefined) application.interviewStatus = interviewStatus;
    if (interviewCancelReason !== undefined) application.interviewCancelReason = interviewCancelReason;
    // `null` explicitly clears it (used to undo a pending removal)
    if (interviewRemovalRequestedAt !== undefined) application.interviewRemovalRequestedAt = interviewRemovalRequestedAt;

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
          .populate({
            path: "job",
            populate: { path: "companyRef", select: "logo coverImage" },
          })
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