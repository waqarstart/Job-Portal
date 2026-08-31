import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // not required for Google-authenticated accounts
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["user", "admin", "hr"], default: "user" },
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // Basic info
    phone: String,
    location: String,
    profilePicture: String,

    // Professional info
    professionalTitle: String,
    bio: String,
    yearsOfExperience: Number,
    currentPosition: String,
    expectedSalary: String,

    // Skills & languages
    skills: [String],
    languages: [String],

    // Education — level-based
    education: [
      {
        level: {
          type: String,
          enum: ["School", "Intermediate", "Undergraduate", "Master", "PhD"],
        },
        institution: String,
        degree: String,
        startDate: String,
        endDate: String,
      },
    ],

    // Work experience
    workExperience: [
      {
        title: String,
        company: String,
        startDate: String,
        endDate: String,
        description: String,
      },
    ],

    // Portfolio & social links
    portfolioUrl: String,
    linkedinUrl: String,
    githubUrl: String,

    // Legacy resume (single file — kept for backward compat)
    resumeUrl: String,
    resumeOriginalName: String,

    profileViews: { type: Number, default: 0 },

    // Account settings flags
    emailNotifications: { type: Boolean, default: true },
    applicationUpdates: { type: Boolean, default: true },
    interviewReminders: { type: Boolean, default: true },
    jobRecommendations: { type: Boolean, default: true },
    profileVisible: { type: Boolean, default: true },
    cvPrivate: { type: Boolean, default: false },
    searchAppearance: { type: Boolean, default: true },
    isDeactivated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
