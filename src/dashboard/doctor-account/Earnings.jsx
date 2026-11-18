import { useCallback, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BadgePercent, CalendarClock, CheckCircle2, FileDown, IndianRupee, Landmark, ReceiptIndianRupee, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import Avatar from "@/components/ui/avatar";
import ConsultationBadge from "@/components/Booking/ConsultationBadge";
import { EmptyState, SectionCard, StatCard } from "@/components/Dashboard/DashboardUI";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { formatAppointment } from "@/utils/appointment";
import { formatPrice } from "@/utils/formatPrice";
import { downloadPdf } from "@/utils/calendar";

// the last 12 months, newest first ("2026-11")
const recentMonths = () =>
  Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - index);
    return { value: date.toLocaleDateString("en-CA").slice(0, 7), label: date.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) };
  });

// a month's payout statement as a PDF: every booking, Medora's fee and your share
const Statement = () => {
  const { token } = useContext(authContext);
  const months = recentMonths();
  const [month, setMonth] = useState(months[0].value);
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      await downloadPdf(token, `/doctors/earnings/statement?month=${month}`, `medora-statement-${month}.pdf`);
    } catch (error) {
      toast.error(error.message);
    }
    setBusy(false);
  };
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      <FileDown className="h-5 w-5 shrink-0 text-primary" />
      <p className="flex-1 text-sm"><span className="font-semibold">Payout statement</span> <span className="text-muted-foreground">· a PDF of the month for your records or your accountant</span></p>
      <div className="flex gap-2">
        <select value={month} onChange={event => setMonth(event.target.value)} aria-label="Month" className="h-9 rounded-xl border border-input bg-background/60 px-3 text-sm">
          {months.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <Button size="sm" onClick={download} disabled={busy}>{busy ? <Spinner className="h-4 w-4 text-primary-foreground" /> : "Download"}</Button>
      </div>
    </div>
  );
};

const STATES = {
  completed: { label: "Earned", className: "bg-success/15 text-success" },
  upcoming: { label: "Upcoming", className: "bg-primary/10 text-primary" },
  missed: { label: "Missed visit", className: "bg-brand-amber/15 text-brand-amber" },
  "cancellation-fee": { label: "Cancellation fee", className: "bg-brand-amber/15 text-brand-amber" },
  refunded: { label: "Refunded", className: "bg-destructive/10 text-destructive" },
};

// where the doctor's share goes: their Stripe Connect payout account
const PayoutAccount = ({ payouts, held, onConnect, onTestAccount, connecting }) => {
  if (payouts.enabled) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <div className="text-sm">
          <p className="font-semibold">Payouts are active</p>
          <p className="text-muted-foreground">
            Your share of every payment goes straight to your Stripe payout account when the patient pays. Refunds are taken back from it in the same split.
            {(payouts.demo || payouts.testMode) && " Demo: this is a Stripe test account, no real money moves."}
          </p>
          {held > 0 && <p className="mt-1 text-muted-foreground">{formatPrice(held)} from before your account was connected is held by Medora and paid out separately.</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-brand-amber/30 bg-brand-amber/10 p-4 sm:flex-row sm:items-center">
      <Landmark className="h-5 w-5 shrink-0 text-brand-amber" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">{payouts.connected ? "Finish setting up payouts" : "Set up payouts"}</p>
        <p className="text-muted-foreground">
          Add your bank account on Stripe&apos;s secure page to get paid automatically. Until then Medora holds your share{held > 0 ? ` (${formatPrice(held)} so far)` : ""}.
          {payouts.testMode && " Demo: skip Stripe's forms with a ready-made test account, no real bank details needed."}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {payouts.testMode && (
          <Button size="sm" onClick={onTestAccount} disabled={Boolean(connecting)}>
            {connecting === "test" ? <Spinner className="h-4 w-4 text-primary-foreground" /> : "Use a test account"}
          </Button>
        )}
        <Button size="sm" variant={payouts.testMode ? "outline" : "default"} onClick={onConnect} disabled={Boolean(connecting)}>
          {connecting === "stripe" ? <Spinner className="h-4 w-4" /> : payouts.connected ? "Continue setup" : "Set up payouts"}
        </Button>
      </div>
    </div>
  );
};

