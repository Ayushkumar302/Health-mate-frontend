import { useContext, useEffect, useState } from "react";
import { HeartPulse, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import ChipInput from "@/components/ui/chip-input";
import { SectionCard } from "@/components/Dashboard/DashboardUI";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { ageFrom, bmiOf } from "@/utils/health";

const COMMON_ALLERGIES = ["Penicillin", "Sulfa drugs", "Peanuts", "Dust", "Lactose"];
const COMMON_CONDITIONS = ["Diabetes", "Hypertension", "Asthma", "Thyroid", "PCOS"];

const fromUser = user => ({
  dateOfBirth: user.dateOfBirth || "",
  heightCm: user.heightCm ?? "",
  weightKg: user.weightKg ?? "",
  allergies: user.allergies || [],
  conditions: user.conditions || [],
  medications: user.medications || [],
  emergencyContact: user.emergencyContact || "",
});

// the patient's own health record; shared with the doctors they book (shown in the doctor's dashboard)
const HealthRecord = ({ user, onSaved }) => {
  const { token } = useContext(authContext);
  const [form, setForm] = useState(() => fromUser(user));
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(fromUser(user)), [user]);

  const set = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const age = ageFrom(form.dateOfBirth);
  const bmi = bmiOf(Number(form.heightCm), Number(form.weightKg));

  const save = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await apiRequest(`/users/${user._id}`, {
        token,
        method: "PUT",
        body: {
          ...form,
          heightCm: form.heightCm === "" ? undefined : Number(form.heightCm),
          weightKg: form.weightKg === "" ? undefined : Number(form.weightKg),
        },
      });
      toast.success("Health record saved");
      onSaved?.(result.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard icon={HeartPulse} title="Health record" subtitle="Helps your doctor treat you safely">
      <form onSubmit={save} className="space-y-6">
        <p className="flex items-start gap-2 rounded-xl bg-highlight/10 px-4 py-3 text-sm text-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-highlight" />
          Only doctors you have booked can see this, and they see it before and during your consultation.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="hr-dob" className="form_label">Date of birth</label>
            <Input id="hr-dob" type="date" max={new Date().toLocaleDateString("en-CA")} value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} />
            {age !== null && <p className="mt-1 text-xs text-muted-foreground">{age} years old</p>}
          </div>
          <div>
            <label htmlFor="hr-height" className="form_label">Height (cm)</label>
            <Input id="hr-height" type="number" min={30} max={250} value={form.heightCm} onChange={e => set("heightCm", e.target.value)} placeholder="170" />
          </div>
          <div>
            <label htmlFor="hr-weight" className="form_label">Weight (kg)</label>
            <Input id="hr-weight" type="number" min={1} max={400} step="0.1" value={form.weightKg} onChange={e => set("weightKg", e.target.value)} placeholder="65" />
            {bmi && <p className="mt-1 text-xs text-muted-foreground">BMI {bmi.value} · {bmi.category}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="hr-allergies" className="form_label">Allergies</label>
          <ChipInput id="hr-allergies" value={form.allergies} onChange={value => set("allergies", value)} placeholder="Type an allergy and press Enter" tone="danger" suggestions={COMMON_ALLERGIES} />
        </div>
        <div>
          <label htmlFor="hr-conditions" className="form_label">Long-term conditions</label>
          <ChipInput id="hr-conditions" value={form.conditions} onChange={value => set("conditions", value)} placeholder="e.g. Diabetes" suggestions={COMMON_CONDITIONS} />
        </div>
        <div>
          <label htmlFor="hr-medications" className="form_label">Medicines you take regularly</label>
          <ChipInput id="hr-medications" value={form.medications} onChange={value => set("medications", value)} placeholder="e.g. Metformin 500 mg" maxLength={80} tone="primary" />
        </div>
        <div>
          <label htmlFor="hr-emergency" className="form_label">Emergency contact</label>
          <Input id="hr-emergency" value={form.emergencyContact} maxLength={80} onChange={e => set("emergencyContact", e.target.value)} placeholder="Name (relation), phone number" />
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? <Spinner className="h-4 w-4 text-primary-foreground" /> : "Save health record"}
        </Button>
      </form>
    </SectionCard>
  );
};

export default HealthRecord;
