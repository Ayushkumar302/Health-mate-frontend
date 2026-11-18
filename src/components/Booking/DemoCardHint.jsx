import { useState } from "react";
import { Check, Copy, CreditCard } from "lucide-react";

const TEST_CARD = "4242 4242 4242 4242";

// demo: the Stripe test card, so visitors know what to type on the payment page
// (shown by the booking panel and the booking assistant)
const DemoCardHint = () => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(TEST_CARD.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 text-xs">
      <p className="flex items-center gap-1.5 font-semibold text-foreground">
        <CreditCard className="h-3.5 w-3.5 text-primary" /> Demo payment, no real money
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2">
        <span className="font-mono text-sm font-bold tracking-wider">{TEST_CARD}</span>
        <button type="button" onClick={copy} className="flex items-center gap-1 font-semibold text-primary hover:underline">
          {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
        </button>
      </div>
      <p className="mt-2 text-muted-foreground">
        Any future date (e.g. <span className="font-semibold text-foreground">12/34</span>), any CVC (e.g. <span className="font-semibold text-foreground">123</span>), any name.
      </p>
    </div>
  );
};

export default DemoCardHint;
