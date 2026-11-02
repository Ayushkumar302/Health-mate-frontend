import { motion } from "framer-motion";
import { CalendarCheck2, ShieldCheck, Star } from "lucide-react";
import { LogoMark } from "../Brand/Logo";
import Avatar from "../ui/avatar";
import { BRAND } from "@/brand";

const perks = [
  { icon: ShieldCheck, text: "Only verified doctors" },
  { icon: CalendarCheck2, text: "Live slots, instant booking" },
  { icon: Star, text: "Real reviews from patients" },
];

// split layout for login / sign up: animated brand panel + form card
function AuthShell({ title, subtitle, children }) {
  return (
    <section className="py-10 lg:py-14">
      <div className="container">
        <div className="card-surface grid overflow-hidden lg:grid-cols-2">
          {/* brand panel */}
          <div className="relative hidden overflow-hidden bg-[hsl(var(--primary-deep))] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="bg-grid absolute inset-0 opacity-20" />
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-highlight/35 blur-3xl animate-aurora" />
            <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-aurora [animation-delay:-8s]" />

            <div className="relative flex items-center gap-3">
              <LogoMark className="h-11 w-11 drop-shadow-lg" />
              <span className="text-2xl font-extrabold tracking-tight">{BRAND.name}</span>
            </div>

            <div className="relative">
              <h2 className="text-4xl font-extrabold leading-tight">{BRAND.tagline}.</h2>
              <ul className="mt-6 space-y-3">
                {perks.map(({ icon: Icon, text }, index) => (
                  <motion.li
                    key={text}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3 text-white/90"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 backdrop-blur">
                      <Icon className="h-4 w-4" />
                    </span>
                    {text}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* floating review card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative"
            >
              <div className="animate-float rounded-2xl border border-white/25 bg-white/15 p-5 backdrop-blur-xl">
                <p className="text-sm leading-6 text-white/95">
                  &ldquo;Found a great pediatrician and booked a slot for the same evening. Took me less than a minute.&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Avatar name="Ananya Iyer" className="h-9 w-9 ring-2 ring-white/40" textClassName="text-xs" />
                  <div>
                    <p className="text-sm font-semibold">Ananya Iyer</p>
                    <p className="text-xs text-white/75">Patient, Chennai</p>
                  </div>
                  <span className="ml-auto text-sm text-brand-amber">★★★★★</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 sm:p-10 lg:p-14"
          >
            <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default AuthShell;
