import express from "express";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Company from "../models/Company.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// ── Dashboard stats ──────────────────────────────────────────────────────────
router.get("/dashboard", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalJobs, activeJobs, totalApplications, totalCompanies, hrUsers] =
      await Promise.all([
        User.countDocuments(),
        Job.countDocuments(),
        Job.countDocuments({ status: "active" }),
        Application.countDocuments(),
        Company.countDocuments(),
        User.countDocuments({ role: "hr" }),
      ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role createdAt");

    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("postedBy", "name");

    res.json({
      stats: { totalUsers, totalJobs, activeJobs, totalApplications, totalCompanies, hrUsers },
      recentUsers,
      recentJobs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Manage Users ─────────────────────────────────────────────────────────────
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
    const users = await User.find(filter).sort({ createdAt: -1 }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "hr", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Manage Jobs ───────────────────────────────────────────────────────────────
router.get("/jobs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const jobs = await Job.find().populate("postedBy", "name email").sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/jobs/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/jobs/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: "Job deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Applications ──────────────────────────────────────────────────────────────
router.get("/applications", requireAuth, requireAdmin, async (req, res) => {
  try {
    const apps = await Application.find()
      .populate("job", "title company city")
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── HR Management ─────────────────────────────────────────────────────────────
router.get("/hr-users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const hrUsers = await User.find({ role: "hr" }).select("-password").sort({ createdAt: -1 });
    const companies = await Company.find().populate("hr", "name email");
    res.json({ hrUsers, companies });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get("/analytics", requireAuth, requireAdmin, async (req, res) => {
  try {
    // Applications by status
    const statusCounts = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Jobs by type
    const jobTypeCounts = await Job.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    // Users by role
    const roleCounts = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    // New users last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: weekAgo } });
    const newApplications = await Application.countDocuments({ createdAt: { $gte: weekAgo } });
    const newJobs = await Job.countDocuments({ createdAt: { $gte: weekAgo } });

    res.json({
      statusCounts,
      jobTypeCounts,
      roleCounts,
      weeklyStats: { newUsers, newApplications, newJobs },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
