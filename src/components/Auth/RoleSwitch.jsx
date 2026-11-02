import { motion } from "framer-motion";
import { Stethoscope, UserRound } from "lucide-react";

const roles = [
  { value: "patient", label: "Patient", icon: UserRound },
  { value: "doctor", label: "Doctor", icon: Stethoscope },
];

// "I am a Patient / Doctor" switch with a sliding background, used on login and sign up
// layoutId must be unique per page so the two switches don't animate into each other
function RoleSwitch({ value, onChange, label = "I am a", layoutId = "role-pill" }) {
  return (
    <div>
      <p className="form_label">{label}</p>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-muted/60 p-1">
        {roles.map(({ value: roleValue, label: roleLabel, icon: Icon }) => {
          const active = value === roleValue;
          return (
            <button
              key={roleValue}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(roleValue)}
              className={`relative flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-xl bg-primary shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative h-4 w-4" />
              <span className="relative">{roleLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RoleSwitch;
