import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Clock3, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "../ui/button";
import { Reveal } from "../Motion/Reveal";
import { BRAND } from "@/brand";

const reasons = [
  {
    icon: BadgeCheck,
    title: "Only verified doctors",
    text: "Every doctor's medical registration number is checked before their profile goes live.",
  },
  {
    icon: Clock3,
    title: "Real-time slots",
    text: "See exactly which times are free. A slot can never be double booked.",
  },
  {
    icon: CreditCard,
    title: "Fair, automatic refunds",
    text: "Cancel up to 2 hours before and your money comes back without asking.",
  },
  {
    icon: ShieldCheck,
    title: "Private and secure",
    text: "Payments run through Stripe and your details are only shared with your doctor.",
  },
];

// a small "dashboard" made of UI pieces, used as the section visual
const AboutVisual = () => (
  <div className="relative mx-auto w-full max-w-[480px]">
    <div className="absolute -inset-6 rounded-[40px] bg-primary/5 blur-2xl" />
    <div className="relative grid grid-cols-2 gap-4">
      <motion.div whileHover={{ y: -6 }} className="card-surface col-span-2 p-5">
        <p className="text-sm text-muted-foreground">Appointments this month</p>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-3xl font-extrabold">1,284</p>
          <span className="rounded-full bg-success/15 px-2 py-1 text-xs font-bold text-success">+18%</span>
        </div>
        {/* tiny bar chart */}
        <div className="mt-4 flex h-20 items-end gap-2">
          {[40, 65, 50, 80, 60, 95, 75, 100, 70, 88].map((height, index) => (
            <motion.span
              key={index}
              initial={{ height: 0 }}
              whileInView={{ height: `${height}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              className="flex-1 rounded-t-md bg-primary/70"
            />
          ))}
        </div>
      </motion.div>
      <motion.div whileHover={{ y: -6 }} className="card-surface p-5">
        <p className="text-sm text-muted-foreground">Avg. rating</p>
        <p className="mt-1 text-2xl font-extrabold">4.9<span className="text-base text-muted-foreground">/5</span></p>
        <p className="mt-1 text-brand-amber">★★★★★</p>
      </motion.div>
      <motion.div whileHover={{ y: -6 }} className="card-surface p-5">
        <p className="text-sm text-muted-foreground">Wait time</p>
        <p className="mt-1 text-2xl font-extrabold">0 min</p>
        <p className="mt-1 text-xs font-semibold text-primary">Book in 60 seconds</p>
      </motion.div>
    </div>
  </div>
);

function About() {
  return (
    <section>
      <div className="container grid items-center gap-14 lg:grid-cols-2">
        <Reveal className="order-2 lg:order-1">
          <AboutVisual />
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal>
            <span className="eyebrow">Why {BRAND.name}</span>
            <h2 className="heading mt-4">
              Care you can trust, <span className="gradient-text">without the waiting room</span>
            </h2>
            <p className="text__para">
              We built {BRAND.name} so that seeing a good doctor feels as easy as ordering a ride. No calls,
              no queues and no surprises, just the right doctor at a time that works for you.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {reasons.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 0.08} className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <Link to="/doctors">
              <Button className="mt-8">
                Meet our doctors <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default About;
