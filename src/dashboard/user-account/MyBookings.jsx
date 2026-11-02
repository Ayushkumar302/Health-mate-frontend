import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BASE_URL } from '@/config';
import { CalendarClock, FileText, Hourglass, MessageSquare, RotateCcw, Star, Video, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '@/components/ui/avatar';
import Spinner from '@/components/ui/spinner';
import { authContext } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { Button } from '@/components/ui/button';
import SlotPicker from '@/components/Booking/SlotPicker';
import CallDetails from '@/components/Video/CallDetails';
import ConsultationBadge from '@/components/Booking/ConsultationBadge';
import { formatPrice } from '@/utils/formatPrice';
import {
  CANCEL_CUTOFF_HOURS,
  appointmentStart,
  canJoinVideo,
  formatAppointment,
  getAppointmentStatus,
  hoursUntil,
  statusLabels,
  statusStyles,
  useNow,
} from '@/utils/appointment';

export const BookingItem = ({ booking, onChanged, hasPrescription }) => {
  const { token } = useContext(authContext);
  const [rescheduling, setRescheduling] = useState(false);
  const [newSlot, setNewSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();

  const now = useNow();
  const { doctor } = booking;
  const status = getAppointmentStatus(booking, now);
  const joinable = canJoinVideo(booking, now);
  const active = status === 'upcoming' || status === 'requested';
  // a request the doctor hasn't accepted can be withdrawn any time, a confirmed one up to 2 hours before
  const canCancel = status === 'requested' || (status === 'upcoming' && hoursUntil(booking) >= CANCEL_CUTOFF_HOURS);

  const updateBooking = async (action, body) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/bookings/${booking._id}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body || {}),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message);
      }
      toast.success(result.message);
      setRescheduling(false);
      setNewSlot(null);
      onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const ok = await confirm(
      status === 'requested'
        ? { title: 'Withdraw this request?', message: 'The doctor won\'t see it any more and you get a full refund.', confirmText: 'Withdraw request', cancelText: 'Keep it', tone: 'danger' }
        : { title: 'Cancel this appointment?', message: 'The slot is given back and your payment is refunded in 5-10 days.', confirmText: 'Cancel appointment', cancelText: 'Keep it', tone: 'danger' }
    );
    if (!ok) return;
    updateBooking('cancel');
  };

  return (
    <motion.div
      layout
      className={`card-surface p-5 transition-colors ${
        status === 'ongoing' ? 'border-highlight/50 ring-4 ring-highlight/10' : 'hover:border-primary/30'
      }`}
    >
      {status === 'ongoing' && (
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-highlight">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-highlight opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-highlight" />
          </span>
          Your consultation is live
        </p>
      )}
      <div className="flex items-center gap-4">
        <Avatar src={doctor.photo} name={doctor.name} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <Link to={`/doctors/${doctor._id}`} className="block truncate text-lg font-bold text-foreground hover:text-primary">
            {doctor.name}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <ConsultationBadge booking={booking} />
            <span className="text-sm capitalize text-muted-foreground">{doctor.specialization}</span>
          </div>
        </div>
        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
          {statusLabels[status]}
        </span>
      </div>

      {status === 'requested' && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-amber/10 px-4 py-3 text-sm">
          <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
          <span>
            <span className="font-semibold">Request sent, waiting for {doctor.name} to confirm.</span>{' '}
            You&apos;ll get a notification here. If they decline or don&apos;t answer in time, you get a full refund.
          </span>
        </p>
      )}
      {status === 'cancelled' && booking.declineReason && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {booking.cancelledBy === 'system' ? booking.declineReason : <>Declined by the doctor: {booking.declineReason}</>}
            {booking.refundId && ' · refunded'}
          </span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-muted/60 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 font-semibold text-foreground">
          <CalendarClock className="h-4 w-4 text-primary" /> {formatAppointment(booking)}
        </span>
        <span className="text-muted-foreground">
          {formatPrice(booking.ticketPrice)}
          {booking.status === 'cancelled' && booking.refundId && ' · refunded'}
        </span>
      </div>

      <CallDetails booking={booking} now={now} />

      {(active || joinable) && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* video call button appears 10 minutes before the appointment */}
          {joinable && (
            <Link to={`/consultation/${booking._id}`}>
              <Button size="sm">
                <Video className="h-4 w-4" /> Join video call
              </Button>
            </Link>
          )}
          {active && (
          <>
          <Button size="sm" variant="outline" disabled={loading} onClick={() => setRescheduling(!rescheduling)}>
            {rescheduling ? 'Close' : 'Reschedule'}
          </Button>
          <Link to={`/messages?with=${doctor._id}`}>
            <Button size="sm" variant="ghost"><MessageSquare className="h-4 w-4" /> Message</Button>
          </Link>
          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" disabled={loading || !canCancel} onClick={handleCancel}>
            {status === 'requested' ? 'Withdraw request' : 'Cancel'}
          </Button>
          </>
          )}
          {status === 'upcoming' && !canCancel && (
            <p className="w-full text-xs text-muted-foreground">
              Less than {CANCEL_CUTOFF_HOURS} hours left, you can only reschedule this appointment.
            </p>
          )}
        </div>
      )}

      {status === 'completed' && (
        <div className="mt-4 flex flex-wrap gap-3">
          {hasPrescription && (
            <Link to={`/prescriptions/${booking._id}`}>
              <Button size="sm"><FileText className="h-4 w-4" /> View prescription</Button>
            </Link>
          )}
          <Link to={`/messages?with=${doctor._id}`}>
            <Button size="sm" variant="outline"><MessageSquare className="h-4 w-4" /> Message</Button>
          </Link>
          <Link to={`/doctors/${doctor._id}`}>
            <Button size="sm" variant="outline"><RotateCcw className="h-4 w-4" /> Book again</Button>
          </Link>
          <Link to={`/doctors/${doctor._id}?tab=feedback`}>
            <Button size="sm" variant="soft"><Star className="h-4 w-4" /> Write a review</Button>
          </Link>
        </div>
      )}

      <AnimatePresence>
        {rescheduling && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-2xl border border-border bg-background/50 p-4">
              <SlotPicker doctorId={doctor._id} selected={newSlot} onSelect={setNewSlot} />
              <p className="mt-3 text-xs text-muted-foreground">The doctor confirms the new time, just like a new request.</p>
              <Button
                className="mt-4"
                disabled={loading || !newSlot}
                onClick={() => updateBooking('reschedule', newSlot)}
              >
                {loading ? <Spinner className="text-primary-foreground" /> : 'Confirm new time'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// live calls first, then upcoming (soonest first), then completed and cancelled (newest first)
const statusOrder = { ongoing: 0, requested: 1, upcoming: 1, completed: 2, cancelled: 3 };
export const sortBookings = (bookings, now) =>
  bookings
    .map(booking => ({ booking, status: getAppointmentStatus(booking, now), start: appointmentStart(booking)?.getTime() || 0 }))
    .sort((a, b) =>
      statusOrder[a.status] - statusOrder[b.status] ||
      (['upcoming', 'requested', 'ongoing'].includes(a.status) ? a.start - b.start : b.start - a.start)
    )
    .map(item => item.booking);

// list of booking cards; the dashboard loads the bookings once and passes them in
const BookingsList = ({ bookings, onChanged, empty, prescribed }) => {
  const now = useNow();
  const sorted = sortBookings(bookings, now);

  if (sorted.length === 0) return empty;

  return (
    <div className="grid grid-cols-1 gap-4">
      {sorted.map(booking => (
        <BookingItem key={booking._id} booking={booking} onChanged={onChanged} hasPrescription={prescribed?.has(booking._id)} />
      ))}
    </div>
  );
};

export default BookingsList;
