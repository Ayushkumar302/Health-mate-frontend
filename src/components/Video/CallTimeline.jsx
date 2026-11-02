import { formatClock, formatSpan, useNow } from "@/utils/appointment";

// timeline of the call window with a live "now" marker
// times: { opensAt, startsAt, endsAt, closesAt } in epoch ms
function CallTimeline({ times, extendedMinutes = 0 }) {
  const now = useNow(1000).getTime();
  const { opensAt, startsAt, endsAt, closesAt } = times;
  const total = closesAt - opensAt;
  const percent = value => `${Math.min(100, Math.max(0, ((value - opensAt) / total) * 100))}%`;

  const phase =
    now < opensAt ? `Opens in ${formatSpan(opensAt - now)}`
      : now < startsAt ? `Appointment starts in ${formatSpan(startsAt - now)}`
      : now < endsAt ? `Appointment time · ${formatSpan(endsAt - now)} left`
      : now < closesAt ? `Extra time · call closes in ${formatSpan(closesAt - now)}`
      : "Call closed";

  const points = [
    { at: opensAt, label: "Join opens" },
    { at: startsAt, label: "Starts" },
    { at: endsAt, label: extendedMinutes ? `Ends (+${extendedMinutes} min)` : "Ends" },
    { at: closesAt, label: "Call closes" },
  ];

  return (
    <div className="card-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-semibold">Consultation timeline</p>
        <p className="font-medium text-primary">{phase}</p>
      </div>

      <div className="relative mt-5 h-2 rounded-full bg-muted">
        {/* appointment part of the window */}
        <div
          className="absolute inset-y-0 rounded-full bg-primary/30"
          style={{ left: percent(startsAt), width: `calc(${percent(endsAt)} - ${percent(startsAt)})` }}
        />
        {/* elapsed part */}
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-1000" style={{ width: percent(now) }} />
        {/* now marker */}
        {now >= opensAt && now <= closesAt && (
          <span
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow"
            style={{ left: percent(now) }}
          />
        )}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        {points.map(point => (
          <div key={point.label} className={now >= point.at ? "text-foreground" : "text-muted-foreground"}>
            <p className="text-[11px] font-medium uppercase tracking-wider">{point.label}</p>
            <p className="text-sm font-semibold">{formatClock(point.at)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CallTimeline;
