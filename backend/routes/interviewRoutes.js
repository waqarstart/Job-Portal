import express from "express";
import Application from "../models/Application.js";

const router = express.Router();

/**
 * HeyGen webhook endpoint.
 *
 * In your HeyGen dashboard, set the webhook URL to:
 *   https://<your-deployed-backend>/api/interview/webhook
 *
 * IMPORTANT: this is a starting point, not a finished integration.
 * You need to:
 *  1. Check HeyGen's actual webhook docs for the real event name/payload
 *     shape (field names below are placeholders — log req.body first
 *     and adjust to match).
 *  2. Make sure the frontend passes your own `application_id` into the
 *     HeyGen session when it starts (e.g. as a custom/metadata field),
 *     so HeyGen can echo it back here and you know which application
 *     this interview belongs to.
 *  3. If HeyGen gives you an audio file URL, you can store that URL
 *     directly (current code) or download+re-host it yourself.
 */
router.post("/webhook", async (req, res) => {
  try {
    console.log("HeyGen webhook payload:", JSON.stringify(req.body, null, 2));

    const { application_id, summary, audio_url } = req.body;

    if (application_id) {
      await Application.findByIdAndUpdate(application_id, {
        interviewSummary: summary,
        interviewAudioUrl: audio_url,
        status: "interviewed",
      });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
