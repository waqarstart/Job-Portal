import axios from "axios";
import { startLoading, stopLoading, isTransitioning } from "../utils/loadingBus";
import { API_URL } from "../config";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Drive the full-page loader from real network activity:
  //  - Saves/submits (POST/PUT/PATCH/DELETE) always count, so any "save" or
  //    "submit" action shows the loader until the response comes back.
  //  - Plain GETs only count right after a route change (isTransitioning),
  //    i.e. a page's initial data fetch — not background polling or
  //    search-as-you-type, which shouldn't block the whole screen.
  const method = (config.method || "get").toLowerCase();
  const shouldTrack = method !== "get" || isTransitioning();
  config.__tracksLoading = shouldTrack;
  if (shouldTrack) startLoading();

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config?.__tracksLoading) stopLoading();
    return response;
  },
  async (error) => {
    if (error.config?.__tracksLoading) stopLoading();

    const original = error.config;
    const isAuthCall = original?.url?.startsWith("/auth/");
    const refreshToken = localStorage.getItem("refreshToken");

    if (error.response?.status === 401 && original && !isAuthCall && !original._retry && refreshToken) {
      original._retry = true;
      try {
        // plain axios, so this call skips the interceptors
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original); // retry the failed request
      } catch {
        // refresh failed: fall through and return the original error
      }
    }

    return Promise.reject(error);
  }
);

export default api;
