import api from "./api";

export async function getSavedJobs() {
  const { data } = await api.get("/saved-jobs");
  return data;
}

export async function saveJob(jobId) {
  const { data } = await api.post(`/saved-jobs/${jobId}`);
  return data;
}

export async function unsaveJob(jobId) {
  const { data } = await api.delete(`/saved-jobs/${jobId}`);
  return data;
}
