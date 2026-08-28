import express from "express";
import Job from "../models/Job.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public: list / search jobs (replaces the old Remotive API call)
router.get("/", async (req, res) => {
  try {
    const { title = "", city = "" } = req.query;
    const filter = { status: "active" };

    if (title) filter.title = { $regex: title, $options: "i" };
    if (city) filter.city = { $regex: city, $options: "i" };

    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!job) return res.status(404).json({ message: "Job not found." });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin only: create a job
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, company, city, description, salary, type } = req.body;

    if (!title || !company || !city || !description) {
      return res.status(400).json({ message: "Title, company, city and description are required." });
    }

    const job = await Job.create({
      title,
      company,
      city,
      description,
      salary,
      type,
      postedBy: req.user.id,
    });

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: "Job deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
