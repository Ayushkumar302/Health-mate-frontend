import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ClipboardCheck, ClipboardList, FileDown, FileText, FolderOpen, HeartPulse, Phone, Pill, Ruler, Users } from "lucide-react";
import { relationLabel } from "@/utils/family";
import { DocumentList } from "@/components/Documents/Documents";
import { SavedCheckItem } from "@/components/Symptoms/SavedChecks";
import PatientSummary from "./PatientSummary";
import { toast } from "react-toastify";
import Modal from "@/components/ui/modal";
import Avatar from "@/components/ui/avatar";
import Spinner from "@/components/ui/spinner";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { bmiOf, formatDay, patientSummary } from "@/utils/health";
import ConvertTime from "@/utils/convertTime";
import { downloadPdf } from "@/utils/calendar";
import { Button } from "@/components/ui/button";

const Chips = ({ items, tone = "bg-muted text-foreground", empty = "None recorded" }) =>
  items?.length ? (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map(item => <span key={item} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${tone}`}>{item}</span>)}
    </div>
  ) : (
    <p className="mt-1 text-sm text-muted-foreground">{empty}</p>
  );

const Block = ({ icon: Icon, title, children }) => (
  <div className="rounded-2xl border border-border p-4">
    <p className="flex items-center gap-2 text-sm font-bold"><Icon className="h-4 w-4 text-primary" /> {title}</p>
    {children}
  </div>
);

// what a doctor sees about one of their patients: health record, visits and earlier prescriptions
// memberId: the visit was for one of the patient's family members (Plus Family), whose own record is shown
const PatientRecordModal = ({ open, onClose, patientId, memberId, patientName }) => {
  const { token } = useContext(authContext);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  const memberQuery = memberId ? `?member=${memberId}` : "";

  useEffect(() => {
    if (!open || !patientId) return;
    setRecord(null);
    setError("");
    apiRequest(`/prescriptions/patients/${patientId}/record${memberQuery}`, { token })
      .then(result => setRecord(result.data))
      .catch(err => {
        setError(err.message);
        toast.error(err.message);
      });
  }, [open, patientId, memberQuery, token]);

  const patient = record?.patient;
  const bmi = patient && bmiOf(patient.heightCm, patient.weightKg);
  // the whole record as a PDF (the same report the report assistant makes)
  const [downloading, setDownloading] = useState(false);
  const downloadReport = async () => {
    setDownloading(true);
    try {
      const query = new URLSearchParams({ days: "0", ...(memberId && { member: memberId }) });
      const name = (patient?.name || "patient").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "patient";
      await downloadPdf(token, `/prescriptions/patients/${patientId}/report/pdf?${query}`, `medora-report-${name}.pdf`);
    } catch (downloadError) {
      toast.error(downloadError.message);
    }
    setDownloading(false);
  };

  return (
    <Modal open={open} onClose={onClose} size="md" icon={ClipboardList} title="Health record" subtitle={patientName}>
      {!record && !error && <div className="flex justify-center py-16"><Spinner /></div>}
      {error && <p className="py-10 text-center text-sm text-muted-foreground">{error}</p>}
      {patient && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar src={patient.photo} name={patient.name} className="h-14 w-14" textClassName="text-lg" />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold">{patient.name}</p>
              <p className="text-sm text-muted-foreground">{patientSummary(patient) || "No personal details yet"}</p>
              {patient.bookedBy && (
                <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-primary">
                  <Users className="h-3.5 w-3.5" /> {relationLabel(patient.relation)} of {patient.bookedBy} · Plus Family
                </p>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={downloadReport} disabled={downloading}>
              {downloading ? <Spinner className="h-4 w-4" /> : <><FileDown className="h-4 w-4" /> PDF report</>}
            </Button>
          </div>

          <PatientSummary key={`${patientId}-${memberId || ""}`} patientId={patientId} memberId={memberId} />

          {patient.allergies?.length > 0 && (
            <p className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Allergies: {patient.allergies.join(", ")}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Block icon={Ruler} title="Body">
              <p className="mt-1 text-sm text-muted-foreground">
                {patient.heightCm ? `${patient.heightCm} cm` : "Height —"} · {patient.weightKg ? `${patient.weightKg} kg` : "Weight —"}
              </p>
              {bmi && <p className="mt-1 text-sm font-semibold">BMI {bmi.value} <span className="font-normal text-muted-foreground">({bmi.category})</span></p>}
            </Block>
            <Block icon={Phone} title="Emergency contact">
              <p className="mt-1 text-sm text-muted-foreground">{patient.emergencyContact || "Not added"}</p>
            </Block>
            <Block icon={HeartPulse} title="Conditions">
              <Chips items={patient.conditions} tone="bg-brand-amber/15 text-brand-amber" />
            </Block>
            <Block icon={Pill} title="Current medicines">
              <Chips items={patient.medications} tone="bg-primary/10 text-primary" />
            </Block>
          </div>

          {record.symptomChecks?.length > 0 && (
            <Block icon={ClipboardCheck} title={`Symptom checks the patient saved (${record.symptomChecks.length})`}>
              <ul className="mt-2 space-y-2">
                {record.symptomChecks.map(check => <SavedCheckItem key={check._id} check={check} />)}
              </ul>
            </Block>
          )}

          <Block icon={FolderOpen} title={`Reports uploaded by the patient (${record.reports?.length || 0})`}>
            <div className="mt-1">
              <DocumentList documents={record.reports} empty="No reports uploaded." />
            </div>
          </Block>

          <Block icon={FileText} title={`Your prescriptions (${record.prescriptions.length}) · ${record.visits.length} visit${record.visits.length === 1 ? "" : "s"}`}>
            {record.prescriptions.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">You haven&apos;t written a prescription for this patient yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {record.prescriptions.map(item => (
                  <li key={item._id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.diagnosis}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDay(item.booking?.appointmentDate)} · {ConvertTime(item.booking?.appointmentTime || "00:00")} · {item.medicines.length} medicine{item.medicines.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Link to={`/prescriptions/${item.booking?._id}`} className="shrink-0 text-xs font-semibold text-primary hover:underline">Open</Link>
                  </li>
                ))}
              </ul>
            )}
          </Block>
          <p className="text-xs text-muted-foreground">Patients share their record with doctors they book. You only see your own prescriptions here.</p>
        </div>
      )}
    </Modal>
  );
};

export default PatientRecordModal;
