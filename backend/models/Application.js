import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cvUrl: { type: String, required: true },
    cvOriginalName: String,

    // Filled in later by the HeyGen webhook once the interview ends
    interviewSummary: String,
    interviewAudioUrl: String,

    status: {
      type: String,
      enum: ["applied", "interviewed", "rejected", "hired"],
      default: "applied",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);
