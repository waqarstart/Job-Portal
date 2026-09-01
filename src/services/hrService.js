import api from "./api";

export async function getHRDashboard(period = "month") {
  const { data } = await api.get("/hr/dashboard", { params: { period } });
  return data;
}

// Jobs
export async function getHRJobs(params = {}) {
  const { data } = await api.get("/hr/jobs", { params });
  return data;
}

export async function getHRJob(id) {
  const { data } = await api.get(`/hr/jobs/${id}`);
  return data;
}

export async function createHRJob(job) {
  const { data } = await api.post("/hr/jobs", job);
  return data;
}

export async function updateHRJob(id, updates) {
  const { data } = await api.put(`/hr/jobs/${id}`, updates);
  return data;
}

export async function deleteHRJob(id) {
  await api.delete(`/hr/jobs/${id}`);
}

// Applicants
export async function getHRApplicants() {
  const { data } = await api.get("/hr/applicants");
  return data;
}

export async function updateApplicantStatus(id, status) {
  const { data } = await api.patch(`/hr/applicants/${id}/status`, { status });
  return data;
}

// Interviews
export async function getHRInterviews() {
  const { data } = await api.get("/hr/interviews");
  return data;
}

export async function getSchedulableApplicants() {
  const { data } = await api.get("/hr/interviews/schedulable");
  return data;
}

// Company
export async function getHRCompany() {
  const { data } = await api.get("/hr/company");
  return data;
}

export async function saveHRCompany(formData) {
  const { data } = await api.post("/hr/company", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
