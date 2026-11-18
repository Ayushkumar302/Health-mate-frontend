import { useCallback, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BarChart3, Building2, CalendarRange, Crown, Eye, ImagePlus, MousePointerClick, RefreshCw, ShieldAlert, Sparkles, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { EmptyState, SectionCard, SettingRow as Setting, StatCard } from "@/components/Dashboard/DashboardUI";
import OffersSetting from "@/components/Header/OffersSetting";
import PlanPicker from "@/components/Plans/PlanPicker";
import { doctorFeatures, doctorRows } from "@/components/Plans/planFeatures";
import { PlanCompare, PlanFaq, PlanSkeleton } from "@/components/Plans/PlanCompare";
import { RevenueChart } from "@/dashboard/admin/AdminCharts";
import { authContext } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { apiRequest } from "@/utils/api";
import { formatPrice } from "@/utils/formatPrice";
import uploadImageToCloudinary from "@/utils/uploadCloudinary";

const percent = share => `${Math.round(share * 100)}%`;
const formatDay = date => new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const verifiedSessions = new Set();
const MAX_PHOTOS = 4;

// common questions, answered under the plans
const faqFor = data => [
  { q: "Can I cancel any time?", a: "Yes. Turn auto-renew off and you keep your plan until the end of the month you paid for. After that the Free plan's commission applies." },
  { q: "How is the commission taken?", a: "Patients pay through Stripe. Medora keeps the commission from each consultation and the rest goes straight to your payout account." },
  { q: "Does a plan change my rating or verification?", a: "No. Plans buy visibility, not trust: verification, reviews and the symptom checker's suggestions are the same for every doctor." },
  { q: "How does Featured work?", a: "Pro doctors take turns in the featured spots (at most 3 per specialty) and Pro Clinic comes first. A cancellation rate above 10% pauses it." },
  { q: "Can I change plans later?", a: "Upgrades start straight away and you pay only the difference for the rest of the month. A cheaper plan starts at your next renewal." },
  ...(data.testMode ? [{ q: "Is this real money?", a: "No, this is a demo. Pay with the test card 4242 4242 4242 4242, any future date and any CVC." }] : []),
];


// Pro Clinic: the clinic's name, logo and photos shown on the public profile
const ClinicBranding = ({ clinic, token, onSaved }) => {
  const [form, setForm] = useState({ name: clinic?.name || "", logo: clinic?.logo || "", photos: clinic?.photos || [] });
  const [busy, setBusy] = useState("");

  const upload = async (event, target) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(target);
    try {
      const data = await uploadImageToCloudinary(file);
      const url = data?.secure_url || data?.url;
      setForm(current => (target === "logo" ? { ...current, logo: url } : { ...current, photos: [...current.photos, url].slice(0, MAX_PHOTOS) }));
    } catch (error) {
      toast.error(error.message);
    }
    setBusy("");
  };

  const save = async () => {
    setBusy("save");
    try {
      const result = await apiRequest("/doctors/plan/clinic", { token, method: "PUT", body: form });
      toast.success(result.message);
      onSaved();
    } catch (error) {
      toast.error(error.message);
    }
    setBusy("");
  };

  return (
    <SectionCard icon={Building2} title="Your clinic" subtitle="Shown on your public profile while you're on Pro Clinic" bodyClassName="space-y-4 p-5">
      <label className="block">
        <span className="text-sm font-medium">Clinic name</span>
        <Input className="mt-1" maxLength={80} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="e.g. Sunrise Family Clinic" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        {form.logo
          ? <img src={form.logo} alt="Clinic logo" className="h-14 w-14 rounded-xl border border-border object-cover" />
          : <span className="grid h-14 w-14 place-items-center rounded-xl bg-muted text-muted-foreground"><Building2 className="h-6 w-6" /></span>}
        <label className="cursor-pointer">
          <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={event => upload(event, "logo")} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-semibold hover:border-primary/50">
            {busy === "logo" ? <Spinner className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />} {form.logo ? "Change logo" : "Add logo"}
          </span>
        </label>
        {form.logo && (
          <button type="button" onClick={() => setForm({ ...form, logo: "" })} className="text-sm font-semibold text-destructive hover:underline">Remove</button>
        )}
      </div>
      <div>
        <p className="text-sm font-medium">Photos <span className="font-normal text-muted-foreground">({form.photos.length}/{MAX_PHOTOS})</span></p>
        <div className="mt-2 flex flex-wrap gap-2">
          {form.photos.map(url => (
            <div key={url} className="relative">
              <img src={url} alt="" className="h-20 w-28 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => setForm({ ...form, photos: form.photos.filter(item => item !== url) })}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {form.photos.length < MAX_PHOTOS && (
            <label className="grid h-20 w-28 cursor-pointer place-items-center rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary">
              <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={event => upload(event, "photo")} />
              {busy === "photo" ? <Spinner className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
            </label>
          )}
        </div>
      </div>
      <Button onClick={save} disabled={Boolean(busy) || !form.name.trim()}>
        {busy === "save" ? <Spinner className="h-4 w-4 text-primary-foreground" /> : "Save clinic details"}
      </Button>
    </SectionCard>
  );
};

// doctor's subscription: choose a plan, upgrade or switch at renewal, settings, and what the plan brings in
const Plan = () => {
  const { token } = useContext(authContext);
  const confirm = useConfirm();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      setData((await apiRequest("/doctors/plan", { token })).data);
      setFailed(false);
    } catch (error) {
      setFailed(true);
      toast.error(error.message);
    }
  }, [token]);

  useEffect(() => {
    // back from Stripe's payment page: confirm the payment with the server first
    const params = new URLSearchParams(location.search);
    const back = params.get("pro");
    const sessionId = params.get("session_id");
    if (!back) return void load();
    navigate(location.pathname, { replace: true });
    if (back === "done" && sessionId) {
      // the same return link is only checked once (React runs this twice in development)
      if (verifiedSessions.has(sessionId)) return;
      verifiedSessions.add(sessionId);
      apiRequest(`/doctors/plan/verify/${encodeURIComponent(sessionId)}`, { token })
        .then(result => toast.success(result.message))
        .catch(error => toast.error(error.message))
        .finally(load);
    } else {
      toast.info("Payment cancelled, nothing was charged");
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  if (!data) {
    return failed
      ? <EmptyState icon={Crown} title="Couldn't load your plan" action={<Button size="sm" variant="outline" onClick={load}>Try again</Button>} />
      : <PlanSkeleton />;
  }

  const { details, plan, analytics, cancellation } = data;
  const tierOf = id => details.tiers.find(tier => tier.id === id);
  const current = tierOf(data.tier);
  const paid = data.tier !== "free";

  const choose = async (tier, action) => {
    if (action === "upgrade") {
      const ok = await confirm({
        title: `Upgrade to ${tier.label}?`,
        message: `It starts now. Stripe charges the difference for the rest of this month to your card, then ${formatPrice(tier.price)} a month from ${formatDay(plan.expiresAt)}.`,
        confirmText: "Upgrade",
      });
      if (!ok) return;
    }
    if (action === "downgrade") {
      const ok = await confirm({
        title: `Switch to ${tier.label}?`,
        message: `You keep ${current.label} until ${formatDay(plan.expiresAt)}, then move to ${tier.label} for ${formatPrice(tier.price)} a month. Nothing is refunded for this month.`,
        confirmText: "Switch at renewal",
      });
      if (!ok) return;
    }
    setBusy(tier.id);
    try {
      if (action === "buy") {
        const result = await apiRequest("/doctors/plan/checkout", { token, method: "POST", body: { tier: tier.id } });
        window.location.assign(result.data.url);
        return;
      }
      const result = await apiRequest("/doctors/plan/change", { token, method: "PUT", body: { tier: tier.id } });
      toast.success(result.message);
      await load();
    } catch (error) {
      toast.error(error.message);
    }
    setBusy("");
  };

  const change = async (setting, on) => {
    if (setting === "auto-renew" && !on) {
      const ok = await confirm({
        title: "Turn off auto-renew?",
        message: `You keep ${current.label} until ${formatDay(plan.expiresAt)}. After that you're on the free plan: ${percent(tierOf("free").commissionRate)} commission and no featured place. You can switch it back on any time before then.`,
        confirmText: "Turn off auto-renew",
        cancelText: "Keep renewing",
        tone: "danger",
      });
      if (!ok) return;
    }
    setBusy(setting);
    try {
      const result = await apiRequest(`/doctors/plan/${setting}`, { token, method: "PUT", body: { on } });
      toast.success(result.message);
      await load();
    } catch (error) {
      toast.error(error.message);
    }
    setBusy("");
  };

  const picker = (
    <PlanPicker
      tiers={details.tiers}
      current={data.tier}
      pending={plan?.pendingTier}
      period="month"
      features={doctorFeatures}
      onAction={choose}
      busy={busy}
      autoRenew={plan?.autoRenew ?? true}
      popular="pro"
    />
  );
  const more = (
    <>
      <PlanCompare tiers={details.tiers} rows={doctorRows} current={data.tier} />
      <PlanFaq items={faqFor(data)} />
    </>
  );

  if (!paid) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="text-2xl font-extrabold tracking-tight">Keep more of every consultation and get found first</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Three plans, from {formatPrice(tierOf("starter").price)} a month: lower commission, longer booking windows, instant booking,
            and on Pro and Pro Clinic a featured place in search. Renews monthly, cancel any time.
            {data.testMode && " Demo: pay with the test card 4242 4242 4242 4242, no real money."}
          </p>
        </div>
        {picker}
        <p className="text-xs text-muted-foreground">
          Plans buy visibility, not trust: verification, reviews and the symptom checker&apos;s suggestions are the same for every doctor.
        </p>
        <SectionCard icon={Crown} title="Notifications" bodyClassName="px-5">
          <OffersSetting text="A suggestion worked out from your own commission and bookings, in your notifications only, at most once every 15 days. They pause if you don't open them." />
        </SectionCard>
        {more}
      </div>
    );
  }

  const pending = plan.pendingTier ? tierOf(plan.pendingTier) : null;
  const featuredTier = current.featured !== "none";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Crown className="h-5 w-5" /></span>
        <div className="flex-1">
          <p className="font-bold">You&apos;re on Medora {current.label}</p>
          <p className="text-sm text-muted-foreground">
            {pending
              ? `Moves to ${pending.label} on ${formatDay(plan.expiresAt)} (${formatPrice(pending.price)} a month)`
              : plan.autoRenew ? `Renews on ${formatDay(plan.expiresAt)} for ${formatPrice(plan.price)}` : `Ends on ${formatDay(plan.expiresAt)}, then the free plan`}
            {" · "}{percent(current.commissionRate)} commission on new bookings
          </p>
        </div>
        {featuredTier && (
          <span className={`flex items-center gap-1 self-start rounded-full px-3 py-1 text-xs font-semibold sm:self-center ${data.featured ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <Sparkles className="h-3 w-3" /> {data.featured ? "Featured in search today" : "Not featured today"}
          </span>
        )}
      </div>

      {data.featuredNote && (
        <p className="flex items-start gap-2 rounded-2xl border border-brand-amber/30 bg-brand-amber/10 p-4 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" /> {data.featuredNote}
        </p>
      )}

      {analytics && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={Eye} label="Profile views" value={analytics.profileViews} hint="patients who opened your page" />
          <StatCard icon={CalendarRange} tone="highlight" label="Paid bookings" value={analytics.bookings} hint="all time" />
          {analytics.level === "full" && (
            <StatCard icon={MousePointerClick} tone="violet" label="Conversion" value={percent(analytics.conversion)} hint="views that became bookings" />
          )}
          <StatCard
            icon={ShieldAlert}
            tone="amber"
            label="Cancellation rate"
            value={percent(cancellation.rate)}
            hint={`${cancellation.cancelled} of ${cancellation.confirmed} confirmed, last 90 days`}
          />
        </div>
      )}

      {analytics?.level === "full" && (
        <SectionCard icon={BarChart3} title="Your earnings, last 6 months" subtitle="Your share after commission and refunds, by payment month">
          <RevenueChart months={analytics.months.map(month => ({ ...month, revenue: month.earned }))} />
        </SectionCard>
      )}

      <SectionCard icon={Crown} title="Plan settings" bodyClassName="divide-y divide-border px-5">
        <Setting
          icon={Zap}
          title="Instant booking"
          text="New bookings are confirmed as soon as the patient pays, without you accepting each one. Keep your weekly hours and time off up to date."
          checked={data.instantBooking}
          busy={busy === "instant-booking"}
          onChange={on => change("instant-booking", on)}
        />
        <Setting
          icon={RefreshCw}
          title="Auto-renew"
          text={plan.autoRenew
            ? `${current.label} renews each month. Turn this off to stop at the end of the paid month.`
            : `Off: ${current.label} ends on ${formatDay(plan.expiresAt)}. Turn it on to keep it.`}
          checked={plan.autoRenew}
          busy={busy === "auto-renew"}
          onChange={on => change("auto-renew", on)}
        />
        {current.id !== "clinic" && <OffersSetting text="A suggestion about the next plan, worked out from your own numbers, in your notifications only, at most once every 15 days." />}
      </SectionCard>

      {current.clinicBranding && <ClinicBranding clinic={data.clinic} token={token} onSaved={load} />}

      <SectionCard icon={Sparkles} title="Change plan" subtitle="Upgrades start now (you pay the difference); cheaper plans start at the next renewal" bodyClassName="p-5">
        {picker}
      </SectionCard>
      {more}
    </div>
  );
};

export default Plan;
