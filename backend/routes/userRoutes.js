import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { safeOriginalName } from "../utils/security.js";

const router = express.Router();

// ── Profile picture upload ───────────────────────────────────────────────────
const picDir = path.join(process.cwd(), "uploads", "profile-pics");
fs.mkdirSync(picDir, { recursive: true });

const picStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, picDir),
  filename: (req, file, cb) =>
    cb(null, `${req.user?.id}-${Date.now()}${path.extname(safeOriginalName(file.originalname))}`),
});

const uploadPic = multer({
  storage: picStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) => {
    const ok = [".jpg", ".jpeg", ".png", ".webp"].includes(
      path.extname(file.originalname).toLowerCase()
    );
    cb(ok ? null : new Error("Only JPG, PNG or WEBP images are allowed."), ok);
  },
});

// ── Resume upload ────────────────────────────────────────────────────────────
const resumeDir = path.join(process.cwd(), "uploads", "resumes");
fs.mkdirSync(resumeDir, { recursive: true });

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, resumeDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${safeOriginalName(file.originalname)}`),
});

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = [".pdf", ".doc", ".docx"].includes(
      path.extname(file.originalname).toLowerCase()
    );
    cb(ok ? null : new Error("Only PDF, DOC or DOCX files are allowed."), ok);
  },
});

// ── Candidate document uploads ──────────────────────────────────────────────
const documentDir = path.join(process.cwd(), "uploads", "profile-documents");
fs.mkdirSync(documentDir, { recursive: true });

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, documentDir),
  filename: (req, file, cb) =>
    cb(null, `${req.user?.id}-${Date.now()}-${safeOriginalName(file.originalname)}`),
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = [".pdf", ".jpg", ".jpeg", ".png", ".webp"].includes(
      path.extname(file.originalname).toLowerCase()
    );
    cb(ok ? null : new Error("Only PDF or image files are allowed."), ok);
  },
});

// ── Helper ───────────────────────────────────────────────────────────────────
function publicProfile(user) {
  const obj = user.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
}

const ALLOWED_PROFILE_FIELDS = [
  "name", "phone", "location", "gender", "nationality", "dateOfBirth", "country", "city", "primaryLanguage", "streetAddress",
  "professionalTitle", "primaryProfession", "bio", "yearsOfExperience", "currentPosition", "currentEmploymentStatus", "availability", "expectedSalary", "salaryCurrency",
  "skills", "languages",
  "workExperience", "education",
  "portfolioUrl", "linkedinUrl", "githubUrl",
];

const ALLOWED_SETTINGS_FIELDS = [
  "emailNotifications", "applicationUpdates", "interviewReminders",
  "jobRecommendations", "profileVisible", "cvPrivate", "searchAppearance",
];

// ── Routes ───────────────────────────────────────────────────────────────────

// GET my profile
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update profile fields
router.put("/me", requireAuth, async (req, res) => {
  try {
    const updates = {};
    for (const field of ALLOWED_PROFILE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST upload profile picture
router.post("/me/picture", requireAuth, uploadPic.single("picture"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Image file required." });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: `/uploads/profile-pics/${req.file.filename}` },
      { new: true }
    );
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST an additional named candidate document
router.post("/me/documents/other", requireAuth, uploadDocument.single("document"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Document file required." });
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Document name required." });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if ((user.otherDocuments || []).length >= 5) {
      return res.status(400).json({ message: "You can add up to 8 documents in total." });
    }

    user.otherDocuments.push({
      name,
      url: `/uploads/profile-documents/${req.file.filename}`,
      originalName: req.file.originalname,
    });
    await user.save();
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE an additional named candidate document
router.delete("/me/documents/other/:id", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    const document = user.otherDocuments?.id(req.params.id);
    if (!document) return res.status(404).json({ message: "Document not found." });

    const filePath = path.join(process.cwd(), document.url.replace(/^\/uploads\//, "uploads/"));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    document.deleteOne();
    await user.save();
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST upload resume (single legacy resume slot)
router.post("/me/resume", requireAuth, uploadResume.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Resume file required." });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { resumeUrl: `/uploads/resumes/${req.file.filename}`, resumeOriginalName: req.file.originalname },
      { new: true }
    );
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST upload a candidate profile document
router.post("/me/documents/:type", requireAuth, uploadDocument.single("document"), async (req, res) => {
  try {
    const allowedTypes = ["nationalId", "experienceLetter", "graduationCertificate"];
    const { type } = req.params;
    if (!allowedTypes.includes(type)) return res.status(400).json({ message: "Invalid document type." });
    if (!req.file) return res.status(400).json({ message: "Document file required." });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { [`documents.${type}`]: { url: `/uploads/profile-documents/${req.file.filename}`, originalName: req.file.originalname } } },
      { new: true }
    );
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a candidate profile document (National ID, experience letter, graduation certificate)
router.delete("/me/documents/:type", requireAuth, async (req, res) => {
  try {
    const allowedTypes = ["nationalId", "experienceLetter", "graduationCertificate"];
    const { type } = req.params;
    if (!allowedTypes.includes(type)) return res.status(400).json({ message: "Invalid document type." });

    const existingUser = await User.findById(req.user.id);
    if (!existingUser) return res.status(404).json({ message: "User not found." });

    const existing = existingUser.documents?.[type];
    if (existing?.url) {
      const filePath = path.join(process.cwd(), existing.url.replace(/^\/uploads\//, "uploads/"));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $unset: { [`documents.${type}`]: "" } },
      { new: true }
    );
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update settings toggles
router.put("/me/settings", requireAuth, async (req, res) => {
  try {
    const updates = {};
    for (const field of ALLOWED_SETTINGS_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT change email
router.put("/me/email", requireAuth, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and current password required." });

    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Current password is incorrect." });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email already in use." });

    user.email = email.toLowerCase();
    await user.save();
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT change password
router.put("/me/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both passwords required." });

    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: "Current password is incorrect." });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST deactivate account
router.post("/me/deactivate", requireAuth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isDeactivated: true });
    res.json({ message: "Account deactivated." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE account permanently
router.delete("/me", requireAuth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Password is incorrect." });

    await user.deleteOne();
    res.json({ message: "Account deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET another user's public profile (increments views)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { profileViews: 1 } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
