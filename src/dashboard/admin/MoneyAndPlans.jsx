import { useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BadgePercent, Crown, IndianRupee, Lock, RotateCcw, Save, SlidersHorizontal, Sparkles, Undo2, Users } from "lucide-react";
import { authContext } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { apiRequest } from "@/utils/api";
import { formatPrice } from "@/utils/formatPrice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { EmptyState, SectionCard, StatCard } from "@/components/Dashboard/DashboardUI";

const shortDate = date => new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// the money settings, grouped as the form shows them
const GROUPS = [
  {
    title: "Commission by doctor plan",
    text: "Medora's share of each consultation. Saved on every booking, so a change only affects new bookings. It must go down with each plan.",
    fields: [
      ["commissionPercent", "Free", "%"],
      ["starterCommissionPercent", "Pro Starter", "%"],
      ["proCommissionPercent", "Pro", "%"],
      ["clinicCommissionPercent", "Pro Clinic", "%"],
    ],
  },
  {
    title: "Doctor plan prices, per month",
    text: "For new subscribers. Existing ones keep the price they subscribed at.",
    fields: [
      ["starterPrice", "Pro Starter", "₹"],
      ["proPrice", "Pro", "₹"],
      ["clinicPrice", "Pro Clinic", "₹"],
    ],
  },
  {
    title: "Patient plan prices, per year",
    text: "For new members. Plus Family covers up to 4 people.",
    fields: [
      ["litePrice", "Plus Lite", "₹"],
      ["plusPrice", "Plus", "₹"],
      ["familyPrice", "Plus Family", "₹"],
    ],
  },
  {
    title: "Refunds when a patient cancels",
    text: "After the doctor has confirmed. Early = 2+ hours before the appointment. Plus Family uses the Plus rates. A doctor who cancels always refunds 100%.",
    fields: [
      ["refundEarlyPercent", "Free, early", "%"],
      ["refundLatePercent", "Free, late", "%"],
      ["liteRefundEarlyPercent", "Plus Lite, early", "%"],
      ["liteRefundLatePercent", "Plus Lite, late", "%"],
      ["plusRefundEarlyPercent", "Plus, early", "%"],
      ["plusRefundLatePercent", "Plus, late", "%"],
    ],
  },
];

const TIER_LABELS = { starter: "Pro Starter", pro: "Pro", clinic: "Pro Clinic", lite: "Plus Lite", plus: "Plus", family: "Plus Family" };
const tierCounts = tiers => tiers.map(tier => `${tier.count} ${TIER_LABELS[tier.id]}`).join(" · ");

const Field = ({ name, label, unit, value, defaultValue, disabled, onChange }) => (
  <label className="block">
    <span className="text-sm font-medium">{label}</span>
    <div className="relative mt-1">
      {unit === "₹" && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>}
      <Input
        type="number"
        inputMode="decimal"
        min="0"
        step={unit === "₹" ? 1 : 0.5}
        name={name}
        value={value}
        disabled={disabled}
        onChange={event => onChange(name, event.target.value)}
        className={`${unit === "₹" ? "pl-7" : "pr-8"} disabled:cursor-not-allowed disabled:opacity-80`}
      />
      {unit === "%" && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>}
    </div>
    {String(value) !== String(defaultValue) && (
      <span className="mt-1 block text-xs text-muted-foreground">Default: {unit === "₹" ? formatPrice(defaultValue) : `${defaultValue}%`}</span>
    )}
  </label>
);

