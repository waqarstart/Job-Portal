import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    industry: String,
    website: String,
    location: String,
    size: String, // e.g. "1-10", "11-50", "51-200", "201-500", "500+"
    logo: String,
    hr: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
