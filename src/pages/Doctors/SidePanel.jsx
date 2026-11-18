import { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BellRing, CalendarCheck2, CalendarOff, Check, ChevronDown, Clock, Lock, ShieldCheck, Users } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { Button } from '@/components/ui/button'
import { BASE_URL } from '@/config';
import { authContext } from '@/context/AuthContext';
import ConvertTime from '@/utils/convertTime';
import SlotPicker from '@/components/Booking/SlotPicker';
import Spinner from '@/components/ui/spinner';
import { toast } from 'react-toastify';
import { formatPrice } from '@/utils/formatPrice'
import { QUICK_CALL_MINUTES, quickCallFeeOf } from '@/utils/appointment'
import { TYPE_ICONS } from '@/components/Booking/ConsultationBadge'
import { DEMO_MODE } from '@/brand'
import { leaveLabel, upcomingLeave } from '@/utils/timeOff'
import usePlus, { currentTier } from '@/hooks/usePlus'
import useFamily from '@/hooks/useFamily'
import { relationLabel } from '@/utils/family'
import DemoCardHint from '@/components/Booking/DemoCardHint'
import { DAYS, byDay, modeLabel, offersType } from '@/utils/schedule'

// a fully booked day: Plus and Plus Family members can wait for a slot to open, others see what the plan offers
const WaitlistOffer = ({ doctorId, date, type, canWait, loggedIn }) => {
  const { token } = useContext(authContext)
  const [joined, setJoined] = useState(null)
  const [busy, setBusy] = useState(false)
  if (!loggedIn) return null
  if (!canWait) {
    return (
      <p className="flex items-start gap-2 rounded-xl border border-dashed border-primary/40 p-3 text-xs text-muted-foreground">
        <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>With Medora Plus you can join the waitlist and hear as soon as a slot opens. <Link to="/plans" className="font-semibold text-primary hover:underline">See plans</Link></span>
      </p>
    )
  }
  if (joined === date) {
    return <p className="flex items-center gap-2 rounded-xl bg-success/15 p-3 text-xs font-semibold text-success"><BellRing className="h-4 w-4" /> You&apos;re on the waitlist, we&apos;ll tell you when a slot opens.</p>
  }
  const join = async () => {
    setBusy(true)
    try {
      const result = await apiRequest('/bookings/waitlist', { token, method: 'POST', body: { doctorId, date, consultationType: type } })
      setJoined(date)
      toast.success(result.message)
    } catch (error) {
      toast.error(error.message)
    }
    setBusy(false)
  }
  return (
    <Button type="button" variant="soft" size="sm" className="w-full" onClick={join} disabled={busy}>
      {busy ? <Spinner className="h-4 w-4" /> : <><BellRing className="h-4 w-4" /> Join the waitlist for this day</>}
    </Button>
  )
}

