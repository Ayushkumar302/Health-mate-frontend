import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { AlertTriangle, BadgePercent, Pencil, Plus, Sparkles, Trash2, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import Spinner from "@/components/ui/spinner";
import Avatar from "@/components/ui/avatar";
import ChipInput from "@/components/ui/chip-input";
import { EmptyState, SectionCard } from "@/components/Dashboard/DashboardUI";
import { authContext } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import useFamily, { setFamily } from "@/hooks/useFamily";
import usePlus, { tierById } from "@/hooks/usePlus";
import { apiRequest } from "@/utils/api";
import { RELATIONS, relationLabel } from "@/utils/family";
import { patientSummary } from "@/utils/health";
import { formatPrice } from "@/utils/formatPrice";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const emptyMember = () => ({ name: "", relation: "child", gender: "", dateOfBirth: "", bloodType: "", allergies: [], conditions: [], medications: [] });
const toForm = member => ({ ...emptyMember(), ...member, gender: member.gender || "", dateOfBirth: member.dateOfBirth || "", bloodType: member.bloodType || "" });

// add or edit one family member's small health record
const MemberForm = ({ open, member, onClose }) => {
  const { token } = useContext(authContext);
  const [form, setForm] = useState(() => (member ? toForm(member) : emptyMember()));
  const [saving, setSaving] = useState(false);
  const set = (field, value) => setForm(current => ({ ...current, [field]: value }));

  const save = async event => {
    event?.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name,
        relation: form.relation,
        ...(form.gender && { gender: form.gender }),
        ...(form.dateOfBirth && { dateOfBirth: form.dateOfBirth }),
        ...(form.bloodType && { bloodType: form.bloodType }),
        allergies: form.allergies,
        conditions: form.conditions,
        medications: form.medications,
      };
      const result = member
        ? await apiRequest(`/users/family/${member._id}`, { token, method: "PUT", body })
        : await apiRequest("/users/family", { token, method: "POST", body });
      setFamily(result.data);
      toast.success(result.message);
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
    setSaving(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={member ? Pencil : UserPlus}
      title={member ? `Edit ${member.name}` : "Add a family member"}
      subtitle="Doctors you book for them see this record, not yours"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || form.name.trim().length < 2}>
            {saving ? <Spinner className="h-4 w-4 text-primary-foreground" /> : member ? "Save" : "Add to family"}
          </Button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fm-name" className="form_label">Name *</label>
            <Input id="fm-name" value={form.name} maxLength={60} onChange={e => set("name", e.target.value)} placeholder="Full name" required />
          </div>
          <div>
            <label htmlFor="fm-relation" className="form_label">Relation *</label>
            <select id="fm-relation" value={form.relation} onChange={e => set("relation", e.target.value)} className="select-field">
              {RELATIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="fm-dob" className="form_label">Date of birth</label>
            <Input id="fm-dob" type="date" max={new Date().toLocaleDateString("en-CA")} value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} />
          </div>
          <div>
            <label htmlFor="fm-gender" className="form_label">Gender</label>
            <select id="fm-gender" value={form.gender} onChange={e => set("gender", e.target.value)} className="select-field">
              <option value="">Not set</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="fm-blood" className="form_label">Blood type</label>
            <select id="fm-blood" value={form.bloodType} onChange={e => set("bloodType", e.target.value)} className="select-field">
              <option value="">Not set</option>
              {BLOOD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="fm-allergies" className="form_label">Allergies</label>
          <ChipInput id="fm-allergies" value={form.allergies} onChange={value => set("allergies", value)} placeholder="Type an allergy and press Enter" tone="danger" />
        </div>
        <div>
          <label htmlFor="fm-conditions" className="form_label">Long-term conditions</label>
          <ChipInput id="fm-conditions" value={form.conditions} onChange={value => set("conditions", value)} placeholder="e.g. Asthma" />
        </div>
        <div>
          <label htmlFor="fm-medications" className="form_label">Medicines they take regularly</label>
          <ChipInput id="fm-medications" value={form.medications} onChange={value => set("medications", value)} placeholder="e.g. Salbutamol inhaler" tone="primary" maxLength={80} />
        </div>
      </form>
    </Modal>
  );
};

// Plus Family: the people the account holder books for, each with their own small health record
const Family = ({ onOpenPlans }) => {
  const { token } = useContext(authContext);
  const confirm = useConfirm();
  const family = useFamily();
  const plus = usePlus();
  // { member } while editing, {} while adding
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState("");

  if (!family) return <div className="grid place-items-center py-16"><Spinner /></div>;

  const familyTier = tierById(plus, "family");
  const full = family.members.length >= family.allowance;

  const remove = async member => {
    const ok = await confirm({
      title: `Remove ${member.name}?`,
      message: "Their small health record is deleted. Past visits and prescriptions stay in your account.",
      confirmText: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(member._id);
    try {
      const result = await apiRequest(`/users/family/${member._id}`, { token, method: "DELETE" });
      setFamily(result.data);
      toast.success(result.message);
    } catch (error) {
      toast.error(error.message);
    }
    setBusy("");
  };

  return (
    <div className="space-y-6">
      {!family.canBook && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Users className="h-4 w-4" /> Plus Family</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Book for your whole family from one account</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Add up to {family.familyPlanAllows} family members, each with their own health record, and get {Math.round((familyTier?.consultDiscount || 0.05) * 100)}% off every
            consultation, yours included. {familyTier && `${formatPrice(familyTier.price)} a year, with all the Plus benefits.`}
          </p>
          <Button className="mt-4" onClick={onOpenPlans}><Sparkles className="h-4 w-4" /> See Plus Family</Button>
          {family.members.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">Your family members are saved. Renew Plus Family to book for them again.</p>
          )}
        </div>
      )}

      {family.canBook && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm"><span className="font-semibold">{family.members.length} of {family.allowance} added.</span> Pick who a visit is for when you book.</p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <BadgePercent className="mt-0.5 h-5 w-5 shrink-0 text-highlight" />
            <p className="text-sm"><span className="font-semibold">{Math.round(family.discount * 100)}% off every visit</span>, for you and them. Medora pays it, your doctor is paid in full.</p>
          </div>
        </div>
      )}

      <SectionCard
        icon={Users}
        title="Family members"
        subtitle="Each person has their own record, visits and prescriptions"
        action={family.canBook && !full && (
          <Button size="sm" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Add</Button>
        )}
        bodyClassName={family.members.length ? "divide-y divide-border px-5" : ""}
      >
        {family.members.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No family members yet"
            text={family.canBook ? "Add your spouse, children or parents to book visits for them." : "Available on Plus Family."}
            action={family.canBook && <Button size="sm" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Add a family member</Button>}
          />
        ) : (
          family.members.map(member => (
            <div key={member._id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={member.name} className="h-11 w-11" textClassName="text-sm" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{member.name} <span className="text-sm font-normal text-muted-foreground">· {relationLabel(member.relation)}</span></p>
                  <p className="text-xs text-muted-foreground">{patientSummary(member) || "No details yet"}</p>
                  {member.allergies?.length > 0 && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-destructive"><AlertTriangle className="h-3 w-3" /> {member.allergies.join(", ")}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing({ member })}><Pencil className="h-4 w-4" /> Edit</Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" disabled={busy === member._id} onClick={() => remove(member)}>
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              </div>
            </div>
          ))
        )}
      </SectionCard>

      {editing && <MemberForm key={editing.member?._id || "new"} open member={editing.member} onClose={() => setEditing(null)} />}
    </div>
  );
};

export default Family;
