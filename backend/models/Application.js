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

    // Interview evaluation
    interviewSummary: String,
    interviewAudioUrl: String,
    interviewRating: Number,

    // Interview scheduling (set by HR)
    interviewDate: Date,
    interviewDurationMinutes: Number,
    interviewType: String, // e.g. "Technical Round", "Technical + HR Round"
    interviewMode: { type: String, default: "Online" }, // "Online" | "On-site"
    interviewLocationDetail: String, // e.g. "Google Meet" or "Office - Lahore"
    interviewerCount: { type: Number, default: 1 },
    interviewStatus: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
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