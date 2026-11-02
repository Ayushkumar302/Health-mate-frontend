import { BASE_URL } from "@/config";
import { reportSessionExpired } from "@/utils/session";

// small fetch wrapper: sends/receives JSON and throws the server's message when a request fails
export const apiRequest = async (path, { token, method = "GET", body } = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    // the login is no longer valid: log out once instead of showing an error
    if (res.status === 401 && token) reportSessionExpired();
    const error = new Error(result.message || "Something went wrong, please try again");
    error.status = res.status;
    error.code = result.code;
    throw error;
  }
  return result;
};
