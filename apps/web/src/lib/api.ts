/**
 * Base URL for API requests. When running frontend and backend separately,
 * set VITE_API_URL to the backend origin (e.g. http://localhost:4000).
 */
export function getApiUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (url && typeof url === "string") {
    return url.replace(/\/$/, "");
  }
  return window.location.origin;
}
