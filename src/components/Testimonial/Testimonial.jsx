import { Quote, Star } from "lucide-react";
import { testimonials } from "@/assets/data/testimonials";
import Avatar from "../ui/avatar";

const TestimonialCard = ({ item }) => (
  <figure className="card-surface relative w-[320px] shrink-0 p-6 sm:w-[360px]">
    <Quote className="absolute right-5 top-5 h-8 w-8 text-primary/15" />
    <div className="flex gap-0.5 text-brand-amber">
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} className={`h-4 w-4 ${index < item.rating ? "fill-current" : "opacity-30"}`} />
      ))}
    </div>
    <blockquote className="mt-4 text-[15px] leading-7 text-foreground/90">&ldquo;{item.text}&rdquo;</blockquote>
    <figcaption className="mt-5 flex items-center gap-3">
      <Avatar name={item.name} className="h-10 w-10" textClassName="text-xs" />
      <div>
        <p className="text-sm font-bold">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.role}</p>
      </div>
    </figcaption>
  </figure>
);

// two rows of auto-scrolling cards going in opposite directions, paused on hover
function Testimonial() {
  const firstRow = testimonials.slice(0, 3);
  const secondRow = testimonials.slice(3);

  const Row = ({ items, reverse }) => (
    <div className="marquee flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      {/* the list is doubled so the loop is seamless */}
      <div className={`flex w-max gap-5 py-2 pr-5 animate-marquee ${reverse ? "[animation-direction:reverse]" : ""}`}>
        {[...items, ...items, ...items, ...items].map((item, index) => (
          <TestimonialCard key={`${item.name}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="mt-12 flex flex-col gap-5">
      <Row items={firstRow} />
      <Row items={secondRow} reverse />
    </div>
  );
}

export default Testimonial;
