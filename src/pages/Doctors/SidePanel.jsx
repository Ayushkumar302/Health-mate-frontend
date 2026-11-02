import { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarCheck2, CalendarOff, Check, Clock, Copy, CreditCard, Lock, ShieldCheck } from 'lucide-react';
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

const TEST_CARD = '4242 4242 4242 4242'

// demo: the Stripe test card, so visitors know what to type on the payment page
const DemoCardHint = () => {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(TEST_CARD.replace(/\s/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="mt-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 text-xs">
      <p className="flex items-center gap-1.5 font-semibold text-foreground">
        <CreditCard className="h-3.5 w-3.5 text-primary" /> Demo payment, no real money
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2">
        <span className="font-mono text-sm font-bold tracking-wider">{TEST_CARD}</span>
        <button type="button" onClick={copy} className="flex items-center gap-1 font-semibold text-primary hover:underline">
          {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
        </button>
      </div>
      <p className="mt-2 text-muted-foreground">
        Any future date (e.g. <span className="font-semibold text-foreground">12/34</span>), any CVC (e.g. <span className="font-semibold text-foreground">123</span>), any name.
      </p>
    </div>
  )
}

// the three ways to see the doctor, step 1 of booking
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
const navigate = useNavigate()
const location = useLocation()
// { date: "YYYY-MM-DD", time: "HH:mm" } once the patient picks a slot
const [selectedSlot, setSelectedSlot] = useState(null)
// "clinic" | "video" | "quick-call"; the symptom checker can suggest one
const [consultationType, setConsultationType] = useState(() =>
  ['clinic', 'video', 'quick-call'].includes(location.state?.consultationType) ? location.state.consultationType : 'video'
)
const options = consultationOptions({ ticketPrice, ...doctor })
const chosen = options.find(option => option.type === consultationType)
const [loading, setLoading] = useState(false)

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
      body: JSON.stringify({ ...selectedSlot, consultationType }),
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
            {chosen.fee ? formatPrice(chosen.fee) : '—'}
            <span className="text-base font-medium text-muted-foreground"> / {chosen.minutes} min</span>
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
          <ShieldCheck className="h-3.5 w-3.5" /> Verified
        </span>
      </div>

      {timeSlots?.length > 0 && (
        <div className="mt-6 rounded-2xl bg-muted/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-primary" /> Weekly hours
          </p>
          <ul className="mt-3 space-y-2">
            {timeSlots.map((item, index) => (
              <li key={index} className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize text-foreground">{item.day}</span>
                <span className="text-muted-foreground">
                  {ConvertTime(item.startingTime)} – {ConvertTime(item.EndingTime)}
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
        </div>
      )}

      {/* doctors can't book appointments, so they only see the weekly hours */}
      {role !== 'doctor' && (
        <>
          {/* step 1: how to see the doctor */}
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold">1. How would you like to see the doctor?</p>
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
                    onClick={() => setConsultationType(option.type)}
                    className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                      active ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-bold">{option.title}</span>
                        <span className="text-sm font-bold">{option.fee ? formatPrice(option.fee) : '—'}</span>
                      </span>
                      <span className="block text-xs text-muted-foreground">{option.text} · {option.minutes} min</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* step 2: when */}
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold">2. Pick a time</p>
            <SlotPicker doctorId={doctorId} selected={selectedSlot} onSelect={setSelectedSlot} />
          </div>
          <Button
            onClick={bookingHandler}
            disabled={loading || !selectedSlot}
            variant="gradient"
            size="lg"
            className="mt-6 w-full"
          >
            {loading ? <Spinner className="text-white" /> : <><CalendarCheck2 className="h-5 w-5" /> {selectedSlot ? `Pay ${formatPrice(chosen.fee)} & send request` : 'Select a slot'}</>}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Secure card payment via Stripe
          </p>
          {DEMO_MODE && <DemoCardHint />}
          <p className="mt-2 rounded-xl bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">
            The doctor confirms your request for that slot. If they decline, you get a full refund.
            {consultationType !== 'clinic' && ' The video room opens 10 minutes before a confirmed appointment.'}
          </p>
        </>
      )}
    </div>
  );
}

export default SidePanel
