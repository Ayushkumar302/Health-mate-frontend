import { useEffect, useState } from "react";
import { formatDate } from "./formatDate";
import ConvertTime from "./convertTime";

// patients can cancel (with refund) only up to this long before the appointment, same rule as the backend
export const CANCEL_CUTOFF_HOURS = 2;
// video call window, same as the backend: opens 10 min early, closes 15 min after the slot ends
export const JOIN_EARLY_MINUTES = 10;
export const JOIN_GRACE_MINUTES = 15;

const MINUTE = 60 * 1000;

// the three ways to see a doctor; only the online ones get a video room
export const CONSULTATION_TYPES = {
  clinic: { label: "Clinic visit", short: "Clinic" },
  video: { label: "Video consultation", short: "Video" },
  "quick-call": { label: "Quick call", short: "Quick call" },
};
export const QUICK_CALL_MINUTES = 10;
export const typeOf = booking => booking.consultationType || "video";
export const isOnline = booking => typeOf(booking) !== "clinic";
// paid, waiting for the doctor to accept
export const isRequest = booking => booking.status === "pending";
// same rule as the backend when the doctor hasn't set a quick-call fee
export const quickCallFeeOf = doctor => doctor.quickCallFee || Math.max(100, Math.round((Number(doctor.ticketPrice) * 0.4) / 10) * 10);

// start of the appointment as a Date, null for old bookings without a slot
export const appointmentStart = booking =>
  booking.appointmentDate && booking.appointmentTime
    ? new Date(`${booking.appointmentDate}T${booking.appointmentTime}:00`)
    : null;

// includes any extra time the doctor added during the call
export const appointmentEnd = booking => {
  const start = appointmentStart(booking);
  return start ? new Date(start.getTime() + ((booking.slotDuration || 30) + (booking.extendedMinutes || 0)) * MINUTE) : null;
};

// "requested" | "upcoming" | "ongoing" | "completed" | "cancelled"
export const getAppointmentStatus = (booking, now = new Date()) => {
  if (booking.status === "cancelled") return "cancelled";
  if (isRequest(booking)) return "requested";
  const start = appointmentStart(booking);
  if (!start) return "upcoming";
  if (now < start) return "upcoming";
  if (now <= appointmentEnd(booking)) return "ongoing";
  return "completed";
};

export const hoursUntil = booking => {
  const start = appointmentStart(booking);
  return start ? (start - new Date()) / 3600000 : Infinity;
};

// when the video call can be joined
export const videoWindow = booking => {
  const start = appointmentStart(booking);
  if (!start) return null;
  return {
    opensAt: new Date(start.getTime() - JOIN_EARLY_MINUTES * MINUTE),
    closesAt: new Date(appointmentEnd(booking).getTime() + JOIN_GRACE_MINUTES * MINUTE),
  };
};

// only confirmed online consultations have a video room
export const canJoinVideo = (booking, now = new Date()) => {
  if (booking.status !== "approved" || !isOnline(booking)) return false;
  const window = videoWindow(booking);
  return Boolean(window && now >= window.opensAt && now <= window.closesAt);
};

export const formatAppointment = booking =>
  booking.appointmentDate && booking.appointmentTime
    ? `${formatDate(`${booking.appointmentDate}T00:00:00`)} at ${ConvertTime(booking.appointmentTime)}`
    : "No time selected";

export const statusLabels = {
  requested: "Request pending",
  upcoming: "Confirmed",
  ongoing: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const statusStyles = {
  requested: "bg-brand-amber/15 text-brand-amber",
  upcoming: "bg-primary/10 text-primary",
  ongoing: "bg-highlight/15 text-highlight",
  completed: "bg-success/15 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

// re-renders the component every `interval` ms so time-based buttons (Join call) appear on their own
export const useNow = (interval = 30000) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(timer);
  }, [interval]);
  return now;
};

// "1:00 pm"
export const formatClock = date => new Date(date).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

// "23 min", "1 h 5 min", "2 days 3 h"
export const formatSpan = ms => {
  const minutes = Math.max(1, Math.ceil(ms / MINUTE));
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ""}`;
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  return `${days} day${days > 1 ? "s" : ""}${hours ? ` ${hours} h` : ""}`;
};

// state of the video call for a booking, with a short sentence for the UI
// "opens" (not open yet) | "open" | "closed" | "cancelled" | "none" (no time chosen)
export const describeCallWindow = (booking, now = new Date()) => {
  if (booking.status === "cancelled") return { state: "cancelled", text: "Cancelled" };
  if (isRequest(booking)) return { state: "waiting", text: "Waiting for the doctor to confirm" };
  const window = videoWindow(booking);
  if (!window) return { state: "none", text: "Choose a time to get a video call" };
  if (now < window.opensAt) return { state: "opens", text: `Opens in ${formatSpan(window.opensAt - now)}` };
  if (now <= window.closesAt) return { state: "open", text: `Open now · closes in ${formatSpan(window.closesAt - now)}` };
  return { state: "closed", text: "Call closed" };
};
