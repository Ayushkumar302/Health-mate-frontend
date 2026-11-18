import { useContext, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CalendarClock, Clock3, Copy, Eraser, Plus, Save, Sparkles, Stethoscope, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { SectionCard } from "@/components/Dashboard/DashboardUI";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import ConvertTime from "@/utils/convertTime";
import { BREAKS, DAYS, MAX_SHIFTS_PER_DAY, MODES, SLOT_LENGTHS, WEEKDAYS, byDay, dayProblem, slotsOfShift } from "@/utils/schedule";
import TimeOff from "./TimeOff";

const shift = (startingTime, EndingTime, mode = "both") => ({ startingTime, EndingTime, mode });

// ready-made weeks a doctor can start from
const PRESETS = [
  { id: "office", label: "Weekdays 9 am – 5 pm", build: () => Object.fromEntries(DAYS.map(day => [day.id, WEEKDAYS.includes(day.id) ? [shift("09:00", "13:00"), shift("14:00", "17:00")] : []])) },
  {
    id: "split",
    label: "Clinic mornings, video evenings",
    build: () => Object.fromEntries(DAYS.map(day => [day.id, day.id === "sunday" ? [] : [shift("10:00", "13:00", "clinic"), shift("18:00", "20:00", "online")]])),
  },
  { id: "weekend", label: "Weekends only", build: () => Object.fromEntries(DAYS.map(day => [day.id, ["saturday", "sunday"].includes(day.id) ? [shift("10:00", "16:00")] : []])) },
];

const plusMinutes = (time, minutes) => {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, h * 60 + m + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

const ModeIcon = ({ mode }) => (mode === "clinic" ? <Stethoscope className="h-3.5 w-3.5" /> : mode === "online" ? <Video className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />);

// the doctor's weekly routine: which days, which hours, clinic or video, appointment length and breaks
const Schedule = ({ doctor, onSaved }) => {
  const { token } = useContext(authContext);
  const [week, setWeek] = useState(() => byDay(doctor.timeSlots));
  const [slotDuration, setSlotDuration] = useState(doctor.slotDuration || 30);
  const [bufferMinutes, setBufferMinutes] = useState(doctor.bufferMinutes || 0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = next => {
    setWeek(next);
    setDirty(true);
  };
  const setDay = (day, shifts) => update({ ...week, [day]: shifts });
  const setShift = (day, index, field, value) => setDay(day, week[day].map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  const addShift = day => {
    const last = week[day].at(-1);
    const start = last ? plusMinutes(last.EndingTime, 60) : "10:00";
    setDay(day, [...week[day], shift(start, plusMinutes(start, 180), last?.mode || "both")]);
  };
  const copyTo = (from, targets) => update({ ...week, ...Object.fromEntries(targets.filter(day => day !== from).map(day => [day, week[from].map(item => ({ ...item }))])) });

  // the appointments each day gives, with the current length and break
  const preview = useMemo(
    () => Object.fromEntries(DAYS.map(day => [day.id, week[day.id].flatMap(item => slotsOfShift(item, Number(slotDuration), Number(bufferMinutes)))])),
    [week, slotDuration, bufferMinutes]
  );
  const weeklyTotal = Object.values(preview).reduce((sum, list) => sum + list.length, 0);
  const problems = Object.fromEntries(DAYS.map(day => [day.id, week[day.id].length ? dayProblem(week[day.id]) : null]));
  const hasProblem = Object.values(problems).some(Boolean);

  const save = async () => {
    setSaving(true);
    try {
      const timeSlots = DAYS.flatMap(day => week[day.id].map(item => ({ day: day.id, ...item })));
      const result = await apiRequest(`/doctors/${doctor._id}`, { token, method: "PUT", body: { timeSlots, slotDuration: Number(slotDuration), bufferMinutes: Number(bufferMinutes) } });
      toast.success(timeSlots.length ? "Weekly routine saved, patients see the new times now" : result.message);
      setDirty(false);
      onSaved?.();
    } catch (error) {
      toast.error(error.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <SectionCard
        icon={CalendarClock}
        title="Weekly routine"
        subtitle="When patients can book you, and how"
        action={
          <Button size="sm" onClick={save} disabled={saving || !dirty || hasProblem}>
            {saving ? <Spinner className="h-4 w-4 text-primary-foreground" /> : <><Save className="h-4 w-4" /> Save</>}
          </Button>
        }
        bodyClassName="p-5 space-y-5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Start from:</span>
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => update(preset.build())}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {preset.label}
            </button>
          ))}
          <button type="button" onClick={() => update(byDay([]))} className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive">
            <Eraser className="h-3.5 w-3.5" /> Clear all
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sch-length" className="form_label">Appointment length</label>
            <select id="sch-length" value={slotDuration} onChange={e => { setSlotDuration(e.target.value); setDirty(true); }} className="select-field">
              {SLOT_LENGTHS.map(minutes => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sch-break" className="form_label">Break after each appointment</label>
            <select id="sch-break" value={bufferMinutes} onChange={e => { setBufferMinutes(e.target.value); setDirty(true); }} className="select-field">
              {BREAKS.map(minutes => <option key={minutes} value={minutes}>{minutes ? `${minutes} minutes` : "No break"}</option>)}
            </select>
          </div>
        </div>

        <ul className="divide-y divide-border rounded-2xl border border-border">
          {DAYS.map(day => {
            const shifts = week[day.id];
            const open = shifts.length > 0;
            return (
              <li key={day.id} className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={open}
                    aria-label={`${day.label} ${open ? "open" : "closed"}`}
                    onClick={() => setDay(day.id, open ? [] : [shift("10:00", "17:00")])}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${open ? "bg-primary" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${open ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                  <p className="w-24 font-semibold">{day.label}</p>
                  <p className="flex-1 text-xs text-muted-foreground">
                    {open ? `${preview[day.id].length} appointment${preview[day.id].length === 1 ? "" : "s"}` : "Closed"}
                  </p>
                  {open && (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => copyTo(day.id, WEEKDAYS)} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-primary" title="Use these hours Monday to Friday">
                        <Copy className="h-3 w-3" /> Weekdays
                      </button>
                      <button type="button" onClick={() => copyTo(day.id, DAYS.map(item => item.id))} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-primary" title="Use these hours every day">
                        <Copy className="h-3 w-3" /> Every day
                      </button>
                    </div>
                  )}
                </div>

                {open && (
                  <div className="mt-3 space-y-2 sm:pl-14">
                    {shifts.map((item, index) => (
                      <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 sm:grid-cols-[130px_auto_130px_1fr_auto]">
                        <Input type="time" aria-label={`${day.label} shift ${index + 1} start`} value={item.startingTime} onChange={e => setShift(day.id, index, "startingTime", e.target.value)} />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input type="time" aria-label={`${day.label} shift ${index + 1} end`} value={item.EndingTime} onChange={e => setShift(day.id, index, "EndingTime", e.target.value)} />
                        <select
                          aria-label={`${day.label} shift ${index + 1} visit type`}
                          value={item.mode || "both"}
                          onChange={e => setShift(day.id, index, "mode", e.target.value)}
                          className="select-field col-span-3 sm:col-span-1"
                        >
                          {MODES.map(mode => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
                        </select>
                        <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" aria-label="Remove shift" onClick={() => setDay(day.id, shifts.filter((_, i) => i !== index))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {problems[day.id] && <p className="text-xs font-semibold text-destructive">{problems[day.id]}</p>}
                    {shifts.length < MAX_SHIFTS_PER_DAY && (
                      <button type="button" onClick={() => addShift(day.id)} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                        <Plus className="h-3.5 w-3.5" /> Add a shift (e.g. evening)
                      </button>
                    )}
                    {preview[day.id].length > 0 && (
                      <p className="truncate text-xs text-muted-foreground">
                        Slots: {preview[day.id].slice(0, 6).map(ConvertTime).join(", ")}{preview[day.id].length > 6 ? ` … ${ConvertTime(preview[day.id].at(-1))}` : ""}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-4 sm:flex-row sm:items-center">
          <Clock3 className="h-5 w-5 shrink-0 text-primary" />
          <p className="flex-1 text-sm">
            <span className="font-semibold">{weeklyTotal} appointments a week</span> of {slotDuration} minutes{Number(bufferMinutes) ? `, with ${bufferMinutes} minutes between them` : ""}.
            {weeklyTotal === 0 && " Patients can't book you until you open at least one day."}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {MODES.map(mode => (
              <span key={mode.id} className="inline-flex items-center gap-1"><ModeIcon mode={mode.id} /> {mode.short}</span>
            ))}
          </div>
        </div>
        {dirty && !hasProblem && (
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>{saving ? <Spinner className="h-4 w-4 text-primary-foreground" /> : <><Save className="h-4 w-4" /> Save weekly routine</>}</Button>
          </div>
        )}
      </SectionCard>

      <TimeOff doctor={doctor} onChanged={onSaved} />
    </div>
  );
};

export default Schedule;
