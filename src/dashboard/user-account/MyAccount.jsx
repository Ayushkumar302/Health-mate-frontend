import { useContext, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, ArrowRight, FolderOpen, CalendarCheck2, CalendarClock, CalendarPlus, Cake, CheckCircle2, CreditCard, Droplet, FileText,
  HeartPulse, IndianRupee, LogOut, Mail, MessageSquare, Phone, Search, Settings, Stethoscope, Trash2, UserRound, Video,
} from "lucide-react";
import { toast } from "react-toastify";
import { authContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/ui/avatar";
import BookingsList, { sortBookings } from "./MyBookings";
import ProfileSettings from "./ProfileSettings";
import HealthRecord from "./HealthRecord";
import PrescriptionsList from "./PrescriptionsList";
import MyDocuments from "@/components/Documents/MyDocuments";
import SavedChecks from "@/components/Symptoms/SavedChecks";
import SymptomCheckCard from "@/components/Symptoms/SymptomCheckCard";
import useFetchData from "../../hooks/useFetchData";
import { BASE_URL } from "@/config";
import { DEMO_MODE } from "@/brand";
import Error from "@/components/Error/Error";
import CallDetails from "@/components/Video/CallDetails";
import { EmptyState, FilterChips, InfoRow, SectionCard, StatCard, greeting, todayLabel } from "@/components/Dashboard/DashboardUI";
import { appointmentStart, canJoinVideo, formatAppointment, formatSpan, getAppointmentStatus, isOnline, useNow } from "@/utils/appointment";
import ConsultationBadge from "@/components/Booking/ConsultationBadge";
import { formatPrice } from "@/utils/formatPrice";
import { formatDate } from "@/utils/formatDate";
import { ageFrom } from "@/utils/health";
import { useBookingsChanged, useMessages } from "@/context/MessagesContext";
import { useConfirm } from "@/context/ConfirmContext";

const tabs = [
  { id: "appointments", label: "Appointments", icon: CalendarClock },
  { id: "prescriptions", label: "Prescriptions", icon: FileText },
  { id: "health", label: "Health record", icon: HeartPulse },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "settings", label: "Profile settings", icon: Settings },
];

const SPECIALTIES = ["Cardiologist", "Dentist", "Dermatologist", "Neurologist", "Pediatrician", "Psychiatrist"];

// search box + specialty shortcuts so booking a new visit is one step away
const FindCare = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const search = event => {
    event.preventDefault();
    navigate(`/doctors${query.trim() ? `?query=${encodeURIComponent(query.trim())}` : ""}`);
  };
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[hsl(var(--primary-deep))] p-5 text-white">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-highlight/30 blur-3xl" />
      <p className="relative flex items-center gap-2 font-bold"><Stethoscope className="h-[18px] w-[18px]" /> Find a doctor</p>
      <p className="relative mt-1 text-sm text-white/75">Verified specialists, live slots, video visits.</p>
      <form onSubmit={search} className="relative mt-4 flex items-center gap-2 rounded-full bg-white p-1 pl-4">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Name or specialty"
          aria-label="Search doctors"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <Button type="submit" size="sm" className="shrink-0">Search</Button>
      </form>
      <div className="relative mt-3 flex flex-wrap gap-1.5">
        {SPECIALTIES.map(name => (
          <Link
            key={name}
            to={`/doctors?query=${name.toLowerCase()}`}
            className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-white/20"
          >
            {name}
          </Link>
        ))}
      </div>
      <Link to="/doctors" className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white hover:underline">
        Browse all doctors <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="skeleton h-16 w-80 rounded-2xl" />
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="skeleton h-56 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-28 rounded-2xl" />)}
        </div>
      </div>
      <div className="skeleton h-96 rounded-2xl" />
    </div>
  </div>
);

