import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { AlertTriangle, HelpCircle, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";

// top of the patient record: the record in 3 lines before the consultation (asked for, not automatic)
const PatientSummary = ({ patientId }) => {
  const { token } = useContext(authContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const summarize = async () => {
    setLoading(true);
    try {
      const result = await apiRequest(`/prescriptions/patients/${patientId}/summary`, { token, method: "POST" });
      setData(result.data);
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-primary" /> Pre-visit summary</p>
        {!data && (
          <Button size="sm" onClick={summarize} disabled={loading}>
            {loading ? <Spinner className="h-4 w-4 text-primary-foreground" /> : "Summarize record"}
          </Button>
        )}
        {data && <span className="text-xs text-muted-foreground">{data.source === "ai" ? "AI (Google Gemini) · check the record below" : "From the record"}</span>}
      </div>
      {!data && <p className="mt-1 text-xs text-muted-foreground">Health details, visits, symptom checks and reports in 3 lines.</p>}
      {data && (
        <div className="mt-3 space-y-3">
          {data.note && <p className="flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {data.note}</p>}
          <ol className="space-y-1.5 text-sm">
            {data.summary.lines.map((line, index) => (
              <li key={line} className="flex gap-2"><span className="font-bold text-primary">{index + 1}.</span>{line}</li>
            ))}
          </ol>
          {data.summary.watchOuts?.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> Watch out</p>
              <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">{data.summary.watchOuts.map(item => <li key={item}>• {item}</li>)}</ul>
            </div>
          )}
          {data.summary.askAbout?.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold text-primary"><HelpCircle className="h-3.5 w-3.5" /> Worth asking</p>
              <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">{data.summary.askAbout.map(item => <li key={item}>• {item}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientSummary;