// progress through booking: each step ticks when it's done, the next one is highlighted
const Stepper = ({ steps }) => {
  const current = steps.findIndex(step => !step.done)
  const doneCount = steps.filter(step => step.done).length
  return (
    <div className="mt-6" aria-label={`Booking progress: step ${current + 1} of ${steps.length}`}>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-2 flex justify-between text-xs font-semibold">
        {steps.map((step, index) => (
          <li
            key={step.id}
            aria-current={index === current ? 'step' : undefined}
            className={`flex items-center gap-1 ${step.done ? 'text-success' : index === current ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {step.done ? <Check className="h-3.5 w-3.5" /> : <span>{index + 1}.</span>} {step.label}
          </li>
        ))}
      </ol>
    </div>
  )
}

const StepTitle = ({ number, done, children }) => (
  <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? 'bg-success text-white' : 'bg-primary text-primary-foreground'}`}>
      {done ? <Check className="h-3.5 w-3.5" /> : number}
    </span>
    {children}
  </p>
)

// the three ways to see the doctor
const consultationOptions = doctor => [
  {
    type: 'clinic',
    title: 'Visit the clinic',
    text: doctor.clinicAddress ? `In person at ${doctor.clinicAddress}` : 'In person at the doctor\'s clinic',
    fee: doctor.ticketPrice,
    minutes: doctor.slotDuration || 30,
  },
  {
    type: 'video',
    title: 'Video consultation',
    text: 'A full consultation from home, prescription included',
    fee: doctor.ticketPrice,
    minutes: doctor.slotDuration || 30,
  },
  {
    type: 'quick-call',
    title: 'Quick call first',
    text: 'Not sure you need a visit? A short call to find out',
    fee: quickCallFeeOf(doctor),
    minutes: QUICK_CALL_MINUTES,
  },
]

function SidePanel({timeSlots, ticketPrice , doctorId, doctor = {}}) {
const { token, role } = useContext(authContext)
// a Medora Plus member sees their own (better) refund rates
const plus = usePlus()
const tier = currentTier(plus)
const refundTiers = tier?.refund || { early: 0.9, late: 0.5 }
const refundEarly = Math.round(refundTiers.early * 100)
const refundLate = Math.round(refundTiers.late * 100)
const navigate = useNavigate()
const location = useLocation()
// { date: "YYYY-MM-DD", time: "HH:mm" } once the patient picks a slot
const [selectedSlot, setSelectedSlot] = useState(null)
// "clinic" | "video" | "quick-call"; the symptom checker can suggest one
const [consultationType, setConsultationType] = useState(() =>
  ['clinic', 'video', 'quick-call'].includes(location.state?.consultationType) ? location.state.consultationType : 'video'
)
// the weekly routine by day; a kind of visit no shift offers can't be chosen
const hours = byDay(timeSlots)
const options = consultationOptions({ ticketPrice, ...doctor }).map(option => ({ ...option, offered: offersType(timeSlots, option.type) }))
const chosen = options.find(option => option.type === consultationType)
// the doctor doesn't offer the preselected kind of visit: start with one they do
const firstOffered = options.find(option => option.offered)?.type
useEffect(() => {
  if (!chosen.offered && firstOffered) setConsultationType(firstOffered)
}, [chosen.offered, firstOffered])
const [loading, setLoading] = useState(false)
// Plus Family: who the visit is for ("" = the account holder) and the discount on every visit
const family = useFamily()
const [memberId, setMemberId] = useState('')
const familyMembers = family?.canBook ? family.members : []
const discount = tier?.consultDiscount || 0
const priceOf = fee => (discount > 0 && fee ? Math.round(fee * (1 - discount) * 100) / 100 : fee)
// booking in steps: who (Plus Family only), kind of visit, time, then pay on Stripe's page
const forFamily = familyMembers.length > 0
const steps = [
  ...(forFamily ? [{ id: 'who', label: 'Who', done: true }] : []),
  { id: 'type', label: 'Visit', done: Boolean(chosen?.offered) },
  { id: 'time', label: 'Time', done: Boolean(selectedSlot) },
  { id: 'pay', label: 'Pay', done: false },
]
const stepNumber = id => steps.findIndex(step => step.id === id) + 1

const bookingHandler = async()=>{
  if (!token) {
    toast.info('Please login to book an appointment')
    // come back to this doctor after logging in
    return navigate('/login', { state: { from: location } })
  }
  if (!selectedSlot) {
    return toast.info('Please select a date and time first')
  }
  setLoading(true)
  try {
    const res = await fetch(`${BASE_URL}/bookings/checkout-session/${doctorId}`,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
        },
      body: JSON.stringify({ ...selectedSlot, consultationType, ...(memberId && { memberId }) }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message)
    }
    if (data.session?.url) {
      window.location.href = data.session.url
    }
  } catch (error) {
    toast.error(error.message)
    setLoading(false)
  }
}

  return (
    <div className="card-surface p-5 lg:sticky lg:top-24 lg:p-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{role === 'doctor' ? 'Consultation fee' : chosen.title}</p>
          <p className="text-3xl font-extrabold">
            {chosen.fee ? formatPrice(role === 'doctor' ? chosen.fee : priceOf(chosen.fee)) : '—'}
            <span className="text-base font-medium text-muted-foreground"> / {chosen.minutes} min</span>
          </p>
          {role !== 'doctor' && discount > 0 && chosen.fee > 0 && (
            <p className="text-xs font-semibold text-highlight">
              <span className="font-normal text-muted-foreground line-through">{formatPrice(chosen.fee)}</span> {Math.round(discount * 100)}% Plus Family discount
            </p>
          )}
        </div>
        <span className="flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
          <ShieldCheck className="h-3.5 w-3.5" /> Verified
        </span>
      </div>

      {timeSlots?.length > 0 && (
        <details className="group mt-6 rounded-2xl bg-muted/60 p-4" open={role === 'doctor'}>
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            <Clock className="h-4 w-4 text-primary" /> Weekly hours
            <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-3 space-y-2">
            {DAYS.filter(day => hours[day.id].length).map(day => (
              <li key={day.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="font-medium text-foreground">{day.label}</span>
                <span className="text-right text-muted-foreground">
                  {hours[day.id].map((item, index) => (
                    <span key={index} className="block">
                      {ConvertTime(item.startingTime)} – {ConvertTime(item.EndingTime)}
                      {item.mode && item.mode !== 'both' && <span className="ml-1 text-xs">({modeLabel(item.mode).toLowerCase()})</span>}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          {upcomingLeave(doctor.timeOff).length > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-brand-amber"><CalendarOff className="h-4 w-4" /> On leave</p>
              <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                {upcomingLeave(doctor.timeOff).slice(0, 3).map(entry => <li key={`${entry.from}-${entry.to}`}>{leaveLabel(entry)}</li>)}
              </ul>
            </div>
          )}
        </details>
      )}

      {/* doctors can't book appointments, so they only see the weekly hours */}
      {role !== 'doctor' && (
        <>
          <Stepper steps={steps} />

          {/* Plus Family: who the visit is for */}
          {familyMembers.length > 0 && (
            <div className="mt-6">
              <StepTitle number={stepNumber('who')} done>Who is this visit for? <Users className="h-4 w-4 text-primary" /></StepTitle>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Who is this visit for">
                {[{ _id: '', name: 'Me' }, ...familyMembers].map(person => {
                  const active = memberId === person._id
                  return (
                    <button
                      key={person._id || 'me'}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setMemberId(person._id)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {person.name}{person.relation && <span className={`ml-1 text-xs font-normal ${active ? 'text-primary-foreground/80' : ''}`}>({relationLabel(person.relation)})</span>}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">The doctor sees {memberId ? 'their' : 'your'} health record for this visit.</p>
            </div>
          )}

          {/* how to see the doctor */}
          <div className="mt-6">
            <StepTitle number={stepNumber('type')} done={Boolean(chosen?.offered)}>How would you like to see the doctor?</StepTitle>
            <div className="grid gap-2" role="radiogroup" aria-label="Type of appointment">
              {options.map(option => {
                const Icon = TYPE_ICONS[option.type]
                const active = option.type === consultationType
                return (
                  <button
                    key={option.type}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={!option.offered}
                    onClick={() => { setConsultationType(option.type); setSelectedSlot(null) }}
                    className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                      active ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-bold">{option.title}</span>
                        <span className="text-sm font-bold">{option.fee ? formatPrice(priceOf(option.fee)) : '—'}</span>
                      </span>
                      <span className="block text-xs text-muted-foreground">{option.offered ? `${option.text} · ${option.minutes} min` : 'Not offered in this doctor\'s weekly hours'}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* when */}
          <div className="mt-6">
            <StepTitle number={stepNumber('time')} done={Boolean(selectedSlot)}>Pick a time</StepTitle>
            <SlotPicker
              doctorId={doctorId}
              type={consultationType}
              selected={selectedSlot}
              onSelect={setSelectedSlot}
              empty={(date, { noHours } = {}) => !noHours && <WaitlistOffer doctorId={doctorId} date={date} type={consultationType} canWait={Boolean(tier?.waitlist)} loggedIn={Boolean(token)} />}
            />
          </div>
          <Button
            onClick={bookingHandler}
            disabled={loading || !selectedSlot}
            variant="gradient"
            size="lg"
            className="mt-6 w-full"
          >
            {loading ? <Spinner className="text-white" /> : <><CalendarCheck2 className="h-5 w-5" /> {selectedSlot ? `Pay ${formatPrice(priceOf(chosen.fee))} & ${doctor.instantBooking ? 'book' : 'send request'}` : 'Select a slot'}</>}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Secure card payment via Stripe
          </p>
          {/* refund terms right under the button, before anyone pays */}
          <p className="mt-2 rounded-xl bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">
            {doctor.instantBooking
              ? 'Instant booking: your appointment is confirmed as soon as you pay. If the doctor cancels, you get a full refund.'
              : 'The doctor confirms your request for that slot. If they decline or cancel, you get a full refund.'}
            {consultationType !== 'clinic' && ' The video room opens 10 minutes before a confirmed appointment.'}
            <span className="mt-1 block font-medium text-foreground">
              {doctor.instantBooking
                ? `Changed your mind? ${refundEarly}% back up to 2 hours before, ${refundLate}% after.`
                : `Changed your mind? Free until the doctor confirms, then ${refundEarly}% back up to 2 hours before and ${refundLate}% after.`}
              {plus?.plus && ` (your ${tier.label} rates)`}
            </span>
          </p>
          {DEMO_MODE && <DemoCardHint />}
        </>
      )}
    </div>
  );
}

export default SidePanel
