// doctors' time off (leave days, holidays): "YYYY-MM-DD" ranges, both days included

export const todayString = () => new Date().toLocaleDateString("en-CA");

const dayLabel = date => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

// "Fri, 6 Nov" or "Fri, 6 Nov – Sat, 7 Nov"
export const leaveLabel = ({ from, to }) => (from === to ? dayLabel(from) : `${dayLabel(from)} – ${dayLabel(to)}`);

// leave that hasn't ended yet, soonest first
export const upcomingLeave = timeOff =>
  (timeOff || []).filter(entry => entry.to >= todayString()).sort((a, b) => a.from.localeCompare(b.from));
