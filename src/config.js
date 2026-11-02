const hostname = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "localhost";
// backend server (REST API + Socket.io for video calls): VITE_API_URL on the live site, port 5000 locally
export const SERVER_URL = (import.meta.env.VITE_API_URL || `http://${hostname}:5000`).replace(/\/$/, "");
export const BASE_URL = `${SERVER_URL}/api/v1`;
// the token is read from authContext at request time, not here, so it is never stale after login/logout
