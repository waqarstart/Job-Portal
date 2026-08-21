import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import CV from "../models/CV.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads", "cvs-library");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    const ok = [".pdf", ".doc", ".docx"].includes(
      path.extname(file.originalname).toLowerCase()
    );
    cb(ok ? null : new Error("Only PDF, DOC or DOCX files are allowed."), ok);
  },
});

const MAX_CVS = 5;

// List all my CVs
router.get("/", requireAuth, async (req, res) => {
  try {
    const cvs = await CV.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(cvs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload a new CV (max 5 total)
router.post("/", requireAuth, upload.single("cv"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "A CV file is required." });
    }

    const count = await CV.countDocuments({ user: req.user.id });
    if (count >= MAX_CVS) {
      // Delete the uploaded file since we're rejecting it
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: `You can only store up to ${MAX_CVS} CVs. Delete one first.`,
      });
    }

    const cv = await CV.create({
      user: req.user.id,
      originalName: req.file.originalname,
      url: `/uploads/cvs-library/${req.file.filename}`,
      label: req.body.label || req.file.originalname,
    });

    res.status(201).json(cv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Edit label AND optionally replace the file
router.put("/:id", requireAuth, upload.single("cv"), async (req, res) => {
  try {
    const cv = await CV.findOne({ _id: req.params.id, user: req.user.id });
    if (!cv) return res.status(404).json({ message: "CV not found." });
    if (cv.locked) return res.status(403).json({ message: "CV is locked. Unlock it first." });

    if (req.body.label) cv.label = req.body.label;

    if (req.file) {
      // Delete old file from disk
      const oldPath = path.join(process.cwd(), cv.url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

      cv.url = `/uploads/cvs-library/${req.file.filename}`;
      cv.originalName = req.file.originalname;
    }

    await cv.save();
    res.json(cv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle lock/unlock
router.patch("/:id/lock", requireAuth, async (req, res) => {
  try {
    const cv = await CV.findOne({ _id: req.params.id, user: req.user.id });
    if (!cv) return res.status(404).json({ message: "CV not found." });

    cv.locked = !cv.locked;
    await cv.save();
    res.json(cv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a CV
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const cv = await CV.findOne({ _id: req.params.id, user: req.user.id });
    if (!cv) return res.status(404).json({ message: "CV not found." });
    if (cv.locked) return res.status(403).json({ message: "CV is locked. Unlock it first." });

    // Remove file from disk
    const filePath = path.join(process.cwd(), cv.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await cv.deleteOne();
    res.json({ message: "CV deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
