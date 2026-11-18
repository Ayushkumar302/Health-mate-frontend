import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, Check, Hourglass, Rocket, ShieldCheck, UserCog, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEP_UI = {
  profile: { icon: UserCog, tab: "profile", action: "Edit profile" },
  hours: { icon: CalendarClock, tab: "schedule", action: "Set routine", hint: "Open at least one day in your weekly routine (Schedule tab)." },
  payouts: { icon: Wallet, tab: "earnings", action: "Connect", hint: "Where your share of each consultation is paid." },
  verified: { icon: ShieldCheck },
};

// what a new doctor still has to do before patients can find them (rules live on the server: utils/onboarding.js)
const SetupChecklist = ({ onboarding, setTab }) => {
  const { steps, done } = onboarding;
  const verification = steps.find(step => step.id === "verified");
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-bold"><Rocket className="h-[18px] w-[18px] text-primary" /> Get listed on Medora</p>
          <p className="text-sm text-muted-foreground">Patients can find and book you once all four steps are done.</p>
        </div>
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{done} of {steps.length} done</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/15">
        <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${(done / steps.length) * 100}%` }} transition={{ duration: 0.5 }} />
      </div>
      <ol className="mt-4 space-y-2">
        {steps.map((step, index) => {
          const ui = STEP_UI[step.id] || {};
          const Icon = step.done ? Check : ui.icon || Hourglass;
          const hint = step.id === "profile"
            ? step.missing?.length ? `Missing: ${step.missing.join(", ")}.` : null
            : step.id === "verified"
              ? step.done ? null : "We check your medical registration number, usually within 2 days. You can finish the other steps meanwhile."
              : step.done ? null : ui.hint;
          return (
            <li key={step.id} className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${step.done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${step.done ? "text-muted-foreground line-through decoration-1" : ""}`}>
                  {index + 1}. {step.label}
                </span>
                {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
              </span>
              {!step.done && ui.tab && (
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => setTab(ui.tab)}>
                  {ui.action} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
              {!step.done && step.id === "verified" && (
                <span className="shrink-0 rounded-full bg-brand-amber/15 px-2.5 py-1 text-xs font-semibold text-brand-amber">
                  {verification.status === "pending" ? "In review" : "Not verified"}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default SetupChecklist;
