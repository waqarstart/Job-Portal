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
