import { useEffect, useState, useId } from "react";
import { motion } from "framer-motion";
import { CalendarDays, CalendarOff, Clock } from "lucide-react";
import { leaveLabel } from "@/utils/timeOff";
import { Input } from "@/components/ui/input";
import { BASE_URL } from "@/config";
import ConvertTime from "@/utils/convertTime";

// how far ahead a doctor can be booked; the server says when it is longer (doctors on Medora Pro)
const BOOKING_WINDOW_DAYS = 30;

// "YYYY-MM-DD" in the browser's local time
const toDateString = date => date.toLocaleDateString("en-CA");

const addDays = days => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// date input + grid of the doctor's free slots on that day (type: clinic / video / quick-call, only the
// shifts of the doctor's weekly routine that offer it). Calls onSelect({ date, time }) when a slot is
// picked, and onSelect(null) when the date changes. `empty` is shown under "no free slots" (the waitlist).
function SlotPicker({ doctorId, selected, onSelect, type, empty }) {
  const dateId = useId();
  const [date, setDate] = useState(toDateString(new Date()));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // the doctor's time off covering the chosen day
  const [onLeave, setOnLeave] = useState(null);
  const [windowDays, setWindowDays] = useState(BOOKING_WINDOW_DAYS);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BASE_URL}/doctors/${doctorId}/slots?date=${date}${type ? `&type=${type}` : ""}`);
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.message);
        }
        if (!cancelled) {
          setSlots(result.data);
          setOnLeave(result.onLeave || null);
          if (result.windowDays) setWindowDays(result.windowDays);
        }
      } catch (err) {
        if (!cancelled) {
          setSlots([]);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSlots();
    // ignore the answer of an older request when the date changes quickly
    return () => {
      cancelled = true;
    };
  }, [doctorId, date, type]);

  const handleDateChange = e => {
    setDate(e.target.value);
    onSelect(null);
  };

  return (
    <div>
      <label htmlFor={dateId} className="form_label flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-primary" /> Select date
      </label>
      <Input
        id={dateId}
        type="date"
        value={date}
        min={toDateString(new Date())}
        max={toDateString(addDays(windowDays))}
        onChange={handleDateChange}
      />

      <label className="form_label mt-5 flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" /> Select time
      </label>
      <div className="min-h-[48px]">
        {loading && (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="skeleton h-10 rounded-xl" />)}
          </div>
        )}
        {!loading && error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && !error && onLeave && (
          <p className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand-amber/50 bg-brand-amber/10 p-4 text-center text-sm text-brand-amber">
            <CalendarOff className="h-4 w-4 shrink-0" /> The doctor is on leave ({leaveLabel(onLeave)}). Try another date.
          </p>
        )}
        {!loading && !error && !onLeave && slots.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            No free slots on this day. Try another date.
          </p>
        )}
        {/* every slot of the day is taken: the waitlist (Plus and Plus Family) */}
        {!loading && !error && !onLeave && slots.length > 0 && slots.every(slot => !slot.available) && (
          <p className="mb-2 rounded-xl bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">Fully booked on this day.</p>
        )}
        {!loading && !error && !onLeave && slots.length > 0 && slots.every(slot => !slot.available) && empty?.(date)}
        {!loading && !error && !onLeave && slots.length === 0 && empty?.(date, { noHours: true })}
        {!loading && !error && slots.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot, index) => {
              const isSelected = selected?.date === date && selected?.time === slot.time;
              return (
                <motion.button
                  key={slot.time}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileTap={slot.available ? { scale: 0.94 } : undefined}
                  disabled={!slot.available}
                  aria-pressed={isSelected}
                  onClick={() => onSelect({ date, time: slot.time })}
                  className={`h-10 rounded-xl border text-[13px] font-semibold transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : slot.available
                      ? "border-border bg-background/60 text-foreground hover:border-primary hover:text-primary"
                      : "cursor-not-allowed border-transparent bg-muted text-muted-foreground/50 line-through"
                  }`}
                >
                  {ConvertTime(slot.time)}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SlotPicker;
