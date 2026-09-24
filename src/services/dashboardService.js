import api from "./api";

export async function getCandidateDashboard() {
  const { data } = await api.get("/dashboard/candidate");
  return data;
}
