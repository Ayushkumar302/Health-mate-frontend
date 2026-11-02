import { faqs } from '@/assets/data/faqs'
import FaqItem from './FaqItem'
import { Accordion } from '@/components/ui/accordion'

function FaqList() {
  return (
    <Accordion type="single" collapsible defaultValue="faq-0" className="mt-8 flex flex-col gap-3">
        {faqs.map((item, index) => (
            <FaqItem key={item.question} item={item} value={`faq-${index}`} />
        ))}
    </Accordion>
  )
}

export default FaqList
