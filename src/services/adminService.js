import api from "./api";

export async function getAdminDashboard() {
  const { data } = await api.get("/admin/dashboard");
  return data;
}

export async function createAdminUser(payload) {
  const { data } = await api.post("/admin/users", payload);
  return data;
}

export async function getAdminUsers(params = {}) {
  const { data } = await api.get("/admin/users", { params });
  return data;
}

export async function updateUserRole(id, role) {
  const { data } = await api.patch(`/admin/users/${id}/role`, { role });
  return data;
}

export async function deleteAdminUser(id) {
  await api.delete(`/admin/users/${id}`);
}

export async function getAdminJobs() {
  const { data } = await api.get("/admin/jobs");
  return data;
}

export async function updateJobStatus(id, status) {
  const { data } = await api.patch(`/admin/jobs/${id}/status`, { status });
  return data;
}

export async function deleteAdminJob(id) {
  await api.delete(`/admin/jobs/${id}`);
}

export async function getAdminApplications() {
  const { data } = await api.get("/admin/applications");
  return data;
}

export async function getHRManagement() {
  const { data } = await api.get("/admin/hr-users");
  return data;
}

export async function getAdminAnalytics() {
  const { data } = await api.get("/admin/analytics");
  return data;
}


export async function createAdminJob(payload) {
  const { data } = await api.post("/jobs", payload);
  return data;
}


export async function updateAdminJob(id, payload) {
  const { data } = await api.put(`/jobs/${id}`, payload);
  return data;
}