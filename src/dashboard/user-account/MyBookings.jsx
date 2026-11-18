import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BASE_URL } from '@/config';
import { CalendarClock, ClipboardPen, FileText, Hourglass, MessageSquare, RotateCcw, Star, Users, Video, XCircle } from 'lucide-react';
import { IntakeForm } from '@/components/AI/Intake';
import { AddToCalendar, ReceiptButton } from '@/components/Booking/BookingExtras';
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
import { apiRequest } from '@/utils/api';
import usePlus, { currentTier } from '@/hooks/usePlus';
import {
  CANCEL_CUTOFF_HOURS,
  MAX_RESCHEDULES,
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
  const [intakeOpen, setIntakeOpen] = useState(false);
  const confirm = useConfirm();

  const now = useNow();
  const { doctor } = booking;
  const status = getAppointmentStatus(booking, now);
  const joinable = canJoinVideo(booking, now);
  const active = status === 'upcoming' || status === 'requested';
  // anything that hasn't started can be cancelled; how much comes back depends on timing (see refundNote)
  const canCancel = status === 'requested' || status === 'upcoming';
  const lateCancel = status === 'upcoming' && hoursUntil(booking) < CANCEL_CUTOFF_HOURS;
  // the patient's plan decides the refund and how often an appointment can be moved (null: no limit)
  const tier = currentTier(usePlus());
  const refundTiers = tier?.refund || { early: 0.9, late: 0.5 };
  const maxMoves = tier ? tier.reschedules : MAX_RESCHEDULES;
  const unlimitedMoves = maxMoves === null;
  const movesLeft = unlimitedMoves ? Infinity : maxMoves - (booking.rescheduleCount || 0);
  const canReschedule = movesLeft > 0;

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
    // the server works out the refund, so what the patient reads is exactly what they get
    let quote;
    try {
      quote = (await apiRequest(`/bookings/${booking._id}/refund-quote`, { token })).data;
    } catch (err) {
      return toast.error(err.message);
    }
    const plusText = quote.plusExtra > 0 ? ` That includes ${formatPrice(quote.plusExtra)} extra from Medora Plus.` : '';
    const refundText = quote.share === 1
      ? `You get a full refund in 5-10 days.${plusText}`
      : `You get ${formatPrice(quote.refund)} back in 5-10 days. ${formatPrice(quote.fee)} is kept as a cancellation fee because the doctor already confirmed${lateCancel ? ' and it is less than 2 hours before' : ''}.${plusText}`;
    const ok = await confirm(
      status === 'requested' && quote.share === 1
        ? { title: 'Withdraw this request?', message: `The doctor won't see it any more. ${refundText}`, confirmText: 'Withdraw request', cancelText: 'Keep it', tone: 'danger' }
        : { title: 'Cancel this appointment?', message: `The slot is given back. ${refundText}`, confirmText: 'Cancel appointment', cancelText: 'Keep it', tone: 'danger' }
    );
    if (!ok) return;
    updateBooking('cancel');
  };

  // what was given back on a cancelled booking
  const refundNote = booking.refundedAmount != null
    ? booking.refundedAmount >= booking.ticketPrice ? ' · refunded in full' : booking.refundedAmount > 0 ? ` · ${formatPrice(booking.refundedAmount)} refunded` : ''
    : booking.refundId ? ' · refunded' : '';

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
          <Link to={`/doctors/${doctor._id}`} className="block break-words text-lg font-bold leading-snug text-foreground hover:text-primary sm:truncate">
            {doctor.name}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {/* on phones the status sits with the other badges so the name has the full width */}
            <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold sm:hidden ${statusStyles[status]}`}>
              {statusLabels[status]}
            </span>
            <ConsultationBadge booking={booking} />
            <span className="text-sm capitalize text-muted-foreground">{doctor.specialization}</span>
            {booking.familyMember?.name && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-violet/15 px-2 py-0.5 text-xs font-semibold text-brand-violet">
                <Users className="h-3 w-3" /> For {booking.familyMember.name}
              </span>
            )}
          </div>
        </div>
        <span className={`hidden whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold sm:inline ${statusStyles[status]}`}>
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
            {booking.cancelledBy === 'system' || booking.noShow === 'doctor' ? booking.declineReason : <>Declined by the doctor: {booking.declineReason}</>}
            {refundNote}
          </span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-muted/60 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 font-semibold text-foreground">
          <CalendarClock className="h-4 w-4 text-primary" /> {formatAppointment(booking)}
        </span>
        <span className="text-muted-foreground">
          {formatPrice(booking.ticketPrice)}
          {booking.familyDiscount > 0 && ` (${formatPrice(booking.familyDiscount)} family discount)`}
          {booking.status === 'cancelled' && refundNote}
          {booking.noShow === 'patient' && ' · marked as missed, not refunded'}
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
          <Button
            size="sm"
            variant="outline"
            disabled={loading || !canReschedule}
            title={canReschedule ? undefined : `Your plan lets you move an appointment ${maxMoves === 1 ? 'once' : `${maxMoves} times`}. Medora Plus has no limit`}
            onClick={() => setRescheduling(!rescheduling)}
          >
            {rescheduling ? 'Close' : canReschedule ? 'Reschedule' : maxMoves === 1 ? 'Moved once' : `Moved ${maxMoves} times`}
          </Button>
          {status === 'upcoming' && <AddToCalendar booking={booking} />}
          <Button size="sm" variant={booking.intake?.submittedAt ? 'ghost' : 'soft'} onClick={() => setIntakeOpen(true)}>
            <ClipboardPen className="h-4 w-4" /> {booking.intake?.submittedAt ? 'Edit pre-visit notes' : 'Tell the doctor before'}
          </Button>
          <Link to={`/messages?with=${doctor._id}`}>
            <Button size="sm" variant="ghost"><MessageSquare className="h-4 w-4" /> Message</Button>
          </Link>
          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" disabled={loading || !canCancel} onClick={handleCancel}>
            {status === 'requested' ? 'Withdraw request' : 'Cancel'}
          </Button>
          </>
          )}
          {status === 'upcoming' && (
            <p className="w-full text-xs text-muted-foreground">
              {lateCancel
                ? `Less than ${CANCEL_CUTOFF_HOURS} hours left: cancelling now refunds ${Math.round(refundTiers.late * 100)}%.`
                : `Cancel up to ${CANCEL_CUTOFF_HOURS} hours before for a ${Math.round(refundTiers.early * 100)}% refund, ${Math.round(refundTiers.late * 100)}% after that.`}
              {unlimitedMoves
                ? ' You can move it as often as you need.'
                : canReschedule && ` You can move it to another time ${movesLeft === 1 ? 'once more' : `${movesLeft} more times`}, for free.`}
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
          <ReceiptButton booking={booking} />
          {booking.reviewDue && (
            <Link to={`/doctors/${doctor._id}?tab=feedback`}>
              <Button size="sm" variant="soft"><Star className="h-4 w-4" /> Write a review</Button>
            </Link>
          )}
          {booking.reviewed && (
            <span className="inline-flex items-center gap-1 self-center text-xs font-semibold text-muted-foreground"><Star className="h-3.5 w-3.5 fill-current text-brand-amber" /> Reviewed</span>
          )}
        </div>
      )}

      {intakeOpen && <IntakeForm booking={booking} open onClose={() => setIntakeOpen(false)} onSaved={onChanged} />}

      <AnimatePresence>
        {rescheduling && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-2xl border border-border bg-background/50 p-4">
              <SlotPicker doctorId={doctor._id} type={booking.consultationType} selected={newSlot} onSelect={setNewSlot} />
              <p className="mt-3 text-xs text-muted-foreground">
                The doctor confirms the new time, just like a new request.{' '}
                {unlimitedMoves ? 'Your plan lets you move it as often as you need.' : `Moves left after this one: ${Math.max(0, movesLeft - 1)}.`}
              </p>
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
