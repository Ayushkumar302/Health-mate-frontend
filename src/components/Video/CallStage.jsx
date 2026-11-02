import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, MessageSquare, TimerReset, Mic, MicOff, MonitorUp, PhoneOff, PictureInPicture2, RefreshCw, Video, VideoOff, WifiOff } from "lucide-react";
import { useCall } from "@/context/CallContext";
import { useNow } from "@/utils/appointment";
import Avatar from "../ui/avatar";
import { Button } from "../ui/button";
import CallChat from "./CallChat";
import { ControlButton, StreamVideo, formatDuration, otherPersonOf } from "./callUi";

// full-size call view on the consultation page (the same call continues as a mini player on other pages)
function CallStage({ onLeave }) {
  const {
    call, status, error, peer, micOn, camOn, hasCamera, sharing, remoteMedia, connectedAt,
    localStream, remoteStream, messages, chatLimits, chatOpen, unread, endingAt,
    endCall, extendCall, toggleMic, toggleCam, toggleScreenShare, sendMessage, setChatOpen,
  } = useCall();
  const remoteVideoRef = useRef(null);
  const now = useNow(1000);
  const other = otherPersonOf(call, peer);
  const [extending, setExtending] = useState(false);

  // doctor sees "Extend" once 15 minutes or less are left
  const msLeft = (call?.session?.closesAt || 0) - now;
  const canExtend = call?.role === "doctor" && ["connected", "waiting", "connecting"].includes(status) && msLeft > 0 && msLeft <= 15 * 60 * 1000;

  const handleExtend = async () => {
    setExtending(true);
    const result = await extendCall();
    setExtending(false);
    if (!result.ok) toast.error(result.message);
  };

  // chat panel only counts as "open" while this page is visible
  useEffect(() => () => setChatOpen(false), []); // eslint-disable-line react-hooks/exhaustive-deps

  const hangUp = () => {
    endCall();
    onLeave();
  };

  // browser picture-in-picture: keeps the other person visible even in another tab or app
  const popOut = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await remoteVideoRef.current?.requestPictureInPicture();
    } catch {
      // not supported or no video yet
    }
  };

  if (status === "ended") {
    return (
      <div className="card-surface mx-auto max-w-lg p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success/15 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-xl font-bold">Consultation ended</h2>
        <p className="mt-2 text-muted-foreground">
          The time for this appointment is over. {call?.role === "doctor" ? "Thank you for your care." : "We hope you feel better soon!"}
        </p>
        <Button className="mt-6" onClick={hangUp}>Back to dashboard</Button>
      </div>
    );
  }

  if (status === "error" || status === "replaced") {
    return (
      <div className="card-surface mx-auto max-w-lg p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <VideoOff className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-xl font-bold">{status === "replaced" ? "Call opened somewhere else" : "Can't join the call"}</h2>
        <p className="mt-2 text-muted-foreground">
          {status === "replaced" ? "You joined this consultation from another tab or window." : error}
        </p>
        <Button className="mt-6" onClick={hangUp}>Back to dashboard</Button>
      </div>
    );
  }

  const showRemoteVideo = status === "connected" && remoteMedia.camOn;
  const statusLabel = {
    idle: "Starting…",
    starting: "Starting camera…",
    waiting: `Waiting for ${other.name} to join…`,
    connecting: "Connecting…",
    connected: `Connected · ${formatDuration(now - (connectedAt || now))}`,
    failed: "Connection failed",
  }[status];

  return (
    <div className={`grid gap-4 ${chatOpen ? "lg:grid-cols-[1fr_360px]" : ""}`}>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-slate-950 shadow-panelShadow sm:aspect-video">
        {/* the other person */}
        <StreamVideo
          ref={remoteVideoRef}
          stream={remoteStream}
          className={`h-full w-full object-cover transition-opacity duration-500 ${showRemoteVideo ? "opacity-100" : "opacity-0"}`}
        />

        {/* waiting / camera-off screen */}
        {!showRemoteVideo && (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="flex flex-col items-center gap-5 px-6 text-center text-white">
              <div className="relative">
                {(status === "waiting" || status === "connecting") && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-highlight/30" />
                )}
                <Avatar src={other.photo} name={other.name} className="relative h-28 w-28 ring-4 ring-white/10" textClassName="text-3xl" />
              </div>
              <div>
                <p className="text-xl font-bold">{other.name}</p>
                <p className="mt-1 text-sm text-white/70">{status === "connected" ? "Camera is off" : statusLabel}</p>
              </div>
              {status === "failed" && (
                <div className="max-w-sm space-y-3">
                  <p className="flex items-center justify-center gap-2 text-sm text-white/80">
                    <WifiOff className="h-4 w-4" /> Your networks couldn&apos;t connect directly. Try the same Wi-Fi or a different network.
                  </p>
                  <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:text-white" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4" /> Try again
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* top bar */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent p-4 text-white">
          <span className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            <span className={`h-2 w-2 rounded-full ${status === "connected" ? "bg-success" : status === "failed" ? "bg-destructive" : "animate-pulse bg-brand-amber"}`} />
            {statusLabel}
          </span>
          <div className="flex items-center gap-2">
            {canExtend && (
              <button
                type="button"
                onClick={handleExtend}
                disabled={extending}
                className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow transition-transform hover:scale-105 disabled:opacity-60"
                title="Add 10 minutes if your next appointment allows it"
              >
                <TimerReset className="h-3.5 w-3.5" /> {extending ? "Extending…" : "Extend +10 min"}
              </button>
            )}
            {endingAt && (
              <span className="flex items-center gap-1.5 rounded-full bg-destructive/90 px-3 py-1.5 text-xs font-semibold text-white">
                Ends in {formatDuration(endingAt - now)}
              </span>
            )}
            {status === "connected" && !remoteMedia.micOn && (
              <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <MicOff className="h-3.5 w-3.5" /> {other.name} is muted
              </span>
            )}
            {document.pictureInPictureEnabled && status === "connected" && (
              <button
                type="button"
                onClick={popOut}
                className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-black/60"
                title="Keep the video on top of other tabs and apps"
              >
                <PictureInPicture2 className="h-3.5 w-3.5" /> Pop out
              </button>
            )}
          </div>
        </div>

        {/* you (picture-in-picture, draggable) */}
        <motion.div
          drag
          dragMomentum={false}
          className="absolute bottom-24 right-4 aspect-[3/4] w-28 cursor-grab overflow-hidden rounded-2xl border-2 border-white/20 bg-slate-800 shadow-2xl active:cursor-grabbing sm:aspect-video sm:w-56"
        >
          <StreamVideo
            stream={localStream}
            muted
            className={`h-full w-full object-cover ${sharing ? "" : "-scale-x-100"} ${camOn || sharing ? "" : "hidden"}`}
          />
          {!camOn && !sharing && (
            <div className="grid h-full place-items-center">
              <Avatar name="You" className="h-12 w-12" textClassName="text-sm" />
            </div>
          )}
          <span className="absolute bottom-1.5 left-2 text-[11px] font-semibold text-white drop-shadow">
            {sharing ? "Your screen" : "You"}
          </span>
        </motion.div>

        {/* controls */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center gap-2 rounded-full bg-black/40 p-2 backdrop-blur-xl sm:gap-3">
            <ControlButton active={micOn} onClick={toggleMic} label={micOn ? "Mute microphone" : "Unmute microphone"}>
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </ControlButton>
            <ControlButton active={camOn} onClick={toggleCam} disabled={!hasCamera} label={camOn ? "Turn camera off" : "Turn camera on"}>
              {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </ControlButton>
            <ControlButton
              active={!sharing}
              onClick={toggleScreenShare}
              disabled={!hasCamera || !navigator.mediaDevices?.getDisplayMedia}
              label={sharing ? "Stop sharing screen" : "Share screen"}
            >
              <MonitorUp className="h-5 w-5" />
            </ControlButton>
            <ControlButton
              active={!chatOpen}
              onClick={() => setChatOpen(!chatOpen)}
              label={chatOpen ? "Hide chat" : "Show chat"}
              badge={chatOpen ? 0 : unread}
            >
              <MessageSquare className="h-5 w-5" />
            </ControlButton>
            <ControlButton danger onClick={hangUp} label="Leave call">
              <PhoneOff className="h-5 w-5" />
            </ControlButton>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {chatOpen && (
          <CallChat
            messages={messages}
            role={call?.role}
            otherName={other.name}
            limits={chatLimits}
            onSend={sendMessage}
            onClose={() => setChatOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default CallStage;
