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
    status: { type: String, enum: ["active", "closed"], default: "active" },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);
