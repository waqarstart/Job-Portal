import express from "express";
import Application from "../models/Application.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * Create a LiveAvatar session token.
 *
 * IMPORTANT:
 * The LiveAvatar API key stays on the backend.
 * The frontend receives only the temporary session token.
 */
router.post("/session", async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({
        message: "applicationId is required.",
      });
    }

    // Make sure the application exists.
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        message: "Application not found.",
      });
    }

    if (!process.env.LIVEAVATAR_API_KEY) {
      return res.status(500).json({
        message: "LIVEAVATAR_API_KEY is not configured on the server.",
      });
    }

    const response = await fetch(
      "https://api.liveavatar.com/v1/sessions/token",
      {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.LIVEAVATAR_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "FULL",

          avatar_id: process.env.LIVEAVATAR_AVATAR_ID,

          avatar_persona: {
            context_id: process.env.LIVEAVATAR_CONTEXT_ID,
          },

          is_sandbox: false,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("LiveAvatar token error:", data);

      return res.status(response.status).json({
        message: "Failed to create LiveAvatar session.",
        details: data,
      });
    }

    console.log("LiveAvatar token created successfully.");

    res.json({
      sessionToken: data.data?.session_token,
      applicationId,
    });
  } catch (error) {
    console.error("LiveAvatar session error:", error);

    res.status(500).json({
      message: "Failed to create LiveAvatar session.",
      error: error.message,
    });
  }
});


/**
 * Existing webhook endpoint.
 */
router.post("/webhook", async (req, res) => {
  try {
    console.log(
      "HeyGen webhook payload:",
      JSON.stringify(req.body, null, 2)
    );

    const { application_id, summary, audio_url, rating } = req.body;

    if (application_id) {
      await Application.findByIdAndUpdate(application_id, {
        interviewSummary: summary,
        interviewAudioUrl: audio_url,
        interviewRating: rating,
        status: "interviewed",
      });
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
      const { summary, audio_url, rating } = req.body;

      const application = await Application.findByIdAndUpdate(
        req.params.applicationId,
        {
          interviewSummary: summary,
          interviewAudioUrl: audio_url,
          interviewRating: rating,
          status: "interviewed",
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