import mongoose from "mongoose";

const cvSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    label: { type: String, default: "" }, // user-editable friendly name
    locked: { type: Boolean, default: false },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("CV", cvSchema);
