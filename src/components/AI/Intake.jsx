import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { AlertTriangle, ClipboardPen, HelpCircle, Info, ListChecks, Sparkles } from "lucide-react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import LanguagePicker, { useAiLanguage } from "./LanguagePicker";

const SINCE = [
  { id: "today", label: "Today" },
  { id: "days", label: "2-3 days" },
  { id: "week", label: "About a week" },
  { id: "month", label: "A few weeks" },
  { id: "longer", label: "Over a month" },
];
const SEVERITY = [
  { id: "mild", label: "Mild" },
  { id: "moderate", label: "Moderate" },
  { id: "severe", label: "Severe" },
];

const Choice = ({ options, value, onChange, label }) => (
  <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
    {options.map(option => (
      <button
        key={option.id}
        type="button"
        role="radio"
        aria-checked={value === option.id}
        onClick={() => onChange(option.id)}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
          value === option.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

// Patient: "Tell the doctor before your visit". Step 1 the reason, step 2 up to 3 follow-up questions the AI picks
// (in the patient's language), then a short summary goes to the doctor.
export const IntakeForm = ({ booking, open, onClose, onSaved }) => {
  const { token } = useContext(authContext);
  const [lang] = useAiLanguage();
  const saved = booking.intake;
  const [form, setForm] = useState({ reason: saved?.reason || "", since: saved?.since || "", severity: saved?.severity || "" });
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = changes => setForm(current => ({ ...current, ...changes }));
  const who = booking.familyMember?.name ? `${booking.familyMember.name}'s` : "your";

  const next = async () => {
    setBusy(true);
    try {
      const result = await apiRequest(`/bookings/${booking._id}/intake/questions`, { token, method: "POST", body: { ...form, lang } });
      setQuestions(result.data.questions);
      setNote(result.data.note || null);
      // answers given before stay with the same questions
      setAnswers(Object.fromEntries((saved?.answers || []).map(item => [item.question, item.answer])));
    } catch (error) {
      toast.error(error.message);
    }
    setBusy(false);
  };

  const send = async () => {
    setBusy(true);
    try {
      const result = await apiRequest(`/bookings/${booking._id}/intake`, {
        token,
        method: "PUT",
        body: { ...form, lang, answers: questions.map(question => ({ question, answer: answers[question] || "" })) },
      });
      toast.success(result.message);
      onSaved?.();
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
    setBusy(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={ClipboardPen}
      title="Before your visit"
      subtitle={`A few words about ${who} visit help the doctor prepare`}
      footer={
        questions ? (
          <>
            <Button variant="ghost" onClick={() => setQuestions(null)}>Back</Button>
            <Button onClick={send} disabled={busy}>{busy ? <Spinner className="h-4 w-4 text-primary-foreground" /> : "Send to the doctor"}</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={next} disabled={busy || form.reason.trim().length < 3}>{busy ? <Spinner className="h-4 w-4 text-primary-foreground" /> : "Next"}</Button>
          </>
        )
      }
    >
      {!questions ? (
        <div className="space-y-5">
          <div>
            <label htmlFor="intake-reason" className="form_label">Why are you seeing the doctor? *</label>
            <textarea
              id="intake-reason"
              rows={3}
              maxLength={500}
              value={form.reason}
              onChange={event => set({ reason: event.target.value })}
              placeholder="e.g. Pain in my lower back for a week, worse in the morning"
              className="w-full resize-none rounded-2xl border border-input bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            />
            <p className="mt-1 text-xs text-muted-foreground">Write in any language you like.</p>
          </div>
          <div>
            <p className="form_label">Since when?</p>
            <Choice label="Since when" options={SINCE} value={form.since} onChange={since => set({ since })} />
          </div>
          <div>
            <p className="form_label">How bad is it?</p>
            <Choice label="How bad" options={SEVERITY} value={form.severity} onChange={severity => set({ severity })} />
          </div>
          <LanguagePicker />
        </div>
      ) : (
        <div className="space-y-4">
          {note && <p className="flex items-start gap-2 rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0" /> {note}</p>}
          <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> A few questions the doctor would ask</p>
          {questions.map((question, index) => (
            <div key={question}>
              <label htmlFor={`intake-q${index}`} className="form_label">{question}</label>
              <textarea
                id={`intake-q${index}`}
                rows={2}
                maxLength={500}
                value={answers[question] || ""}
                onChange={event => setAnswers(current => ({ ...current, [question]: event.target.value }))}
                className="w-full resize-none rounded-2xl border border-input bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Skip anything you don&apos;t want to answer. Only {booking.doctor?.name || "your doctor"} sees this.</p>
        </div>
      )}
    </Modal>
  );
};

// Doctor: the pre-visit summary (English), with what the patient wrote in their own words underneath
export const IntakeView = ({ intake, patientName, open, onClose }) => {
  const summary = intake?.summary;
  if (!summary) return null;
  return (
    <Modal open={open} onClose={onClose} icon={ClipboardPen} title="Pre-visit notes" subtitle={patientName}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Main complaint</p>
          <p className="mt-1 font-bold">{summary.complaint}</p>
          <p className="mt-1 text-xs text-muted-foreground">{summary.source === "ai" ? "Summarised by AI (Google Gemini) from the patient's answers" : "From the patient's answers"}</p>
        </div>
        {summary.redFlags?.length > 0 && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> Watch out</p>
            <ul className="mt-1 space-y-0.5">{summary.redFlags.map(item => <li key={item}>• {item}</li>)}</ul>
          </div>
        )}
        {summary.details?.length > 0 && (
          <div>
            <p className="flex items-center gap-2 text-sm font-bold"><ListChecks className="h-4 w-4 text-primary" /> Details</p>
            <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">{summary.details.map(item => <li key={item}>• {item}</li>)}</ul>
          </div>
        )}
        {summary.askAbout?.length > 0 && (
          <div>
            <p className="flex items-center gap-2 text-sm font-bold"><HelpCircle className="h-4 w-4 text-primary" /> Worth asking</p>
            <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">{summary.askAbout.map(item => <li key={item}>• {item}</li>)}</ul>
          </div>
        )}
        <details className="rounded-2xl border border-border p-4 text-sm">
          <summary className="cursor-pointer font-semibold">In the patient&apos;s own words</summary>
          <p className="mt-2">{intake.reason}</p>
          {(intake.answers || []).map(item => (
            <p key={item.question} className="mt-2"><span className="text-muted-foreground">{item.question}</span><br />{item.answer || "—"}</p>
          ))}
        </details>
      </div>
    </Modal>
  );
};
