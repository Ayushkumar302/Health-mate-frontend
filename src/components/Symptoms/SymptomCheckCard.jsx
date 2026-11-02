import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// invitation to the symptom checker: "wide" on the home and doctors pages, "compact" in the dashboard sidebar
const SymptomCheckCard = ({ variant = "wide" }) => {
  if (variant === "compact") {
    return (
      <Link
        to="/symptom-checker"
        className="group flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 transition-colors hover:border-primary/50"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Not sure which doctor?</span>
          <span className="block text-xs text-muted-foreground">Check your symptoms in seconds</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
      </Link>
    );
  }
  return (
    <div className="card-surface flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft"><Sparkles className="h-7 w-7" /></span>
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-bold">Not sure which doctor you need?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe how you feel and our AI symptom checker tells you how urgent it is, which specialist to see and who is free to help.
        </p>
      </div>
      <Button asChild className="w-full shrink-0 sm:w-auto">
        <Link to="/symptom-checker">Check your symptoms <ArrowRight className="h-4 w-4" /></Link>
      </Button>
    </div>
  );
};

export default SymptomCheckCard;
