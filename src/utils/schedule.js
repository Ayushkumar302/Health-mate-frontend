// The doctor's weekly routine: shifts per day, each for clinic visits, video consultations or both.
// Slots are worked out the same way as on the server (utils/slots.js).

export const DAYS = [
  { id: "monday", label: "Monday", short: "Mon" },
  { id: "tuesday", label: "Tuesday", short: "Tue" },
  { id: "wednesday", label: "Wednesday", short: "Wed" },
  { id: "thursday", label: "Thursday", short: "Thu" },
  { id: "friday", label: "Friday", short: "Fri" },
  { id: "saturday", label: "Saturday", short: "Sat" },
  { id: "sunday", label: "Sunday", short: "Sun" },
];
export const WEEKDAYS = DAYS.slice(0, 5).map(day => day.id);

export const MODES = [
  { id: "both", label: "Clinic & video", short: "Clinic & video" },
  { id: "clinic", label: "Clinic visits only", short: "Clinic" },
  { id: "online", label: "Video & calls only", short: "Video" },
];
export const modeLabel = mode => MODES.find(item => item.id === (mode || "both"))?.short || "Clinic & video";

export const SLOT_LENGTHS = [15, 20, 30, 45, 60];
export const BREAKS = [0, 5, 10, 15];
export const MAX_SHIFTS_PER_DAY = 4;

const toMinutes = time => {
  const [hours, minutes] = String(time || "0:0").split(":").map(Number);
  return hours * 60 + minutes;
};
const toTime = minutes => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// start times of the appointments in one shift
export const slotsOfShift = (shift, duration = 30, buffer = 0) => {
  const times = [];
  const end = toMinutes(shift.EndingTime);
  for (let start = toMinutes(shift.startingTime); start + duration <= end; start += duration + buffer) times.push(toTime(start));
  return times;
};

// { monday: [shift, ...], ... } in time order
export const byDay = timeSlots =>
  Object.fromEntries(
    DAYS.map(day => [
      day.id,
      (timeSlots || []).filter(slot => slot.day?.toLowerCase() === day.id).sort((a, b) => String(a.startingTime).localeCompare(String(b.startingTime))),
    ])
  );

// the problem with a day's shifts, if any (start before end, no overlaps)
export const dayProblem = shifts => {
  const sorted = [...shifts].sort((a, b) => String(a.startingTime).localeCompare(String(b.startingTime)));
  if (sorted.some(shift => !shift.startingTime || !shift.EndingTime || shift.startingTime >= shift.EndingTime)) return "Each shift must end after it starts";
  if (sorted.some((shift, index) => index > 0 && shift.startingTime < sorted[index - 1].EndingTime)) return "Shifts overlap";
  return null;
};

// does the routine offer this kind of visit at all? (clinic, video, quick-call)
export const offersType = (timeSlots, type) =>
  !timeSlots?.length || timeSlots.some(slot => {
    const mode = slot.mode || "both";
    return mode === "both" || (type === "clinic" ? mode === "clinic" : mode === "online");
  });
