import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ClipboardCheck, Sparkles, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/Dashboard/DashboardUI";
import { authContext } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { apiRequest } from "@/utils/api";
import { AGE_GROUPS, DURATIONS, SEVERITIES, SOURCE_LABELS, URGENCY, VISIT_LABELS, optionLabel } from "@/utils/symptoms";

// one saved symptom check; doctors see the same card in the patient record
export const SavedCheckItem = ({ check, onDelete }) => {
  const urgency = URGENCY[check.result?.urgency] || URGENCY.routine;
  const { input = {}, result = {} } = check;
  const described = [input.symptoms, ...(input.chips || [])].filter(Boolean).join(" · ");
  return (
    <li className="rounded-2xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${urgency.tone}`}>{urgency.label}</span>
        {/* doctors see whether the advice came from the AI, the rules guide or the emergency check */}
        <span className="text-xs text-muted-foreground">
          {SOURCE_LABELS[check.source]} · {new Date(check.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold">{described || "Symptoms not described"}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {[optionLabel(AGE_GROUPS, input.ageGroup), `started ${optionLabel(DURATIONS, input.duration).toLowerCase()}`, optionLabel(SEVERITIES, input.severity).toLowerCase()].join(" · ")}
      </p>
      {result.specialtyLabel && (
        <p className="mt-2 text-sm">
          Suggested: <span className="font-semibold">{result.specialtyLabel}</span>
          {result.visitType && <span className="text-muted-foreground"> · {VISIT_LABELS[result.visitType]}</span>}
        </p>
      )}
      {result.summary && <p className="mt-1 text-sm text-muted-foreground">{result.summary}</p>}
      {onDelete && (
        <button type="button" onClick={() => onDelete(check)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      )}
    </li>
  );
};

// the patient's saved symptom checks (health tab)
const SavedChecks = () => {
  const { token } = useContext(authContext);
  const confirm = useConfirm();
  const [checks, setChecks] = useState(null);

  useEffect(() => {
    apiRequest("/symptom-check/saved", { token })
      .then(result => setChecks(result.data))
      .catch(() => setChecks([]));
  }, [token]);

  const remove = async check => {
    if (!(await confirm({ title: "Delete this symptom check?", message: "It is removed from your health record.", confirmText: "Delete", tone: "danger" }))) return;
    try {
      await apiRequest(`/symptom-check/saved/${check._id}`, { token, method: "DELETE" });
      setChecks(list => list.filter(item => item._id !== check._id));
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <SectionCard
      icon={ClipboardCheck}
      title="Saved symptom checks"
      subtitle="Doctors you book can read them before your visit"
      action={<Link to="/symptom-checker" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><Sparkles className="h-4 w-4" /> New check</Link>}
    >
      {!checks ? (
        <div className="skeleton h-16 rounded-xl" />
      ) : checks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing saved yet. After a <Link to="/symptom-checker" className="font-semibold text-primary hover:underline">symptom check</Link>, choose &quot;Save to my health record&quot; to keep it here.
        </p>
      ) : (
        <ul className="space-y-3">
          {checks.map(check => <SavedCheckItem key={check._id} check={check} onDelete={remove} />)}
        </ul>
      )}
    </SectionCard>
  );
};

export default SavedChecks;
