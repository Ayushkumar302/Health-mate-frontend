const hostname = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "localhost";
export const BASE_URL = `http://${hostname}:5000/api/v1`;
export const token = localStorage.getItem("token");