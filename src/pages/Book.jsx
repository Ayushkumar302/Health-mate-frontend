import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { CalendarCheck2, CheckCircle2, Clock, Download, Lock, MessageSquarePlus, Phone, ShieldAlert, Sparkles, Star, XCircle } from "lucide-react";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { formatPrice } from "@/utils/formatPrice";
import { downloadPdf } from "@/utils/calendar";
import { chatKey, clearChat, loadChat, newId, saveChat } from "@/utils/chatStorage";
import { BotMessage, BotText, ChatLog, ChatPanel, Composer, MyMessage, Note, Suggestions } from "@/components/Assistant/Chat";
import { TYPE_ICONS } from "@/components/Booking/ConsultationBadge";
import DemoCardHint from "@/components/Booking/DemoCardHint";
import Avatar from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import usePlus, { currentTier } from "@/hooks/usePlus";
import { DEMO_MODE } from "@/brand";

const EXAMPLES = [
  "Skin doctor tomorrow evening, video",
  "Dentist on Saturday morning at the clinic",
  "General physician today under ₹500",
  "Kal subah bachche ke liye doctor",
];

const capital = text => String(text || "").replace(/\b\w/g, char => char.toUpperCase());

// "Dermatologist · Tue, 18 Nov · evening", with "(quick match)" when the rules read the message
const Understood = ({ data }) =>
  data.understood ? (
    <p className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
      <Sparkles className="h-3.5 w-3.5 shrink-0" /> {data.understood}
      {data.source === "rules" && <span className="font-normal text-muted-foreground">(quick match)</span>}
    </p>
  ) : null;

const Emergency = ({ emergency }) => (
  <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
    <p className="flex items-center gap-2 font-bold text-destructive"><ShieldAlert className="h-5 w-5" /> This sounds urgent</p>
    <p className="mt-1">{emergency.message}</p>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      {emergency.actions.map(action => <li key={action}>{action}</li>)}
    </ul>
    <a href="tel:112" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 font-semibold text-destructive-foreground">
      <Phone className="h-4 w-4" /> Call 112
    </a>
  </div>
);

