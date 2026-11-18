import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AlertTriangle, ArrowDown, ArrowUp, Check, FileSearch, HelpCircle, Info, Leaf, Sparkles, Stethoscope } from "lucide-react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import LanguagePicker, { useAiLanguage } from "./LanguagePicker";

const STATUS = {
  low: { label: "Low", icon: ArrowDown, className: "bg-brand-amber/15 text-brand-amber" },
  high: { label: "High", icon: ArrowUp, className: "bg-destructive/10 text-destructive" },
  abnormal: { label: "Check", icon: AlertTriangle, className: "bg-destructive/10 text-destructive" },
  normal: { label: "Normal", icon: Check, className: "bg-success/15 text-success" },
  unknown: { label: "—", icon: null, className: "bg-muted text-muted-foreground" },
};
const URGENCY = {
  urgent: { text: "Some values are far outside the normal range. Please speak to a doctor today.", className: "border-destructive/40 bg-destructive/10 text-destructive" },
  soon: { text: "Something here needs a doctor's look. Book a visit in the next few days.", className: "border-brand-amber/40 bg-brand-amber/10 text-foreground" },
  routine: { text: "Nothing here looks urgent. Show it to your doctor at your next visit.", className: "border-success/30 bg-success/10 text-foreground" },
};

const List = ({ icon: Icon, title, items, tone = "text-primary" }) =>
  items?.length > 0 && (
    <div className="rounded-2xl border border-border p-4">
      <p className="flex items-center gap-2 text-sm font-bold"><Icon className={`h-4 w-4 ${tone}`} /> {title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        {items.map(item => <li key={item} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current" />{item}</li>)}
      </ul>
    </div>
  );

// "Explain this report": the AI reads a lab report or scan and explains it in plain words (in the patient's language)
const ReportExplainer = ({ document, open, onClose, onExplained }) => {
  const { token } = useContext(authContext);
  const [lang] = useAiLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allowance, setAllowance] = useState(null);

  useEffect(() => {
    if (!open) return;
    setData(null);
    setError(null);
    apiRequest("/documents/explain/allowance", { token }).then(result => setAllowance(result.data)).catch(() => {});
  }, [open, token, document?._id]);

  const explain = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest(`/documents/${document._id}/explain`, { token, method: "POST", body: { lang } });
      setData(result.data);
      setAllowance(current => ({ ...current, ...result.data.allowance }));
      onExplained?.(document._id);
    } catch (err) {
      setError({ message: err.message, limit: err.code === "report-limit" });
      if (err.code !== "report-limit") toast.error(err.message);
    }
    setLoading(false);
  };

  const explanation = data?.explanation;
  const left = allowance && allowance.limit !== null ? Math.max(0, allowance.limit - allowance.used) : null;
  // a report explained before (in any language) doesn't count again
  const free = Boolean(document?.explainedAt || document?.locked);

  return (
    <Modal open={open} onClose={onClose} size="lg" icon={FileSearch} title="Your report in plain words" subtitle={document?.title}>
      {!explanation && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The AI (Google Gemini) reads the report and explains each value: what it measures, whether it is in the normal range and what to ask your doctor.
            It doesn&apos;t diagnose. Your doctor has the final word.
          </p>
          {allowance && (
            <p className="flex items-start gap-2 rounded-xl bg-muted/60 px-4 py-3 text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {free
                ? "You've had this report explained before, so this doesn't count toward your plan."
                : allowance.limit === null
                  ? "Your plan explains as many reports as you need."
                  : `${left} of ${allowance.limit} report explanation${allowance.limit === 1 ? "" : "s"} left this month on your plan.`}
            </p>
          )}
          {error?.limit && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
              <p className="font-semibold">{error.message}</p>
              <Link to="/plans" onClick={onClose} className="mt-2 inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                <Sparkles className="h-4 w-4" /> See Medora Plus plans
              </Link>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={explain} disabled={loading || error?.limit}>
              {loading ? <><Spinner className="h-4 w-4 text-primary-foreground" /> Reading your report…</> : <><Sparkles className="h-4 w-4" /> Explain this report</>}
            </Button>
            <LanguagePicker />
          </div>
          {loading && <p className="text-xs text-muted-foreground">This can take up to half a minute.</p>}
        </div>
      )}

      {explanation && !explanation.isMedicalReport && (
        <p className="flex items-start gap-2 rounded-xl bg-muted/60 px-4 py-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0" /> {explanation.summary || "This doesn't look like a medical test or scan report, so there is nothing to explain."}
        </p>
      )}

      {explanation?.isMedicalReport && (
        <div className="space-y-4">
          {explanation.reportType && <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{explanation.reportType}</p>}
          <p className={`rounded-xl border px-4 py-3 text-sm font-medium ${URGENCY[explanation.urgency].className}`}>{URGENCY[explanation.urgency].text}</p>
          <p className="text-sm leading-6">{explanation.summary}</p>

          {explanation.results.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border">
              <ul className="divide-y divide-border">
                {explanation.results.map((item, index) => {
                  const status = STATUS[item.status] || STATUS.unknown;
                  const Icon = status.icon;
                  return (
                    <li key={`${item.name}-${index}`} className="p-3 sm:p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{item.name}</p>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${status.className}`}>
                          {Icon && <Icon className="h-3 w-3" />} {status.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm">
                        <span className="font-bold">{item.value}</span> {item.unit}
                        {item.range && <span className="text-xs text-muted-foreground"> · normal {item.range}</span>}
                      </p>
                      {item.meaning && <p className="mt-1 text-xs text-muted-foreground">{item.meaning}</p>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <List icon={Info} title="What stands out" items={explanation.keyFindings} />
            <List icon={HelpCircle} title="Ask your doctor" items={explanation.questionsForDoctor} />
          </div>
          <List icon={Leaf} title="Everyday tips" items={explanation.lifestyleTips} tone="text-success" />

          {explanation.suggestedSpecialty && (
            <Link
              to={`/doctors?query=${encodeURIComponent(explanation.suggestedSpecialty)}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm hover:border-primary/60"
            >
              <Stethoscope className="h-5 w-5 shrink-0 text-primary" />
              <span className="flex-1">Discuss it with a <span className="font-semibold capitalize">{explanation.suggestedSpecialty}</span></span>
              <span className="font-semibold text-primary">Find one</span>
            </Link>
          )}
          <p className="text-xs text-muted-foreground">
            Explained by AI (Google Gemini) from the report itself. It can make mistakes: check the values against your report and follow your doctor&apos;s advice.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default ReportExplainer;
