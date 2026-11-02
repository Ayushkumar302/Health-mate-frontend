import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookmarkPlus, Check, Info, Lightbulb, Phone, ShieldAlert, Sparkles, Star, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/ui/avatar";
import Spinner from "@/components/ui/spinner";
import { TYPE_ICONS } from "@/components/Booking/ConsultationBadge";
import { formatPrice } from "@/utils/formatPrice";
import { quickCallFeeOf } from "@/utils/appointment";
import { SOURCE_LABELS, URGENCY, VISIT_LABELS } from "@/utils/symptoms";

const List = ({ icon: Icon, title, items, tone = "text-primary" }) =>
  items?.length > 0 && (
    <div className="rounded-2xl border border-border p-4">
      <p className="flex items-center gap-2 text-sm font-bold"><Icon className={`h-4 w-4 ${tone}`} /> {title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        {items.map(item => (
          <li key={item} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current" />{item}</li>
        ))}
      </ul>
    </div>
  );

// the coloured box at the top: how urgent it is (with what to do right now for emergencies)
export const UrgencyBanner = ({ result }) => {
  const urgency = URGENCY[result.urgency] || URGENCY.routine;
  const Icon = urgency.icon;
  return (
    <div className={`rounded-2xl border p-5 ${urgency.tone}`}>
      <p className="flex items-center gap-2 text-lg font-extrabold"><Icon className="h-5 w-5" /> {urgency.title}</p>
      {result.summary && <p className="mt-2 text-sm leading-6 text-foreground">{result.summary}</p>}
      {result.emergency?.actions?.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {result.emergency.actions.map(action => (
            <li key={action} className="flex items-start gap-2 text-sm font-semibold text-foreground">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> {action}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const DoctorRow = ({ doctor, visitType }) => {
  const navigate = useNavigate();
  const fee = visitType === "quick-call" ? quickCallFeeOf(doctor) : doctor.ticketPrice;
  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar src={doctor.photo} name={doctor.name} className="h-11 w-11" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{doctor.name}</p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">{doctor.specialization}</span>
          <span className="flex items-center gap-0.5 font-semibold text-brand-amber">
            <Star className="h-3 w-3 fill-current" /> {doctor.averageRating ? doctor.averageRating.toFixed(1) : "New"}
          </span>
          {fee > 0 && <span>· {formatPrice(fee)}</span>}
        </p>
      </div>
      {/* the booking panel opens with the suggested kind of visit already chosen */}
      <Button size="sm" onClick={() => navigate(`/doctors/${doctor._id}`, { state: { consultationType: visitType } })}>
        Book <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </li>
  );
};

// everything the checker answered; onSave adds the "Save to my health record" button
const SymptomResult = ({ data, onSave, saving = false, saved = false }) => {
  const { result, source, doctors = [], note } = data;
  const emergency = result.urgency === "emergency";
  const VisitIcon = TYPE_ICONS[result.visitType] || Stethoscope;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          {source === "ai" ? <Sparkles className="h-3.5 w-3.5 text-primary" /> : <ShieldAlert className="h-3.5 w-3.5" />}
          {SOURCE_LABELS[source]}
        </span>
        {onSave && (
          <Button variant={saved ? "soft" : "outline"} size="sm" onClick={onSave} disabled={saving || saved}>
            {saving ? <Spinner className="h-4 w-4" /> : saved ? <><Check className="h-4 w-4" /> Saved to health record</> : <><BookmarkPlus className="h-4 w-4" /> Save to my health record</>}
          </Button>
        )}
      </div>
      {note && <p className="flex items-start gap-2 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0" /> {note}</p>}

      <UrgencyBanner result={result} />

      {!emergency && result.specialty && (
        <div className="rounded-2xl border border-border p-5">
          <p className="text-sm text-muted-foreground">Doctor to see</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <p className="text-2xl font-extrabold">{result.specialtyLabel}</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <VisitIcon className="h-4 w-4" /> {VISIT_LABELS[result.visitType]}
            </span>
          </div>
          {result.reasons?.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {result.reasons.map(reason => (
                <li key={reason} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{reason}</li>
              ))}
            </ul>
          )}
          {result.alsoConsider?.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              Also worth considering:{" "}
              {result.alsoConsider.map((item, index) => (
                <span key={item.key || item}>
                  {index > 0 && ", "}
                  {item.key ? <Link to={`/doctors?specialty=${encodeURIComponent(item.key)}`} className="font-semibold text-primary hover:underline">{item.label}</Link> : item}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <List icon={Lightbulb} title="What it could be" items={result.possibleCauses} />
        <List icon={Check} title="What you can do now" items={result.selfCare} tone="text-success" />
        <List icon={ShieldAlert} title="Get help quickly if" items={result.warningSigns} tone="text-destructive" />
      </div>

      {!emergency && doctors.length > 0 && (
        <div className="rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold">Top rated {result.specialtyLabel?.toLowerCase()}s</p>
            <Link to={`/doctors?specialty=${encodeURIComponent(result.specialty)}`} className="text-sm font-semibold text-primary hover:underline">
              See all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {doctors.map(doctor => <DoctorRow key={doctor._id} doctor={doctor} visitType={result.visitType} />)}
          </ul>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        This is guidance, not a diagnosis. If you feel very unwell or it gets worse, call 112 or see a doctor.
      </p>
    </div>
  );
};

export default SymptomResult;
