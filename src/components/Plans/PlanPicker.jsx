import { Check, Clock, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { formatPrice } from "@/utils/formatPrice";


// The plans side by side, with the right button on each: choose (no plan yet), upgrade (now, pay the
// difference), switch at renewal (cheaper), or keep (cancels a switch that is waiting).
// onAction(tier, action) with action "buy" | "upgrade" | "downgrade" | "keep".
// popular: the plan most people pick, marked on its card (only while you are on the free plan)
const PlanPicker = ({ tiers, current, pending, period, features, onAction, busy, autoRenew = true, icon: Icon = Crown, popular }) => {
  const rank = id => tiers.findIndex(tier => tier.id === id);
  return (
    <div className={`grid gap-4 pt-3 sm:grid-cols-2 ${tiers.length > 3 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
      {tiers.map(tier => {
        const isCurrent = tier.id === current;
        const isPending = tier.id === pending;
        const free = tier.id === "free";
        const action = free ? null
          : current === "free" ? "buy"
          : isCurrent ? (pending ? "keep" : null)
          : rank(tier.id) > rank(current) ? "upgrade" : "downgrade";
        const label = { buy: `Choose ${tier.label}`, upgrade: `Upgrade to ${tier.label}`, downgrade: "Switch at renewal", keep: `Keep ${tier.label}` }[action];
        const isPopular = tier.id === popular && current === "free";
        const highlighted = (isCurrent && !free) || isPopular;
        return (
          <div
            key={tier.id}
            className={`relative flex flex-col rounded-2xl border p-5 ${highlighted ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border bg-card"}`}
          >
            {isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground shadow-sm">
                Most popular
              </span>
            )}
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-1.5 font-bold">
                {!free && <Icon className="h-4 w-4 text-primary" />} {tier.label}
              </p>
              {isCurrent && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">Your plan</span>}
              {isPending && <span className="flex items-center gap-1 rounded-full bg-brand-amber/15 px-2 py-0.5 text-[11px] font-bold text-brand-amber"><Clock className="h-3 w-3" /> From renewal</span>}
            </div>
            <p className="mt-2">
              <span className="text-2xl font-extrabold">{free ? "₹0" : formatPrice(tier.price)}</span>
              {!free && <span className="text-sm text-muted-foreground"> / {period}</span>}
            </p>
            {!free && period === "year" && (
              <p className="text-xs text-muted-foreground">about {formatPrice(Math.round(tier.price / 12))} a month</p>
            )}
            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {features(tier).map(line => (
                <li key={line} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span>{line}</span></li>
              ))}
            </ul>
            <div className="mt-5">
              {tier.available === false ? (
                <Button className="w-full" variant="outline" disabled><Sparkles className="h-4 w-4" /> Coming soon</Button>
              ) : action === "downgrade" && !autoRenew ? (
                <p className="text-center text-xs text-muted-foreground">Turn auto-renew on to switch plans</p>
              ) : action ? (
                <Button
                  className="w-full"
                  variant={action === "upgrade" || action === "buy" ? "default" : "outline"}
                  disabled={Boolean(busy)}
                  onClick={() => onAction(tier, action)}
                >
                  {busy === tier.id ? <Spinner className="h-4 w-4" /> : label}
                </Button>
              ) : free && current !== "free" ? (
                <p className="text-center text-xs text-muted-foreground">Turn auto-renew off to go back to Free</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlanPicker;
