import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Company from "../models/Company.js";
import { requireAuth, requireHR } from "../middleware/auth.js";

const router = express.Router();

// Logo upload
const logoDir = path.join(process.cwd(), "uploads", "logos");
fs.mkdirSync(logoDir, { recursive: true });

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, logoDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = [".jpg", ".jpeg", ".png", ".webp", ".svg"].includes(
      path.extname(file.originalname).toLowerCase()
    );
    cb(ok ? null : new Error("Only image files are allowed."), ok);
  },
});

// ── Dashboard stats ──────────────────────────────────────────────────────────
router.get("/dashboard", requireAuth, requireHR, async (req, res) => {
  try {
    const myJobs = await Job.find({ postedBy: req.user.id });
    const jobIds = myJobs.map((j) => j._id);

    const [totalApplicants, shortlisted, interviews] = await Promise.all([
      Application.countDocuments({ job: { $in: jobIds } }),
      Application.countDocuments({ job: { $in: jobIds }, status: "shortlisted" }),
      Application.countDocuments({ job: { $in: jobIds }, status: "interviewed" }),
    ]);

    res.json({
      activeJobs: myJobs.filter((j) => j.status === "active").length,
      totalJobs: myJobs.length,
      totalApplicants,
      shortlisted,
      interviews,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Jobs ─────────────────────────────────────────────────────────────────────
router.get("/jobs", requireAuth, requireHR, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/jobs", requireAuth, requireHR, async (req, res) => {
  try {
    const { title, company, city, description, salary, type } = req.body;
    if (!title || !company || !city || !description) {
      return res.status(400).json({ message: "Title, company, city and description are required." });
    }

    const job = await Job.create({
      title, company, city, description, salary, type,
      postedBy: req.user.id,
      status: "active",
    });

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/jobs/:id", requireAuth, requireHR, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user.id });
    if (!job) return res.status(404).json({ message: "Job not found." });

    Object.assign(job, req.body);
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/jobs/:id", requireAuth, requireHR, async (req, res) => {
  try {
    await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user.id });
    res.json({ message: "Job deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Applicants ───────────────────────────────────────────────────────────────
router.get("/applicants", requireAuth, requireHR, async (req, res) => {
  try {
    const myJobs = await Job.find({ postedBy: req.user.id });
    const jobIds = myJobs.map((j) => j._id);

    const applications = await Application.find({ job: { $in: jobIds } })
      .populate("job", "title company city")
      .populate("user", "name email phone location skills")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update application status (shortlist, hire, reject etc.)
router.patch("/applicants/:id/status", requireAuth, requireHR, async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("job").populate("user", "name email");

    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Interviews ───────────────────────────────────────────────────────────────
router.get("/interviews", requireAuth, requireHR, async (req, res) => {
  try {
    const myJobs = await Job.find({ postedBy: req.user.id });
    const jobIds = myJobs.map((j) => j._id);

    const interviews = await Application.find({
      job: { $in: jobIds },
      status: { $in: ["interviewed", "shortlisted", "selected"] },
    })
      .populate("job", "title company")
      .populate("user", "name email")
      .sort({ updatedAt: -1 });

    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Company Profile ──────────────────────────────────────────────────────────
router.get("/company", requireAuth, requireHR, async (req, res) => {
  try {
    const company = await Company.findOne({ hr: req.user.id });
    res.json(company || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/company", requireAuth, requireHR, uploadLogo.single("logo"), async (req, res) => {
  try {
    let existing = await Company.findOne({ hr: req.user.id });

    const updates = {
      name: req.body.name,
      description: req.body.description,
      industry: req.body.industry,
      website: req.body.website,
      location: req.body.location,
      size: req.body.size,
      hr: req.user.id,
    };

    if (req.file) {
      updates.logo = `/uploads/logos/${req.file.filename}`;
    }

    if (existing) {
      Object.assign(existing, updates);
      await existing.save();
      return res.json(existing);
    }

    const company = await Company.create(updates);
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
