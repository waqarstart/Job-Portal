import api from "./api";

export async function searchJobs(title = "", city = "") {
  const { data } = await api.get("/jobs", { params: { title, city } });
  return data;
}

export async function getJob(id) {
  const { data } = await api.get(`/jobs/${id}`);
  return data;
}

export async function getTopCompanies(limit = 6) {
  const { data } = await api.get("/jobs/companies/top", { params: { limit } });
  return data;
}

export async function getCompanyDetail(name) {
  const { data } = await api.get(`/jobs/companies/${encodeURIComponent(name)}`);
  return data;
}

// Admin only
export async function createJob(job) {
  const { data } = await api.post("/jobs", job);
  return data;
}

export async function deleteJob(id) {
  await api.delete(`/jobs/${id}`);
}
