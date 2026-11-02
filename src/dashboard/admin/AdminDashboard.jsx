import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck, BarChart3, CalendarDays, ClipboardCheck, IndianRupee, LayoutDashboard, LogOut, Receipt, Search, ShieldCheck,
  Stethoscope, UserRound, Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import Avatar from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState, FilterChips, SectionCard, StatCard, greeting, todayLabel } from "@/components/Dashboard/DashboardUI";
import { formatAppointment } from "@/utils/appointment";
import { formatPrice } from "@/utils/formatPrice";
import { RevenueChart, SpecialtyBars } from "./AdminCharts";
import DoctorReviewCard from "./DoctorReviewCard";
import ConsultationBadge from "@/components/Booking/ConsultationBadge";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "verification", label: "Verification", icon: ClipboardCheck },
  { id: "patients", label: "Patients", icon: Users },
  { id: "bookings", label: "Bookings", icon: Receipt },
];

const shortDate = date => (date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

const SearchBox = ({ value, onChange, placeholder }) => (
  <div className="relative sm:w-72">
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-xl border border-input bg-background/60 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
    />
  </div>
);

const bookingStatus = booking =>
  booking.refundId ? ["Refunded", "bg-brand-amber/15 text-brand-amber"]
    : booking.status === "cancelled" ? ["Cancelled", "bg-muted text-muted-foreground"]
    : booking.status === "pending" ? ["Awaiting doctor", "bg-brand-amber/15 text-brand-amber"]
    : ["Confirmed", "bg-success/15 text-success"];

const Overview = ({ stats, goTo }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatCard icon={IndianRupee} tone="amber" label="Revenue" value={formatPrice(stats.revenue)} hint={`${formatPrice(stats.refunded)} refunded`} />
      <StatCard icon={CalendarDays} label="Bookings" value={stats.bookings} hint={`${stats.cancelled} cancelled`} />
      <StatCard icon={Users} tone="violet" label="Patients" value={stats.patients} hint="registered" />
      <StatCard icon={Stethoscope} tone="highlight" label="Listed doctors" value={stats.doctors.approved} hint={`${stats.doctors.suspended} suspended`} />
    </div>

    {stats.doctors.pending > 0 && (
      <div className="flex flex-col gap-3 rounded-2xl border border-brand-amber/30 bg-brand-amber/10 p-4 sm:flex-row sm:items-center">
        <ShieldCheck className="h-5 w-5 shrink-0 text-brand-amber" />
        <p className="flex-1 text-sm">
          <span className="font-semibold">{stats.doctors.pending} doctor application{stats.doctors.pending > 1 ? "s are" : " is"} waiting for verification.</span>{" "}
          They stay hidden from patients until you approve them.
        </p>
        <Button size="sm" onClick={() => goTo("verification")}>Review now</Button>
      </div>
    )}

    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <SectionCard icon={BarChart3} title="Revenue, last 6 months" subtitle="Paid bookings, refunds left out">
        <RevenueChart months={stats.months} />
      </SectionCard>
      <SectionCard icon={Stethoscope} title="Bookings by specialty">
        <SpecialtyBars items={stats.bySpecialty} />
      </SectionCard>
    </div>

    <SectionCard
      icon={Receipt}
      title="Latest bookings"
      action={<button type="button" onClick={() => goTo("bookings")} className="text-sm font-semibold text-primary hover:underline">See all</button>}
      bodyClassName="px-5"
    >
      {stats.recentBookings.length === 0 ? (
        <EmptyState icon={Receipt} title="No bookings yet" />
      ) : (
        <ul className="divide-y divide-border">
          {stats.recentBookings.map(booking => {
            const [label, style] = bookingStatus(booking);
            return (
              <li key={booking._id} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar src={booking.user.photo} name={booking.user.name} className="h-9 w-9" textClassName="text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{booking.user.name} <span className="font-normal text-muted-foreground">booked</span> {booking.doctor.name}</p>
                  <p className="text-xs text-muted-foreground">{formatAppointment(booking)} · paid {shortDate(booking.createdAt)}</p>
                </div>
                <span className="text-sm font-semibold">{formatPrice(booking.ticketPrice)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  </div>
);

const Verification = ({ counts, onChanged }) => {
  const { token } = useContext(authContext);
  const [status, setStatus] = useState("pending");
  const [query, setQuery] = useState("");
  const [doctors, setDoctors] = useState(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ status, ...(query.trim() && { query: query.trim() }) });
    return apiRequest(`/admin/doctors?${params}`, { token })
      .then(result => setDoctors(result.data))
      .catch(error => toast.error(error.message));
  }, [status, query, token]);

  useEffect(() => {
    setDoctors(null);
    const timer = setTimeout(load, 250); // wait for typing to pause
    return () => clearTimeout(timer);
  }, [load]);

  const act = async (doctor, action, note) => {
    try {
      const result = await apiRequest(`/admin/doctors/${doctor._id}/status`, { token, method: "PUT", body: { action, note } });
      toast.success(result.message);
      // the doctor moves to another list, so drop it from this one
      setDoctors(list => list.filter(item => item._id !== doctor._id));
      onChanged();
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          layoutId="admin-doctor-filter"
          value={status}
          onChange={setStatus}
          options={[
            { value: "pending", label: "Pending", count: counts.pending },
            { value: "approved", label: "Listed", count: counts.approved },
            { value: "rejected", label: "Rejected", count: counts.rejected },
            { value: "suspended", label: "Suspended", count: counts.suspended },
          ]}
        />
        <SearchBox value={query} onChange={setQuery} placeholder="Name, email, specialty, reg. no." />
      </div>
      {!doctors && [0, 1].map(index => <div key={index} className="skeleton h-64 rounded-2xl" />)}
      {doctors?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border">
          <EmptyState icon={BadgeCheck} title={status === "pending" ? "All caught up" : "Nobody here"} text={status === "pending" ? "There are no applications waiting for review." : undefined} />
        </div>
      )}
      {doctors?.map(doctor => <DoctorReviewCard key={doctor._id} doctor={doctor} onAction={act} />)}
    </div>
  );
};

const Patients = () => {
  const { token } = useContext(authContext);
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      apiRequest(`/admin/patients${query.trim() ? `?query=${encodeURIComponent(query.trim())}` : ""}`, { token })
        .then(result => setPatients(result.data))
        .catch(error => toast.error(error.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, token]);

  return (
    <SectionCard icon={Users} title="Patients" subtitle={patients ? `${patients.length} accounts` : "Loading…"} bodyClassName="">
      <div className="border-b border-border p-4"><SearchBox value={query} onChange={setQuery} placeholder="Search by name or email" /></div>
      {!patients ? (
        <div className="skeleton m-4 h-40 rounded-2xl" />
      ) : patients.length === 0 ? (
        <EmptyState icon={UserRound} title="No patients found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Bookings</th>
                <th className="px-5 py-3">Spent</th>
                <th className="px-5 py-3">Last booking</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(patient => (
                <tr key={patient._id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={patient.photo} name={patient.name} className="h-9 w-9" textClassName="text-xs" />
                      <div className="min-w-0">
                        <p className="font-semibold">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{patient.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{shortDate(patient.createdAt)}</td>
                  <td className="px-5 py-3 font-semibold">{patient.bookings}</td>
                  <td className="whitespace-nowrap px-5 py-3">{formatPrice(patient.spent)}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{shortDate(patient.lastBooking)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
};

const Bookings = () => {
  const { token } = useContext(authContext);
  const [status, setStatus] = useState("all");
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    setBookings(null);
    apiRequest(`/admin/bookings?status=${status}`, { token })
      .then(result => setBookings(result.data))
      .catch(error => toast.error(error.message));
  }, [status, token]);

  return (
    <SectionCard icon={Receipt} title="Bookings" subtitle="Every paid appointment on the platform" bodyClassName="">
      <div className="border-b border-border p-4">
        <FilterChips
          layoutId="admin-booking-filter"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "cancelled", label: "Cancelled" },
            { value: "refunded", label: "Refunded" },
          ]}
        />
      </div>
      {!bookings ? (
        <div className="skeleton m-4 h-40 rounded-2xl" />
      ) : bookings.length === 0 ? (
        <EmptyState icon={Receipt} title="No bookings here" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">Appointment</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => {
                const [label, style] = bookingStatus(booking);
                return (
                  <tr key={booking._id} className="border-t border-border hover:bg-muted/40">
                    <td className="whitespace-nowrap px-5 py-3 font-semibold">{booking.user.name}</td>
                    <td className="px-5 py-3">
                      <p className="whitespace-nowrap font-medium">{booking.doctor.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">{booking.doctor.specialization}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      <p className="whitespace-nowrap">{formatAppointment(booking)}</p>
                      <ConsultationBadge booking={booking} className="mt-1" />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-semibold">{formatPrice(booking.ticketPrice)}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">Card</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
};

function AdminDashboard() {
  const { token, user, dispatch } = useContext(authContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const loadStats = useCallback(
    () =>
      apiRequest("/admin/stats", { token })
        .then(result => setStats(result.data))
        .catch(err => setError(err.message)),
    [token]
  );

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const logout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  return (
    <section className="pt-8">
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="card-surface p-4 lg:p-5">
              <div className="flex items-center gap-3 lg:flex-col lg:text-center">
                <Avatar src={user?.photo} name={user?.name} className="h-12 w-12 lg:h-20 lg:w-20" textClassName="lg:text-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{user?.name}</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </span>
                </div>
              </div>
              <nav className="no-scrollbar -mx-1 mt-4 flex gap-1 overflow-x-auto px-1 lg:mt-6 lg:flex-col">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`relative flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                      tab === id ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {tab === id && (
                      <motion.span layoutId="admin-sidebar" className="absolute inset-0 rounded-xl bg-primary/10" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                    )}
                    <Icon className="relative h-4 w-4" />
                    <span className="relative">{label}</span>
                    {id === "verification" && stats?.doctors.pending > 0 && (
                      <span className="relative ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand-amber px-1.5 text-[11px] font-bold text-white">
                        {stats.doctors.pending}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
              <div className="mt-4 border-t border-border pt-4 lg:mt-6 lg:pt-5">
                <Button variant="outline" className="w-full" onClick={logout}><LogOut className="h-4 w-4" /> Log out</Button>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{greeting()}, admin 👋</h1>
              <p className="mt-1 text-muted-foreground">Verify doctors and keep an eye on bookings and revenue.</p>
            </div>

            {error && <p className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
            {!stats && !error && (
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-28 rounded-2xl" />)}
              </div>
            )}

            {stats && (
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                  {tab === "overview" && <Overview stats={stats} goTo={setTab} />}
                  {tab === "verification" && <Verification counts={stats.doctors} onChanged={loadStats} />}
                  {tab === "patients" && <Patients />}
                  {tab === "bookings" && <Bookings />}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;
