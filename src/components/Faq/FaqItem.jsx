import { useEffect , useState} from "react";
import {Accordion,AccordionContent,AccordionItem,AccordionTrigger,} from "@/components/ui/accordion";
  

const FaqItem = ({ item }) => {



    return (
        <>
        <Accordion type="single" collapsible>
        <AccordionItem  value="item-1" className=" p-3 lg:p-1 mb-2 rounded-[12px] border border-solid border-[#D9DCE2]">
          <AccordionTrigger className="px-2 lg:px-4">{item.question}</AccordionTrigger>
          <AccordionContent>
            {item.content}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      </>
    );
  };
  
  export default FaqItem;
  

//   <div className="p-3 lg:p-5 rounded-[12px] border border-solid border-[#D9DCE2] mb-5 cursor-pointer">
//         <div className="flex items-center justify-between gap-5">
//           <h4 className="text-[16px] leading-4 lg:text-[22px] lg:leading-5 text-headingColor">
//             {item.question}
//           </h4>
//           <div className={`w-4 h-4 lg:w-4 lg:h-4
//             border border-solid border-[#141f21] rounded flex items-center justify-center`}></div>
//         </div>
        
//       </div>



{/* <Accordion type="single" collapsible>
        <AccordionItem  value="item-1" className=" p-3 lg:p-1 mb-2 rounded-[12px] border border-solid border-[#D9DCE2]">
          <AccordionTrigger className="px-4">{item.question}</AccordionTrigger>
          <AccordionContent>
            {item.content}
          </AccordionContent>
        </AccordionItem>
      </Accordion> */}