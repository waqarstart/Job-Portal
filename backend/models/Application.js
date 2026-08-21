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
        "selected",
        "hired",
        "rejected",
      ],
      default: "applied",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Application", applicationSchema);
