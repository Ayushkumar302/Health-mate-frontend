import { useContext, useEffect, useState } from "react";
import { AlertTriangle, FilePenLine, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Spinner from "@/components/ui/spinner";
import ChipInput from "@/components/ui/chip-input";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { formatDay, patientSummary } from "@/utils/health";

const emptyMedicine = () => ({ name: "", dosage: "", frequency: "", duration: "", instructions: "" });

const emptyForm = () => ({ diagnosis: "", symptoms: "", medicines: [emptyMedicine()], tests: [], advice: "", followUpDate: "" });

// common ways of writing how often to take a medicine (1-0-1 = morning, afternoon, night)
const FREQUENCIES = ["1-0-0", "0-0-1", "1-0-1", "1-1-1", "SOS (when needed)", "Once a week"];
const COMMON_TESTS = ["Complete blood count", "Lipid profile", "HbA1c", "Thyroid profile", "Vitamin D", "ECG"];

const plusDays = (date, days) => {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toLocaleDateString("en-CA");
};

// doctor writes (or edits) the prescription of one consultation
const PrescriptionEditor = ({ open, onClose, booking, onSaved }) => {
  const { token } = useContext(authContext);
  const [form, setForm] = useState(emptyForm);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);
  const patient = booking?.user;

  useEffect(() => {
    if (!open || !booking) return;
    setLoading(true);
    Promise.all([
      apiRequest(`/prescriptions/booking/${booking._id}`, { token }),
      patient?._id ? apiRequest(`/prescriptions/patients/${patient._id}/record`, { token }).catch(() => null) : null,
    ])
      .then(([prescription, patientRecord]) => {
        const saved = prescription.data;
        setExists(Boolean(saved));
        setForm(
          saved
            ? {
                diagnosis: saved.diagnosis || "",
                symptoms: saved.symptoms || "",
                medicines: saved.medicines?.length ? saved.medicines.map(medicine => ({ ...emptyMedicine(), ...medicine })) : [emptyMedicine()],
                tests: saved.tests || [],
                advice: saved.advice || "",
                followUpDate: saved.followUpDate || "",
              }
            : emptyForm()
        );
        setRecord(patientRecord?.data?.patient || null);
      })
      .catch(error => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [open, booking, patient?._id, token]);

  const set = (field, value) => setForm(current => ({ ...current, [field]: value }));

  const setMedicine = (index, field, value) =>
    setForm(current => ({
      ...current,
      medicines: current.medicines.map((medicine, i) => (i === index ? { ...medicine, [field]: value } : medicine)),
    }));

  const save = async event => {
    event?.preventDefault();
    setSaving(true);
    try {
      const result = await apiRequest(`/prescriptions/booking/${booking._id}`, {
        token,
        method: "PUT",
        body: { ...form, medicines: form.medicines.filter(medicine => medicine.name.trim()), followUpDate: form.followUpDate || undefined },
      });
      toast.success(result.message);
      onSaved?.(result.data);
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!booking) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={FilePenLine}
      title={exists ? "Edit prescription" : "Write prescription"}
      subtitle={`${patient?.name || "Patient"} · ${formatDay(booking.appointmentDate)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || loading || !form.diagnosis.trim()}>
            {saving ? <Spinner className="h-4 w-4 text-primary-foreground" /> : exists ? "Save changes" : "Save & share with patient"}
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <form onSubmit={save} className="space-y-6">
          {record && (
            <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
              <p className="font-semibold">{record.name} <span className="font-normal text-muted-foreground">· {patientSummary(record) || "no details yet"}</span></p>
              {record.allergies?.length > 0 && (
                <p className="mt-2 flex items-start gap-2 font-semibold text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Allergic to {record.allergies.join(", ")}
                </p>
              )}
              {(record.conditions?.length > 0 || record.medications?.length > 0) && (
                <p className="mt-1 text-muted-foreground">
                  {record.conditions?.length > 0 && <>Conditions: {record.conditions.join(", ")}. </>}
                  {record.medications?.length > 0 && <>Already taking: {record.medications.join(", ")}.</>}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rx-diagnosis" className="form_label">Diagnosis *</label>
              <Input id="rx-diagnosis" value={form.diagnosis} maxLength={200} onChange={e => set("diagnosis", e.target.value)} placeholder="e.g. Acute viral pharyngitis" required />
            </div>
            <div>
              <label htmlFor="rx-symptoms" className="form_label">Complaints</label>
              <Input id="rx-symptoms" value={form.symptoms} maxLength={500} onChange={e => set("symptoms", e.target.value)} placeholder="e.g. Sore throat and fever for 3 days" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="form_label mb-0">Medicines</p>
              <span className="text-xs text-muted-foreground">{form.medicines.length}/15</span>
            </div>
            <datalist id="rx-frequencies">
              {FREQUENCIES.map(item => <option key={item} value={item} />)}
            </datalist>
            <div className="space-y-3">
              {form.medicines.map((medicine, index) => (
                <div key={index} className="grid gap-2 rounded-2xl border border-border p-3 sm:grid-cols-[1.4fr_0.8fr_1fr_0.8fr_auto]">
                  <Input aria-label="Medicine name" value={medicine.name} maxLength={80} onChange={e => setMedicine(index, "name", e.target.value)} placeholder="Medicine" />
                  <Input aria-label="Dosage" value={medicine.dosage} maxLength={40} onChange={e => setMedicine(index, "dosage", e.target.value)} placeholder="500 mg" />
                  <Input aria-label="How often" list="rx-frequencies" value={medicine.frequency} maxLength={40} onChange={e => setMedicine(index, "frequency", e.target.value)} placeholder="1-0-1 after food" />
                  <Input aria-label="Duration" value={medicine.duration} maxLength={40} onChange={e => setMedicine(index, "duration", e.target.value)} placeholder="5 days" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => set("medicines", form.medicines.length > 1 ? form.medicines.filter((_, i) => i !== index) : [emptyMedicine()])}
                    aria-label="Remove medicine"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Input
                    aria-label="Instructions"
                    className="sm:col-span-4"
                    value={medicine.instructions}
                    maxLength={120}
                    onChange={e => setMedicine(index, "instructions", e.target.value)}
                    placeholder="Instructions (optional), e.g. take with warm water"
                  />
                </div>
              ))}
            </div>
            {form.medicines.length < 15 && (
              <Button type="button" variant="soft" size="sm" className="mt-3" onClick={() => set("medicines", [...form.medicines, emptyMedicine()])}>
                <Plus className="h-4 w-4" /> Add medicine
              </Button>
            )}
          </div>

          <div>
            <label htmlFor="rx-tests" className="form_label">Tests advised</label>
            <ChipInput id="rx-tests" value={form.tests} onChange={tests => set("tests", tests)} max={10} maxLength={80} placeholder="Type a test and press Enter" tone="primary" suggestions={COMMON_TESTS} />
          </div>

          <div>
            <label htmlFor="rx-advice" className="form_label">Advice</label>
            <Textarea id="rx-advice" rows={3} maxLength={1000} value={form.advice} onChange={e => set("advice", e.target.value)} placeholder="Diet, rest, warning signs to watch for…" />
          </div>

          <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-end">
            <div>
              <label htmlFor="rx-follow-up" className="form_label">Follow-up</label>
              <Input id="rx-follow-up" type="date" min={plusDays(booking.appointmentDate, 1)} value={form.followUpDate} onChange={e => set("followUpDate", e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              {[7, 14, 30].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => set("followUpDate", plusDays(booking.appointmentDate, days))}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary"
                >
                  In {days} days
                </button>
              ))}
              {form.followUpDate && (
                <button type="button" onClick={() => set("followUpDate", "")} className="px-2 text-xs font-semibold text-muted-foreground hover:text-destructive">
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default PrescriptionEditor;
