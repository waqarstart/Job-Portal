import axios from "axios";
import { startLoading, stopLoading, isTransitioning } from "../utils/loadingBus";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
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
  (error) => {
    if (error.config?.__tracksLoading) stopLoading();
    return Promise.reject(error);
  }
);

export default api;
