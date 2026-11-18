import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BadgeIndianRupee, BadgePercent, CalendarRange, RefreshCw, Sparkles } from "lucide-react";
import { refreshFamily } from "@/hooks/useFamily";
import { SectionCard, SettingRow, StatCard } from "@/components/Dashboard/DashboardUI";
import PlanPicker from "@/components/Plans/PlanPicker";
import { patientFeatures, patientRows } from "@/components/Plans/planFeatures";
import { PlanCompare, PlanFaq, PlanSkeleton } from "@/components/Plans/PlanCompare";
import { authContext } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import usePlus, { currentTier, refreshPlus, tierById } from "@/hooks/usePlus";
import { apiRequest } from "@/utils/api";
import { formatPrice } from "@/utils/formatPrice";

const formatDay = date => new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const verifiedSessions = new Set();

// common questions, answered under the plans
const faqFor = (data, cutoffHours) => [
  { q: "Can I cancel any time?", a: "Yes. Turn auto-renew off and you keep your plan until the end of the year you paid for. Nothing more is charged." },
  { q: "Can I change plans later?", a: "Upgrades start straight away and you pay only the difference for the rest of the year. A cheaper plan starts at your next renewal." },
  { q: "What if the doctor cancels?", a: "You always get a full refund, on every plan. The plan only changes what you get back when you cancel yourself." },
  { q: "Who pays for the bigger refunds?", a: `Medora does. Your doctor is paid the same on every plan, so choosing a plan never costs them anything. The refund rates apply when you cancel ${cutoffHours}+ hours before or later.` },
  { q: "How does Plus Family work?", a: "Add up to 3 family members, book visits for them from your account, and keep a separate health record for each person. Every consultation is 5% cheaper." },
  ...(data.testMode ? [{ q: "Is this real money?", a: "No, this is a demo. Pay with the test card 4242 4242 4242 4242, any future date and any CVC." }] : []),
];


