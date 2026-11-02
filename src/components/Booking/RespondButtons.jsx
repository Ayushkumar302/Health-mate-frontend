import { useContext, useState } from "react";
import { Check, X, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Modal from "@/components/ui/modal";
import Spinner from "@/components/ui/spinner";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { formatAppointment } from "@/utils/appointment";

const DECLINE_REASONS = [
  "I'm not available at this time any more",
  "This needs an in-person visit, please book a clinic visit",
  "This is outside my specialty, please see another specialist",
];

// doctor's Accept / Decline for a booking request; declining asks for a reason and refunds the patient
const RespondButtons = ({ booking, onDone }) => {
  const { token } = useContext(authContext);
  const [busy, setBusy] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  const respond = async (action, note) => {
    setBusy(true);
    try {
      const result = await apiRequest(`/bookings/${booking._id}/respond`, { token, method: "PUT", body: { action, reason: note } });
      toast.success(result.message);
      setDeclining(false);
      onDone?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="sm" disabled={busy} onClick={() => respond("accept")}>
        {busy && !declining ? <Spinner className="h-4 w-4 text-primary-foreground" /> : <Check className="h-4 w-4" />} Accept
      </Button>
      <Button size="sm" variant="outline" className="text-destructive hover:border-destructive/50 hover:text-destructive" disabled={busy} onClick={() => setDeclining(true)}>
        <X className="h-4 w-4" /> Decline
      </Button>

      <Modal
        open={declining}
        onClose={() => setDeclining(false)}
        size="sm"
        icon={XCircle}
        title="Decline request"
        subtitle={`${booking.user?.name || "Patient"} · ${formatAppointment(booking)}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeclining(false)}>Keep it</Button>
            <Button variant="destructive" disabled={!reason.trim() || busy} onClick={() => respond("decline", reason)}>
              {busy ? <Spinner className="h-4 w-4 text-white" /> : "Decline & refund"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">The patient gets a full refund and sees your reason.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {DECLINE_REASONS.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => setReason(item)}
              className={`rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors ${reason === item ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <label htmlFor="decline-reason" className="form_label mt-4">Reason</label>
        <Textarea id="decline-reason" rows={3} maxLength={300} value={reason} onChange={e => setReason(e.target.value)} placeholder="Tell the patient why" />
      </Modal>
    </>
  );
};

export default RespondButtons;
