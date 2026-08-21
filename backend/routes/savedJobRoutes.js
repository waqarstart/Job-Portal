import express from "express";
import SavedJob from "../models/SavedJob.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// List my saved jobs
router.get("/", requireAuth, async (req, res) => {
  try {
    const saved = await SavedJob.find({ user: req.user.id })
      .populate("job")
      .sort({ createdAt: -1 });
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save a job
router.post("/:jobId", requireAuth, async (req, res) => {
  try {
    const existing = await SavedJob.findOne({ user: req.user.id, job: req.params.jobId });
    if (existing) return res.status(400).json({ message: "Job already saved." });

    const saved = await SavedJob.create({ user: req.user.id, job: req.params.jobId });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unsave a job
router.delete("/:jobId", requireAuth, async (req, res) => {
  try {
    await SavedJob.findOneAndDelete({ user: req.user.id, job: req.params.jobId });
    res.json({ message: "Job removed from saved list." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
