import express from "express";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  buildInterviewQueue,
  getInterviewTiming,
  isLiveAvatarSandbox,
  buildIntroText,
  formatTurnsTranscript,
  DEFAULT_MAX_QUESTIONS,
  SANDBOX_MAX_QUESTIONS,
} from "../services/interviewQueue.js";
import { summarizeInterview } from "../services/interviewSummarizer.js";
import {
  getLiveAvatarTranscript,
} from "../utils/liveavatar.js";

const router = express.Router();

export const CLOSING_REMARKS =
  "Thank you for your time. I'll send my remarks to the HR team. If you are selected, they will contact you for the next stage.";

/** Only avatar allowed in LiveAvatar sandbox (free, ~55s). */
export const WAYNE_SANDBOX_AVATAR_ID =
  "dd73ea75-1218-4ef3-92ce-606d5f7fbc0a";

/**
 * Sandbox → Wayne (or LIVEAVATAR_SANDBOX_AVATAR_ID).
 * Production → LIVEAVATAR_AVATAR_ID (e.g. Silas). Skip Silas context_id in sandbox.
 */
async function createLiveAvatarSessionToken({
  applicationId,
  companyName,
  jobTitle,
}) {
  if (!process.env.LIVEAVATAR_API_KEY) {
    throw new Error("LIVEAVATAR_API_KEY is not configured on the server.");
  }

  const sandbox = isLiveAvatarSandbox();
  const avatarId = sandbox
    ? process.env.LIVEAVATAR_SANDBOX_AVATAR_ID || WAYNE_SANDBOX_AVATAR_ID
    : process.env.LIVEAVATAR_AVATAR_ID;

  if (!avatarId) {
    throw new Error(
      sandbox
        ? "Sandbox avatar id is not configured."
        : "LIVEAVATAR_AVATAR_ID is not configured on the server."
    );
  }

  const body = {
    mode: "FULL",
    avatar_id: avatarId,
    is_sandbox: sandbox,
    max_session_duration: sandbox ? 55 : 120,
    dynamic_variables: {
      company_name: String(companyName || "our company").slice(0, 1000),
      job_title: String(jobTitle || "this role").slice(0, 1000),
    },
  };

  // FULL mode requires avatar_persona or voice_agent.
  // Production: optional Silas context. Sandbox: language-only (app owns intro script).
  if (!sandbox && process.env.LIVEAVATAR_CONTEXT_ID) {
    body.avatar_persona = {
      context_id: process.env.LIVEAVATAR_CONTEXT_ID,
    };
  } else if (sandbox) {
    body.avatar_persona = {
      language: "en",
    };
  }

  console.log(
    `LiveAvatar token request: is_sandbox=${sandbox} avatar_id=${avatarId}`
  );

  const response = await fetch(
    "https://api.liveavatar.com/v1/sessions/token",
    {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.LIVEAVATAR_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      `LiveAvatar token error (is_sandbox=${sandbox} avatar_id=${avatarId}):`,
      data
    );
    const err = new Error("Failed to create LiveAvatar session.");
    err.status = response.status;
    err.details = data;
    throw err;
  }

  console.log(
    `LiveAvatar token ok: is_sandbox=${sandbox} avatar_id=${avatarId}`
  );

  return {
    sessionToken: data.data?.session_token,
    sessionId:
      data.data?.session_id ||
      data.data?.id ||
      data.session_id ||
      null,
    applicationId,
    sandbox,
    avatarId,
    raw: data.data || data,
  };
}

/**
 * Create a LiveAvatar session token (legacy endpoint kept for compatibility).
 */
router.post("/session", requireAuth, async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({
        message: "applicationId is required.",
      });
    }

    const application = await Application.findById(applicationId).populate("job");

    if (!application) {
      return res.status(404).json({
        message: "Application not found.",
      });
    }

    if (String(application.user) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized." });
    }

    const tokenData = await createLiveAvatarSessionToken({
      applicationId,
      companyName: application.job?.company,
      jobTitle: application.job?.title,
    });

    if (tokenData.sessionId) {
      application.liveAvatarSessionId = tokenData.sessionId;
      await application.save();
    }

    res.json({
      sessionToken: tokenData.sessionToken,
      sessionId: tokenData.sessionId,
      applicationId,
    });
  } catch (error) {
    console.error("LiveAvatar session error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Failed to create LiveAvatar session.",
      details: error.details,
    });
  }
});

/**
 * Start a timed AI interview for the candidate.
 */
