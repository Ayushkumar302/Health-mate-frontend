import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, CalendarPlus, CheckCircle2, Circle, FolderOpen, HeartPulse, Rocket, X } from "lucide-react";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";

const storageKey = id => `medora-getting-started-hidden:${id}`;
const isHidden = id => {
  try {
    return localStorage.getItem(storageKey(id)) === "1";
  } catch {
    return false;
  }
};

// a short checklist for new patients: a few steps that make the first visit go well.
// It disappears once everything is done, or when the patient hides it.
const GettingStarted = ({ user, bookings, onOpen }) => {
  const { token } = useContext(authContext);
  const [documents, setDocuments] = useState(null);
  const [hidden, setHidden] = useState(() => isHidden(user._id));

  useEffect(() => {
    if (hidden) return;
    apiRequest("/documents/mine", { token })
      .then(result => setDocuments(result.data || []))
      .catch(() => setDocuments([]));
  }, [token, hidden]);

  if (hidden || documents === null) return null;

  const steps = [
    {
      id: "health",
      icon: HeartPulse,
      title: "Add your health details",
      text: "Blood type, allergies and conditions, so every doctor sees them",
      done: Boolean(user.bloodType || user.dateOfBirth || user.allergies?.length),
      action: () => onOpen("health"),
    },
    {
      id: "report",
      icon: FolderOpen,
      title: "Upload a lab report or scan",
      text: "Doctors you book can read it, and the AI can explain it in plain words",
      done: documents.length > 0,
      action: () => onOpen("health"),
    },
    {
      id: "photo",
      icon: Camera,
      title: "Add a profile photo",
      text: "Helps your doctor recognise you on a video call",
      done: Boolean(user.photo),
      action: () => onOpen("settings"),
    },
    {
      id: "visit",
      icon: CalendarPlus,
      title: "Book your first visit",
      text: "Verified doctors, clinic or video, from a few minutes' time",
      done: bookings.length > 0,
      to: "/doctors",
    },
  ];
  const done = steps.filter(step => step.done).length;
  if (done === steps.length) return null;

  const hide = () => {
    try {
      localStorage.setItem(storageKey(user._id), "1");
    } catch {
      // private window: hidden for this visit only
    }
    setHidden(true);
  };

  return (
    <section aria-labelledby="getting-started" className="rounded-2xl border border-primary/25 bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Rocket className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 id="getting-started" className="font-bold">Get set up</h2>
          <p className="text-sm text-muted-foreground">{done} of {steps.length} done</p>
        </div>
        <button type="button" onClick={hide} aria-label="Hide the setup checklist" title="Hide" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map(step => {
          const Icon = step.icon;
          const body = (
            <>
              {step.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" /> : <Circle className="h-5 w-5 shrink-0 text-muted-foreground/50" />}
              <span className="min-w-0 flex-1">
                <span className={`flex items-center gap-1.5 text-sm font-semibold ${step.done ? "text-muted-foreground line-through" : ""}`}>
                  <Icon className="h-4 w-4 shrink-0 text-primary" /> {step.title}
                </span>
                {!step.done && <span className="mt-0.5 block text-xs text-muted-foreground">{step.text}</span>}
              </span>
            </>
          );
          const className = "flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors";
          if (step.done) return <li key={step.id} className={`${className} bg-muted/40`}>{body}</li>;
          return (
            <li key={step.id}>
              {step.to ? (
                <Link to={step.to} className={`${className} hover:border-primary/50 hover:bg-primary/5`}>{body}</Link>
              ) : (
                <button type="button" onClick={step.action} className={`${className} hover:border-primary/50 hover:bg-primary/5`}>{body}</button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default GettingStarted;
