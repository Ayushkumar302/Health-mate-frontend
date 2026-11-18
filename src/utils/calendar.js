import { BASE_URL } from "@/config";
import { appointmentEnd, appointmentStart, isOnline } from "./appointment";

// "Add to calendar": a Google Calendar link and an .ics file (Apple Calendar, Outlook...) for an appointment.
// Appointment times are in India time (UTC+5:30, no daylight saving), turned into UTC here.

const IST_OFFSET_MINUTES = 330;

const utcStamp = (date, time) => {
  const [y, m, d] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hours, minutes) - IST_OFFSET_MINUTES * 60000);
};
const format = date => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const eventOf = booking => {
  const start = utcStamp(booking.appointmentDate, booking.appointmentTime);
  const length = (appointmentEnd(booking) - appointmentStart(booking)) || 30 * 60000;
  const doctor = booking.doctor?.name || "your doctor";
  const online = isOnline(booking);
  const site = window.location.origin;
  return {
    start,
    end: new Date(start.getTime() + length),
    title: `${online ? "Video consultation" : "Clinic visit"} with ${doctor}${booking.familyMember?.name ? ` (${booking.familyMember.name})` : ""}`,
    location: online ? `${site}/consultation/${booking._id}` : booking.doctor?.clinicAddress || "",
    description: online
      ? `Join from your Medora dashboard, the video room opens 10 minutes before: ${site}/users/profile/me`
      : `Booked on Medora. Manage it from your dashboard: ${site}/users/profile/me`,
  };
};

export const googleCalendarUrl = booking => {
  const event = eventOf(booking);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${format(event.start)}/${format(event.end)}`,
    details: event.description,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
};

const icsText = text => String(text).replace(/\\/g, "\\\\").replace(/[,;]/g, match => `\\${match}`).replace(/\n/g, "\\n");

export const downloadIcs = booking => {
  const event = eventOf(booking);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Medora//Appointments//EN",
    "BEGIN:VEVENT",
    `UID:${booking._id}@medora`,
    `DTSTAMP:${format(new Date())}`,
    `DTSTART:${format(event.start)}`,
    `DTEND:${format(event.end)}`,
    `SUMMARY:${icsText(event.title)}`,
    `DESCRIPTION:${icsText(event.description)}`,
    `LOCATION:${icsText(event.location)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(event.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: `medora-appointment-${booking.appointmentDate}.ics` });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

// a PDF from the API (receipts, statements): needs the login token, so it is fetched and saved from memory
export const downloadPdf = async (token, path, fileName) => {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const result = await res.json().catch(() => ({}));
    throw new Error(result.message || "Could not download the file");
  }
  const url = URL.createObjectURL(await res.blob());
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
