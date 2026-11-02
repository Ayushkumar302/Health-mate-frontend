import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ServicesList from "@/components/Services/ServicesList";
import PageHero from "@/components/Home/PageHero";
import { Reveal } from "@/components/Motion/Reveal";
import { Button } from "@/components/ui/button";

function Services() {
  return (
    <>
      <PageHero
        eyebrow="Our specialties"
        title={<>Care for <span className="gradient-text">every part of you</span></>}
        subtitle="Pick a specialty to see verified doctors, their free slots and fees."
      />
      <section className="pt-0">
        <div className="container">
          <ServicesList />
          <Reveal className="card-surface mt-14 flex flex-col items-center justify-between gap-6 p-8 text-center md:flex-row md:text-left">
            <div>
              <h2 className="text-2xl font-bold">Not sure which specialist you need?</h2>
              <p className="mt-1 text-muted-foreground">Browse all doctors and filter by name or specialty.</p>
            </div>
            <Link to="/doctors">
              <Button>
                Browse doctors <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}

export default Services;
