import api from "./api";

export async function getHRDashboard() {
  const { data } = await api.get("/hr/dashboard");
  return data;
}

// Jobs
export async function getHRJobs() {
  const { data } = await api.get("/hr/jobs");
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
