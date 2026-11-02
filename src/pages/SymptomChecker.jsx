import { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Lock, LogIn, RotateCcw, ShieldCheck, Sparkles, UserPlus, UserRound } from "lucide-react";
import PageHero from "@/components/Home/PageHero";
import SymptomResult from "@/components/Symptoms/SymptomResult";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { AGE_GROUPS, DURATIONS, SEVERITIES, SYMPTOM_CHIPS } from "@/utils/symptoms";
import { DEMO_ACCOUNTS, DEMO_MODE } from "@/brand";

const MAX_LENGTH = 500;
const demoPatient = DEMO_ACCOUNTS.find(account => account.role === "patient");

// row of buttons acting as one choice
const Segmented = ({ label, options, value, onChange }) => (
  <div>
    <p className="mb-2 text-sm font-semibold">{label}</p>
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            value === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

// not logged in: one click into the demo patient (portfolio demo) or log in / sign up
const LoginGate = () => {
  const { dispatch } = useContext(authContext);
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const tryDemo = async () => {
    setLoading(true);
    try {
      const result = await apiRequest("/auth/login", { method: "POST", body: { email: demoPatient.email, password: demoPatient.password } });
      dispatch({ type: "LOGIN_SUCCESS", payload: { user: result.data, token: result.token, role: result.role } });
      toast.success("Logged in as the demo patient");
    } catch (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="card-surface mx-auto max-w-xl p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Lock className="h-6 w-6" /></span>
      <h2 className="mt-4 text-xl font-bold">Log in to check your symptoms</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {DEMO_MODE
          ? "This is a demo: try it instantly as the demo patient, no sign-up needed."
          : "The symptom checker is free for Medora patients. Log in or create an account to use it."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {DEMO_MODE ? (
          <Button onClick={tryDemo} disabled={loading}>
            {loading ? <Spinner className="h-4 w-4 text-primary-foreground" /> : <><UserRound className="h-4 w-4" /> Try as demo patient</>}
          </Button>
        ) : (
          <Button asChild><Link to="/register"><UserPlus className="h-4 w-4" /> Create account</Link></Button>
        )}
        <Button variant="outline" asChild>
          <Link to="/login" state={{ from: location }}><LogIn className="h-4 w-4" /> Log in</Link>
        </Button>
      </div>
    </div>
  );
};

const SymptomChecker = () => {
  const { token, role } = useContext(authContext);
  const [form, setForm] = useState({ symptoms: "", chips: [], ageGroup: "adult", duration: "today", severity: "moderate" });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const resultRef = useRef(null);

  const set = changes => setForm(previous => ({ ...previous, ...changes }));
  const toggleChip = chip =>
    set({ chips: form.chips.includes(chip) ? form.chips.filter(item => item !== chip) : [...form.chips, chip] });

  useEffect(() => {
    if (data) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [data]);

  const submit = async event => {
    event.preventDefault();
    if (form.symptoms.trim().length < 3 && form.chips.length === 0) {
      return toast.info("Describe how you feel or pick at least one symptom");
    }
    setLoading(true);
    setSaved(false);
    try {
      const result = await apiRequest("/symptom-check", { token, method: "POST", body: form });
      setData(result.data);
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const result = await apiRequest("/symptom-check/saved", { token, method: "POST", body: { checkId: data.checkId } });
      setSaved(true);
      toast.success(result.message);
    } catch (error) {
      toast.error(error.message);
    }
    setSaving(false);
  };

  const startAgain = () => {
    setData(null);
    setSaved(false);
    set({ symptoms: "", chips: [] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <PageHero
        eyebrow="Symptom checker"
        title={<>Not sure which <span className="gradient-text">doctor</span> you need?</>}
        subtitle="Describe how you feel. In a few seconds you'll know how urgent it is, which specialist to see and who is free to help."
      />

      <section className="pt-0">
        <div className="container max-w-4xl">
          {!token ? (
            <LoginGate />
          ) : role !== "patient" ? (
            <div className="card-surface mx-auto max-w-xl p-8 text-center">
              <h2 className="text-xl font-bold">The symptom checker is for patients</h2>
              <p className="mt-2 text-sm text-muted-foreground">Log out and log in with a patient account to try it.</p>
            </div>
          ) : (
            <>
              <form onSubmit={submit} className="card-surface space-y-6 p-5 sm:p-8">
                <div>
                  <label htmlFor="symptoms" className="mb-2 block text-sm font-semibold">How do you feel?</label>
                  <textarea
                    id="symptoms"
                    value={form.symptoms}
                    onChange={event => set({ symptoms: event.target.value.slice(0, MAX_LENGTH) })}
                    rows={4}
                    placeholder="e.g. Sore throat and fever since yesterday, it hurts to swallow"
                    className="w-full resize-none rounded-2xl border border-input bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  />
                  <div className="mt-1 flex justify-between gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Don&apos;t include your name or other personal details</span>
                    <span>{form.symptoms.length}/{MAX_LENGTH}</span>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Or tap what applies</p>
                  <div className="flex flex-wrap gap-2">
                    {SYMPTOM_CHIPS.map(chip => {
                      const active = form.chips.includes(chip);
                      return (
                        <button
                          key={chip}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleChip(chip)}
                          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                            active ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <Segmented label="Who is it for?" options={AGE_GROUPS} value={form.ageGroup} onChange={ageGroup => set({ ageGroup })} />
                  <Segmented label="When did it start?" options={DURATIONS} value={form.duration} onChange={duration => set({ duration })} />
                  <Segmented label="How bad is it?" options={SEVERITIES} value={form.severity} onChange={severity => set({ severity })} />
                </div>

                <div className="flex flex-col items-center gap-2 border-t border-border pt-6">
                  <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
                    {loading ? <><Spinner className="h-5 w-5 text-primary-foreground" /> Checking your symptoms…</> : <><Sparkles className="h-5 w-5" /> Check my symptoms</>}
                  </Button>
                  <p className="text-xs text-muted-foreground">Takes a few seconds · Not a diagnosis · In an emergency call 112</p>
                </div>
              </form>

              {data && (
                <motion.div ref={resultRef} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-surface mt-6 scroll-mt-28 p-5 sm:p-8">
                  <SymptomResult data={data} onSave={save} saving={saving} saved={saved} />
                  {DEMO_MODE && (
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      Demo account: anything you save is visible to other visitors using the demo patient until the demo is reset.
                    </p>
                  )}
                  <div className="mt-6 flex justify-center">
                    <Button variant="ghost" onClick={startAgain}><RotateCcw className="h-4 w-4" /> Check something else</Button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default SymptomChecker;
