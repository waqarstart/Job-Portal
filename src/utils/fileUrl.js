/**
 * CV/resume files are now served through an authenticated route (see
 * backend/routes/fileRoutes.js) since they're private documents. Plain
 * <a href> links and window.open() calls can't attach an Authorization
 * header, so we pass the JWT as a `?token=` query param instead — the
 * backend accepts either. Company logos/profile pictures are still
 * public and don't need this.
 */
export function withAuthToken(url) {
  const token = localStorage.getItem("token");
  if (!token) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}
