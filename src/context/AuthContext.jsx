import { createContext, useEffect, useReducer } from "react";
import { toast } from "react-toastify";
import { SESSION_EXPIRED, isTokenExpired, tokenExpiry } from "@/utils/session";

// older versions saved the strings "null"/"undefined" on logout, treat those as empty
const readItem = key => {
  const value = localStorage.getItem(key);
  return value && value !== "null" && value !== "undefined" ? value : null;
};

const readUser = () => {
  try {
    return JSON.parse(readItem("user"));
  } catch {
    return null;
  }
};

// a login saved from an earlier visit that has expired in the meantime is not used at all
const savedToken = readItem("token");
const savedIsValid = savedToken && !isTokenExpired(savedToken);

const initialState = {
    user: savedIsValid ? readUser() : null,
    token: savedIsValid ? savedToken : null,
    role: savedIsValid ? readItem("role") : null,
};

export const authContext = createContext(initialState);

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return { user: null, role: null, token: null };
    case "LOGIN_SUCCESS":
      return {
        user: action.payload.user,
        role: action.payload.role,
        token: action.payload.token,
      };
    case "LOGOUT":
      return { user: null, role: null, token: null };
    default:
      return state;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  useEffect(() => {
    if (state.token) {
      localStorage.setItem("user", JSON.stringify(state.user));
      localStorage.setItem("token", state.token);
      localStorage.setItem("role", state.role);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    }
  }, [state]);
  // end the session the moment the token expires, or when the server says it's no longer valid;
  // protected pages then send the person to the login page (and back here after logging in)
  useEffect(() => {
    if (!state.token) return;
    const expire = () => {
      dispatch({ type: "LOGOUT" });
      toast.info("Your session has ended, please log in again", { toastId: "session-expired" });
    };
    window.addEventListener(SESSION_EXPIRED, expire);
    const expiry = tokenExpiry(state.token);
    // setTimeout can't wait longer than about 24 days
    const timer = expiry ? setTimeout(expire, Math.min(Math.max(0, expiry - Date.now()), 2 ** 31 - 1)) : null;
    return () => {
      window.removeEventListener(SESSION_EXPIRED, expire);
      clearTimeout(timer);
    };
  }, [state.token]);

  return (
    <authContext.Provider
      value={{
        user: state.user,
        token: state.token,
        role: state.role,
        dispatch,
      }}
    >
      {children}
    </authContext.Provider>
  );
};
