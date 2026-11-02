import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { AlertTriangle, Check, FlaskConical, Info, Pill, ShieldAlert, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";

const GRID_COLUMNS = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" };

const List = ({ icon: Icon, title, items, tone }) =>
  items?.length > 0 && (
    <div className="rounded-2xl border border-border p-4">
      <p className="flex items-center gap-2 text-sm font-bold"><Icon className={`h-4 w-4 ${tone}`} /> {title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        {items.map(item => <li key={item} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current" />{item}</li>)}
      </ul>
    </div>
  );

// "Explain in simple words" for patients: the doctor's exact instructions stay next to the plain-words version
const PrescriptionExplainer = ({ prescription }) => {
  const { token } = useContext(authContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    setLoading(true);
    try {
      const result = await apiRequest(`/prescriptions/booking/${prescription.booking?._id || prescription.booking}/explain`, { token, method: "POST" });
      setData(result.data);
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  if (!data) {
    return (
      <div className="card-surface mx-auto mb-6 flex max-w-3xl flex-col items-start gap-4 p-5 sm:flex-row sm:items-center print:hidden">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">Not sure what this all means?</p>
          <p className="text-sm text-muted-foreground">Get your prescription explained in simple words: what each medicine is for and how to take it.</p>
        </div>
        <Button onClick={explain} disabled={loading} className="w-full shrink-0 sm:w-auto">
          {loading ? <><Spinner className="h-4 w-4 text-primary-foreground" /> Explaining…</> : <><Sparkles className="h-4 w-4" /> Explain in simple words</>}
        </Button>
      </div>
    );
  }

  const { explanation, source, note } = data;
  return (
    <div className="card-surface mx-auto mb-6 max-w-3xl space-y-4 p-5 sm:p-6 print:hidden">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-bold"><Sparkles className="h-4 w-4 text-primary" /> Your prescription in simple words</p>
        <button type="button" onClick={() => setData(null)} aria-label="Close the explanation" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{source === "ai" ? "Explained by AI (Google Gemini)" : "Quick guide"}</p>
      {note && <p className="flex items-start gap-2 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0" /> {note}</p>}
      <p className="text-sm leading-6">{explanation.overview}</p>

      {explanation.medicines.length > 0 && (
        <div className="space-y-3">
          {explanation.medicines.map((medicine, index) => {
            const written = prescription.medicines[index];
            return (
              <div key={`${medicine.name}-${index}`} className="rounded-2xl border border-border p-4">
                <p className="flex items-center gap-2 font-bold"><Pill className="h-4 w-4 text-primary" /> {medicine.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{medicine.whatFor}</p>
                <p className="mt-2 text-sm"><span className="font-semibold">How to take it:</span> {medicine.howToTake}</p>
                {/* exactly what the doctor wrote, so nothing can get lost in the explanation */}
                {written && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Doctor wrote: {[written.dosage, written.frequency, written.duration, written.instructions].filter(Boolean).join(" · ") || "see the prescription"}
                  </p>
                )}
                {medicine.tips?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {medicine.tips.map(tip => <li key={tip} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{tip}</li>)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {explanation.tests?.length > 0 && (
        <div className="rounded-2xl border border-border p-4">
          <p className="flex items-center gap-2 text-sm font-bold"><FlaskConical className="h-4 w-4 text-primary" /> Tests to get done</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {explanation.tests.map(test => <li key={test.name}><span className="font-semibold text-foreground">{test.name}:</span> {test.why}</li>)}
          </ul>
        </div>
      )}

      {/* as many columns as there are lists, so an empty one leaves no gap */}
      <div className={`grid gap-4 ${GRID_COLUMNS[[explanation.dos, explanation.donts, explanation.callDoctorIf].filter(items => items?.length).length] || ""}`}>
        <List icon={Check} title="Do" items={explanation.dos} tone="text-success" />
        <List icon={AlertTriangle} title="Avoid" items={explanation.donts} tone="text-brand-amber" />
        <List icon={ShieldAlert} title="Call your doctor if" items={explanation.callDoctorIf} tone="text-destructive" />
      </div>

      <p className="text-xs text-muted-foreground">
        If anything here is different from the prescription below, follow the prescription and ask your doctor.
      </p>
    </div>
  );
};

export default PrescriptionExplainer;
