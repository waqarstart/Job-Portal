import {
  getApplications,
  saveApplications,
} from "./storageService";

import { currentUser } from "./authService";

export function applyToJob(job) {
  const user = currentUser();

  if (!user) {
    throw new Error("Please login first.");
  }

  const applications = getApplications();

  const exists = applications.find(
    (a) =>
      a.userId === user.id &&
      a.jobId === job.id
  );

  if (exists) {
    throw new Error("You have already applied.");
  }

  applications.push({
    id: Date.now(),
    userId: user.id,
    jobId: job.id,
    title: job.title,
    city: job.candidate_required_location,
    company: job.company_name,
    appliedAt: new Date().toISOString(),
  });

  saveApplications(applications);
}

export function getMyApplications() {
  const user = currentUser();

  if (!user) return [];

  return getApplications().filter(
    (a) => a.userId === user.id
  );
}

export function getAllApplications() {
  return getApplications();
}