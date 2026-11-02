import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { services } from "@/assets/data/services";
import { Button } from "../ui/button";
import { Reveal } from "../Motion/Reveal";

const featured = services.slice(0, 6);

// home page section: pick a specialty on the left, see what it covers on the right
function SpecialtyExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = featured[activeIndex];
  const Icon = active.icon;

  return (
    <Reveal className="mt-12 grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* specialty list (horizontal chips on mobile, vertical list on desktop) */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {featured.map((item, index) => {
          const ItemIcon = item.icon;
          const isActive = index === activeIndex;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setActiveIndex(index)}
              onMouseEnter={() => window.matchMedia("(hover: hover)").matches && setActiveIndex(index)}
              className={`group relative flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors lg:py-4 ${
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="specialty-active"
                  className="absolute inset-0 rounded-2xl border border-border bg-card shadow-soft"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.accent}`}>
                <ItemIcon className="h-5 w-5" />
              </span>
              <span className="relative whitespace-nowrap font-semibold">{item.name}</span>
              <ChevronRight
                className={`relative ml-auto hidden h-4 w-4 transition-all lg:block ${
                  isActive ? "translate-x-0 text-primary opacity-100" : "-translate-x-2 opacity-0"
                }`}
              />
            </button>
          );
        })}
        <Link
          to="/services"
          className="hidden items-center gap-2 px-4 pt-3 text-sm font-semibold text-primary hover:underline lg:flex"
        >
          View all specialties <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* detail panel */}
      <div className="card-surface relative min-h-[420px] overflow-hidden">
        {/* soft tint + large faded icon in the corner */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/[0.07] blur-2xl" />
        <AnimatePresence mode="wait">
          <motion.div
            key={active.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative grid h-full gap-8 p-6 sm:p-8 lg:p-10 xl:grid-cols-[1.2fr_1fr]"
          >
            <Icon className="pointer-events-none absolute -bottom-8 -right-8 h-56 w-56 text-foreground/[0.04]" strokeWidth={1.2} />

            <div className="flex flex-col">
              <span className={`grid h-16 w-16 place-items-center rounded-2xl ${active.accent}`}>
                <Icon className="h-8 w-8" />
              </span>
              <h3 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">{active.name}</h3>
              <p className="mt-3 text-base leading-7 text-muted-foreground">{active.desc}</p>

              <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Common reasons to visit</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {active.conditions.map((condition, index) => (
                  <motion.span
                    key={condition}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium"
                  >
                    {condition}
                  </motion.span>
                ))}
              </div>

              <div className="mt-auto pt-8">
                <Link to={`/doctors?query=${active.query}`}>
                  <Button size="lg">
                    Find {active.specialist.toLowerCase()} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl bg-muted/60 p-6">
              <p className="font-bold">What to expect</p>
              <ul className="mt-4 space-y-4">
                {active.expect.map((step, index) => (
                  <motion.li
                    key={step}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.08 }}
                    className="flex gap-3 text-sm leading-6"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-highlight" />
                    <span>{step}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground">
                Online booking · Verified doctors · Free cancellation up to 2 hours before
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

export default SpecialtyExplorer;
