import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle, AlertTriangle, CalendarClock, CalendarDays, CalendarRange, CheckCircle2, Circle, ClipboardList, Clock3, ExternalLink,
  FileCheck2, FileText, Inbox, IndianRupee, ListChecks, MessageSquare, MessageSquareQuote, Search, Star, Users, Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Error from "@/components/Error/Error";
import useFetchData from "../../hooks/useFetchData";
import { BASE_URL } from "@/config";
import Tabs from "./Tabs";
import Profile from "./Profile";
import TimeOff from "./TimeOff";
import Appointments, { IconAction, PrescriptionButton } from "./Appointments";
import PrescriptionEditor from "@/components/Prescription/PrescriptionEditor";
import PatientRecordModal from "@/components/Records/PatientRecordModal";
import ConsultationBadge from "@/components/Booking/ConsultationBadge";
import RespondButtons from "@/components/Booking/RespondButtons";
import MyDocuments from "@/components/Documents/MyDocuments";
import { useBookingsChanged, useMessages } from "@/context/MessagesContext";
import { ageFrom, formatDay } from "@/utils/health";
import Avatar from "@/components/ui/avatar";
import CallDetails from "@/components/Video/CallDetails";
import { EmptyState, FilterChips, SectionCard, StatCard, greeting, todayLabel } from "@/components/Dashboard/DashboardUI";
import { appointmentStart, canJoinVideo, formatClock, getAppointmentStatus, statusLabels, statusStyles, useNow } from "@/utils/appointment";
import { formatPrice } from "@/utils/formatPrice";
import { formatDate } from "@/utils/formatDate";
import ConvertTime from "@/utils/convertTime";

const DAY = 24 * 60 * 60 * 1000;
const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const dateKey = date => date.toLocaleDateString("en-CA");

const DashboardSkeleton = () => (
  <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
    <div className="skeleton h-80 rounded-2xl" />
    <div className="space-y-4">
      <div className="skeleton h-16 w-80 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  </div>
);

const Stars = ({ rating, className = "h-4 w-4" }) => (
  <span className="flex text-brand-amber">
    {Array.from({ length: 5 }, (_, index) => (
      <Star key={index} className={`${className} ${index < Math.round(rating) ? "fill-current" : "opacity-30"}`} />
    ))}
  </span>
);

