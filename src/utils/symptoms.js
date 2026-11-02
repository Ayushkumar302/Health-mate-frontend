import { AlertTriangle, CalendarCheck2, HeartHandshake, Siren } from "lucide-react";

// the symptom checker's choices (the server accepts exactly these)
export const SYMPTOM_CHIPS = [
  "Fever", "Headache", "Cough", "Sore throat", "Stomach pain", "Rash or itching", "Toothache", "Chest pain",
  "Breathlessness", "Dizziness", "Joint or back pain", "Anxiety or low mood", "Trouble sleeping",
  "Period problems", "Ear or nose problem", "Tiredness",
];

export const AGE_GROUPS = [
  { value: "child", label: "Child (under 14)" },
  { value: "adult", label: "Adult" },
  { value: "senior", label: "60 or older" },
];

export const DURATIONS = [
  { value: "today", label: "Today" },
  { value: "few_days", label: "A few days" },
  { value: "weeks", label: "Weeks or longer" },
];

export const SEVERITIES = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];

export const URGENCY = {
  emergency: { label: "Emergency", title: "Get emergency care now", icon: Siren, tone: "border-destructive/40 bg-destructive/10 text-destructive" },
  soon: { label: "See a doctor soon", title: "See a doctor in the next day or two", icon: AlertTriangle, tone: "border-brand-amber/40 bg-brand-amber/10 text-brand-amber" },
  routine: { label: "Routine", title: "Book a normal appointment", icon: CalendarCheck2, tone: "border-primary/30 bg-primary/5 text-primary" },
  self_care: { label: "Self-care", title: "Usually fine to manage at home", icon: HeartHandshake, tone: "border-success/40 bg-success/10 text-success" },
};

export const VISIT_LABELS = { clinic: "Clinic visit", video: "Video consultation", "quick-call": "Quick call first" };

export const SOURCE_LABELS = { ai: "AI answer (Google Gemini)", rules: "Quick guide", emergency: "Emergency check" };

export const optionLabel = (list, value) => list.find(item => item.value === value)?.label || value;