router.post(
  "/start/:applicationId",
  requireAuth,
  async (req, res) => {
    try {
      const application = await Application.findById(
        req.params.applicationId
      ).populate("job");

      if (!application) {
        return res.status(404).json({ message: "Application not found." });
      }

      if (String(application.user) !== String(req.user.id)) {
        return res.status(403).json({ message: "Not authorized." });
      }

      if (application.status === "rejected") {
        return res.status(400).json({
          message: "This application was rejected. Interview is not available.",
        });
      }

      if (application.interviewStatus === "completed") {
        return res.status(400).json({
          message: "Interview already completed for this application.",
        });
      }

      const rating = Number(application.cvRating);
      if (!Number.isFinite(rating) || rating <= 50) {
        return res.status(400).json({
          message:
            "Interview is only available when CV rating is above 50.",
        });
      }

      const job = application.job || (await Job.findById(application.job));
      if (!job) {
        return res.status(404).json({ message: "Job not found." });
      }

      const sandbox = isLiveAvatarSandbox();
      const { durationSeconds, answerSeconds } = getInterviewTiming(job, {
        sandbox,
      });
      const maxCap = sandbox ? SANDBOX_MAX_QUESTIONS : DEFAULT_MAX_QUESTIONS;
      const maxQuestions = Math.min(
        maxCap,
        Math.max(1, Math.floor(durationSeconds / answerSeconds))
      );

      const questions = await buildInterviewQueue({
        job,
        application,
        maxQuestions,
      });
      application.interviewQuestions = questions;
      application.interviewTurns = [];

      const companyName = job.company || "our company";
      const jobTitle = job.title || "this role";
      const introText = buildIntroText(companyName, jobTitle);

      let sessionToken = null;
      let sessionId = null;

      try {
        const tokenData = await createLiveAvatarSessionToken({
          applicationId: application._id.toString(),
          companyName,
          jobTitle,
        });
        sessionToken = tokenData.sessionToken;
        if (tokenData.sessionId) {
          sessionId = tokenData.sessionId;
          application.liveAvatarSessionId = sessionId;
        }
      } catch (avatarErr) {
        console.error(
          "LiveAvatar session creation failed (interview can still proceed with timers):",
          avatarErr.message
        );
      }

      application.interviewStartedAt = new Date();
      application.interviewStatus = "in_progress";
      application.currentQuestionIndex = 0;
      await application.save();

      res.json({
        applicationId: application._id,
        sessionToken,
        sessionId,
        sandbox,
        questions: application.interviewQuestions,
        durationSeconds,
        answerSeconds,
        companyName,
        jobTitle,
        introText,
        closingRemarks: CLOSING_REMARKS,
        currentQuestionIndex: 0,
        job: {
          _id: job._id,
          title: job.title,
          company: job.company,
        },
      });
    } catch (err) {
      console.error("Interview start error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * Advance to the next interview question.
 */
router.post(
  "/next/:applicationId",
  requireAuth,
  async (req, res) => {
    try {
      const application = await Application.findById(
        req.params.applicationId
      );

      if (!application) {
        return res.status(404).json({ message: "Application not found." });
      }

      if (String(application.user) !== String(req.user.id)) {
        return res.status(403).json({ message: "Not authorized." });
      }

      if (application.interviewStatus === "completed") {
        return res.json({ done: true, currentQuestionIndex: application.currentQuestionIndex });
      }

      const questions = application.interviewQuestions || [];
      const nextIndex = (application.currentQuestionIndex || 0) + 1;

      if (nextIndex >= questions.length) {
        application.currentQuestionIndex = questions.length;
        await application.save();
        return res.json({
          done: true,
          currentQuestionIndex: application.currentQuestionIndex,
          question: null,
        });
      }

      application.currentQuestionIndex = nextIndex;
      await application.save();

      res.json({
        done: false,
        currentQuestionIndex: nextIndex,
        question: questions[nextIndex],
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * Finish interview: fetch transcript, summarize, update statuses.
 */
router.post(
  "/finish/:applicationId",
  requireAuth,
  async (req, res) => {
    try {
      const application = await Application.findById(
        req.params.applicationId
      ).populate("job");

      if (!application) {
        return res.status(404).json({ message: "Application not found." });
      }

      if (
        String(application.user) !== String(req.user.id) &&
        req.user.role !== "admin" &&
        req.user.role !== "hr"
      ) {
        return res.status(403).json({ message: "Not authorized." });
      }

      // Idempotent: already completed
      if (application.interviewStatus === "completed") {
        return res.json({
          applicationId: application._id,
          interviewStatus: application.interviewStatus,
          status: application.status,
          interviewSummary: application.interviewSummary,
          interviewRating: application.interviewRating,
          interviewTranscript: application.interviewTranscript,
          interviewTurns: application.interviewTurns || [],
          alreadyCompleted: true,
        });
      }

      const clientSessionId =
        req.body?.sessionId || application.liveAvatarSessionId;
      if (clientSessionId) {
        application.liveAvatarSessionId = clientSessionId;
      }

      // Structured turns from client are source of truth for HR Q&A
      const clientTurns = Array.isArray(req.body?.turns)
        ? req.body.turns
            .filter((t) => t && t.question)
            .map((t, i) => ({
              order: Number.isFinite(Number(t.order)) ? Number(t.order) : i,
              question: String(t.question).trim(),
              source: ["intro", "hr", "cv", "general", "closing"].includes(
                t.source
              )
                ? t.source
                : "hr",
              answer: t.answer != null ? String(t.answer).trim() : "",
            }))
        : [];

      if (clientTurns.length) {
        application.interviewTurns = clientTurns;
      }

      let transcriptRaw = null;
      if (application.liveAvatarSessionId) {
        try {
          const data = await getLiveAvatarTranscript(
            application.liveAvatarSessionId
          );
          transcriptRaw = data;
        } catch (transcriptErr) {
          console.error(
            "Failed to fetch LiveAvatar transcript:",
            transcriptErr.message
          );
        }
      }

      // Clean primary transcript from turns (no local-log merge pollution)
      let transcript = formatTurnsTranscript(application.interviewTurns || []);
      if (!transcript.trim()) {
        const clientTranscript = req.body?.transcript
          ? String(req.body.transcript).trim()
          : "";
        transcript =
          clientTranscript ||
          "Interview completed. No detailed transcript was captured.";
      }

      const questionTexts = (application.interviewTurns || [])
        .filter((t) => !["intro", "closing"].includes(t.source))
        .map((t) => t.question);

      const summaryResult = await summarizeInterview({
        jobTitle: application.job?.title,
        jobDescription: application.job?.description,
        transcript,
        questions: questionTexts.length
          ? questionTexts
          : (application.interviewQuestions || []).map((q) => q.text),
      });

      application.interviewTranscript = transcript;
      if (transcriptRaw) {
        application.interviewTranscriptRaw = {
          liveAvatar: transcriptRaw,
          ...(Array.isArray(req.body?.rawLog)
            ? { clientLog: req.body.rawLog }
            : {}),
        };
      }
      application.interviewSummary =
        summaryResult.summary ||
        "Interview completed. Please review the transcript.";
      if (summaryResult.rating != null) {
        application.interviewRating = summaryResult.rating;
      }
      if (summaryResult.technicalRating != null) {
        application.interviewTechnicalRating = summaryResult.technicalRating;
      }
      application.interviewStatus = "completed";
      application.status = "interviewed";
      application.interviewCompletedAt = new Date();
      await application.save();

      res.json({
        applicationId: application._id,
        interviewStatus: application.interviewStatus,
        status: application.status,
        interviewSummary: application.interviewSummary,
        interviewRating: application.interviewRating,
        interviewTechnicalRating: application.interviewTechnicalRating,
        interviewTranscript: application.interviewTranscript,
        interviewTurns: application.interviewTurns,
        closingRemarks: CLOSING_REMARKS,
        alreadyCompleted: false,
      });
    } catch (err) {
      console.error("Interview finish error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * Candidate note fallback (kept for older clients).
 */
router.post(
  "/candidate-note/:applicationId",
  requireAuth,
  async (req, res) => {
    try {
      const application = await Application.findById(req.params.applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found." });
      }
      if (String(application.user) !== String(req.user.id)) {
        return res.status(403).json({ message: "Not authorized." });
      }

      if (req.body?.summary) {
        application.interviewSummary = String(req.body.summary);
      }
      application.interviewStatus = "completed";
      application.status = "interviewed";
      application.interviewCompletedAt = new Date();
      await application.save();

      res.json(application);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * Existing webhook endpoint.
 */
router.post("/webhook", async (req, res) => {
  try {
    console.log(
      "HeyGen webhook payload:",
      JSON.stringify(req.body, null, 2)
    );

    const {
      application_id,
      summary,
      audio_url,
      rating,
      transcript,
      session_id,
    } = req.body;

    if (application_id) {
      const updates = {
        interviewStatus: "completed",
        status: "interviewed",
        interviewCompletedAt: new Date(),
      };

      if (summary !== undefined) updates.interviewSummary = summary;
      if (audio_url !== undefined) updates.interviewAudioUrl = audio_url;
      if (rating !== undefined) updates.interviewRating = rating;
      if (transcript !== undefined) updates.interviewTranscript = transcript;
      if (session_id !== undefined) updates.liveAvatarSessionId = session_id;

      await Application.findByIdAndUpdate(application_id, updates);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
});

/**
 * Admin manual rating endpoint.
 */
router.post(
  "/manual-rating/:applicationId",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { summary, audio_url, rating, transcript } = req.body;

      const application = await Application.findByIdAndUpdate(
        req.params.applicationId,
        {
          interviewSummary: summary,
          interviewAudioUrl: audio_url,
          interviewRating: rating,
          ...(transcript !== undefined
            ? { interviewTranscript: transcript }
            : {}),
          interviewStatus: "completed",
          status: "interviewed",
          interviewCompletedAt: new Date(),
        },
        { new: true }
      );

      if (!application) {
        return res.status(404).json({
          message: "Application not found.",
        });
      }

      res.json(application);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

export default router;
