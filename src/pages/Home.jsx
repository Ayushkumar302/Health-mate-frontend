import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { ArrowRight, CalendarClock, CreditCard, Search, ShieldCheck, Sparkles, Stethoscope, UserRoundSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Avatar from '@/components/ui/avatar';
import About from '@/components/About/About';
import SpecialtyExplorer from '@/components/Services/SpecialtyExplorer';
import DoctorsList from '@/components/Doctors/DoctorsList';
import FaqList from '@/components/Faq/FaqList';
import Testimonial from '@/components/Testimonial/Testimonial';
import HeroVisual from '@/components/Home/HeroVisual';
import Aurora from '@/components/Home/Aurora';
import { Reveal, SectionHeading, Stagger, StaggerItem } from '@/components/Motion/Reveal';
import { BRAND, DEMO_MODE } from '@/brand';
import SymptomCheckCard from '@/components/Symptoms/SymptomCheckCard';

const stats = [
  { end: 120, suffix: '+', label: 'Verified doctors' },
  { end: 25, suffix: 'k+', label: 'Appointments booked' },
  { end: 30, suffix: '+', label: 'Specialties' },
  { end: 98, suffix: '%', label: 'Happy patients' },
];

const steps = [
  {
    icon: UserRoundSearch,
    title: 'Find your doctor',
    text: 'Search by name or specialty and compare ratings, experience and fees.',
  },
  {
    icon: CalendarClock,
    title: 'Pick a free slot',
    text: 'Choose a date and a time that suits you. Live availability, no phone calls.',
  },
  {
    icon: CreditCard,
    title: 'Pay & you are set',
    text: 'Pay securely online. Reschedule anytime or cancel up to 2 hours before.',
  },
];

const popularSearches = ['Cardiologist', 'Dentist', 'Pediatrician', 'Dermatologist'];

function Home() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = e => {
    e.preventDefault();
    navigate(`/doctors${search.trim() ? `?query=${encodeURIComponent(search.trim())}` : ''}`);
  };

  return (
    <>
      {/* hero */}
      <section className="relative isolate overflow-hidden pb-10 pt-10 lg:pb-20 lg:pt-16">
        <Aurora />
        <div className="container grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="eyebrow"
            >
              <Sparkles className="h-3.5 w-3.5" /> Verified doctors · Instant booking
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[64px]"
            >
              Healthcare that fits <span className="gradient-text">your schedule</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground"
            >
              Find trusted specialists, see their real-time availability and book a visit in under a minute.
              {' '}{BRAND.name} takes the waiting out of getting well.
            </motion.p>

            {/* search */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="glass mt-8 flex max-w-xl items-center gap-2 rounded-full p-2 shadow-soft focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10"
            >
              <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search doctors or specialties…"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                aria-label="Search doctors"
              />
              <Button type="submit" className="shrink-0">Search</Button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-4 flex flex-wrap items-center gap-2 text-sm"
            >
              <span className="text-muted-foreground">Popular:</span>
              {popularSearches.map(term => (
                <Link
                  key={term}
                  to={`/doctors?query=${term.toLowerCase()}`}
                  className="rounded-full border border-border bg-card/60 px-3 py-1 font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {term}
                </Link>
              ))}
            </motion.div>

            {/* social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-10 flex items-center gap-4"
            >
              <div className="flex -space-x-3">
                {['Aarav Shah', 'Isha Rao', 'Neha Gupta', 'Vikram Singh'].map(name => (
                  <Avatar key={name} name={name} className="h-10 w-10 ring-2 ring-background" textClassName="text-xs" />
                ))}
              </div>
              <div className="text-sm">
                <p className="font-bold text-foreground">★ 4.9 <span className="font-medium text-muted-foreground">from 2,000+ reviews</span></p>
                <p className="text-muted-foreground">Trusted by patients across India</p>
              </div>
            </motion.div>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* stats */}
      <section className="py-0">
        <div className="container">
          <Reveal className="card-surface grid grid-cols-2 divide-border overflow-hidden lg:grid-cols-4 lg:divide-x">
            {stats.map(stat => (
              <div key={stat.label} className="p-6 text-center lg:p-8">
                <p className="text-3xl font-extrabold tracking-tight text-foreground lg:text-4xl">
                  <CountUp end={stat.end} duration={2} enableScrollSpy scrollSpyOnce />
                  <span className="gradient-text">{stat.suffix}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* symptom checker */}
      <section className="pb-0">
        <div className="container">
          <Reveal>
            <SymptomCheckCard />
          </Reveal>
        </div>
      </section>

      {/* how it works */}
      <section>
        <div className="container">
          <SectionHeading
            eyebrow="How it works"
            title="Book a visit in three simple steps"
            subtitle="No calls, no queues. Everything happens in a few taps."
          />
          <Stagger className="relative mt-14 grid gap-6 md:grid-cols-3">
            {/* dashed line connecting the steps */}
            <div className="absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-border md:block" />
            {steps.map(({ icon: Icon, title, text }, index) => (
              <StaggerItem key={title} className="relative text-center">
                <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
                  <Icon className="h-7 w-7" />
                  <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-background bg-foreground text-xs font-bold text-background">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold">{title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* services */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-muted/60 to-transparent" />
        <div className="container">
          <SectionHeading
            eyebrow="Specialties"
            title="What can we help you with?"
            subtitle="Pick an area of care to see what it covers, what a visit looks like and who can help."
          />
          <SpecialtyExplorer />
          {/* the explorer shows this link itself on large screens */}
          <Reveal className="mt-8 text-center lg:hidden">
            <Link to="/services">
              <Button variant="outline">
                View all specialties <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>

      <About />

      {/* doctors */}
      <section>
        <div className="container">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              align="left"
              eyebrow="Our doctors"
              title="Meet our top specialists"
              subtitle="Experienced, verified and loved by their patients."
            />
            <Reveal>
              <Link to="/doctors">
                <Button variant="outline">
                  See all doctors <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Reveal>
          </div>
          <DoctorsList limit={6} />
        </div>
      </section>

      {/* testimonials */}
      <section className="overflow-hidden">
        <div className="container">
          <SectionHeading
            eyebrow="Testimonials"
            title="Loved by patients"
            subtitle="Real stories from people who found the right care."
          />
        </div>
        <Testimonial />
      </section>

      {/* FAQ */}
      <section>
        <div className="container grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading
              align="left"
              eyebrow="FAQ"
              title="Questions? We have answers"
              subtitle="Everything you need to know about booking, payments and refunds."
            />
            <Reveal className="card-surface mt-8 flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <p className="font-bold">Still have questions?</p>
                <p className="text-sm text-muted-foreground">Our team usually replies within a few hours.</p>
              </div>
              <Link to="/contact">
                <Button size="sm" variant="soft">Contact us</Button>
              </Link>
            </Reveal>
          </div>
          <FaqList />
        </div>
      </section>

      {/* call to action */}
      <section className="pt-0">
        <div className="container">
          <Reveal className="relative overflow-hidden rounded-[32px] bg-[hsl(var(--primary-deep))] p-8 text-white shadow-soft sm:p-12 lg:p-16">
            <div className="bg-grid absolute inset-0 opacity-20" />
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-highlight/40 blur-3xl animate-aurora" />
            <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-aurora [animation-delay:-8s]" />
            <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">Your next appointment is a minute away</h2>
                <p className="mt-3 text-white/85">
                  {DEMO_MODE
                    ? `Explore ${BRAND.name} with the demo patient and doctor accounts: book a slot, pay with a test card and join a video consultation.`
                    : `Create a free account and book a verified doctor today. Are you a doctor? Join ${BRAND.name} and reach new patients.`}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/doctors">
                  <Button size="lg" className="bg-white text-slate-900 shadow-none hover:bg-white/90">
                    Book now <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to={DEMO_MODE ? "/login" : "/register"}>
                  <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:border-white hover:text-white">
                    <Stethoscope className="h-4 w-4" /> {DEMO_MODE ? "Try the demo" : "Join as a doctor"}
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

export default Home;