// one appointment row used in "Requests", "Today" and "This week"
const ScheduleRow = ({ booking, now, actions, showDate = false }) => {
  const status = getAppointmentStatus(booking, now);
  const start = appointmentStart(booking);
  return (
    <li className="py-4">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-20 shrink-0">
          {showDate && start && <p className="text-xs font-semibold text-muted-foreground">{start.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>}
          <p className="font-bold">{start ? formatClock(start) : "—"}</p>
          <p className="text-xs text-muted-foreground">{(booking.slotDuration || 30) + (booking.extendedMinutes || 0)} min</p>
        </div>
        <Avatar src={booking.user?.photo} name={booking.user?.name || "Patient"} className="h-10 w-10" textClassName="text-xs" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold">{booking.user?.name || "Deleted user"}</p>
            <ConsultationBadge booking={booking} />
            <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status]}`}>{statusLabels[status]}</span>
          </div>
          <CallDetails booking={booking} now={now} compact />
        </div>
      </div>
      {/* main actions (Accept, Join, Rx) on the left, Record and Message on the right */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {status === "requested" && <RespondButtons booking={booking} onDone={actions.onChanged} />}
        {canJoinVideo(booking, now) && (
          <Link to={`/consultation/${booking._id}`}>
            <Button size="sm"><Video className="h-4 w-4" /> Join</Button>
          </Link>
        )}
        <PrescriptionButton booking={booking} status={status} hasPrescription={actions.prescribed.has(booking._id)} onPrescribe={actions.onPrescribe} />
        {booking.user && (
          <div className="ml-auto flex gap-2">
            <IconAction icon={ClipboardList} label="Health record" text="Record" onClick={() => actions.onRecord(booking.user)} />
            <IconAction icon={MessageSquare} label="Message" to={`/messages?with=${booking.user._id}`} />
          </div>
        )}
      </div>
    </li>
  );
};

// every patient who booked this doctor, with their visit history
const PatientsTable = ({ appointments, now, onRecord }) => {
  const patients = useMemo(() => {
    const byPatient = new Map();
    appointments.forEach(booking => {
      if (!booking.user) return;
      const id = booking.user._id;
      const entry = byPatient.get(id) || { user: booking.user, visits: 0, last: null, next: null, spent: 0 };
      const status = getAppointmentStatus(booking, now);
      const start = appointmentStart(booking);
      if (status === "completed") {
        entry.visits += 1;
        if (!entry.last || start > entry.last) entry.last = start;
      }
      if (["upcoming", "requested", "ongoing"].includes(status) && (!entry.next || start < entry.next)) entry.next = start;
      if (booking.status !== "cancelled") entry.spent += booking.ticketPrice || 0;
      byPatient.set(id, entry);
    });
    return [...byPatient.values()].sort((a, b) => (b.next || b.last || 0) - (a.next || a.last || 0));
  }, [appointments, now]);

  if (patients.length === 0) {
    return <EmptyState icon={Users} title="No patients yet" text="Patients who book you will show up here." />;
  }
  const day = date => (date ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-5 py-3">Patient</th>
            <th className="px-5 py-3">Visits</th>
            <th className="px-5 py-3">Last visit</th>
            <th className="px-5 py-3">Next visit</th>
            <th className="px-5 py-3">Paid</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {patients.map(({ user, visits, last, next, spent }) => (
            <tr key={user._id} className="border-t border-border transition-colors hover:bg-muted/40">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar src={user.photo} name={user.name} className="h-10 w-10" textClassName="text-xs" />
                  <div className="min-w-0">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {[ageFrom(user.dateOfBirth) !== null && `${ageFrom(user.dateOfBirth)} y`, user.gender, user.bloodType].filter(Boolean).join(" · ") || user.email}
                    </p>
                    {user.allergies?.length > 0 && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-destructive">
                        <AlertTriangle className="h-3 w-3" /> {user.allergies.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 font-semibold">{visits}</td>
              <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{day(last)}</td>
              <td className="whitespace-nowrap px-5 py-3">{next ? <span className="font-semibold text-primary">{day(next)}</span> : <span className="text-muted-foreground">—</span>}</td>
              <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{formatPrice(spent)}</td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => onRecord(user)}><ClipboardList className="h-4 w-4" /> Record</Button>
                  <IconAction icon={MessageSquare} label="Message" to={`/messages?with=${user._id}`} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Dashboard = () => {
  const { data, loading, error, refetch } = useFetchData(`${BASE_URL}/doctors/profile/me`);
  const { data: prescriptions, refetch: refetchPrescriptions } = useFetchData(`${BASE_URL}/prescriptions/mine`);
  const { unread } = useMessages();
  useBookingsChanged(refetch);
  const [tab, setTab] = useState("overview");
  const [rxBooking, setRxBooking] = useState(null);
  const [recordPatient, setRecordPatient] = useState(null);
  const [filter, setFilter] = useState("upcoming");
  const [search, setSearch] = useState("");
  const now = useNow();

  const isApproved = data ? data.isApproved : null;
  const prescribed = useMemo(() => new Set((prescriptions || []).map(item => item.booking._id)), [prescriptions]);
  const rowActions = { prescribed, onPrescribe: setRxBooking, onRecord: setRecordPatient, onChanged: refetch };
  // past consultations that still need a prescription
  const missingRx = summary => summary.lists.past.filter(booking => !prescribed.has(booking._id));

  // everything on the dashboard is worked out from the doctor's bookings
  const summary = useMemo(() => {
    const appointments = data?.appointments || [];
    const withStatus = appointments.map(booking => ({ booking, status: getAppointmentStatus(booking, now), start: appointmentStart(booking) }));
    const active = withStatus.filter(item => ["upcoming", "requested", "ongoing"].includes(item.status));
    // paid requests still waiting for an answer, soonest first
    const requests = withStatus.filter(item => item.status === "requested").sort((a, b) => (a.start || 0) - (b.start || 0));
    const byStart = (a, b) => (a.start || 0) - (b.start || 0);
    const today = dateKey(now);

    const todays = withStatus.filter(item => item.start && dateKey(item.start) === today && item.status !== "cancelled").sort(byStart);
    const week = active.filter(item => item.start && dateKey(item.start) !== today && item.start - now < 7 * DAY).sort(byStart);
    const weekByDay = week.reduce((groups, item) => {
      const label = item.start.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
      (groups[label] ||= []).push(item.booking);
      return groups;
    }, {});

    // this month's paid consultations (cancelled ones are refunded, so they don't count)
    const monthKey = now.toLocaleDateString("en-CA").slice(0, 7);
    const monthEarnings = withStatus
      .filter(item => item.booking.status === "approved" && item.booking.appointmentDate?.startsWith(monthKey))
      .reduce((sum, item) => sum + (item.booking.ticketPrice || 0), 0);

    return {
      todays: todays.map(item => item.booking),
      weekByDay,
      weekCount: week.length + todays.filter(item => item.status !== "completed").length,
      patients: new Set(appointments.map(booking => booking.user?._id).filter(Boolean)).size,
      monthEarnings,
      requests: requests.map(item => item.booking),
      lists: {
        requests: requests.map(item => item.booking),
        today: todays.map(item => item.booking),
        upcoming: active.sort(byStart).map(item => item.booking),
        past: withStatus.filter(item => item.status === "completed").sort((a, b) => byStart(b, a)).map(item => item.booking),
        cancelled: withStatus.filter(item => item.status === "cancelled").map(item => item.booking),
      },
    };
  }, [data, now]);

  // what a complete public profile needs (shown as a checklist)
  const checklist = data
    ? [
        { label: "Profile photo", done: Boolean(data.photo) },
        { label: "Specialization", done: Boolean(data.specialization) },
        { label: "Consultation fee", done: Boolean(data.ticketPrice) },
        { label: "Short bio", done: Boolean(data.bio) },
        { label: "About you", done: Boolean(data.about) },
        { label: "Weekly time slots", done: data.timeSlots?.length > 0 },
        { label: "Qualifications", done: data.qualifications?.length > 0 },
        { label: "Experience", done: data.experiences?.length > 0 },
      ]
    : [];
  const completeness = checklist.length ? Math.round((checklist.filter(item => item.done).length / checklist.length) * 100) : 0;

  const reviews = [...(data?.reviews || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const weeklyHours = [...(data?.timeSlots || [])].sort(
    (a, b) => WEEK_DAYS.indexOf(a.day?.toLowerCase()) - WEEK_DAYS.indexOf(b.day?.toLowerCase())
  );

  const tableRows = (summary.lists[filter] || []).filter(booking =>
    !search.trim() || booking.user?.name?.toLowerCase().includes(search.trim().toLowerCase())
  );
  const firstName = data?.name?.replace(/^dr\.?\s*/i, "").split(" ")[0];

  return (
    <section className="pt-8">
      <div className="container">
        {loading && !data && <DashboardSkeleton />}
        {error && !loading && <Error />}

        {!error && data && (
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            <Tabs tab={tab} setTab={setTab} doctor={data} unread={unread} />

            <div className="min-w-0 space-y-6">
              {/* header */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm text-muted-foreground">{todayLabel()}</p>
                  <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{greeting()}, Dr. {firstName} 👋</h1>
                  <p className="mt-1 text-muted-foreground">
                    {summary.todays.length
                      ? `You have ${summary.todays.length} appointment${summary.todays.length > 1 ? "s" : ""} today.`
                      : "No appointments today."}
                  </p>
                </div>
                {isApproved === "approved" && (
                  <Link to={`/doctors/${data._id}`}>
                    <Button variant="outline"><ExternalLink className="h-4 w-4" /> View public profile</Button>
                  </Link>
                )}
              </div>

              {isApproved === "pending" && (
                <div className="flex gap-3 rounded-2xl border border-brand-amber/30 bg-brand-amber/10 p-4 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 text-brand-amber" />
                  <p>
                    <span className="font-semibold">Your account is waiting for verification.</span> We&apos;ll check your medical
                    registration number within 2 days. Meanwhile, complete your profile ({completeness}% done) so patients can book
                    you as soon as you are listed.
                  </p>
                </div>
              )}
              {["rejected", "suspended", "cancelled"].includes(isApproved) && (
                <div className="flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                  <p>
                    {isApproved === "rejected"
                      ? "Your registration could not be verified, so your profile is not listed."
                      : "Your profile has been taken down by our team and is hidden from patients."}
                    {data.reviewNote && <> Reason: <span className="font-semibold">{data.reviewNote}</span>.</>} Please contact support if you think this is a mistake.
                  </p>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {tab === "overview" && (
                    <>
                      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                        <StatCard icon={Inbox} tone="amber" label="Requests" value={summary.requests.length} hint="waiting for you" />
                        <StatCard icon={CalendarDays} label="Today" value={summary.todays.length} hint="appointments" />
                        <StatCard icon={CalendarRange} tone="highlight" label="Next 7 days" value={summary.weekCount} hint="upcoming visits" />
                        <StatCard
                          icon={IndianRupee}
                          tone="violet"
                          label="This month"
                          value={formatPrice(summary.monthEarnings)}
                          hint={now.toLocaleDateString("en-IN", { month: "long" }) + " earnings"}
                        />
                      </div>

                      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                        <div className="min-w-0 space-y-6">
                          {summary.requests.length > 0 && (
                            <SectionCard
                              icon={Inbox}
                              title={`New booking requests (${summary.requests.length})`}
                              subtitle="Paid by the patient. Accept to confirm, or decline to refund them"
                              className="border-brand-amber/40"
                              bodyClassName="px-5"
                            >
                              <ul className="divide-y divide-border">
                                {summary.requests.map(booking => <ScheduleRow key={booking._id} booking={booking} now={now} actions={rowActions} showDate />)}
                              </ul>
                            </SectionCard>
                          )}
                          {prescriptions && missingRx(summary).length > 0 && (
                            <div className="flex flex-col gap-3 rounded-2xl border border-brand-amber/30 bg-brand-amber/10 p-4 sm:flex-row sm:items-center">
                              <FileText className="h-5 w-5 shrink-0 text-brand-amber" />
                              <p className="flex-1 text-sm">
                                <span className="font-semibold">{missingRx(summary).length} past consultation{missingRx(summary).length > 1 ? "s" : ""} without a prescription.</span>{" "}
                                Latest: {missingRx(summary)[0].user?.name || "patient"}, {formatDay(missingRx(summary)[0].appointmentDate)}.
                              </p>
                              <Button size="sm" variant="outline" onClick={() => setRxBooking(missingRx(summary)[0])}>Write it now</Button>
                            </div>
                          )}
                          <SectionCard
                            icon={Clock3}
                            title="Today's schedule"
                            subtitle={now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                            bodyClassName="px-5"
                          >
                            {summary.todays.length === 0 ? (
                              <EmptyState icon={CalendarDays} title="Nothing scheduled today" text="New bookings for today will show up here." />
                            ) : (
                              <ul className="divide-y divide-border">
                                {summary.todays.map(booking => <ScheduleRow key={booking._id} booking={booking} now={now} actions={rowActions} />)}
                              </ul>
                            )}
                          </SectionCard>

                          <SectionCard icon={CalendarRange} title="Coming up this week" subtitle="Next 7 days" bodyClassName="px-5">
                            {Object.keys(summary.weekByDay).length === 0 ? (
                              <EmptyState icon={CalendarRange} title="No other appointments this week" />
                            ) : (
                              Object.entries(summary.weekByDay).map(([day, bookings]) => (
                                <div key={day} className="border-b border-border py-2 last:border-0">
                                  <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{day}</p>
                                  <ul className="divide-y divide-border">
                                    {bookings.map(booking => <ScheduleRow key={booking._id} booking={booking} now={now} actions={rowActions} />)}
                                  </ul>
                                </div>
                              ))
                            )}
                          </SectionCard>
                        </div>

                        <aside className="space-y-6">
                          <SectionCard
                            icon={ListChecks}
                            title="Profile completeness"
                            action={<span className="text-sm font-bold text-primary">{completeness}%</span>}
                          >
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <motion.div
                                className="h-full rounded-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${completeness}%` }}
                                transition={{ duration: 0.8 }}
                              />
                            </div>
                            <ul className="mt-4 space-y-2 text-sm">
                              {checklist.map(item => (
                                <li key={item.label} className={`flex items-center gap-2 ${item.done ? "text-muted-foreground" : ""}`}>
                                  {item.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                                  <span className={item.done ? "line-through decoration-muted-foreground/40" : "font-medium"}>{item.label}</span>
                                </li>
                              ))}
                            </ul>
                            {completeness < 100 && (
                              <Button size="sm" variant="soft" className="mt-4 w-full" onClick={() => setTab("profile")}>
                                Complete profile
                              </Button>
                            )}
                          </SectionCard>

                          <SectionCard icon={CalendarClock} title="Weekly hours" subtitle={`${data.slotDuration || 30} min appointments · ${data.ticketPrice ? formatPrice(data.ticketPrice) : "no fee set"}`}>
                            {weeklyHours.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No time slots yet. Add them in your profile so patients can book you.</p>
                            ) : (
                              <ul className="space-y-2 text-sm">
                                {weeklyHours.map((slot, index) => (
                                  <li key={index} className="flex justify-between gap-3">
                                    <span className="font-medium capitalize">{slot.day}</span>
                                    <span className="text-muted-foreground">{ConvertTime(slot.startingTime)} – {ConvertTime(slot.EndingTime)}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </SectionCard>

                          <TimeOff doctor={data} onChanged={refetch} />

                          <SectionCard
                            icon={Star}
                            title="Patient rating"
                            action={reviews.length > 0 && (
                              <button type="button" onClick={() => setTab("reviews")} className="text-sm font-semibold text-primary hover:underline">See all</button>
                            )}
                          >
                            <div className="flex items-end gap-3">
                              <p className="text-3xl font-extrabold">{data.averageRating ? data.averageRating.toFixed(1) : "—"}</p>
                              <div className="pb-1">
                                <Stars rating={data.averageRating || 0} />
                                <p className="text-xs text-muted-foreground">{data.totalRating || 0} reviews</p>
                              </div>
                            </div>
                            {reviews[0] && (
                              <blockquote className="mt-4 rounded-xl bg-muted/60 p-3 text-sm">
                                <p className="line-clamp-3">&ldquo;{reviews[0].reviewText}&rdquo;</p>
                                <footer className="mt-2 text-xs text-muted-foreground">— {reviews[0].user?.name || "Patient"}, {formatDate(reviews[0].createdAt)}</footer>
                              </blockquote>
                            )}
                          </SectionCard>
                        </aside>
                      </div>
                    </>
                  )}

                  {tab === "appointments" && (
                    <SectionCard
                      icon={CalendarDays}
                      title="Appointments"
                      subtitle="All paid bookings from your patients"
                      bodyClassName=""
                    >
                      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <FilterChips
                          layoutId="doctor-filter"
                          value={filter}
                          onChange={setFilter}
                          options={[
                            { value: "requests", label: "Requests", count: summary.lists.requests.length },
                            { value: "today", label: "Today", count: summary.lists.today.length },
                            { value: "upcoming", label: "Upcoming", count: summary.lists.upcoming.length },
                            { value: "past", label: "Past", count: summary.lists.past.length },
                            { value: "cancelled", label: "Cancelled", count: summary.lists.cancelled.length },
                          ]}
                        />
                        <div className="relative sm:w-64">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search patient"
                            className="h-10 w-full rounded-xl border border-input bg-background/60 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                          />
                        </div>
                      </div>
                      <Appointments appointments={tableRows} onChanged={refetch} prescribed={prescribed} onPrescribe={setRxBooking} onRecord={setRecordPatient} />
                    </SectionCard>
                  )}

                  {tab === "patients" && (
                    <SectionCard icon={Users} title="My patients" subtitle="Everyone who has booked you, with their health record" bodyClassName="">
                      <PatientsTable appointments={data.appointments || []} now={now} onRecord={setRecordPatient} />
                    </SectionCard>
                  )}

                  {tab === "reviews" && (
                    <SectionCard icon={MessageSquareQuote} title="Patient reviews" subtitle={`${data.totalRating || 0} reviews · ${data.averageRating ? data.averageRating.toFixed(1) : "—"} average`}>
                      {reviews.length === 0 ? (
                        <EmptyState icon={MessageSquareQuote} title="No reviews yet" text="Patients can review you after their appointment." />
                      ) : (
                        <ul className="divide-y divide-border">
                          {reviews.map(review => (
                            <li key={review._id} className="py-4 first:pt-0 last:pb-0">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <Avatar src={review.user?.photo} name={review.user?.name || "Patient"} className="h-10 w-10" textClassName="text-xs" />
                                  <div>
                                    <p className="font-semibold">{review.user?.name || "Former patient"}</p>
                                    <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                                  </div>
                                </div>
                                <Stars rating={review.rating} />
                              </div>
                              <p className="mt-3 text-sm leading-6">{review.reviewText}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </SectionCard>
                  )}

                  {tab === "profile" && (
                    <>
                      <div className="card-surface p-6 sm:p-8">
                        <Profile doctorData={data} />
                      </div>
                      <MyDocuments
                        icon={FileCheck2}
                        title="Verification documents"
                        subtitle="Seen only by the Medora admin team"
                        note={isApproved === "approved"
                          ? "Keep your registration certificate up to date, the team may re-check it."
                          : "Upload your medical registration certificate, degree and a government ID so we can verify you faster."}
                        categories={["registration", "degree", "id-proof"]}
                        empty="No documents uploaded yet."
                      />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <PrescriptionEditor open={Boolean(rxBooking)} booking={rxBooking} onClose={() => setRxBooking(null)} onSaved={refetchPrescriptions} />
      <PatientRecordModal open={Boolean(recordPatient)} onClose={() => setRecordPatient(null)} patientId={recordPatient?._id} patientName={recordPatient?.name} />
    </section>
  );
};

export default Dashboard;
