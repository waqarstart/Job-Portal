import api from "./api";

export async function applyToJob(jobId, cvFile = null, cvId = null) {
  const formData = new FormData();

  // New uploaded CV
  if (cvFile) {
    formData.append("cv", cvFile);
  }

  // Existing saved CV
  if (cvId) {
    formData.append("cvId", cvId);
  }

  const { data } = await api.post(
    `/applications/${jobId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
}

export async function getMyApplications() {
  const { data } = await api.get("/applications/mine");
  return data;
}

// Admin only
export async function getAllApplications() {
  const { data } = await api.get("/applications");
  return data;
}

// Admin only — fallback/manual entry if the real HeyGen webhook isn't
// wired up yet
export async function submitManualRating(
  applicationId,
  { rating, summary, audio_url }
) {
  const { data } = await api.post(
    `/interview/manual-rating/${applicationId}`,
    {
      rating,
      summary,
      audio_url,
    }
  );

  return data;
}

// Candidate-facing
export async function candidateFinishInterview(
  applicationId,
  summary
) {
  const { data } = await api.post(
    `/interview/candidate-note/${applicationId}`,
    {
      summary,
    }
  );

  return data;
}

// Start a real LiveAvatar session
export async function startInterviewSession(applicationId) {
  const { data } = await api.post(
    `/interview/start/${applicationId}`
  );

  return data;
}

// Called once interview ends
export async function finishInterviewSession(applicationId) {
  const { data } = await api.post(
    `/interview/finish/${applicationId}`
  );

  return data;
}
// HR/Admin: schedule, complete, or cancel an interview
export async function scheduleInterview(applicationId, payload) {
  const { data } = await api.patch(
    `/applications/${applicationId}/interview`,
    payload
  );

  return data;
}
