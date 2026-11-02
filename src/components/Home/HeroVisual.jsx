import { motion } from "framer-motion";
import { BadgeCheck, CalendarCheck2, HeartPulse, Star } from "lucide-react";
import Avatar from "../ui/avatar";

const slots = ["09:30", "10:30", "11:00", "12:30", "16:00", "17:30"];

const float = (delay = 0) => ({
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
});

// illustrated "app screenshot" made of real UI pieces instead of stock photos
function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[5/5] w-full max-w-[520px]">
      {/* glowing rings behind the cards */}
      <div className="absolute inset-[8%] rounded-full border border-primary/20" />
      <div className="absolute inset-[20%] rounded-full border border-dashed border-border animate-[spin_40s_linear_infinite]" />
      <div className="absolute inset-[26%] rounded-full bg-primary/10 blur-3xl" />

      {/* main booking card (centered by the wrapper, framer-motion animates the inner element) */}
      <div className="absolute left-1/2 top-1/2 w-[78%] -translate-x-1/2 -translate-y-1/2">
      <motion.div {...float(0.1)}>
        <div className="glass rounded-3xl p-5 shadow-panelShadow">
          <div className="flex items-center gap-3">
            <Avatar src="/doctors/neha-kapoor.svg" name="Meera Kapoor" className="h-14 w-14" textClassName="text-base" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">Dr. Meera Kapoor</p>
              <p className="text-sm text-muted-foreground">Cardiologist · 12 yrs</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-brand-amber/15 px-2.5 py-1 text-xs font-bold text-brand-amber">
              <Star className="h-3.5 w-3.5 fill-current" /> 4.9
            </span>
          </div>

          <div className="mt-5 flex items-center justify-between text-sm">
            <p className="font-semibold">Tuesday, 24 Nov</p>
            <p className="text-muted-foreground">6 slots free</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {slots.map((slot, index) => (
              <motion.span
                key={slot}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.06 }}
                className={`rounded-xl border py-2 text-center text-xs font-semibold ${
                  index === 1
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background/60 text-foreground"
                }`}
              >
                {slot}
              </motion.span>
            ))}
          </div>
          <div className="mt-4 flex h-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            Book for ₹500
          </div>
        </div>
      </motion.div>
      </div>

      {/* heart rate card */}
      <motion.div {...float(0.35)} className="absolute right-0 top-[4%] w-[44%]">
        <div className="glass animate-float rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-rose/15 text-brand-rose">
              <HeartPulse className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] text-muted-foreground">Heart rate</p>
              <p className="text-sm font-bold">
                72 <span className="text-xs font-medium text-muted-foreground">bpm</span>
              </p>
            </div>
          </div>
          <svg viewBox="0 0 160 40" className="mt-2 h-8 w-full" aria-hidden="true">
            <path
              d="M0 22 H40 L48 10 L56 34 L64 4 L72 26 L80 22 H112 L118 14 L124 28 L130 22 H160"
              fill="none"
              stroke="hsl(var(--brand-rose))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="300"
              className="animate-pulse-line"
            />
          </svg>
        </div>
      </motion.div>

      {/* confirmation card */}
      <motion.div {...float(0.55)} className="absolute bottom-[6%] left-0 w-[52%]">
        <div className="glass animate-float-slow rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-success/15 text-success">
              <CalendarCheck2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">Booking confirmed</p>
              <p className="text-xs text-muted-foreground">Tue, 10:30 AM · Paid</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* verified badge */}
      <motion.div {...float(0.75)} className="absolute bottom-[22%] right-[2%]">
        <div className="glass flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold shadow-soft">
          <BadgeCheck className="h-4 w-4 text-primary" /> Verified doctors
        </div>
      </motion.div>
    </div>
  );
}

export default HeroVisual;
