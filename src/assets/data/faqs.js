import { BRAND } from "@/brand";

export const faqs = [
  {
    question: `How do I book an appointment on ${BRAND.name}?`,
    content:
      "Open Find a Doctor, pick a doctor, choose a date and one of the free time slots, then pay securely. Your appointment shows up under My Bookings right away.",
  },
  {
    question: "Can I cancel or reschedule my appointment?",
    content:
      "Yes. You can reschedule any upcoming appointment to another free slot. Cancelling is possible up to 2 hours before the appointment and you get a full refund to your card.",
  },
  {
    question: "How are doctors verified?",
    content:
      "Every doctor signs up with their medical registration number. Our team checks it before the profile is listed, so you only see verified doctors.",
  },
  {
    question: "Is my payment and health information safe?",
    content:
      "Payments are handled by Stripe, so we never see or store your card details. Your profile and bookings are only visible to you and the doctor you booked.",
  },
  {
    question: "What if the doctor cancels my appointment?",
    content:
      "If a doctor has to cancel, you always get a full refund automatically, and the slot is freed so you can book another time.",
  },
];
