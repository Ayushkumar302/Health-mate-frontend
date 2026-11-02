import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FaqItem = ({ item, value }) => {
    return (
        <AccordionItem
          value={value}
          className="rounded-2xl border border-border bg-card px-5 transition-colors data-[state=open]:border-primary/40 data-[state=open]:shadow-soft"
        >
          <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-[15px] leading-7 text-muted-foreground">
            {item.content}
          </AccordionContent>
        </AccordionItem>
    );
  };

  export default FaqItem;
