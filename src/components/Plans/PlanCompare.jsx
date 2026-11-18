import { Check, Minus } from "lucide-react";
import { SectionCard } from "@/components/Dashboard/DashboardUI";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Cell = ({ value }) => {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-success" aria-label="Included" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-muted-foreground/60" aria-label="Not included" />;
  return <span className="font-semibold">{value}</span>;
};

// every plan side by side, one feature per row; scrolls sideways inside its card on phones
export const PlanCompare = ({ tiers, rows, current }) => (
  <SectionCard title="Compare all features" subtitle="Everything each plan includes" bodyClassName="">
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-5 py-3 text-left">Feature</th>
            {tiers.map(tier => (
              <th key={tier.id} scope="col" className={`px-3 py-3 text-center ${tier.id === current ? "text-primary" : ""}`}>{tier.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.label} className="border-t border-border">
              <th scope="row" className="px-5 py-3 text-left font-medium">{row.label}</th>
              {tiers.map(tier => (
                <td key={tier.id} className={`px-3 py-3 text-center ${tier.id === current ? "bg-primary/5" : ""}`}><Cell value={row.value(tier)} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </SectionCard>
);

export const PlanFaq = ({ items }) => (
  <SectionCard title="Questions" bodyClassName="px-5">
    <Accordion type="single" collapsible>
      {items.map(item => (
        <AccordionItem key={item.q} value={item.q} className="last:border-b-0">
          <AccordionTrigger className="text-left font-semibold">{item.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </SectionCard>
);

// shown while the plans load, in the shape of the real page
export const PlanSkeleton = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading plans">
    <div className="skeleton h-28 rounded-2xl" />
    <div className="grid gap-4 pt-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-80 rounded-2xl" />)}
    </div>
  </div>
);
