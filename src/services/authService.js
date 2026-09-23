import api from "./api";

export async function register(name, email, password) {
  const { data } = await api.post("/auth/register", { name, email, password });
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}

export async function loginWithGoogle(credential) {
  const { data } = await api.post("/auth/google", { credential });
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function currentUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export async function forgotPassword(email) {
  // A longer timeout scoped to just this call — the backend may be
  // waiting on an outbound email-service connection here, which can be
  // slower than a normal API call. Without this, a hung/blocked
  // connection leaves the button stuck on "loading" forever with no
  // feedback; this makes it fail with a real error instead.
  const { data } = await api.post(
    "/auth/forgot-password",
    { email },
    { timeout: 20_000 }
  );
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await api.post(`/auth/reset-password/${token}`, { password });
  return data;
}
