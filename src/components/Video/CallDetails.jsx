import { Hospital, MapPin, PhoneCall, Video } from "lucide-react";
import {
  JOIN_EARLY_MINUTES,
  appointmentEnd,
  appointmentStart,
  describeCallWindow,
  formatClock,
  isOnline,
  isRequest,
  typeOf,
  videoWindow,
} from "@/utils/appointment";

const stateStyles = {
  opens: "bg-primary/10 text-primary",
  open: "bg-success/15 text-success",
  closed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  none: "bg-muted text-muted-foreground",
  waiting: "bg-brand-amber/15 text-brand-amber",
};

const StatusPill = ({ state, text }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${stateStyles[state]}`}>
    <span className={`h-1.5 w-1.5 rounded-full bg-current ${state === "open" || state === "waiting" ? "animate-pulse" : ""}`} />
    {text}
  </span>
);

const DetailGrid = ({ items }) => (
  <dl className="mt-3 grid grid-cols-3 gap-3">
    {items.map(item => (
      <div key={item.label} className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{item.label}</dt>
        <dd className="mt-0.5 truncate text-sm font-semibold" title={item.value}>{item.value}</dd>
        <dd className="text-[11px] text-muted-foreground">{item.note}</dd>
      </div>
    ))}
  </dl>
);

// in-person visit: when and where
function ClinicDetails({ booking, compact }) {
  const start = appointmentStart(booking);
  const end = appointmentEnd(booking);
  const address = typeof booking.doctor === "object" ? booking.doctor?.clinicAddress : null;
  const pill = isRequest(booking)
    ? <StatusPill state="waiting" text="Waiting for the doctor to confirm" />
    : <StatusPill state="opens" text="Confirmed, see you at the clinic" />;

  if (compact) {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>{formatClock(start)}–{formatClock(end)} · at the clinic{address ? ` · ${address}` : ""}</span>
      </div>
    );
  }
  return (
    <div className="mt-3 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold"><Hospital className="h-4 w-4 text-brand-violet" /> Clinic visit</p>
        {pill}
      </div>
      <DetailGrid
        items={[
          { label: "Appointment", value: `${formatClock(start)} – ${formatClock(end)}`, note: `${booking.slotDuration || 30} min` },
          { label: "Arrive by", value: formatClock(new Date(start.getTime() - 10 * 60000)), note: "10 min early for check-in" },
          { label: "Where", value: address || "Doctor's clinic", note: address ? "bring your reports" : "" },
        ]}
      />
      {address && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <MapPin className="h-3.5 w-3.5" /> Open in Maps
        </a>
      )}
    </div>
  );
}

// times for one booking: video room for online consultations, place and time for clinic visits
function CallDetails({ booking, now, compact = false }) {
  const call = describeCallWindow(booking, now);
  const start = appointmentStart(booking);
  if (!start || call.state === "cancelled") return null;
  if (!isOnline(booking)) return <ClinicDetails booking={booking} compact={compact} />;

  const end = appointmentEnd(booking);
  const window = videoWindow(booking);
  const minutes = (booking.slotDuration || 30) + (booking.extendedMinutes || 0);
  const quick = typeOf(booking) === "quick-call";

  // one line for tables and small lists
  if (compact) {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>
          {formatClock(start)}–{formatClock(end)} · join from {formatClock(window.opensAt)} · closes {formatClock(window.closesAt)}
        </span>
        {/* a request already has its status badge next to it */}
        {call.state !== "waiting" && <StatusPill state={call.state} text={call.text} />}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          {quick ? <PhoneCall className="h-4 w-4 text-highlight" /> : <Video className="h-4 w-4 text-primary" />}
          {quick ? "Quick call: do you need a visit?" : "Video consultation"}
        </p>
        <StatusPill state={call.state} text={call.text} />
      </div>
      <DetailGrid
        items={[
          {
            label: "Appointment",
            value: `${formatClock(start)} – ${formatClock(end)}`,
            note: `${minutes} min${booking.extendedMinutes ? ` (incl. +${booking.extendedMinutes} extended)` : ""}`,
          },
          { label: "Join from", value: formatClock(window.opensAt), note: `${JOIN_EARLY_MINUTES} min early, once confirmed` },
          { label: "Call closes", value: formatClock(window.closesAt), note: "ends for both sides" },
        ]}
      />
    </div>
  );
}

export default CallDetails;
