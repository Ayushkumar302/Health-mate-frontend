import { useContext, useEffect, useRef, useState } from "react";
import { CalendarPlus, Download, FileDown } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { authContext } from "@/context/AuthContext";
import { downloadIcs, downloadPdf, googleCalendarUrl } from "@/utils/calendar";

// "Add to calendar": Google Calendar, or an .ics file for Apple Calendar / Outlook
export const AddToCalendar = ({ booking }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = event => ref.current && !ref.current.contains(event.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <Button size="sm" variant="ghost" onClick={() => setOpen(value => !value)} aria-expanded={open}>
        <CalendarPlus className="h-4 w-4" /> Add to calendar
      </Button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 w-52 rounded-xl border border-border bg-popover p-1 shadow-panelShadow">
          <a href={googleCalendarUrl(booking)} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">
            Google Calendar
          </a>
          <button type="button" onClick={() => { downloadIcs(booking); setOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted">
            Apple / Outlook (.ics)
          </button>
        </div>
      )}
    </div>
  );
};

// the payment receipt of a booking, as a PDF
export const ReceiptButton = ({ booking, compact = false }) => {
  const { token } = useContext(authContext);
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      await downloadPdf(token, `/bookings/${booking._id}/receipt`, `medora-receipt-${String(booking._id).slice(-8)}.pdf`);
    } catch (error) {
      toast.error(error.message);
    }
    setBusy(false);
  };
  return compact ? (
    <button type="button" onClick={download} disabled={busy} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-60">
      {busy ? <Spinner className="h-3.5 w-3.5" /> : <FileDown className="h-3.5 w-3.5" />} Receipt
    </button>
  ) : (
    <Button size="sm" variant="ghost" onClick={download} disabled={busy}>
      {busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Receipt
    </Button>
  );
};