// the patient's membership: choose a plan, upgrade or switch at renewal, auto-renew, what it has saved
const Plus = () => {
  const { token } = useContext(authContext);
  const confirm = useConfirm();
  const location = useLocation();
  const navigate = useNavigate();
  const data = usePlus();
  const [busy, setBusy] = useState("");

  useEffect(() => {
    // back from Stripe's payment page: confirm the payment with the server first
    const params = new URLSearchParams(location.search);
    const back = params.get("plus");
    const sessionId = params.get("session_id");
    if (!back) return;
    navigate(location.pathname, { replace: true });
    if (back === "done" && sessionId) {
      // the same return link is only checked once (React runs this twice in development)
      if (verifiedSessions.has(sessionId)) return;
      verifiedSessions.add(sessionId);
      apiRequest(`/plus/verify/${encodeURIComponent(sessionId)}`, { token })
        .then(result => toast.success(result.message))
        .catch(error => toast.error(error.message))
        .finally(() => {
          refreshPlus(token);
          refreshFamily(token);
        });
    } else if (back === "cancelled") {
      toast.info("Payment cancelled, nothing was charged");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return <PlanSkeleton />;

  const { details, membership, savings } = data;
  const current = currentTier(data);
  const paid = data.tier !== "free";

  const choose = async (tier, action) => {
    if (action === "upgrade") {
      const ok = await confirm({
        title: `Upgrade to ${tier.label}?`,
        message: `It starts now. Stripe charges the difference for the rest of this year to your card, then ${formatPrice(tier.price)} a year from ${formatDay(membership.expiresAt)}.`,
        confirmText: "Upgrade",
      });
      if (!ok) return;
    }
    if (action === "downgrade") {
      const ok = await confirm({
        title: `Switch to ${tier.label}?`,
        message: `You keep ${current.label} until ${formatDay(membership.expiresAt)}, then move to ${tier.label} for ${formatPrice(tier.price)} a year. Nothing is refunded for this year.`,
        confirmText: "Switch at renewal",
      });
      if (!ok) return;
    }
    setBusy(tier.id);
    try {
      if (action === "buy") {
        const result = await apiRequest("/plus/checkout", { token, method: "POST", body: { tier: tier.id } });
        window.location.assign(result.data.url);
        return;
      }
      const result = await apiRequest("/plus/change", { token, method: "PUT", body: { tier: tier.id } });
      toast.success(result.message);
      await Promise.all([refreshPlus(token), refreshFamily(token)]);
    } catch (error) {
      toast.error(error.message);
    }
    setBusy("");
  };

  const setAutoRenew = async on => {
    if (!on) {
      const ok = await confirm({
        title: "Turn off auto-renew?",
        message: `You keep ${current.label} until ${formatDay(membership.expiresAt)}. After that the free plan's refund and reschedule rules apply again. You can switch it back on any time before then.`,
        confirmText: "Turn off auto-renew",
        cancelText: "Keep renewing",
        tone: "danger",
      });
      if (!ok) return;
    }
    setBusy("auto-renew");
    try {
      const result = await apiRequest("/plus/auto-renew", { token, method: "PUT", body: { on } });
      toast.success(result.message);
      await refreshPlus(token);
    } catch (error) {
      toast.error(error.message);
    }
    setBusy("");
  };

  const picker = (
    <PlanPicker
      tiers={details.tiers}
      current={data.tier}
      pending={membership?.pendingTier}
      period="year"
      features={tier => patientFeatures(tier, details.cutoffHours)}
      onAction={choose}
      busy={busy}
      autoRenew={membership?.autoRenew ?? true}
      icon={Sparkles}
      popular="plus"
    />
  );
  const more = (
    <>
      <PlanCompare tiers={details.tiers} rows={patientRows(details.cutoffHours)} current={data.tier} />
      <PlanFaq items={faqFor(data, details.cutoffHours)} />
    </>
  );

  if (!paid) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="text-2xl font-extrabold tracking-tight">Plans change. Your care shouldn&apos;t cost more when they do.</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Better refunds, more reschedules and longer follow-up chat with your doctor, from {formatPrice(tierById(data, "lite")?.price || 0)} a year.
            Renews yearly, cancel any time.
            {data.testMode && " Demo: pay with the test card 4242 4242 4242 4242, no real money."}
          </p>
        </div>
        {picker}
        <p className="text-xs text-muted-foreground">
          Your doctor is paid the same on every plan: Medora pays the extra refunds, not them. A doctor who cancels always refunds you in full.
        </p>
        {more}
      </div>
    );
  }

  const pending = membership.pendingTier ? tierById(data, membership.pendingTier) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" /></span>
        <div className="flex-1">
          <p className="font-bold">You&apos;re a Medora {current.label} member</p>
          <p className="text-sm text-muted-foreground">
            {pending
              ? `Moves to ${pending.label} on ${formatDay(membership.expiresAt)} (${formatPrice(pending.price)} a year)`
              : membership.autoRenew
                ? `Renews on ${formatDay(membership.expiresAt)} for ${formatPrice(membership.price)}`
                : `Ends on ${formatDay(membership.expiresAt)}, then the free plan's rules apply`}
          </p>
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-4 ${current.consultDiscount > 0 || savings.discounts > 0 ? "xl:grid-cols-3" : ""}`}>
        <StatCard icon={BadgeIndianRupee} label="Extra refunds" value={formatPrice(savings.refunds)} hint="more than the free plan's refund" />
        <StatCard icon={CalendarRange} tone="highlight" label="Extra moves" value={savings.extraReschedules} hint="reschedules past the free one" />
        {(current.consultDiscount > 0 || savings.discounts > 0) && (
          <StatCard icon={BadgePercent} tone="violet" label="Family discounts" value={formatPrice(savings.discounts || 0)} hint={`${Math.round((current.consultDiscount || 0) * 100)}% off every visit`} />
        )}
      </div>

      <SectionCard icon={Sparkles} title="Membership" bodyClassName="divide-y divide-border px-5">
        <SettingRow
          icon={RefreshCw}
          title="Auto-renew"
          text={membership.autoRenew
            ? `${current.label} renews each year. Turn this off to stop at the end of the paid year.`
            : `Off: ${current.label} ends on ${formatDay(membership.expiresAt)}. Turn it on to keep it.`}
          checked={membership.autoRenew}
          busy={busy === "auto-renew"}
          onChange={setAutoRenew}
        />
      </SectionCard>

      <SectionCard icon={Sparkles} title="Change plan" subtitle="Upgrades start now (you pay the difference); cheaper plans start at the next renewal" bodyClassName="p-5">
        {picker}
      </SectionCard>
      {more}
    </div>
  );
};

export default Plus;
