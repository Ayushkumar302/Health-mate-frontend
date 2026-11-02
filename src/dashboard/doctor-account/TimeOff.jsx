import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/Dashboard/DashboardUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { authContext } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { apiRequest } from "@/utils/api";
import { DEMO_MODE } from "@/brand";
import { leaveLabel, todayString as today, upcomingLeave } from "@/utils/timeOff";

// leave days and holidays: no slots are offered on them; bookings already on those days are refunded
const TimeOff = ({ doctor, onChanged }) => {
  const { token } = useContext(authContext);
  const confirm = useConfirm();
  const [entries, setEntries] = useState(doctor.timeOff || []);
  const [form, setForm] = useState({ from: "", to: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const upcoming = upcomingLeave(entries);

  const add = async event => {
    event.preventDefault();
    if (!form.from) return toast.info("Pick the first day of your time off");
    const to = form.to || form.from;
    setBusy(true);
    try {
      // tell the doctor first if patients are booked on those days
      const impact = await apiRequest(`/doctors/time-off/impact?from=${form.from}&to=${to}`, { token });
      const count = impact.data.count;
      if (count > 0) {
        const ok = await confirm({
          title: `Cancel ${count} appointment${count === 1 ? "" : "s"}?`,
          message: `${count} patient${count === 1 ? " has" : "s have"} booked you on these days. ${count === 1 ? "The booking" : "They"} will be cancelled, refunded in full, and the patient${count === 1 ? "" : "s"} told straight away.`,
          confirmText: "Add time off and refund",
          tone: "danger",
        });
        if (!ok) return setBusy(false);
      }
      const result = await apiRequest("/doctors/time-off", { token, method: "POST", body: { from: form.from, to, reason: form.reason } });
      setEntries(result.data.timeOff);
      setForm({ from: "", to: "", reason: "" });
      toast.success(result.message);
      if (result.data.cancelled) onChanged?.();
    } catch (error) {
      toast.error(error.message);
    }
    setBusy(false);
  };

  const remove = async entry => {
    if (!(await confirm({ title: "Remove this time off?", message: `${leaveLabel(entry)} becomes bookable again. Cancelled appointments stay cancelled.`, confirmText: "Remove" }))) return;
    try {
      const result = await apiRequest(`/doctors/time-off/${entry._id}`, { token, method: "DELETE" });
      setEntries(result.data.timeOff);
      toast.success(result.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <SectionCard icon={CalendarOff} title="Time off" subtitle="Leave days and holidays are not bookable">
      {upcoming.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {upcoming.map(entry => (
            <li key={entry._id} className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{leaveLabel(entry)}</p>
                {entry.reason && <p className="truncate text-xs text-muted-foreground">{entry.reason}</p>}
              </div>
              <button type="button" onClick={() => remove(entry)} aria-label={`Remove time off ${leaveLabel(entry)}`} className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">No time off planned.</p>
      )}
      <form onSubmit={add} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-muted-foreground">
            From
            <Input type="date" min={today()} value={form.from} onChange={event => setForm(previous => ({ ...previous, from: event.target.value }))} className="mt-1" />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            To
            <Input type="date" min={form.from || today()} value={form.to} onChange={event => setForm(previous => ({ ...previous, to: event.target.value }))} className="mt-1" />
          </label>
        </div>
        <Input
          value={form.reason}
          maxLength={100}
          placeholder="Reason (only you see it), e.g. Conference"
          onChange={event => setForm(previous => ({ ...previous, reason: event.target.value }))}
        />
        <Button type="submit" variant="soft" size="sm" disabled={busy} className="w-full">
          {busy ? <Spinner className="h-4 w-4" /> : <><Plus className="h-4 w-4" /> Add time off</>}
        </Button>
        {DEMO_MODE && doctor.isDemo && (
          <p className="text-xs text-muted-foreground">Demo doctors: up to 2 breaks of 7 days, starting 3+ days from today.</p>
        )}
      </form>
    </SectionCard>
  );
};

export default TimeOff;
