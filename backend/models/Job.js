import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    companyRef: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    city: { type: String, required: true },
    description: { type: String, required: true },
    salary: { type: String },
    type: {
      type: String,
      enum: ["Full Time", "Part Time", "Internship", "Contract", "Freelance"],
      default: "Full Time",
    },
    status: { type: String, enum: ["draft", "active", "closed"], default: "active" },
    views: { type: Number, default: 0 },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Fields the Find Jobs filters/UI already expect but weren't being saved
    workMode: {
      type: String,
      enum: ["On-site", "Remote", "Hybrid"],
      default: "On-site",
    },
    experienceLevel: { type: String }, // e.g. "1 - 2 Years"
    skills: [{ type: String }],
    category: { type: String }, // e.g. "Sales", "Marketing", "IT & Software"
    applicationDeadline: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);
