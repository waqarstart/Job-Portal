import express from "express";
import Application from "../models/Application.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  getLiveAvatarTranscript,
  formatTranscript,
} from "../utils/liveavatar.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CREATE LIVEAVATAR SESSION
|--------------------------------------------------------------------------
*/

async function createSession(req, res) {
  try {
    const applicationId =
      req.params.applicationId || req.body.applicationId;

    if (!applicationId) {
      return res.status(400).json({
        message: "Application ID is required.",
      });
    }

    const application = await Application.findOne({
      _id: applicationId,
      user: req.user.id,
    }).populate("job", "title company");

    if (!application) {
      return res.status(404).json({
        message: "Application not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | INTERVIEW ELIGIBILITY
    |--------------------------------------------------------------------------
    */

    const cvRating = Number(application.cvRating || 0);

    if (
      application.status !== "shortlisted" &&
      cvRating <= 50
    ) {
      return res.status(403).json({
        message: `Interview unavailable. Current status: "${application.status}", CV rating: ${cvRating}. Candidate must be shortlisted or have a CV rating above 50.`,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | PREVENT COMPLETED INTERVIEW FROM STARTING AGAIN
    |--------------------------------------------------------------------------
    */

    if (
      application.interviewStatus === "completed" ||
      application.status === "interviewed"
    ) {
      return res.status(400).json({
        message: "This interview has already been completed.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | AUTO-SHORTLIST
    |--------------------------------------------------------------------------
    */

    if (
      cvRating > 50 &&
      application.status !== "shortlisted" &&
      application.status !== "interviewed"
    ) {
      application.status = "shortlisted";
    }

    /*
    |--------------------------------------------------------------------------
    | ENVIRONMENT VARIABLES
    |--------------------------------------------------------------------------
    */

    const apiKey =
      process.env.LIVEAVATAR_API_KEY?.trim();

    const avatarId =
      process.env.LIVEAVATAR_AVATAR_ID?.trim();

    const contextId =
      process.env.LIVEAVATAR_CONTEXT_ID?.trim();

    const voiceId =
      process.env.LIVEAVATAR_VOICE_ID?.trim();

    if (!apiKey) {
      return res.status(500).json({
        message:
          "LIVEAVATAR_API_KEY is missing on the backend.",
      });
    }

    if (!avatarId) {
      return res.status(500).json({
        message:
          "LIVEAVATAR_AVATAR_ID is missing on the backend.",
      });
    }

    if (!contextId) {
      return res.status(500).json({
        message:
          "LIVEAVATAR_CONTEXT_ID is missing on the backend.",
      });
    }

    console.log("=======================================");
    console.log("Creating LiveAvatar interview");
    console.log("Application ID:", application._id.toString());
    console.log("Application status:", application.status);
    console.log("Interview status:", application.interviewStatus);
    console.log("CV Rating:", cvRating);
    console.log("Avatar ID:", avatarId);
    console.log("Context ID:", contextId);
    console.log("Sandbox:", true);
    console.log("=======================================");

    /*
    |--------------------------------------------------------------------------
    | AVATAR PERSONA
    |--------------------------------------------------------------------------
    */

    const avatarPersona = {
      context_id: contextId,
      language: "en",
    };

    if (voiceId) {
      avatarPersona.voice_id = voiceId;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE SESSION TOKEN
    |--------------------------------------------------------------------------
    */

    const response = await fetch(
      "https://api.liveavatar.com/v1/sessions/token",
      {
        method: "POST",

        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mode: "FULL",

          avatar_id: avatarId,

          avatar_persona: avatarPersona,

          /*
           * Sandbox is enabled while testing.
           */
          is_sandbox: true,
        }),
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch (error) {
      console.error(
        "Could not parse LiveAvatar response:",
        error
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LIVEAVATAR ERROR
    |--------------------------------------------------------------------------
    */

    if (!response.ok) {
      console.error(
        "LiveAvatar session creation failed:"
      );

      console.error(
        JSON.stringify(data, null, 2)
      );

      const providerMessage =
        data?.message ||
        data?.error?.message ||
        data?.error ||
        data?.detail ||
        data?.data?.message ||
        "LiveAvatar rejected the session request.";

      return res.status(response.status).json({
        message:
          typeof providerMessage === "string"
            ? providerMessage
            : "LiveAvatar rejected the session request.",

        provider: "LiveAvatar",

        status: response.status,

        details: data,
      });
    }

    console.log(
      "LiveAvatar token response:",
      JSON.stringify(data, null, 2)
    );

    /*
    |--------------------------------------------------------------------------
    | EXTRACT SESSION DATA
    |--------------------------------------------------------------------------
    */

    const sessionToken =
      data?.data?.session_token ||
      data?.session_token ||
      null;

    const sessionId =
      data?.data?.session_id ||
      data?.session_id ||
      null;

    if (!sessionToken) {
      return res.status(502).json({
        message:
          "LiveAvatar did not return a session token.",

        details: data,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | MARK INTERVIEW AS IN PROGRESS
    |--------------------------------------------------------------------------
    */

    if (sessionId) {
      application.liveAvatarSessionId =
        sessionId;
    }

    application.interviewStartedAt =
      new Date();

    application.interviewStatus =
      "in_progress";

    await application.save();

    console.log(
      "LiveAvatar session created successfully."
    );

    console.log(
      "Session ID:",
      sessionId || "No session ID returned"
    );

    /*
    |--------------------------------------------------------------------------
    | RETURN SESSION TO FRONTEND
    |--------------------------------------------------------------------------
    */

    return res.json({
      success: true,

      sessionToken,

      sessionId,

      applicationId:
        application._id,

      job:
        application.job,

      cvRating,

      applicationStatus:
        application.status,

      interviewStatus:
        application.interviewStatus,

      durationSeconds: 120,

      sandbox: true,
    });
  } catch (error) {
    console.error(
      "Create interview session error:",
      error
    );

    return res.status(500).json({
      message:
        error?.message ||
        "Could not start the LiveAvatar interview.",
    });
  }
}


/*
|--------------------------------------------------------------------------
| START INTERVIEW
|--------------------------------------------------------------------------
*/

router.post(
  "/start/:applicationId",
  requireAuth,
  createSession
);


/*
|--------------------------------------------------------------------------
| LEGACY SESSION ENDPOINT
|--------------------------------------------------------------------------
*/

router.post(
  "/session",
  requireAuth,
  createSession
);


/*
|--------------------------------------------------------------------------
| FINISH INTERVIEW
|--------------------------------------------------------------------------
*/

router.post(
  "/finish/:applicationId",
  requireAuth,
  async (req, res) => {
    try {
      const application =
        await Application.findOne({
          _id: req.params.applicationId,
          user: req.user.id,
        });

      if (!application) {
        return res.status(404).json({
          message:
            "Application not found.",
        });
      }

      /*
       * Already completed.
       * Keep this endpoint safe to call more than once.
       */
      if (
        application.interviewStatus === "completed"
      ) {
        return res.json({
          success: true,
          alreadyCompleted: true,
          message:
            "Interview was already completed.",
          application,
        });
      }

      if (!application.interviewStartedAt) {
        return res.status(400).json({
          message:
            "Interview has not been started.",
        });
      }

      /*
       * If frontend sends a session ID, keep it.
       */
      if (req.body?.sessionId) {
        application.liveAvatarSessionId =
          req.body.sessionId;
      }

      let transcriptSummary = null;

      /*
      |--------------------------------------------------------------------------
      | LIVEAVATAR TRANSCRIPT
      |--------------------------------------------------------------------------
      */

      if (application.liveAvatarSessionId) {
        try {
          console.log(
            "Getting transcript for session:",
            application.liveAvatarSessionId
          );

          const transcript =
            await getLiveAvatarTranscript(
              application.liveAvatarSessionId
            );

          transcriptSummary =
            formatTranscript(
              transcript?.transcript_data || []
            );

          console.log(
            "Transcript retrieved."
          );
        } catch (transcriptError) {
          console.warn(
            "Could not retrieve LiveAvatar transcript:",
            transcriptError?.message ||
              transcriptError
          );
        }
      }

      /*
       * Use frontend transcript as fallback if available.
       */
      if (
        !transcriptSummary &&
        req.body?.transcript
      ) {
        transcriptSummary =
          req.body.transcript;
      }

      /*
      |--------------------------------------------------------------------------
      | SAVE SUMMARY
      |--------------------------------------------------------------------------
      */

      if (transcriptSummary) {
        application.interviewSummary =
          transcriptSummary;
      }

      /*
      |--------------------------------------------------------------------------
      | MARK INTERVIEW COMPLETED
      |--------------------------------------------------------------------------
      */

      application.interviewCompletedAt =
        new Date();

      /*
       * This is the important fix for the HR Applicants page.
       */
      application.interviewStatus =
        "completed";

      /*
       * Overall application status.
       */
      application.status =
        "interviewed";

      await application.save();

      console.log(
        "======================================="
      );
      console.log(
        "Interview completed:",
        application._id.toString()
      );
      console.log(
        "Interview status:",
        application.interviewStatus
      );
      console.log(
        "Application status:",
        application.status
      );
      console.log(
        "======================================="
      );

      return res.json({
        success: true,

        message:
          "Interview completed successfully.",

        interviewStatus:
          application.interviewStatus,

        status:
          application.status,

        application,
      });
    } catch (error) {
      console.error(
        "Finish interview error:",
        error
      );

      return res.status(500).json({
        message:
          error?.message ||
          "Could not finish interview.",
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| CANDIDATE FALLBACK NOTE
|--------------------------------------------------------------------------
*/

router.post(
  "/candidate-note/:applicationId",
  requireAuth,
  async (req, res) => {
    try {
      const application =
        await Application.findOne({
          _id: req.params.applicationId,
          user: req.user.id,
        });

      if (!application) {
        return res.status(404).json({
          message:
            "Application not found.",
        });
      }

      application.interviewSummary =
        req.body.summary ||
        "Interview completed.";

      application.interviewCompletedAt =
        new Date();

      /*
       * Important:
       * update BOTH status fields.
       */
      application.interviewStatus =
        "completed";

      application.status =
        "interviewed";

      await application.save();

      return res.json({
        success: true,

        interviewStatus:
          application.interviewStatus,

        status:
          application.status,

        application,
      });
    } catch (error) {
      console.error(
        "Candidate interview note error:",
        error
      );

      return res.status(500).json({
        message:
          error?.message ||
          "Could not save interview note.",
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| LIVEAVATAR / HEYGEN WEBHOOK
|--------------------------------------------------------------------------
*/

router.post(
  "/webhook",
  async (req, res) => {
    try {
      console.log(
        "Interview webhook:"
      );

      console.log(
        JSON.stringify(req.body, null, 2)
      );

      const {
        application_id,
        summary,
        audio_url,
        rating,
      } = req.body;

      if (application_id) {
        await Application.findByIdAndUpdate(
          application_id,
          {
            interviewSummary:
              summary,

            interviewAudioUrl:
              audio_url,

            interviewRating:
              rating,

            interviewCompletedAt:
              new Date(),

            /*
             * Important:
             * HR page reads interviewStatus.
             */
            interviewStatus:
              "completed",

            status:
              "interviewed",
          }
        );
      }

      return res.status(200).json({
        received: true,
      });
    } catch (error) {
      console.error(
        "Interview webhook error:",
        error
      );

      return res.status(500).json({
        message:
          error?.message ||
          "Webhook failed.",
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| ADMIN MANUAL INTERVIEW RATING
|--------------------------------------------------------------------------
*/

router.post(
  "/manual-rating/:applicationId",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        summary,
        audio_url,
        rating,
      } = req.body;

      const application =
        await Application.findByIdAndUpdate(
          req.params.applicationId,

          {
            interviewSummary:
              summary,

            interviewAudioUrl:
              audio_url,

            interviewRating:
              rating,

            interviewCompletedAt:
              new Date(),

            /*
             * Important:
             * mark interview itself as completed.
             */
            interviewStatus:
              "completed",

            status:
              "interviewed",
          },

          {
            new: true,
          }
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Application not found.",
        });
      }

      return res.json({
        success: true,

        interviewStatus:
          application.interviewStatus,

        status:
          application.status,

        application,
      });
    } catch (error) {
      console.error(
        "Manual interview rating error:",
        error
      );

      return res.status(500).json({
        message:
          error?.message ||
          "Could not update interview rating.",
      });
    }
  }
);


export default router;