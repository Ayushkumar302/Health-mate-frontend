// Login sessions end after a while (the server's JWT_EXPIRES_IN). When that happens the site logs the
// person out once, with one message, instead of showing "Token is expired" errors everywhere.

export const SESSION_EXPIRED = "medora:session-expired";

// when the token stops working (ms), read from the token itself; null if it can't be read
export const tokenExpiry = token => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isTokenExpired = token => {
  const expiry = tokenExpiry(token);
  return expiry !== null && expiry <= Date.now();
};

// any request or socket that gets "your login is no longer valid" calls this
export const reportSessionExpired = () => window.dispatchEvent(new Event(SESSION_EXPIRED));
