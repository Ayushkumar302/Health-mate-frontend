import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// the dashboard menu: a list down the side on large screens and a grid on phones,
// so every section is always in view (nothing hides off the edge of a sideways strip)
const ITEM = "relative flex min-w-0 flex-col items-center gap-1 rounded-xl px-1.5 py-2.5 text-center text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex-row lg:gap-3 lg:px-4 lg:text-left lg:text-sm";
const IDLE = "text-muted-foreground hover:bg-muted hover:text-foreground";

const Count = ({ value }) => (
  <span className="absolute right-1.5 top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground lg:static lg:ml-auto">
    {value}
  </span>
);

const Label = ({ icon: Icon, label }) => (
  <>
    <Icon className="relative h-5 w-5 shrink-0 lg:h-4 lg:w-4" />
    <span className="relative w-full leading-tight lg:w-auto">{label}</span>
  </>
);

// arrow keys (and Home / End) move between the entries, like other menus
const moveFocus = event => {
  const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
  if (!(event.key in keys) && event.key !== "Home" && event.key !== "End") return;
  const entries = [...event.currentTarget.querySelectorAll("a, button")];
  const index = entries.indexOf(document.activeElement);
  if (index === -1) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? entries.length - 1 : (index + keys[event.key] + entries.length) % entries.length;
  entries[next].focus();
};

// items switch sections on this page; links go to other pages (messages, plans)
const DashboardNav = ({ items, tab, onChange, links = [], layoutId }) => (
  <nav aria-label="Dashboard sections" onKeyDown={moveFocus} className="grid grid-cols-3 gap-1 sm:grid-cols-5 lg:grid-cols-1">
    {items.map(({ id, label, icon, count }) => {
      const active = tab === id;
      return (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-current={active ? "page" : undefined}
          className={`${ITEM} ${active ? "text-primary" : IDLE}`}
        >
          {active && (
            <motion.span layoutId={layoutId} className="absolute inset-0 rounded-xl bg-primary/10" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
          )}
          <Label icon={icon} label={label} />
          {count > 0 && <Count value={count} />}
        </button>
      );
    })}
    {links.map(({ to, label, icon, count, highlight }) => (
      <Link key={to} to={to} className={`${ITEM} ${highlight ? "text-primary hover:bg-primary/10" : IDLE}`}>
        <Label icon={icon} label={label} />
        {count > 0 && <Count value={count} />}
      </Link>
    ))}
  </nav>
);

export default DashboardNav;
