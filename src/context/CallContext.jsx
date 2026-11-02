/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { SERVER_URL } from "@/config";
import { apiRequest } from "@/utils/api";
import { authContext } from "./AuthContext";

// The active video call lives here, above the router, so it keeps running while the user
// browses other pages (the call then shows as a floating mini player, see MiniCall).
// Media goes directly between the two browsers (WebRTC); the backend only relays connection
// details and chat messages over Socket.io.

// free public STUN servers let the two browsers discover how to reach each other; the server adds a
// TURN relay (when one is set up) for networks that block direct connections
const STUN_SERVERS = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const { token: authToken } = useContext(authContext);

  // { bookingId, session, role } while a call is active
  const [call, setCall] = useState(null);
  // "idle" | "starting" | "waiting" | "connecting" | "connected" | "failed" | "error" | "replaced" | "ended"
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [peer, setPeer] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [hasCamera, setHasCamera] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [remoteMedia, setRemoteMedia] = useState({ micOn: true, camOn: true });
  const [connectedAt, setConnectedAt] = useState(null);
  const [localStream, setLocalStream] = useState(null); // shown in the self view (camera or shared screen)
  const [remoteStream, setRemoteStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLimits, setChatLimits] = useState(null);
  const [chatOpen, setChatOpenState] = useState(false);
  const [unread, setUnread] = useState(0);
  const [endingAt, setEndingAt] = useState(null); // set 5 minutes before the call window closes

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const iceServersRef = useRef(STUN_SERVERS);
  const cameraStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const mediaStateRef = useRef({ micOn: true, camOn: true });
  const activeIdRef = useRef(null); // booking of the running call, used to ignore late async results
  const roleRef = useRef(null);
  const chatOpenRef = useRef(false);
  const endTimerRef = useRef(null); // backup timer in case the server's "call-ended" never arrives

  const sendMediaState = () => socketRef.current?.emit("media-state", mediaStateRef.current);
  const videoSender = () => pcRef.current?.getSenders().find(sender => sender.track?.kind === "video");

  // the relay details for this login, fetched once (calls fall back to STUN only)
  useEffect(() => {
    if (!authToken) return;
    apiRequest("/ice-servers", { token: authToken })
      .then(result => {
        if (Array.isArray(result.data) && result.data.length) iceServersRef.current = result.data;
      })
      .catch(() => {});
  }, [authToken]);

  const closePeer = () => {
    pcRef.current?.close();
    pcRef.current = null;
    pendingCandidatesRef.current = [];
    setRemoteStream(null);
  };

  const createPeer = () => {
    closePeer();
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    const stream = cameraStreamRef.current;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    // already sharing the screen: send that instead of the camera
    if (screenTrackRef.current) {
      pc.getSenders().find(sender => sender.track?.kind === "video")?.replaceTrack(screenTrackRef.current);
    }
    pc.ontrack = event => setRemoteStream(event.streams[0]);
    pc.onicecandidate = event => {
      if (event.candidate) socketRef.current?.emit("signal", { candidate: event.candidate });
    };
    pc.onconnectionstatechange = () => {
      if (pcRef.current !== pc) return;
      if (pc.connectionState === "connected") {
        setStatus("connected");
        setConnectedAt(time => time || Date.now());
      } else if (pc.connectionState === "failed") {
        setStatus("failed");
      }
    };
    pcRef.current = pc;
    return pc;
  };

  const flushCandidates = async () => {
    for (const candidate of pendingCandidatesRef.current) {
      await pcRef.current?.addIceCandidate(candidate).catch(() => {});
    }
    pendingCandidatesRef.current = [];
  };

  // the person who was already waiting starts the connection
  const callPeer = async () => {
    const pc = createPeer();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit("signal", { description: pc.localDescription });
  };

  const handleSignal = async ({ description, candidate }) => {
    try {
      if (description?.type === "offer") {
        const pc = createPeer();
        await pc.setRemoteDescription(description);
        await flushCandidates();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current?.emit("signal", { description: pc.localDescription });
        sendMediaState();
      } else if (description?.type === "answer" && pcRef.current) {
        await pcRef.current.setRemoteDescription(description);
        await flushCandidates();
      } else if (candidate) {
        // candidates can arrive before the offer/answer is applied, keep them until then
        if (pcRef.current?.remoteDescription) await pcRef.current.addIceCandidate(candidate).catch(() => {});
        else pendingCandidatesRef.current.push(candidate);
      }
    } catch {
      // a bad or late signal is skipped; the connection retries on its own
    }
  };

  // stop camera, connection and socket
  const cleanup = () => {
    clearTimeout(endTimerRef.current);
    endTimerRef.current = null;
    socketRef.current?.emit("leave-call");
    socketRef.current?.disconnect();
    socketRef.current = null;
    closePeer();
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    cameraStreamRef.current = null;
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    activeIdRef.current = null;
  };

  const resetState = () => {
    setStatus("idle");
    setError("");
    setPeer(null);
    setMicOn(true);
    setCamOn(true);
    setHasCamera(true);
    setSharing(false);
    setRemoteMedia({ micOn: true, camOn: true });
    setConnectedAt(null);
    setLocalStream(null);
    setMessages([]);
    setChatLimits(null);
    setUnread(0);
    setEndingAt(null);
    mediaStateRef.current = { micOn: true, camOn: true };
  };

  const endCall = () => {
    cleanup();
    resetState();
    setCall(null);
  };

  const startCall = async ({ bookingId, session, token, role }) => {
    if (activeIdRef.current === bookingId) return; // already running (e.g. coming back from the mini player)
    if (activeIdRef.current) cleanup(); // switching to a different consultation
    activeIdRef.current = bookingId;
    roleRef.current = role;
    resetState();
    setCall({ bookingId, session, role });
    setStatus("starting");
    const isCurrent = () => activeIdRef.current === bookingId;

    // the appointment's time is up: hang up on this side (the server does the same for both sides)
    const endByTime = () => {
      if (!isCurrent()) return;
      cleanup();
      setStatus("ended");
      toast.info("Your consultation time is over, the call has ended.");
    };
    endTimerRef.current = setTimeout(endByTime, Math.max(0, session.closesAt - Date.now()));

    // 1. camera + microphone (audio only if there is no camera)
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasCamera(false);
        setCamOn(false);
        mediaStateRef.current.camOn = false;
      } catch {
        if (isCurrent()) {
          setError("Please allow camera and microphone access in your browser, then try again.");
          setStatus("error");
        }
        return;
      }
    }
    if (!isCurrent()) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    cameraStreamRef.current = stream;
    setLocalStream(stream);

    // 2. signaling connection
    const socket = io(SERVER_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-call", { bookingId }, res => {
        if (!isCurrent()) return;
        if (!res?.ok) {
          setError(res?.message || "Could not join the call");
          setStatus("error");
          return;
        }
        setMessages(res.messages || []);
        setChatLimits(res.chatLimits || null);
        if (res.peer) {
          setPeer(res.peer);
          setStatus("connecting"); // the other person will send an offer
        } else {
          setStatus("waiting");
        }
      });
    });
    socket.on("connect_error", () => {
      if (!isCurrent()) return;
      setError("Could not reach the call server. Please check that the backend is running.");
      setStatus("error");
    });
    socket.on("peer-joined", async joined => {
      setPeer(joined);
      setStatus("connecting");
      await callPeer();
      sendMediaState();
    });
    socket.on("signal", handleSignal);
    socket.on("media-state", setRemoteMedia);
    socket.on("peer-left", () => {
      closePeer();
      setRemoteMedia({ micOn: true, camOn: true });
      setStatus("waiting");
    });
    socket.on("replaced", () => {
      cleanup();
      setStatus("replaced");
    });
    socket.on("call-ending-soon", ({ closesAt }) => {
      if (!isCurrent()) return;
      setEndingAt(closesAt);
      const minutes = Math.max(1, Math.round((closesAt - Date.now()) / 60000));
      toast.warning(`This consultation ends in ${minutes} minute${minutes > 1 ? "s" : ""}.`, { autoClose: 6000 });
    });
    socket.on("call-ended", endByTime);
    socket.on("call-extended", ({ endsAt, closesAt, extendedMinutes, addedMinutes, by }) => {
      if (!isCurrent()) return;
      // new end time for the timeline, countdown and backup timer
      setCall(current => current && { ...current, session: { ...current.session, endsAt, closesAt, extendedMinutes } });
      setEndingAt(closesAt - Date.now() <= 5 * 60 * 1000 ? closesAt : null);
      clearTimeout(endTimerRef.current);
      endTimerRef.current = setTimeout(endByTime, Math.max(0, closesAt - Date.now()));
      toast.success(
        roleRef.current === "doctor"
          ? `Consultation extended by ${addedMinutes} minutes.`
          : `${by} extended the consultation by ${addedMinutes} minutes.`
      );
    });
    socket.on("chat-message", message => {
      setMessages(previous => [...previous, message]);
      if (!chatOpenRef.current && message.senderRole !== roleRef.current) setUnread(count => count + 1);
    });
  };

  const toggleMic = () => {
    const track = cameraStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
    mediaStateRef.current.micOn = track.enabled;
    sendMediaState();
  };

  const toggleCam = () => {
    const track = cameraStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
    mediaStateRef.current.camOn = track.enabled || Boolean(screenTrackRef.current);
    sendMediaState();
  };

  const stopSharing = () => {
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    const cameraTrack = cameraStreamRef.current?.getVideoTracks()[0];
    if (cameraTrack) videoSender()?.replaceTrack(cameraTrack);
    setLocalStream(cameraStreamRef.current);
    setSharing(false);
    mediaStateRef.current.camOn = Boolean(cameraTrack?.enabled);
    sendMediaState();
  };

  const toggleScreenShare = async () => {
    if (screenTrackRef.current) return stopSharing();
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = display.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;
      videoSender()?.replaceTrack(screenTrack);
      setLocalStream(display);
      screenTrack.onended = stopSharing; // user pressed the browser's "Stop sharing"
      setSharing(true);
      mediaStateRef.current.camOn = true;
      sendMediaState();
    } catch {
      // user closed the screen picker
    }
  };

  // doctor only: add 10 minutes (the server checks the doctor's next appointment)
  const extendCall = () =>
    new Promise(resolve => {
      const socket = socketRef.current;
      if (!socket?.connected) return resolve({ ok: false, message: "Not connected to the call" });
      socket.timeout(8000).emit("extend-call", {}, (err, res) =>
        resolve(err ? { ok: false, message: "No answer from the server, please try again" } : res)
      );
    });

  // resolves with the server's answer, so the chat box can show limit errors
  const sendMessage = text =>
    new Promise(resolve => {
      const socket = socketRef.current;
      if (!socket?.connected) return resolve({ ok: false, message: "Not connected to the call" });
      socket.timeout(5000).emit("chat-message", { text }, (err, res) =>
        resolve(err ? { ok: false, message: "No answer from the server, please try again" } : res)
      );
    });

  const setChatOpen = open => {
    chatOpenRef.current = open;
    setChatOpenState(open);
    if (open) setUnread(0);
  };

  // logging out ends the call
  useEffect(() => {
    if (!authToken && activeIdRef.current) endCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  // closing the app stops the camera
  useEffect(() => () => cleanup(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CallContext.Provider
      value={{
        call,
        status,
        error,
        peer,
        micOn,
        camOn,
        hasCamera,
        sharing,
        remoteMedia,
        connectedAt,
        localStream,
        remoteStream,
        messages,
        chatLimits,
        chatOpen,
        unread,
        endingAt,
        startCall,
        endCall,
        extendCall,
        toggleMic,
        toggleCam,
        toggleScreenShare,
        sendMessage,
        setChatOpen,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
