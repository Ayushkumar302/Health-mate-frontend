/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { SERVER_URL } from "@/config";
import { apiRequest } from "@/utils/api";
import { authContext } from "./AuthContext";
import { reportSessionExpired } from "@/utils/session";

// fired on window when a booking changes, so open dashboards load their bookings again
export const BOOKINGS_CHANGED = "medora:bookings-changed";

// reload some data whenever a booking changes elsewhere
export const useBookingsChanged = callback => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => {
    const listener = () => callbackRef.current();
    window.addEventListener(BOOKINGS_CHANGED, listener);
    return () => window.removeEventListener(BOOKINGS_CHANGED, listener);
  }, []);
};

// Keeps one live connection while someone is logged in: the unread badge in the header, new messages /
// read receipts / typing for the Messages page, and booking updates (request accepted, declined...).
const MessagesContext = createContext({ unread: 0, subscribe: () => () => {}, sendTyping: () => {}, refreshUnread: () => {} });

export const MessagesProvider = ({ children }) => {
  const { token, role } = useContext(authContext);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Set());
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);
  const navigate = useNavigate();
  const canMessage = Boolean(token) && (role === "patient" || role === "doctor");

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const refreshUnread = useCallback(() => {
    if (!canMessage) return;
    apiRequest("/messages/unread", { token })
      .then(result => setUnread(result.data.unread))
      .catch(() => {});
  }, [canMessage, token]);

  useEffect(() => {
    if (!canMessage) {
      setUnread(0);
      return;
    }
    const socket = io(SERVER_URL, { auth: { token } });
    socketRef.current = socket;
    const emit = (event, payload) => listenersRef.current.forEach(listener => listener(event, payload));

    socket.on("connect", refreshUnread);
    // the server refuses sockets with an expired login
    socket.on("connect_error", error => {
      if (error?.message === "unauthorized") reportSessionExpired();
    });
    socket.on("dm:new", payload => {
      emit("dm:new", payload);
      refreshUnread();
      // a message from the other person while not on the Messages page: show a small toast
      const fromOther = payload.message.senderRole !== role;
      if (fromOther && !pathnameRef.current.startsWith("/messages")) {
        toast.info(`${payload.senderName || "New message"}: ${payload.message.text.slice(0, 80)}`, {
          onClick: () => navigate(`/messages/${payload.conversationId}`),
        });
      }
    });
    socket.on("dm:read", payload => {
      emit("dm:read", payload);
      refreshUnread();
    });
    socket.on("dm:typing", payload => emit("dm:typing", payload));
    // booking requests: accepted, declined, new, cancelled
    socket.on("booking:updated", payload => {
      const show = payload.status === "cancelled" ? toast.warn : payload.status === "approved" ? toast.success : toast.info;
      show(payload.message);
      window.dispatchEvent(new CustomEvent(BOOKINGS_CHANGED, { detail: payload }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [canMessage, token, role, refreshUnread, navigate]);

  // the Messages page listens to live events through this
  const subscribe = useCallback(listener => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const sendTyping = useCallback(conversationId => socketRef.current?.emit("dm:typing", { conversationId }), []);

  return (
    <MessagesContext.Provider value={{ unread, subscribe, sendTyping, refreshUnread }}>
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = () => useContext(MessagesContext);
