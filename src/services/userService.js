import api from "./api";

export async function getMyProfile() {
  const { data } = await api.get("/users/me");
  return data;
}

export async function updateMyProfile(updates) {
  const { data } = await api.put("/users/me", updates);
  return data;
}

export async function uploadProfilePicture(file) {
  const formData = new FormData();
  formData.append("picture", file);
  const { data } = await api.post("/users/me/picture", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function uploadResume(file) {
  const formData = new FormData();
  formData.append("resume", file);
  const { data } = await api.post("/users/me/resume", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateSettings(settings) {
  const { data } = await api.put("/users/me/settings", settings);
  return data;
}

export async function changeEmail(email, password) {
  const { data } = await api.put("/users/me/email", { email, password });
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.put("/users/me/password", { currentPassword, newPassword });
  return data;
}

export async function deactivateAccount() {
  const { data } = await api.post("/users/me/deactivate");
  return data;
}

export async function deleteAccount(password) {
  const { data } = await api.delete("/users/me", { data: { password } });
  return data;
}
