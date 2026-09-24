import express from "express";
import Application from "../models/Application.js";
import SavedJob from "../models/SavedJob.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Mirrors the granular per-field checks used on the candidate's "My Profile"
// page (src/pages/CandidateProfile.jsx → getCompletionSections) so the
// Dashboard widget and the Profile page always agree on the same percentage
// and the same set of completed sections.
const PROFILE_COMPLETION_SECTIONS = [
  { key: "basicInfo", label: "Basic Info" },
  { key: "professional", label: "Professional Info" },
  { key: "about", label: "About You" },
  { key: "experience", label: "Work Experience" },
  { key: "skills", label: "Skills" },
  { key: "education", label: "Education" },
  { key: "documents", label: "Documents" },
];

function computeProfileCompletion(user) {
  const bioLen = (user.bio || "").trim().length;
  const hasEduLevel = (user.education || []).some((e) => e.level);

  const checksBySection = {
    basicInfo: [!!user.name, !!user.phone, !!user.gender, !!user.nationality, !!user.dateOfBirth, !!(user.country && user.city)],
    professional: [
      !!user.professionalTitle,
      !!user.primaryProfession,
      user.yearsOfExperience !== undefined && user.yearsOfExperience !== null && user.yearsOfExperience !== "",
      !!user.currentEmploymentStatus,
    ],
    about: [bioLen >= 100],
    experience: [(user.workExperience || []).length > 0],
    skills: [(user.skills || []).length > 0],
    education: [(user.education || []).length > 0, hasEduLevel],
    documents: [!!user.documents?.nationalId?.originalName],
  };

  const checklist = {};
  let totalChecks = 0;
  let doneChecks = 0;
  for (const section of PROFILE_COMPLETION_SECTIONS) {
    const items = checksBySection[section.key];
    checklist[section.key] = items.every(Boolean);
    totalChecks += items.length;
    doneChecks += items.filter(Boolean).length;
  }

  const percent = totalChecks ? Math.round((doneChecks / totalChecks) * 100) : 100;
  return { checklist, percent };
}

router.get("/candidate", requireAuth, async (req, res) => {
  try {
    const [user, applications, savedJobs] = await Promise.all([
      User.findById(req.user.id),
      Application.find({ user: req.user.id })
        .populate({
          path: "job",
          populate: { path: "companyRef", select: "logo coverImage" },
        })
        .sort({ createdAt: -1 }),
      SavedJob.find({ user: req.user.id }).populate("job"),
    ]);

    // A saved job whose underlying job was deleted comes back with job: null —
    // don't count those toward the "Saved Jobs" stat.
    const validSavedJobs = savedJobs.filter((s) => s.job);

    const pipeline = {
      applied: 0,
      under_review: 0,
      shortlisted: 0,
      interviewed: 0,
      selected: 0,
      rejected: 0,
    };
    for (const app of applications) {
      if (pipeline[app.status] !== undefined) pipeline[app.status]++;
    }

    // "Interviews" stat: applications eligible for AI interview that are not done
    const pendingInterviews = applications.filter(
      (a) =>
        Number.isFinite(Number(a.cvRating)) &&
        Number(a.cvRating) > 50 &&
        a.status !== "rejected" &&
        a.interviewStatus !== "completed" &&
        a.interviewStatus !== "cancelled" &&
        a.status !== "interviewed"
    );
    const nextInterview = pendingInterviews[0] || null;

    res.json({
      stats: {
        applications: applications.length,
        savedJobs: validSavedJobs.length,
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