// the most important thing on the page: your next (or live) appointment
const NextVisit = ({ booking, now }) => {
  if (!booking) {
    return (
      <SectionCard icon={CalendarCheck2} title="Next appointment" bodyClassName="">
        <EmptyState
          icon={CalendarPlus}
          title="No upcoming appointments"
          text="Find a verified doctor and book a slot in under a minute."
          action={<Link to="/doctors"><Button size="sm"><Search className="h-4 w-4" /> Find a doctor</Button></Link>}
        />
      </SectionCard>
    );
  }

  const { doctor } = booking;
  const status = getAppointmentStatus(booking, now);
  const live = status === "ongoing";
  const start = appointmentStart(booking);
  const title = status === "requested"
    ? "Waiting for the doctor to confirm"
    : live ? (isOnline(booking) ? "Your consultation is live" : "Your clinic visit is now") : "Next appointment";
  const subtitle = live && isOnline(booking) ? "Join now, your doctor is expecting you" : `Starts in ${formatSpan(start - now)}`;

  return (
    <SectionCard
      icon={CalendarCheck2}
      title={title}
      subtitle={subtitle}
      className={live ? "border-highlight/50 ring-4 ring-highlight/10" : ""}
      action={
        canJoinVideo(booking, now) ? (
          <Link to={`/consultation/${booking._id}`}>
            <Button size="sm"><Video className="h-4 w-4" /> Join video call</Button>
          </Link>
        ) : null
      }
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar src={doctor.photo} name={doctor.name} className="h-16 w-16" textClassName="text-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/doctors/${doctor._id}`} className="text-lg font-bold hover:text-primary">{doctor.name}</Link>
            <ConsultationBadge booking={booking} />
          </div>
          <p className="text-sm capitalize text-muted-foreground">
            {doctor.specialization}{doctor.experiences?.[0]?.hospital ? ` · ${doctor.experiences[0].hospital}` : ""}
          </p>
        </div>
        <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm sm:text-right">
          <p className="font-bold">{formatAppointment(booking)}</p>
          <p className="text-muted-foreground">{formatPrice(booking.ticketPrice)} · paid</p>
        </div>
      </div>
      <CallDetails booking={booking} now={now} />
    </SectionCard>
  );
};

