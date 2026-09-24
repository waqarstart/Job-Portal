import api from "./api";

export async function getMyCVs() {
  const { data } = await api.get("/cvs");
  return data;
}

export async function uploadCV(file, label) {
  const formData = new FormData();
  formData.append("cv", file);
  if (label) formData.append("label", label);
  const { data } = await api.post("/cvs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateCV(id, { label, file } = {}) {
  const formData = new FormData();
  if (label) formData.append("label", label);
  if (file) formData.append("cv", file);
  const { data } = await api.put(`/cvs/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// Keep old name as alias for backward compat
export const renameCV = (id, label) => updateCV(id, { label });

export async function toggleCVLock(id) {
  const { data } = await api.patch(`/cvs/${id}/lock`);
  return data;
}

export async function setPrimaryCV(id) {
  const { data } = await api.patch(`/cvs/${id}/primary`);
  return data;
}

export async function getCVStats() {
  const { data } = await api.get("/cvs/stats");
  return data;
}

export async function getCVUsage() {
  const { data } = await api.get("/cvs/usage");
  return data;
}

export async function deleteCV(id) {
  await api.delete(`/cvs/${id}`);
}
