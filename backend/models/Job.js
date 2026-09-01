import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    companyRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    city: { type: String, required: true },
    description: { type: String, required: true },
    salary: { type: String },

    type: {
      type: String,
      enum: [
        "Full Time",
        "Part Time",
        "Internship",
        "Contract",
        "Freelance",
      ],
      default: "Full Time",
    },

    status: {
      type: String,
      enum: ["draft", "active", "closed"],
      default: "active",
    },

    views: {
      type: Number,
      default: 0,
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    workMode: {
      type: String,
      enum: ["On-site", "Remote", "Hybrid"],
      default: "On-site",
    },

    experienceLevel: {
      type: String,
    },

    skills: [
      {
        type: String,
      },
    ],

    category: {
      type: String,
    },

    applicationDeadline: {
      type: Date,
    },

    // HR-created questions for the AI interview
    interviewQuestions: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Job", jobSchema);