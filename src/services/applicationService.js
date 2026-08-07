import api from "./api";

export async function applyToJob(jobId, cvFile) {
  const formData = new FormData();
  formData.append("cv", cvFile);

  const { data } = await api.post(`/applications/${jobId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

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
// wired up yet (same effect as the webhook, triggered by hand)
export async function submitManualRating(applicationId, { rating, summary, audio_url }) {
  const { data } = await api.post(`/interview/manual-rating/${applicationId}`, {
    rating,
    summary,
    audio_url,
  });
  return data;
}
