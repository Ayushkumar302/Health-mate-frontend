import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarClock, ClipboardList, Clock, FilePenLine, ShieldCheck, Video, VideoOff } from "lucide-react";
import PrescriptionEditor from "@/components/Prescription/PrescriptionEditor";
import PatientRecordModal from "@/components/Records/PatientRecordModal";
import CallStage from "@/components/Video/CallStage";
import CallTimeline from "@/components/Video/CallTimeline";
import { useCall } from "@/context/CallContext";
import { BASE_URL } from "@/config";
import { authContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import Aurora from "@/components/Home/Aurora";
import { useNow } from "@/utils/appointment";

const pad = value => String(value).padStart(2, "0");

const formatCountdown = ms => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
};

const tips = [
  "Find a quiet, well-lit place",
  "Keep your reports or prescriptions handy",
  "Allow camera and microphone when your browser asks",
];

// centered card used for the waiting / ended / error states
const StatusCard = ({ icon: Icon, title, children }) => (
  <section className="relative isolate grid min-h-[75vh] place-items-center overflow-hidden">
    <Aurora />
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-surface mx-auto max-w-lg p-8 text-center sm:p-10"
      >
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">{title}</h1>
        {children}
      </motion.div>
    </div>
  </section>
);

function VideoConsultation() {
  const { bookingId } = useParams();
  const { token, role } = useContext(authContext);
  const navigate = useNavigate();
  const now = useNow(1000);
  const { call, startCall } = useCall();
  // coming back from the mini player: the call is already running, no need to load it again
  const alreadyInCall = call?.bookingId === bookingId;
  // "loading" | "waiting" | "ready" | "ended" | "error"
  const [state, setState] = useState(alreadyInCall ? "ready" : "loading");
  const [session, setSession] = useState(alreadyInCall ? call.session : null);
  const [message, setMessage] = useState("");
  // doctor tools during the call
  const [rxOpen, setRxOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);

  const dashboardPath = role === "doctor" ? "/doctors/profile/me" : "/users/profile/me";

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/bookings/${bookingId}/video`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok) {
        setSession(result.data);
        setState("ready");
      } else if (result.code === "TOO_EARLY") {
        setSession(result.data);
        setState("waiting");
      } else if (result.code === "ENDED") {
        setState("ended");
      } else {
        setMessage(result.message);
        setState("error");
      }
    } catch {
      setMessage("Could not reach the server. Please check your connection.");
      setState("error");
    }
  }, [bookingId, token]);

  useEffect(() => {
    if (!alreadyInCall) loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadSession]);

  // start (or keep) the call; it lives in CallContext so it survives navigating to other pages
  useEffect(() => {
    if (state === "ready" && session) startCall({ bookingId, session, token, role });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, session, bookingId]);

  // when the countdown reaches zero, ask again for the room
  useEffect(() => {
    if (state === "waiting" && session?.opensAt && now.getTime() >= session.opensAt) {
      setState("loading");
      loadSession();
    }
  }, [state, session, now, loadSession]);

  if (state === "loading") {
    return (
      <StatusCard icon={Video} title="Preparing your consultation…">
        <div className="mt-6 flex justify-center"><Spinner className="h-8 w-8 border-[3px]" /></div>
      </StatusCard>
    );
  }

  if (state === "waiting") {
    return (
      <StatusCard icon={Clock} title="Your call hasn't opened yet">
        <p className="mt-3 text-muted-foreground">
          You can join {Math.round((session.startsAt - session.opensAt) / 60000)} minutes before your appointment. This page will open the call automatically.
        </p>
        <p className="mt-6 font-mono text-5xl font-bold tracking-tight text-primary">
          {formatCountdown(session.opensAt - now.getTime())}
        </p>
        <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
          Appointment at {new Date(session.startsAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        <div className="mt-8 text-left">
          <CallTimeline times={session} extendedMinutes={session.extendedMinutes} />
        </div>
        <ul className="mt-4 space-y-2 rounded-2xl bg-muted/60 p-5 text-left text-sm">
          {tips.map(tip => (
            <li key={tip} className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-highlight" /> {tip}</li>
          ))}
        </ul>
        <Link to={dashboardPath}><Button variant="outline" className="mt-6">Back to dashboard</Button></Link>
      </StatusCard>
    );
  }

  if (state === "ended" || state === "error") {
    return (
      <StatusCard icon={VideoOff} title={state === "ended" ? "This consultation has ended" : "Can't start the call"}>
        <p className="mt-3 text-muted-foreground">
          {state === "ended" ? "The video room for this appointment is closed. You can book a follow-up anytime." : message}
        </p>
        <Link to={dashboardPath}><Button className="mt-8">Back to dashboard</Button></Link>
      </StatusCard>
    );
  }

  const otherPerson = role === "doctor" ? session.patientName : session.doctorName;

  return (
    <section className="py-6">
      <div className="container">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to={dashboardPath}
              className="grid h-10 w-10 place-items-center rounded-full border border-border hover:border-primary/50 hover:text-primary"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-bold">Consultation with {otherPerson}</h1>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                {new Date(session.startsAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                {" · "}open until {new Date(session.closesAt).toLocaleTimeString("en-IN", { timeStyle: "short" })}
              </p>
            </div>
          </div>
          <div className="hidden text-right text-xs text-muted-foreground sm:block">
            <p className="flex items-center justify-end gap-1.5">
              <ShieldCheck className="h-4 w-4 text-highlight" /> Private peer-to-peer call, video goes directly between you
            </p>
            <p className="mt-1">Browse other pages anytime, the call keeps going in a mini player.</p>
          </div>
        </div>

        <CallStage onLeave={() => navigate(dashboardPath)} />

        {/* the doctor can check the record and write the prescription while talking */}
        {role === "doctor" && session.patientId && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <p className="flex-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Doctor tools.</span> The patient sees the prescription in their dashboard as soon as you save it.
            </p>
            <Button variant="outline" size="sm" onClick={() => setRecordOpen(true)}><ClipboardList className="h-4 w-4" /> Health record</Button>
            <Button size="sm" onClick={() => setRxOpen(true)}><FilePenLine className="h-4 w-4" /> Write prescription</Button>
          </div>
        )}

        {/* live times: updates when the doctor extends the call */}
        <div className="mt-4">
          <CallTimeline times={call?.session || session} extendedMinutes={(call?.session || session).extendedMinutes} />
        </div>
      </div>

      {role === "doctor" && session.patientId && (
        <>
          <PrescriptionEditor
            open={rxOpen}
            onClose={() => setRxOpen(false)}
            booking={{ _id: bookingId, appointmentDate: session.appointmentDate, user: { _id: session.patientId, name: session.patientName } }}
          />
          <PatientRecordModal open={recordOpen} onClose={() => setRecordOpen(false)} patientId={session.patientId} patientName={session.patientName} />
        </>
      )}
    </section>
  );
}

export default VideoConsultation;
