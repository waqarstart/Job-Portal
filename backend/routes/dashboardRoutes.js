import express from "express";
import Application from "../models/Application.js";
import SavedJob from "../models/SavedJob.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const PROFILE_CHECKLIST = ["basicInfo", "workExperience", "education", "skills", "portfolio", "resume"];

function computeProfileCompletion(user) {
  const checklist = {
    basicInfo: !!(user.name && user.phone && user.location),
    workExperience: (user.workExperience || []).length > 0,
    education: (user.education || []).length > 0,
    skills: (user.skills || []).length > 0,
    portfolio: !!user.portfolioUrl,
    resume: !!user.resumeUrl,
  };

  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const percent = Math.round((checkedCount / PROFILE_CHECKLIST.length) * 100);

  return { checklist, percent };
}

router.get("/candidate", requireAuth, async (req, res) => {
  try {
    const [user, applications, savedJobs] = await Promise.all([
      User.findById(req.user.id),
      Application.find({ user: req.user.id }).populate("job").sort({ createdAt: -1 }),
      SavedJob.find({ user: req.user.id }),
    ]);

    const pipeline = {
      applied: 0,
      under_review: 0,
      shortlisted: 0,
      interviewed: 0,
      selected: 0,
    };
    for (const app of applications) {
      if (pipeline[app.status] !== undefined) pipeline[app.status]++;
    }

    // "Interviews" stat: applications that still need their AI interview done
    const pendingInterviews = applications.filter((a) => a.status === "applied");
    const nextInterview = pendingInterviews[0] || null; // most recent application awaiting interview

    res.json({
      stats: {
        applications: applications.length,
        savedJobs: savedJobs.length,
        interviewsPending: pendingInterviews.length,
        profileViews: user.profileViews || 0,
      },
      profileCompletion: computeProfileCompletion(user),
      pipeline,
      nextInterview: nextInterview
        ? {
            applicationId: nextInterview._id,
            job: nextInterview.job,
          }
        : null,
      recentApplications: applications.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