// admin: what subscriptions bring in, who is subscribed, and the money rules (view-only in the demo)
const MoneyAndPlans = () => {
  const { token } = useContext(authContext);
  const confirm = useConfirm();
  const [plans, setPlans] = useState(null);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState("");
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const [plansResult, settingsResult] = await Promise.all([
        apiRequest("/admin/plans", { token }),
        apiRequest("/admin/settings/money", { token }),
      ]);
      setPlans(plansResult.data);
      setSettings(settingsResult.data);
      setForm(settingsResult.data.values);
      setFailed(false);
    } catch (error) {
      setFailed(true);
      toast.error(error.message);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (!plans || !settings) {
    return failed
      ? <EmptyState icon={IndianRupee} title="Couldn't load money and plans" action={<Button size="sm" variant="outline" onClick={load}>Try again</Button>} />
      : <div className="grid place-items-center py-16"><Spinner /></div>;
  }

  const editable = settings.editable;
  const changed = Object.keys(settings.values).some(key => String(form[key]) !== String(settings.values[key]));
  const setField = (name, value) => setForm(current => ({ ...current, [name]: value }));

  const save = async () => {
    setBusy("save");
    try {
      const result = await apiRequest("/admin/settings/money", { token, method: "PUT", body: form });
      toast.success(result.message);
      setSettings(result.data);
      setForm(result.data.values);
      setPlans((await apiRequest("/admin/plans", { token })).data);
    } catch (error) {
      toast.error(error.message);
    }
    setBusy("");
  };

  const stopRenewal = async member => {
    const ok = await confirm({
      title: `Stop ${member.name}'s renewal?`,
      message: `Their ${member.kind === "pro" ? "Medora Pro" : "Medora Plus"} plan runs until ${shortDate(member.expiresAt)} and is not charged again. They get a notification.`,
      confirmText: "Stop renewal",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(member._id);
    try {
      const result = await apiRequest(`/admin/plans/${member.kind}/${member._id}/stop-renewal`, { token, method: "PUT" });
      toast.success(result.message);
      setPlans((await apiRequest("/admin/plans", { token })).data);
    } catch (error) {
      toast.error(error.message);
    }
    setBusy("");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Crown} label="Doctors on a plan" value={plans.pro.active} hint={tierCounts(plans.pro.tiers)} />
        <StatCard icon={Sparkles} tone="highlight" label="Patients on a plan" value={plans.plus.active} hint={tierCounts(plans.plus.tiers)} />
        <StatCard icon={IndianRupee} tone="violet" label="Subscriptions" value={formatPrice(plans.pro.monthlyRevenue + plans.plus.monthlyRevenue)} hint="a month, from paid renewing plans" />
        <StatCard icon={BadgePercent} tone="amber" label="Commission" value={`${settings.values.commissionPercent}%`} hint={`${settings.values.clinicCommissionPercent}% to ${settings.values.starterCommissionPercent}% on paid plans`} />
      </div>

      <SectionCard icon={Users} title="Subscribers" subtitle="Ending soonest first" bodyClassName="">
        {plans.members.length === 0 ? (
          <EmptyState icon={Users} title="No subscribers yet" text="Doctors buy Medora Pro and patients Medora Plus from their dashboards." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Pays</th>
                  <th className="px-5 py-3">Paid until</th>
                  <th className="px-5 py-3">Renewal</th>
                  {editable && <th className="px-5 py-3"><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody>
                {plans.members.map(member => (
                  <tr key={`${member.kind}-${member._id}`} className="border-t border-border">
                    <td className="px-5 py-3">
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${member.kind === "pro" ? "bg-primary/10 text-primary" : "bg-highlight/15 text-highlight"}`}>
                        {member.kind === "pro" ? <Crown className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />} {member.tierLabel}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      {member.paid ? `${formatPrice(member.price)}/${member.kind === "pro" ? "month" : "year"}` : <span className="text-muted-foreground">Demo, no payment</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                      {shortDate(member.expiresAt)}
                      {member.pendingTier && <span className="block text-xs">then {TIER_LABELS[member.pendingTier]}</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${member.autoRenew ? "bg-success/15 text-success" : "bg-brand-amber/15 text-brand-amber"}`}>
                        {member.autoRenew ? "Renewing" : "Ending"}
                      </span>
                    </td>
                    {editable && (
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        {member.autoRenew && (
                          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" disabled={busy === member._id} onClick={() => stopRenewal(member)}>
                            {busy === member._id ? <Spinner className="h-4 w-4" /> : "Stop renewal"}
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={SlidersHorizontal}
        title="Money settings"
        subtitle={settings.updatedAt ? `Last changed ${shortDate(settings.updatedAt)}` : "Using the defaults from the server's settings"}
        bodyClassName="p-5"
      >
        {!editable && (
          <p className="mb-5 flex items-start gap-2 rounded-xl bg-muted/70 px-4 py-3 text-sm text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            View-only in the demo: every visitor shares this admin account, so prices and refund rules stay the same for everyone. On a real deployment the admin edits them here.
          </p>
        )}
        <div className="space-y-6">
          {GROUPS.map(group => (
            <fieldset key={group.title}>
              <legend className="font-semibold">{group.title}</legend>
              <p className="text-xs text-muted-foreground">{group.text}</p>
              <div className={`mt-3 grid gap-4 sm:grid-cols-2 ${group.fields.length === 3 ? "xl:grid-cols-3" : group.fields.length > 3 ? "xl:grid-cols-4" : ""}`}>
                {group.fields.map(([name, label, unit]) => (
                  <Field key={name} name={name} label={label} unit={unit} value={form[name] ?? ""} defaultValue={settings.defaults[name]} disabled={!editable || busy === "save"} onChange={setField} />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        {editable && (
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button onClick={save} disabled={!changed || busy === "save"}>
              {busy === "save" ? <Spinner className="h-4 w-4 text-primary-foreground" /> : <><Save className="h-4 w-4" /> Save changes</>}
            </Button>
            <Button variant="outline" disabled={!changed || busy === "save"} onClick={() => setForm(settings.values)}>
              <Undo2 className="h-4 w-4" /> Undo
            </Button>
            <Button variant="ghost" disabled={busy === "save"} onClick={() => setForm(settings.defaults)}>
              <RotateCcw className="h-4 w-4" /> Fill in defaults
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default MoneyAndPlans;