// one doctor with a few free times
const OptionCard = ({ option, onPick, disabled }) => {
  const { doctor } = option;
  const TypeIcon = TYPE_ICONS[option.type];
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar src={doctor.photo} name={doctor.name} className="h-11 w-11" textClassName="text-xs" />
        <div className="min-w-0 flex-1">
          <Link to={`/doctors/${doctor._id}`} className="block truncate font-bold hover:text-primary">{doctor.name}</Link>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {capital(doctor.specialization)}
            {doctor.totalRating > 0 && (
              <>
                {" · "}<Star className="h-3 w-3 fill-brand-amber text-brand-amber" /> {Number(doctor.averageRating).toFixed(1)} ({doctor.totalRating})
              </>
            )}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-bold">{formatPrice(option.price)}</p>
          {option.price < option.fee && <p className="text-[11px] text-muted-foreground line-through">{formatPrice(option.fee)}</p>}
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        {TypeIcon && <TypeIcon className="h-3.5 w-3.5" />} {option.typeLabel} · {option.minutes} min · {option.dayLabel}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {option.times.map(slot => {
          // the time the patient asked for stands out
          const asked = slot.time === option.exactTime;
          return (
            <button
              key={slot.time}
              type="button"
              disabled={disabled}
              onClick={() => onPick(option, slot)}
              aria-label={`${slot.label} with ${doctor.name}, ${option.dayLabel}${asked ? " (the time you asked for)" : ""}`}
              className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                asked
                  ? "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  : "border-primary/30 bg-primary/5 text-primary hover:border-primary hover:bg-primary/15"
              }`}
            >
              {slot.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// the last step before Stripe: what, when, for whom, the price and the refund rules
const Confirm = ({ option, slot, member, onPay, paying, onChange }) => {
  const plus = usePlus();
  const tier = currentTier(plus);
  const early = Math.round((tier?.refund?.early ?? 0.9) * 100);
  const late = Math.round((tier?.refund?.late ?? 0.5) * 100);
  return (
    <div className="rounded-2xl border-2 border-primary/40 bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-primary">Check and pay</p>
      <p className="mt-1 font-bold">{option.typeLabel} with {option.doctor.name}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div><dt className="text-xs text-muted-foreground">When</dt><dd className="font-semibold">{option.dayLabel}, {slot.label}</dd></div>
        <div><dt className="text-xs text-muted-foreground">For</dt><dd className="font-semibold">{member?.name || "You"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Length</dt><dd className="font-semibold">{option.minutes} min</dd></div>
        <div>
          <dt className="text-xs text-muted-foreground">Price</dt>
          <dd className="font-semibold">
            {formatPrice(option.price)}
            {option.price < option.fee && <span className="ml-1 text-xs font-normal text-muted-foreground line-through">{formatPrice(option.fee)}</span>}
          </dd>
        </div>
      </dl>
      <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        {option.instant
          ? "Instant booking: confirmed as soon as you pay. If the doctor cancels, you get a full refund."
          : "The doctor confirms your request. If they decline or cancel, you get a full refund."}{" "}
        <span className="font-medium text-foreground">
          {option.instant ? `Changed your mind? ${early}% back up to 2 hours before, ${late}% after.` : `Changed your mind? Free until the doctor confirms, then ${early}% back up to 2 hours before and ${late}% after.`}
        </span>
      </p>
      {DEMO_MODE && <DemoCardHint />}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={onPay} disabled={paying}>
          {paying ? <Spinner className="h-4 w-4 text-primary-foreground" /> : <><Lock className="h-4 w-4" /> Pay {formatPrice(option.price)}</>}
        </Button>
        <Button variant="ghost" onClick={onChange} disabled={paying}>Change something</Button>
      </div>
    </div>
  );
};

// what happened to a time the patient paid for: waiting for the doctor, confirmed or cancelled
const BOOKED = {
  pending: { icon: Clock, title: "Paid · waiting for the doctor", border: "border-primary/40", text: "text-primary" },
  approved: { icon: CheckCircle2, title: "Booked and confirmed", border: "border-success/40", text: "text-success" },
  cancelled: { icon: XCircle, title: "Cancelled", border: "border-destructive/40", text: "text-destructive" },
};

// after paying, the "Check and pay" card turns into the booking itself
const Booked = ({ booking, option, member, token, onAnother }) => {
  const state = BOOKED[booking.status] || BOOKED.pending;
  const Icon = state.icon;
  const doctorName = booking.doctor?.name || option.doctor.name;
  const day = new Date(`${booking.appointmentDate}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const [hours, minutes] = String(booking.appointmentTime).split(":").map(Number);
  const when = `${day}, ${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
  const number = `MED-${String(booking._id).slice(-8).toUpperCase()}`;
  const [downloading, setDownloading] = useState(false);
  const receipt = async () => {
    setDownloading(true);
    try {
      await downloadPdf(token, `/bookings/${booking._id}/receipt`, `medora-receipt-${number}.pdf`);
    } catch (error) {
      toast.error(error.message);
    }
    setDownloading(false);
  };
  const note =
    booking.status === "approved"
      ? `${doctorName} confirmed it.${booking.consultationType !== "clinic" ? " The video room opens 10 minutes before, from your Visits." : " Please reach the clinic a few minutes early."}`
      : booking.status === "cancelled"
        ? booking.refundedAmount > 0
          ? `${formatPrice(booking.refundedAmount)} was refunded to your card.`
          : "This booking was cancelled."
        : `${doctorName} has your request and will confirm it soon. If they decline, you get a full refund. We'll let you know either way.`;
  return (
    <div className={`rounded-2xl border-2 bg-card p-4 ${state.border}`}>
      <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${state.text}`}>
        <Icon className="h-4 w-4" /> {state.title}
      </p>
      <p className="mt-1 font-bold">{option.typeLabel} with {doctorName}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div><dt className="text-xs text-muted-foreground">When</dt><dd className="font-semibold">{when}</dd></div>
        <div><dt className="text-xs text-muted-foreground">For</dt><dd className="font-semibold">{booking.familyMember?.name || member?.name || "You"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Paid</dt><dd className="font-semibold">{formatPrice(booking.ticketPrice)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Booking no.</dt><dd className="font-mono text-xs font-semibold">{number}</dd></div>
      </dl>
      <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{note}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/users/profile/me?appointments">
          <Button size="sm"><CalendarCheck2 className="h-4 w-4" /> See it in my visits</Button>
        </Link>
        <Button size="sm" variant="outline" onClick={receipt} disabled={downloading}>
          {downloading ? <Spinner className="h-4 w-4" /> : <><Download className="h-4 w-4" /> Receipt</>}
        </Button>
        <Button size="sm" variant="ghost" onClick={onAnother}>Book another</Button>
      </div>
    </div>
  );
};

// "Book with AI": the patient says what they need, picks a time, checks it and pays (Stripe, like the booking panel)
function Book() {
  const { token, user } = useContext(authContext);
  const key = chatKey("book", user?._id);
  const saved = loadChat(key);
  const [messages, setMessages] = useState(saved?.messages || []);
  // the request so far, sent back with each message so "make it Friday" only changes the day
  const [current, setCurrent] = useState(saved?.current || null);
  const [left, setLeft] = useState(saved?.left ?? null);
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState("");
  // the patient's paid bookings, to show what became of a time they paid for (null until loaded)
  const [bookings, setBookings] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    saveChat(key, { messages: messages.slice(-30), current, left });
  }, [key, messages, current, left]);

  // looked up when the page opens (also on coming back from Stripe) and when the tab gets focus again
  const hasConfirm = messages.some(message => message.data?.kind === "confirm");
  useEffect(() => {
    if (!hasConfirm || !token) return undefined;
    let alive = true;
    const load = () =>
      apiRequest("/users/appointments/my-appointments", { token })
        .then(result => alive && setBookings(result.data || []))
        .catch(() => alive && setBookings(list => list || []));
    load();
    window.addEventListener("focus", load);
    return () => {
      alive = false;
      window.removeEventListener("focus", load);
    };
  }, [hasConfirm, token]);

  // the paid booking made from a card: by its id (kept when Pay was pressed, so a reschedule still matches),
  // or the same doctor, day and time
  const bookingFor = data =>
    bookings?.find(booking => data.bookingId && String(booking._id) === data.bookingId) ||
    bookings?.find(
      booking => String(booking.doctor?._id) === String(data.option.doctor._id) && booking.appointmentDate === data.option.date && booking.appointmentTime === data.slot.time
    );

  const add = message => setMessages(list => [...list, { id: newId(), ...message }]);

  const send = async text => {
    add({ from: "me", text });
    setBusy(true);
    try {
      const { data } = await apiRequest("/bookings/assistant", { token, method: "POST", body: { message: text, ...(current && { current }) } });
      if (data.request) setCurrent(data.request);
      if (data.left != null) setLeft(data.left);
      add({ from: "bot", data });
    } catch (error) {
      if (error.code === "chat-limit") setLeft(0);
      add({ from: "bot", data: { kind: "error", text: error.message } });
    }
    setBusy(false);
  };

  const pick = (option, slot, member) => {
    add({ from: "me", text: `${slot.label} with ${option.doctor.name}, ${option.dayLabel}` });
    add({ from: "bot", data: { kind: "confirm", option, slot, member } });
  };

  const pay = async ({ option, slot, member }, id) => {
    setPaying(id);
    try {
      const result = await apiRequest(`/bookings/checkout-session/${option.doctor._id}`, {
        token,
        method: "POST",
        body: { date: option.date, time: slot.time, consultationType: option.type, ...(member && { memberId: member._id }), from: "assistant" },
      });
      if (result.session?.url) {
        // remember which booking this card became (saved straight away: the page is left right after)
        const bookingId = result.session.metadata?.bookingId;
        const next = messages.map(message => (message.id === id ? { ...message, data: { ...message.data, bookingId } } : message));
        setMessages(next);
        saveChat(key, { messages: next.slice(-30), current, left });
        window.location.href = result.session.url;
      } else setPaying("");
    } catch (error) {
      toast.error(error.message);
      setPaying("");
    }
  };

  const restart = () => {
    setMessages([]);
    setCurrent(null);
    clearChat(key);
    inputRef.current?.focus();
  };

  const renderBot = (data, id) => {
    switch (data.kind) {
      case "error":
        return <BotText error>{data.text}</BotText>;
      case "emergency":
        return <Emergency emergency={data.emergency} />;
      case "confirm": {
        if (bookings === null) {
          return <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner className="h-4 w-4" /> Checking this booking…</p>;
        }
        const booking = bookingFor(data);
        if (booking) return <Booked booking={booking} option={data.option} member={data.member} token={token} onAnother={() => inputRef.current?.focus()} />;
        return <Confirm {...data} paying={paying === id} onPay={() => pay(data, id)} onChange={() => inputRef.current?.focus()} />;
      }
      default:
        return (
          <>
            <Understood data={data} />
            <BotText>{data.text}</BotText>
            {data.whoNote && <Note>{data.whoNote}</Note>}
            {data.note && <Note>{data.note}</Note>}
            {data.options?.map(option => (
              <OptionCard key={`${option.doctor._id}-${option.date}`} option={option} disabled={busy} onPick={(chosen, slot) => pick(chosen, slot, data.member)} />
            ))}
            <Suggestions items={data.choices} onPick={send} disabled={busy || left === 0} />
          </>
        );
    }
  };

  return (
    <section className="container max-w-3xl py-4 sm:py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> AI booking assistant
          </p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Book with AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">Say what you need. Pick a time, check it and pay. Nothing is booked until you pay.</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={restart} className="shrink-0">
            <MessageSquarePlus className="h-4 w-4" /> New chat
          </Button>
        )}
      </div>

      <div className="mt-5">
        <ChatPanel
          footer={
            <Composer
              onSend={send}
              busy={busy}
              left={left}
              inputRef={inputRef}
              label="Message the booking assistant"
              placeholder="e.g. skin doctor tomorrow evening, video"
            />
          }
        >
          <ChatLog label="Booking assistant conversation" count={messages.length} busy={busy} version={bookings === null ? 0 : 1}>
            <BotMessage>
              <BotText>Hi {user?.name?.split(" ")[0] || "there"}! Which doctor do you need, and when? You can write in English or Hindi.</BotText>
              {messages.length === 0 && <Suggestions items={EXAMPLES} onPick={send} disabled={busy} label="Examples" />}
            </BotMessage>
            {messages.map(message =>
              message.from === "me" ? (
                <MyMessage key={message.id}>{message.text}</MyMessage>
              ) : (
                <BotMessage key={message.id}>{renderBot(message.data, message.id)}</BotMessage>
              )
            )}
          </ChatLog>
        </ChatPanel>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          The assistant only reads your message. Free times and prices come from Medora, and you confirm every booking.
        </p>
      </div>
    </section>
  );
}

export default Book;