function MyAccount() {
  const { dispatch, token } = useContext(authContext);
  const [tab, setTab] = useState("appointments");
  const [filter, setFilter] = useState("upcoming");
  const navigate = useNavigate();
  const now = useNow();
  const confirm = useConfirm();

  const { data: userData, loading, error, refetch: refetchUser } = useFetchData(`${BASE_URL}/users/profile/me`);
  const { data: bookingData, loading: bookingsLoading, refetch } = useFetchData(`${BASE_URL}/users/appointments/my-appointments`);
  const { data: prescriptions } = useFetchData(`${BASE_URL}/prescriptions/mine`);
  const { unread } = useMessages();
  useBookingsChanged(refetch);
  // bookings that already have a prescription, so their cards can link to it
  const prescribed = useMemo(() => new Set((prescriptions || []).map(item => item.booking._id)), [prescriptions]);

  // everything the dashboard shows is worked out from the bookings
  const summary = useMemo(() => {
    const bookings = Array.isArray(bookingData) ? bookingData : [];
    const withStatus = bookings.map(booking => ({ booking, status: getAppointmentStatus(booking, now) }));
    const pick = (...statuses) => withStatus.filter(item => statuses.includes(item.status)).map(item => item.booking);
    const upcoming = pick("ongoing", "upcoming", "requested");
    const past = pick("completed");
    const cancelled = pick("cancelled");
    const paidFor = bookings.filter(booking => !(booking.status === "cancelled" && booking.refundId));
    const doctors = [...new Map(bookings.map(booking => [booking.doctor._id, booking.doctor])).values()];
    return {
      bookings,
      upcoming,
      past,
      cancelled,
      next: sortBookings(upcoming, now)[0],
      totalSpent: paidFor.reduce((sum, booking) => sum + (booking.ticketPrice || 0), 0),
      doctors,
    };
  }, [bookingData, now]);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (!(await confirm({ title: "Delete your account?", message: "Your bookings, records and messages are removed for good. This cannot be undone.", confirmText: "Delete account", tone: "danger" }))) return;
    try {
      const res = await fetch(`${BASE_URL}/users/${userData._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message);
      }
      toast.success(result.message);
      handleLogout();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = { upcoming: summary.upcoming, past: summary.past, cancelled: summary.cancelled }[filter];
  const firstName = userData?.name?.split(" ")[0];

  return (
    <section className="pt-8">
      <div className="container">
        {(loading || bookingsLoading) && !userData && <DashboardSkeleton />}
        {error && !loading && <Error errMessage={error} />}

        {!error && userData && (
          <div className="space-y-6">
            {/* header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm text-muted-foreground">{todayLabel()}</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {greeting()}, {firstName} 👋
                </h1>
                <p className="mt-1 text-muted-foreground">Here&apos;s an overview of your care.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/messages">
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4" /> Messages
                    {unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{unread}</span>}
                  </Button>
                </Link>
                <Link to="/doctors">
                  <Button><Search className="h-4 w-4" /> Find a doctor</Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="min-w-0 space-y-6">
                <NextVisit booking={summary.next} now={now} />

                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                  <StatCard icon={CalendarClock} label="Upcoming" value={summary.upcoming.length} hint="booked visits" />
                  <StatCard icon={CheckCircle2} tone="highlight" label="Completed" value={summary.past.length} hint="consultations" />
                  <StatCard icon={IndianRupee} tone="amber" label="Total spent" value={formatPrice(summary.totalSpent)} hint="refunds excluded" />
                  <StatCard icon={Stethoscope} tone="violet" label="Doctors" value={summary.doctors.length} hint="consulted" />
                </div>

                {/* tabs */}
                <div className="no-scrollbar flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border">
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                        tab === id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" /> {label}
                      {tab === id && <motion.span layoutId="patient-tab" className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {tab === "appointments" && (
                      <div className="space-y-4">
                        <FilterChips
                          layoutId="patient-filter"
                          value={filter}
                          onChange={setFilter}
                          options={[
                            { value: "upcoming", label: "Upcoming", count: summary.upcoming.length },
                            { value: "past", label: "Past", count: summary.past.length },
                            { value: "cancelled", label: "Cancelled", count: summary.cancelled.length },
                          ]}
                        />
                        <BookingsList
                          bookings={filtered}
                          prescribed={prescribed}
                          onChanged={refetch}
                          empty={
                            <div className="rounded-2xl border border-dashed border-border">
                              <EmptyState
                                icon={CalendarClock}
                                title={`No ${filter} appointments`}
                                text={filter === "upcoming" ? "Book a visit and it will show up here." : undefined}
                                action={filter === "upcoming" ? <Link to="/doctors"><Button size="sm">Find a doctor</Button></Link> : undefined}
                              />
                            </div>
                          }
                        />
                      </div>
                    )}

                    {tab === "prescriptions" && <PrescriptionsList prescriptions={prescriptions} />}

                    {tab === "health" && (
                      <div className="space-y-6">
                        <HealthRecord user={userData} onSaved={refetchUser} />
                        <SavedChecks />
                        <MyDocuments
                          icon={FolderOpen}
                          title="Medical reports"
                          subtitle="Lab results, scans and old prescriptions"
                          note="Private to you. Doctors you have booked can open them during and after your consultation."
                          categories={["lab", "imaging", "prescription", "other"]}
                          withDate
                          empty="No reports yet. Upload lab results or scans so your doctor can see them."
                        />
                      </div>
                    )}

                    {tab === "payments" && (
                      <SectionCard icon={CreditCard} title="Payment history" subtitle="Paid securely through Stripe" bodyClassName="">
                        {summary.bookings.length === 0 ? (
                          <EmptyState icon={CreditCard} title="No payments yet" />
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                                <tr>
                                  <th className="px-5 py-3">Paid on</th>
                                  <th className="px-5 py-3">Doctor</th>
                                  <th className="px-5 py-3">Appointment</th>
                                  <th className="px-5 py-3">Amount</th>
                                  <th className="px-5 py-3">Method</th>
                                  <th className="px-5 py-3">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...summary.bookings]
                                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                  .map(booking => {
                                    const refunded = booking.status === "cancelled" && booking.refundId;
                                    const cancelledNoRefund = booking.status === "cancelled" && !booking.refundId;
                                    return (
                                      <tr key={booking._id} className="border-t border-border">
                                        <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{formatDate(booking.createdAt)}</td>
                                        <td className="whitespace-nowrap px-5 py-3 font-semibold">{booking.doctor.name}</td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{formatAppointment(booking)}</td>
                                        <td className="whitespace-nowrap px-5 py-3 font-semibold">{formatPrice(booking.ticketPrice)}</td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">Card</td>
                                        <td className="px-5 py-3">
                                          <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                              refunded ? "bg-brand-amber/15 text-brand-amber"
                                                : cancelledNoRefund ? "bg-muted text-muted-foreground"
                                                : "bg-success/15 text-success"
                                            }`}
                                          >
                                            {refunded ? "Refunded" : cancelledNoRefund ? "Cancelled" : "Paid"}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </SectionCard>
                    )}

                    {tab === "settings" && <ProfileSettings user={userData} />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* sidebar */}
              <aside className="space-y-6">
                <FindCare />
                <SymptomCheckCard variant="compact" />

                <SectionCard icon={UserRound} title="My profile" action={
                  <button type="button" onClick={() => setTab("settings")} className="text-sm font-semibold text-primary hover:underline">Edit</button>
                }>
                  <div className="flex items-center gap-3">
                    <Avatar src={userData.photo} name={userData.name} className="h-14 w-14" textClassName="text-lg" />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{userData.name}</p>
                      <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" /> {userData.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 divide-y divide-border">
                    <InfoRow icon={Phone} label="Phone" value={userData.phone} />
                    <InfoRow icon={UserRound} label="Gender" value={userData.gender && userData.gender[0].toUpperCase() + userData.gender.slice(1)} />
                    <InfoRow icon={Droplet} label="Blood type" value={userData.bloodType} />
                    <InfoRow icon={Cake} label="Age" value={ageFrom(userData.dateOfBirth) !== null ? `${ageFrom(userData.dateOfBirth)} years` : null} />
                  </div>
                  {userData.allergies?.length > 0 && (
                    <p className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                      <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" /> Allergic to {userData.allergies.join(", ")}
                    </p>
                  )}
                  <button type="button" onClick={() => setTab("health")} className="mt-3 text-sm font-semibold text-primary hover:underline">
                    {userData.dateOfBirth || userData.allergies?.length ? "View health record" : "Add your health record"}
                  </button>
                </SectionCard>

                <SectionCard icon={Stethoscope} title="Your doctors" subtitle="Book a follow-up in one click">
                  {summary.doctors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Doctors you consult will appear here.</p>
                  ) : (
                    <ul className="space-y-3">
                      {summary.doctors.slice(0, 5).map(doctor => (
                        <li key={doctor._id} className="flex items-center gap-3">
                          <Link to={`/doctors/${doctor._id}`} className="group flex min-w-0 flex-1 items-center gap-3">
                            <Avatar src={doctor.photo} name={doctor.name} className="h-10 w-10" textClassName="text-xs" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold group-hover:text-primary">{doctor.name}</p>
                              <p className="truncate text-xs capitalize text-muted-foreground">{doctor.specialization}</p>
                            </div>
                          </Link>
                          <Link
                            to={`/messages?with=${doctor._id}`}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            aria-label={`Message ${doctor.name}`}
                            title="Message"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>

                <div className="grid gap-2">
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" /> Log out
                  </Button>
                  {!DEMO_MODE && (
                    <Button variant="ghost" onClick={handleDeleteAccount} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" /> Delete account
                    </Button>
                  )}
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default MyAccount;
