/* eslint-disable react-refresh/only-export-components */
import { motion } from "framer-motion";

// "Good morning" / "Good afternoon" / "Good evening"
export const greeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const todayLabel = () =>
  new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// small metric tile: icon, big value, label, optional hint
export const StatCard = ({ icon: Icon, label, value, hint, tone = "primary" }) => {
  const tones = {
    primary: "bg-primary/10 text-primary",
    highlight: "bg-highlight/15 text-highlight",
    amber: "bg-brand-amber/15 text-brand-amber",
    violet: "bg-brand-violet/15 text-brand-violet",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </motion.div>
  );
};

// a row of numbers: cards from tablet width up, one compact strip on phones (saves a screen of scrolling)
export const StatGroup = ({ items }) => (
  <>
    <div className="grid grid-cols-4 divide-x divide-border rounded-2xl border border-border bg-card py-3 sm:hidden">
      {items.map(({ label, value }) => (
        <div key={label} className="min-w-0 px-1.5 text-center">
          <p className="truncate text-base font-extrabold tracking-tight">{value}</p>
          <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
    <div className="hidden grid-cols-2 gap-4 sm:grid xl:grid-cols-4">
      {items.map(item => <StatCard key={item.label} {...item} />)}
    </div>
  </>
);

// card with a titled header and optional action on the right
export const SectionCard = ({ icon: Icon, title, subtitle, action, children, className = "", bodyClassName = "p-5" }) => (
  <div className={`overflow-hidden rounded-2xl border border-border bg-card ${className}`}>
    <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && <Icon className="h-[18px] w-[18px] shrink-0 text-primary" />}
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-bold">{title}</h2>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
    <div className={bodyClassName}>{children}</div>
  </div>
);

export const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="flex flex-col items-center px-6 py-10 text-center">
    {Icon && (
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </span>
    )}
    <p className="mt-4 font-semibold">{title}</p>
    {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// row of filter chips with counts, e.g. Upcoming (2) · Past (5)
export const FilterChips = ({ options, value, onChange, layoutId }) => (
  <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/50 p-1">
    {options.map(option => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={`relative rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
          value === option.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {value === option.value && (
          <motion.span
            layoutId={layoutId}
            className="absolute inset-0 rounded-lg bg-card shadow-sm"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
        <span className="relative">
          {option.label}
          {option.count !== undefined && <span className="ml-1.5 text-xs text-muted-foreground">{option.count}</span>}
        </span>
      </button>
    ))}
  </div>
);

// key / value line used in profile summaries
export const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
    <span className="flex items-center gap-2 text-muted-foreground">
      {Icon && <Icon className="h-4 w-4" />} {label}
    </span>
    <span className="truncate font-semibold">{value || "—"}</span>
  </div>
);

// an on/off setting with its explanation (plan and membership pages)
export const SettingRow = ({ icon: Icon, title, text, checked, onChange, busy }) => (
  <div className="flex items-start gap-3 py-4">
    <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={title}
      disabled={busy}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  </div>
);
