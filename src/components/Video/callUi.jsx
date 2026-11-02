/* eslint-disable react-refresh/only-export-components */
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export const formatDuration = ms => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

// the person on the other side, known from the booking even before they join
export const otherPersonOf = (call, peer) =>
  peer ||
  (call?.role === "doctor"
    ? { name: call?.session?.patientName, photo: call?.session?.patientPhoto }
    : { name: call?.session?.doctorName, photo: call?.session?.doctorPhoto });

// <video> that plays a MediaStream (the call keeps the streams, views only display them)
export const StreamVideo = forwardRef(({ stream, muted = false, className = "" }, ref) => {
  const videoRef = useRef(null);
  useImperativeHandle(ref, () => videoRef.current);

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream || null;
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline muted={muted} className={className} />;
});
StreamVideo.displayName = "StreamVideo";

// round button used in the call toolbars
export const ControlButton = ({ active = true, danger, onClick, label, children, disabled, size = "h-12 w-12", badge }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={`relative grid ${size} place-items-center rounded-full transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
      danger
        ? "bg-destructive text-white hover:bg-destructive/90"
        : active
        ? "bg-white/15 text-white hover:bg-white/25"
        : "bg-white text-slate-900"
    }`}
  >
    {children}
    {badge > 0 && (
      <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-highlight px-1 text-[10px] font-bold text-white">
        {badge > 9 ? "9+" : badge}
      </span>
    )}
  </button>
);
