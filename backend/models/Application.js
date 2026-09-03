import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    cvUrl: {
      type: String,
      required: true,
    },

    cvOriginalName: String,

    // AI CV evaluation
    cvRating: Number,
    cvMatchSummary: String,
    cvMatchedSkills: [String],
    cvMissingSkills: [String],

    cvEvaluationStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    // Stored CV text for interview question generation (truncated)
    cvExtractedText: String,

    // Ordered interview question queue for this candidate
    interviewQuestions: [
      {
        text: { type: String, required: true },
        source: {
          type: String,
          enum: ["hr", "cv", "general"],
          default: "hr",
        },
        order: { type: Number, default: 0 },
      },
    ],
    currentQuestionIndex: { type: Number, default: 0 },

    // Interview evaluation
    interviewSummary: String,
    interviewAudioUrl: String,
    interviewRating: Number,
    interviewTechnicalRating: Number,
    interviewTranscript: String,
    interviewTranscriptRaw: mongoose.Schema.Types.Mixed,
    interviewStartedAt: Date,
    interviewCompletedAt: Date,

    // Interview scheduling (set by HR)
    interviewDate: Date,
    interviewDurationMinutes: Number,
    interviewType: String, // e.g. "Technical Round", "Technical + HR Round"
    interviewMode: { type: String, default: "Online" }, // "Online" | "On-site"
    interviewLocationDetail: String, // e.g. "Google Meet" or "Office - Lahore"
    interviewerCount: { type: Number, default: 1 },
    interviewStatus: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
    },
    interviewCancelReason: String,

    // LiveAvatar
    liveAvatarSessionId: String,

    // Application status
    status: {
      type: String,
      enum: [
        "applied",
        "under_review",
        "shortlisted",
        "interviewed",
        "offered",
        "selected",
        "hired",
        "rejected",
      ],
      default: "applied",
    },

    // When the application was marked rejected — used by the cleanup job
    // that auto-deletes rejected applications (and their CV) after 10 days
    rejectedAt: { type: Date },

    // Where the candidate applied from (used for HR analytics)
    source: {
      type: String,
      enum: ["Company Website", "LinkedIn", "Indeed", "Referral", "Other"],
      default: "Company Website",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Application",
  applicationSchema
);