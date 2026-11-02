import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, Building2, Star } from "lucide-react";
import DoctorAbout from "./DoctorAbout";
import DoctorFeedback from "./DoctorFeedback";
import SidePanel from "./SidePanel";
import { BASE_URL } from "@/config";
import useFetchData from "@/hooks/useFetchData";
import Error from "@/components/Error/Error";
import Avatar from "@/components/ui/avatar";
import Aurora from "@/components/Home/Aurora";

const tabs = [
  { id: "about", label: "About" },
  { id: "feedback", label: "Reviews" },
];

const DetailsSkeleton = () => (
  <div className="container grid gap-8 py-12 lg:grid-cols-3">
    <div className="space-y-4 lg:col-span-2">
      <div className="card-surface flex gap-6 p-6">
        <div className="skeleton h-32 w-32 rounded-2xl" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton h-8 w-2/3" />
          <div className="skeleton h-4 w-full" />
        </div>
      </div>
      <div className="skeleton h-64 w-full rounded-2xl" />
    </div>
    <div className="skeleton h-96 rounded-2xl" />
  </div>
);

function DoctorsDetails() {
  // ?tab=feedback opens the reviews straight away (used by "Write a review")
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'feedback' ? 'feedback' : 'about');
  const { id } = useParams();
  const { data: doctor, error, loading } = useFetchData(`${BASE_URL}/doctors/${id}`);

  if (loading) {
    return <DetailsSkeleton />;
  }

  if (error || !doctor) {
    return (
      <section className="container">
        <Error errMessage={error ? "We couldn't load this doctor. Please try again." : "Doctor not found."} />
      </section>
    );
  }

  const {
    name,
    bio,
    specialization,
    ticketPrice,
    qualifications,
    experiences,
    timeSlots,
    reviews,
    about,
    photo,
    averageRating,
    totalRating,
  } = doctor;
  const hospital = experiences?.[0]?.hospital;

  return (
    <section className="relative isolate overflow-hidden pt-8">
      <Aurora />
      <div className="container">
        <Link to="/doctors" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> All doctors
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* profile header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-surface flex flex-col gap-6 p-6 sm:flex-row sm:items-center"
            >
              <div className="relative shrink-0">
                {photo ? (
                  <img src={photo} alt={name} className="h-32 w-32 rounded-2xl object-cover shadow-soft" />
                ) : (
                  <Avatar name={name} className="h-32 w-32 rounded-2xl" textClassName="text-3xl" />
                )}
                <span className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full border-4 border-card bg-primary text-primary-foreground">
                  <BadgeCheck className="h-4 w-4" />
                </span>
              </div>

              <div className="min-w-0">
                {specialization && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
                    {specialization}
                  </span>
                )}
                <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Star className="h-4 w-4 fill-brand-amber text-brand-amber" />
                    {averageRating ? averageRating.toFixed(1) : "New"}
                    <span className="font-normal text-muted-foreground">({totalRating || 0} reviews)</span>
                  </span>
                  {hospital && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" /> {hospital}
                    </span>
                  )}
                </div>
                {bio && <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{bio}</p>}
              </div>
            </motion.div>

            {/* tabs with an animated underline */}
            <div className="mt-8 flex gap-2 border-b border-border">
              {tabs.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`relative px-5 py-3 text-sm font-semibold transition-colors ${
                    tab === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                  {tab === item.id && (
                    <motion.span layoutId="doctor-tab" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab === 'about' && (
                    <DoctorAbout
                      name={name}
                      about={about}
                      qualifications={qualifications}
                      experiences={experiences}
                    />
                  )}
                  {tab === 'feedback' && (
                    <DoctorFeedback reviews={reviews} totalRating={totalRating} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div>
            <SidePanel
            doctorId={doctor._id}
            ticketPrice={ticketPrice}
            timeSlots={timeSlots}
            doctor={doctor}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default DoctorsDetails;
