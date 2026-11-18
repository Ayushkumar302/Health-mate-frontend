import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarCheck2, CalendarClock, CalendarPlus, CheckCircle2, CreditCard, FileText, FolderOpen, HeartPulse, IndianRupee, LayoutDashboard, LogOut, MessageSquare, MessageSquareText, Search, Settings, Sparkles, Star, Stethoscope, Trash2, Users, Video } from "lucide-react";
import Family from "./Family";
import useFamily from "@/hooks/useFamily";
import ReportExplainer from "@/components/AI/ReportExplainer";
import { ReceiptButton } from "@/components/Booking/BookingExtras";
import Waitlist from "./Waitlist";
import GettingStarted from "./GettingStarted";
import { toast } from "react-toastify";
import { authContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/ui/avatar";
import BookingsList, { sortBookings } from "./MyBookings";
import ProfileSettings from "./ProfileSettings";
import HealthRecord from "./HealthRecord";
import PrescriptionsList from "./PrescriptionsList";
import usePlus, { currentTier, tierById } from "@/hooks/usePlus";
import MyDocuments from "@/components/Documents/MyDocuments";
import SavedChecks from "@/components/Symptoms/SavedChecks";
import SymptomCheckCard from "@/components/Symptoms/SymptomCheckCard";
import useFetchData from "../../hooks/useFetchData";
import { BASE_URL } from "@/config";
import { DEMO_MODE } from "@/brand";
import Error from "@/components/Error/Error";
import CallDetails from "@/components/Video/CallDetails";
import { EmptyState, FilterChips, SectionCard, StatGroup, greeting, todayLabel } from "@/components/Dashboard/DashboardUI";
import DashboardNav from "@/components/Dashboard/DashboardNav";
import { appointmentStart, canJoinVideo, formatAppointment, formatSpan, getAppointmentStatus, isOnline, useNow } from "@/utils/appointment";
import ConsultationBadge from "@/components/Booking/ConsultationBadge";
import { formatPrice } from "@/utils/formatPrice";
import { formatDate } from "@/utils/formatDate";
import { useBookingsChanged, useMessages } from "@/context/MessagesContext";
import { useConfirm } from "@/context/ConfirmContext";

// each section is its own view, picked from the menu (and kept in the address, e.g. ?family)
const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "appointments", label: "Appointments", icon: CalendarClock },
  { id: "prescriptions", label: "Prescriptions", icon: FileText },
  { id: "health", label: "Health record", icon: HeartPulse },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "family", label: "Family", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const HEADINGS = {
  appointments: ["Appointments", "Your upcoming, past and cancelled visits"],
  prescriptions: ["Prescriptions", "Every prescription your doctors have written"],
  health: ["Health record", "Your details, saved symptom checks and medical reports"],
  payments: ["Payments", "Everything you've paid, with receipts"],
  family: ["Family", "People you book visits for"],
  settings: ["Settings", "Your profile and account"],
};

const sectionFromUrl = search => {
  const params = new URLSearchParams(search);
  return SECTIONS.find(section => params.has(section.id))?.id || "overview";
};

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

// after a visit that took place: ask once for a review of that doctor
const ReviewPrompt = ({ booking }) => (
  <div className="flex flex-col gap-4 rounded-2xl border border-brand-amber/40 bg-brand-amber/10 p-5 sm:flex-row sm:items-center">
    <Avatar src={booking.doctor.photo} name={booking.doctor.name} className="h-12 w-12" textClassName="text-sm" />
    <div className="min-w-0 flex-1">
      <p className="font-bold">How was your visit with {booking.doctor.name}?</p>
      <p className="text-sm text-muted-foreground">
        {booking.familyMember?.name ? `${booking.familyMember.name}'s visit` : "Your visit"} on {formatDate(`${booking.appointmentDate}T00:00:00`)}. A few words help other patients choose.
      </p>
    </div>
    <div className="flex gap-1 text-brand-amber" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => <Star key={index} className="h-5 w-5" />)}
    </div>
    <Link to={`/doctors/${booking.doctor._id}?tab=feedback`}>
      <Button size="sm"><Star className="h-4 w-4" /> Write a review</Button>
    </Link>
  </div>
);

