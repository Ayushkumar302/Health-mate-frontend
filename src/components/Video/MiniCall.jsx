import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Mic, MicOff, PhoneOff, Undo2, Video, VideoOff } from "lucide-react";
import { useCall } from "@/context/CallContext";
import { useNow } from "@/utils/appointment";
import Avatar from "../ui/avatar";
import { ControlButton, StreamVideo, formatDuration, otherPersonOf } from "./callUi";

// floating mini player: the call keeps running while the user browses other pages of the site
function MiniCall() {
  const { call, status, peer, micOn, camOn, hasCamera, remoteMedia, connectedAt, remoteStream, unread, endingAt, endCall, toggleMic, toggleCam } = useCall();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const constraintsRef = useRef(null);
  const now = useNow(1000);

  const callPath = call ? `/consultation/${call.bookingId}` : null;
  const visible = Boolean(call) && pathname !== callPath && !["error", "replaced", "idle", "ended"].includes(status);
  const other = otherPersonOf(call, peer);
  const showVideo = status === "connected" && remoteMedia.camOn;
  const backToCall = () => navigate(callPath);

  return (
    // full-screen layer that only defines where the window may be dragged
    <div ref={constraintsRef} className="pointer-events-none fixed inset-4 z-[60]">
      <AnimatePresence>
        {visible && (
          <motion.div
            drag
            dragConstraints={constraintsRef}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            onTap={event => {
              // a tap on the video (not on a button, not a drag) opens the full call again
              if (!event.target.closest("button")) backToCall();
            }}
            className="group pointer-events-auto absolute bottom-0 right-0 aspect-video w-72 cursor-grab overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl active:cursor-grabbing sm:w-80"
          >
            <StreamVideo
              stream={remoteStream}
              className={`h-full w-full object-cover ${showVideo ? "opacity-100" : "opacity-0"}`}
            />
            {!showVideo && (
              <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-slate-900 to-slate-950 text-white">
                <div className="flex flex-col items-center gap-2">
                  <Avatar src={other.photo} name={other.name} className="h-14 w-14" />
                  <p className="text-xs text-white/70">
                    {status === "connected" ? "Camera is off" : status === "failed" ? "Connection failed" : "Waiting…"}
                  </p>
                </div>
              </div>
            )}

            {/* back to call + name + timer */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/60 to-transparent px-2 py-2 text-white">
              <button
                type="button"
                onClick={backToCall}
                className="flex min-w-0 items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur transition-colors hover:bg-white/25"
                title="Back to the call page"
              >
                <Undo2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Back to call · {other.name}</span>
              </button>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                <span className={`h-1.5 w-1.5 rounded-full ${status === "connected" ? "bg-success" : "animate-pulse bg-brand-amber"}`} />
                {endingAt ? (
                  <span className="text-red-300">ends {formatDuration(endingAt - now)}</span>
                ) : status === "connected" ? formatDuration(now - (connectedAt || now)) : "Live"}
              </span>
            </div>

            {/* controls appear on hover (always visible on touch screens) */}
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <ControlButton size="h-9 w-9" active={micOn} onClick={toggleMic} label={micOn ? "Mute" : "Unmute"}>
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </ControlButton>
              <ControlButton size="h-9 w-9" active={camOn} onClick={toggleCam} disabled={!hasCamera} label={camOn ? "Camera off" : "Camera on"}>
                {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </ControlButton>
              <ControlButton size="h-9 w-9" onClick={backToCall} label="Back to full call" badge={unread}>
                <Maximize2 className="h-4 w-4" />
              </ControlButton>
              <ControlButton size="h-9 w-9" danger onClick={endCall} label="Leave call">
                <PhoneOff className="h-4 w-4" />
              </ControlButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MiniCall;