// doctor's money: what each booking paid, the platform's commission and what the doctor keeps
const Earnings = ({ onPayoutsChanged }) => {
  const { token } = useContext(authContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [connecting, setConnecting] = useState(""); // "stripe" | "test" while busy

  const load = useCallback(async () => {
    try {
      setData((await apiRequest("/doctors/earnings", { token })).data);
      setFailed(false);
    } catch (error) {
      setFailed(true);
      toast.error(error.message);
    }
  }, [token]);

  useEffect(() => {
    // back from Stripe's onboarding page: ask Stripe whether the account is ready, then load
    const back = new URLSearchParams(location.search).get("payouts");
    if (back) {
      navigate(`${location.pathname}?earnings`, { replace: true });
      apiRequest("/doctors/payouts/status", { token }).catch(() => {}).finally(load);
    } else {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const connect = async () => {
    setConnecting("stripe");
    try {
      const result = await apiRequest("/doctors/payouts/connect", { token, method: "POST" });
      window.location.assign(result.data.url);
    } catch (error) {
      toast.error(error.message);
      setConnecting("");
    }
  };

  // Stripe test mode: a payout account with Stripe's test data, ready at once
  const connectTestAccount = async () => {
    setConnecting("test");
    try {
      const result = await apiRequest("/doctors/payouts/test-account", { token, method: "POST" });
      toast.success(result.message);
      await load();
      onPayoutsChanged?.();
    } catch (error) {
      toast.error(error.message);
    }
    setConnecting("");
  };

  if (!data) {
    return failed
      ? <EmptyState icon={Wallet} title="Couldn't load your earnings" action={<Button size="sm" variant="outline" onClick={load}>Try again</Button>} />
      : <div className="grid place-items-center py-16"><Spinner /></div>;
  }

  const { totals, payouts, items } = data;
  const rate = items[0] ? Math.round(items[0].rate * 100) : 15;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Wallet} label="You earned" value={formatPrice(totals.earned)} hint="after commission and refunds" />
        <StatCard icon={IndianRupee} tone="violet" label="This month" value={formatPrice(totals.thisMonth)} hint="your share" />
        <StatCard icon={CalendarClock} tone="highlight" label="Upcoming" value={formatPrice(totals.upcoming)} hint="booked, not yet seen" />
        <StatCard icon={BadgePercent} tone="amber" label="Commission" value={formatPrice(totals.commission)} hint={`${rate}% Medora fee`} />
      </div>

      <PayoutAccount payouts={payouts} held={totals.held} onConnect={connect} onTestAccount={connectTestAccount} connecting={connecting} />

      <Statement />

      <SectionCard icon={ReceiptIndianRupee} title="Payments" subtitle={`Each booking's fee, refunds, the ${rate}% commission and your share`} bodyClassName="">
        {items.length === 0 ? (
          <EmptyState icon={ReceiptIndianRupee} title="No payments yet" text="Paid bookings show up here with your share of each one." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-muted/60 text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3">Patient</th>
                  <th scope="col" className="px-5 py-3">Appointment</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3 text-right">Fee</th>
                  <th scope="col" className="px-5 py-3 text-right">Refunded</th>
                  <th scope="col" className="px-5 py-3 text-right">Commission</th>
                  <th scope="col" className="px-5 py-3 text-right">You earn</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item._id} className="border-b border-border transition-colors hover:bg-muted/40">
                    <th scope="row" className="px-5 py-3 font-semibold text-foreground">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <Avatar src={item.patient?.photo} name={item.patient?.name || "Patient"} className="h-8 w-8" textClassName="text-[10px]" />
                        {item.patient?.name || "Deleted user"}
                      </span>
                    </th>
                    <td className="px-5 py-3">
                      <span className="flex flex-wrap items-center gap-2 whitespace-nowrap text-foreground">
                        {formatAppointment(item)} <ConsultationBadge booking={item} />
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATES[item.state].className}`}>{STATES[item.state].label}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">{formatPrice(item.paid)}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">{item.refunded ? `−${formatPrice(item.refunded)}` : "–"}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">{item.platform ? `−${formatPrice(item.platform)}` : "–"}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-foreground">{formatPrice(item.doctor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default Earnings;