// a small card that leads to the plans page
const PlansCard = ({ plus }) => {
  const tier = currentTier(plus);
  return (
    <Link
      to="/plans"
      className="group flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:border-primary/60"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{plus.plus ? `Medora ${tier?.label} member` : "Medora Plus plans"}</span>
        <span className="block text-xs text-muted-foreground">
          {plus.plus
            ? `${Math.round(tier.refund.early * 100)}% refunds and ${tier.followUpDays}-day follow-up chat. See or change your plan.`
            : `Better refunds, more reschedules and longer follow-up chat, from ${formatPrice(tierById(plus, "lite")?.price || 0)} a year.`}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
};

function MyAccount() {
  const { dispatch, token } = useContext(authContext);
  const location = useLocation();
  const [tab, setTab] = useState(() => sectionFromUrl(window.location.search));
  const contentRef = useRef(null);
  // links from the phone's bottom bar change the address: show that section
  useEffect(() => setTab(sectionFromUrl(location.search)), [location.search]);
  const plus = usePlus();
  const family = useFamily();
  // the report being explained by the AI
  const [explaining, setExplaining] = useState(null);
  const [filter, setFilter] = useState("upcoming");
  const navigate = useNavigate();
  const now = useNow();
  const confirm = useConfirm();

  const { data: userData, loading, error, refetch: refetchUser } = useFetchData(`${BASE_URL}/users/profile/me`);
  const { data: bookingData, error: bookingsError, refetch } = useFetchData(`${BASE_URL}/users/appointments/my-appointments`);
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
      // the latest visit that took place and whose doctor hasn't been reviewed yet
      reviewDue: sortBookings(bookings.filter(booking => booking.reviewDue), now)[0],
      totalSpent: paidFor.reduce((sum, booking) => sum + (booking.ticketPrice || 0), 0),
      doctors,
    };
  }, [bookingData, now]);

  const openSection = id => {
    setTab(id);
    navigate({ search: id === "overview" ? "" : `?${id}` }, { replace: true });
    const top = contentRef.current?.getBoundingClientRect().top;
    if (top !== undefined && (top < 0 || top > window.innerHeight * 0.6)) contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  const ready = Boolean(userData) && (bookingData !== null || Boolean(bookingsError));
  const filtered = { upcoming: summary.upcoming, past: summary.past, cancelled: summary.cancelled }[filter];
  const firstName = userData?.name?.split(" ")[0];
  const items = SECTIONS.map(section => (section.id === "appointments" ? { ...section, count: summary.upcoming.length } : section));

  // plans moved to their own page: old links (?plus) and Stripe returns (?plus=done) go there
  if (new URLSearchParams(location.search).has("plus")) return <Navigate to={`/plans${location.search}`} replace />;

  return (
    <section className="pt-8">
      <div className="container">
        {/* wait for the bookings too, so the page never flashes "no appointments" and zero totals first */}
        {!error && !ready && <DashboardSkeleton />}
        {error && !loading && <Error errMessage={error} />}

        {!error && ready && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* menu: a sidebar on large screens, a grid of every section on phones */}
            <aside className="min-w-0 lg:sticky lg:top-24 lg:h-fit">
              <div className="card-surface p-4 lg:p-5">
                <div className="flex items-center gap-3 lg:flex-col lg:text-center">
                  <Avatar src={userData.photo} name={userData.name} className="h-12 w-12 lg:h-20 lg:w-20" textClassName="lg:text-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{userData.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{userData.email}</p>
                    {plus && (
                      <Link
                        to="/plans"
                        className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${plus.plus ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                      >
                        <Sparkles className="h-3 w-3" /> {plus.plus ? `${currentTier(plus)?.label} member` : "Free plan"}
                      </Link>
                    )}
                  </div>
                </div>
                {/* on phones the bar along the bottom of the screen is the menu */}
                <div className="mt-4 hidden md:block lg:mt-6">
                  <DashboardNav
                    items={items}
                    tab={tab}
                    onChange={openSection}
                    layoutId="patient-menu"
                    links={[
                      { to: "/messages", label: "Messages", icon: MessageSquare, count: unread },
                      { to: "/book", label: "Book with AI", icon: MessageSquareText },
                      { to: "/plans", label: "Plans", icon: Sparkles, highlight: true },
                    ]}
                  />
                </div>
                <div className="mt-6 hidden border-t border-border pt-5 lg:grid">
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" /> Log out
                  </Button>
                </div>
              </div>
            </aside>

            <div ref={contentRef} className="min-w-0 scroll-mt-28 space-y-6">
              {tab === "overview" ? (
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm text-muted-foreground">{todayLabel()}</p>
                    <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                      {greeting()}, {firstName} 👋
                    </h1>
                    <p className="mt-1 text-muted-foreground">Here&apos;s an overview of your care.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/book">
                      <Button variant="outline"><MessageSquareText className="h-4 w-4" /> Book with AI</Button>
                    </Link>
                    <Link to="/doctors">
                      <Button><Search className="h-4 w-4" /> Find a doctor</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{HEADINGS[tab][0]}</h1>
                  <p className="mt-1 text-muted-foreground">{HEADINGS[tab][1]}</p>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                {tab === "overview" && (
                  <div className="space-y-6">
                    <NextVisit booking={summary.next} now={now} />
                    {summary.reviewDue && <ReviewPrompt booking={summary.reviewDue} />}
                    <GettingStarted user={userData} bookings={summary.bookings} onOpen={openSection} />

                    <StatGroup
                      items={[
                        { icon: CalendarClock, label: "Upcoming", value: summary.upcoming.length, hint: "booked visits" },
                        { icon: CheckCircle2, tone: "highlight", label: "Completed", value: summary.past.length, hint: "consultations" },
                        { icon: IndianRupee, tone: "amber", label: "Total spent", value: formatPrice(summary.totalSpent), hint: "refunds excluded" },
                        { icon: Stethoscope, tone: "violet", label: "Doctors", value: summary.doctors.length, hint: "consulted" },
                      ]}
                    />

                    <div className="grid gap-6 md:grid-cols-2">
                      <FindCare />
                      <SectionCard icon={Stethoscope} title="Your doctors" subtitle="Book a follow-up in one click">
                        {summary.doctors.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Doctors you consult will appear here.</p>
                        ) : (
                          <ul className="space-y-3">
                            {summary.doctors.slice(0, 4).map(doctor => (
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
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <SymptomCheckCard variant="compact" />
                      {plus && <PlansCard plus={plus} />}
                    </div>
                  </div>
                )}

{tab === "appointments" && (
                  <div className="space-y-4">
                    <Waitlist />
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
                      members={family?.members || []}
                      extra={document => (
                        <Button size="sm" variant="soft" onClick={() => setExplaining(document)}>
                          <Sparkles className="h-4 w-4" /> Explain
                        </Button>
                      )}
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
                      <div className="relative overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                            <tr>
                              <th className="px-5 py-3">Paid on</th>
                              <th className="px-5 py-3">Doctor</th>
                              <th className="px-5 py-3">Appointment</th>
                              <th className="px-5 py-3">Amount</th>
                              <th className="px-5 py-3">Method</th>
                              <th className="px-5 py-3">Status</th>
                              <th className="px-5 py-3"><span className="sr-only">Receipt</span></th>
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
                                    <td className="whitespace-nowrap px-5 py-3 font-semibold">
                                      {booking.doctor.name}
                                      {booking.familyMember?.name && <span className="block text-xs font-normal text-muted-foreground">for {booking.familyMember.name}</span>}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{formatAppointment(booking)}</td>
                                    <td className="whitespace-nowrap px-5 py-3 font-semibold">
                                      {formatPrice(booking.ticketPrice)}
                                      {booking.familyDiscount > 0 && <span className="block text-xs font-normal text-highlight">{formatPrice(booking.familyDiscount)} family discount</span>}
                                    </td>
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
                                    <td className="whitespace-nowrap px-5 py-3"><ReceiptButton booking={booking} compact /></td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </SectionCard>
                )}

                {tab === "family" && <Family onOpenPlans={() => navigate("/plans")} />}

                {tab === "settings" && (
                  <div className="space-y-6">
                    <ProfileSettings user={userData} />
                    {!DEMO_MODE && (
                      <SectionCard icon={Trash2} title="Delete account" subtitle="Removes your bookings, records and messages for good">
                        <Button variant="ghost" onClick={handleDeleteAccount} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" /> Delete my account
                        </Button>
                      </SectionCard>
                    )}
                  </div>
                )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
      <ReportExplainer open={Boolean(explaining)} document={explaining} onClose={() => setExplaining(null)} />
    </section>
  );
}

export default MyAccount;
