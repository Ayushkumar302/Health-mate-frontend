import { useState } from "react";
import { Ban, CheckCircle2, Circle, Copy, ExternalLink, GraduationCap, Hospital, Lock, Mail, Phone, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { DocumentList } from "@/components/Documents/Documents";
import { useConfirm } from "@/context/ConfirmContext";
import { toast } from "react-toastify";
import Avatar from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Modal from "@/components/ui/modal";
import Spinner from "@/components/ui/spinner";
import { formatPrice } from "@/utils/formatPrice";

// India's national register of doctors, where an admin looks up the registration number by hand
const NMC_REGISTER_URL = "https://www.nmc.org.in/information-desk/indian-medical-register/";

const REJECT_REASONS = [
  "Registration number not found on the medical register",
  "Name does not match the registration record",
  "Qualification details are missing",
  "Duplicate account",
];
const SUSPEND_REASONS = ["Complaints from patients", "Registration has expired", "Requested by the doctor"];

const statusStyles = {
  pending: "bg-brand-amber/15 text-brand-amber",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/10 text-destructive",
  suspended: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};
const statusNames = { pending: "Pending", approved: "Listed", rejected: "Rejected", suspended: "Suspended", cancelled: "Suspended" };

// quick automatic hints; the real check is the admin looking the number up
const checksFor = doctor => {
  const reg = doctor.registrationNumber || "";
  return [
    { label: "Registration number given", done: Boolean(reg) },
    { label: "Registration certificate uploaded", done: doctor.documents?.some(document => document.category === "registration") },
    { label: "Number format looks valid", done: /\d{4,}/.test(reg) && reg.length >= 7, hint: reg && reg.length < 7 ? "too short, check carefully" : "" },
    { label: "Qualifications listed", done: doctor.qualifications?.length > 0 },
    { label: "Work experience listed", done: doctor.experiences?.length > 0 },
    { label: "Profile photo", done: Boolean(doctor.photo) },
  ];
};

const ReasonModal = ({ action, doctor, onClose, onConfirm }) => {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const reasons = action === "reject" ? REJECT_REASONS : SUSPEND_REASONS;

  const confirm = async () => {
    setSaving(true);
    await onConfirm(note);
    setSaving(false);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      icon={action === "reject" ? XCircle : Ban}
      title={action === "reject" ? "Reject application" : "Suspend doctor"}
      subtitle={doctor.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={!note.trim() || saving} onClick={confirm}>
            {saving ? <Spinner className="h-4 w-4 text-white" /> : action === "reject" ? "Reject" : "Suspend"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        {action === "reject"
          ? "The doctor stays hidden from patients. The reason is kept on record and shown to the doctor."
          : "The profile is hidden from patients right away. Existing bookings are not cancelled."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {reasons.map(reason => (
          <button
            key={reason}
            type="button"
            onClick={() => setNote(reason)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${note === reason ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
          >
            {reason}
          </button>
        ))}
      </div>
      <label htmlFor="review-note" className="form_label mt-4">Reason</label>
      <Textarea id="review-note" rows={3} maxLength={300} value={note} onChange={e => setNote(e.target.value)} placeholder="Explain the decision" />
    </Modal>
  );
};

const DoctorReviewCard = ({ doctor, onAction }) => {
  const [busy, setBusy] = useState(false);
  const [askReason, setAskReason] = useState(null); // "reject" | "suspend"
  const confirm = useConfirm();
  const checks = checksFor(doctor);
  const status = doctor.isApproved;
  const locked = doctor.isDemo;

  const run = async (action, note) => {
    setBusy(true);
    const ok = await onAction(doctor, action, note);
    setBusy(false);
    if (ok) setAskReason(null);
  };

  const approve = async () => {
    const ok = await confirm({
      title: status === "pending" ? "Approve and list this doctor?" : "Re-approve this doctor?",
      message: `${doctor.name} will be listed on Medora and patients can book them straight away.`,
      confirmText: "Approve",
    });
    if (ok) run("approve");
  };

  const copyNumber = () => {
    navigator.clipboard?.writeText(doctor.registrationNumber || "");
    toast.info("Registration number copied");
  };

  return (
    <article className="card-surface p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar src={doctor.photo} name={doctor.name} className="h-14 w-14" textClassName="text-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold">{doctor.name}</p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status]}`}>{statusNames[status]}</span>
            {locked && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                <Lock className="h-3 w-3" /> Demo account
              </span>
            )}
          </div>
          <p className="text-sm capitalize text-muted-foreground">
            {doctor.specialization || "No specialty"} · {doctor.ticketPrice ? formatPrice(doctor.ticketPrice) : "no fee"}
            {doctor.createdAt && ` · applied ${new Date(doctor.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {doctor.email}</span>
            {doctor.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {doctor.phone}</span>}
            {status === "approved" && <span>{doctor.bookings} paid booking{doctor.bookings === 1 ? "" : "s"}</span>}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-3">
          <div className="rounded-2xl bg-muted/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medical registration number</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-card px-2.5 py-1 font-mono text-sm font-bold">{doctor.registrationNumber || "—"}</code>
              {doctor.registrationNumber && (
                <button type="button" onClick={copyNumber} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-primary" aria-label="Copy registration number">
                  <Copy className="h-4 w-4" />
                </button>
              )}
              <a href={NMC_REGISTER_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Look it up on the NMC register <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-border px-4 py-1">
            <DocumentList documents={doctor.documents} empty="No documents uploaded." />
          </div>
          <div className="space-y-1.5 text-sm">
            {doctor.qualifications?.map((item, index) => (
              <p key={index} className="flex items-start gap-2">
                <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><span className="font-semibold">{item.degree}</span> · {item.university}</span>
              </p>
            ))}
            {doctor.experiences?.map((item, index) => (
              <p key={index} className="flex items-start gap-2">
                <Hospital className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><span className="font-semibold">{item.position}</span> · {item.hospital}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border p-4">
          <p className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-primary" /> Verification checklist</p>
          <ul className="mt-3 space-y-2 text-sm">
            {checks.map(check => (
              <li key={check.label} className="flex items-center gap-2">
                {check.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-brand-amber" />}
                <span className={check.done ? "" : "font-medium"}>{check.label}</span>
                {check.hint && <span className="text-xs text-brand-amber">({check.hint})</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {doctor.reviewNote && (
        <p className="mt-4 rounded-xl bg-muted/60 px-4 py-3 text-sm">
          <span className="font-semibold">Admin note:</span> {doctor.reviewNote}
          {doctor.reviewedAt && <span className="text-muted-foreground"> · {new Date(doctor.reviewedAt).toLocaleDateString("en-IN")}</span>}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {locked ? (
          <p className="text-xs text-muted-foreground">Demo doctors stay listed so every visitor can book them. Try the actions on a pending application.</p>
        ) : (
          <>
            {status !== "approved" && (
              <Button size="sm" disabled={busy} onClick={approve}>
                {status === "pending" ? <><CheckCircle2 className="h-4 w-4" /> Approve & list</> : <><RotateCcw className="h-4 w-4" /> Re-approve</>}
              </Button>
            )}
            {status === "pending" && (
              <Button size="sm" variant="outline" className="text-destructive hover:border-destructive/50 hover:text-destructive" disabled={busy} onClick={() => setAskReason("reject")}>
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            )}
            {status === "approved" && (
              <Button size="sm" variant="outline" className="text-destructive hover:border-destructive/50 hover:text-destructive" disabled={busy} onClick={() => setAskReason("suspend")}>
                <Ban className="h-4 w-4" /> Suspend
              </Button>
            )}
            {busy && <Spinner className="h-4 w-4" />}
          </>
        )}
      </div>

      {askReason && <ReasonModal action={askReason} doctor={doctor} onClose={() => setAskReason(null)} onConfirm={note => run(askReason, note)} />}
    </article>
  );
};

export default DoctorReviewCard;
