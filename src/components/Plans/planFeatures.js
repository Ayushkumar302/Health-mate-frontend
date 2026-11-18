// what each plan gives, in a few lines (plan cards and comparisons)
const pct = share => `${Math.round(share * 100)}%`;

// what each doctor plan gives, in a few lines
export const doctorFeatures = tier => [
  `${pct(tier.commissionRate)} commission per consultation`,
  `Patients book up to ${tier.bookingWindowDays} days ahead`,
  tier.instantBooking && "Instant booking and the \"Available today\" badge",
  tier.featured === "rotate" && "Featured in search, taking turns",
  tier.featured === "priority" && "Featured first in your specialty",
  tier.analytics === "basic" && "Profile views and booking numbers",
  tier.analytics === "full" && "Full analytics: conversion and earnings trend",
  tier.clinicBranding && "Your clinic's name, logo and photos on your profile",
  tier.timeOffEntries > 10 ? "No practical limit on planned time off" : `${tier.timeOffEntries} planned breaks at a time`,
].filter(Boolean);

// what each patient plan gives
export const patientFeatures = (tier, cutoffHours = 2) => [
  `${pct(tier.refund.early)} back if you cancel ${cutoffHours}+ hours before, ${pct(tier.refund.late)} later`,
  tier.reschedules === null ? "Move appointments as often as you need" : `Move each appointment ${tier.reschedules === 1 ? "once" : `${tier.reschedules} times`}`,
  `${tier.followUpDays === 1 ? "A day" : `${tier.followUpDays} days`} of follow-up chat after a visit`,
  `${tier.aiChecksPerDay} AI symptom checks a day`,
  tier.familyMembers > 0 && `Covers you and ${tier.familyMembers} family members`,
  tier.consultDiscount > 0 && `${pct(tier.consultDiscount)} off every consultation`,
].filter(Boolean);

// Infinity can't travel in JSON, the server sends null for "no limit"
const limit = (value, unit = "") => (value === null || value === undefined || value === Infinity ? "Unlimited" : `${value}${unit}`);

// rows of the comparison table: a label and how to show each plan's value
export const patientRows = (cutoffHours = 2) => [
  { label: `Refund, cancelling ${cutoffHours}+ hours before`, value: tier => pct(tier.refund.early) },
  { label: "Refund, cancelling later", value: tier => pct(tier.refund.late) },
  { label: "Reschedules per appointment", value: tier => limit(tier.reschedules) },
  { label: "Follow-up chat after a visit", value: tier => `${tier.followUpDays} day${tier.followUpDays === 1 ? "" : "s"}` },
  { label: "AI symptom checks a day", value: tier => limit(tier.aiChecksPerDay) },
  { label: "AI report explanations a month", value: tier => limit(tier.reportsPerMonth) },
  { label: "Waitlist for fully booked days", value: tier => Boolean(tier.waitlist) },
  { label: "Family members covered", value: tier => (tier.familyMembers ? `${tier.familyMembers}` : false) },
  { label: "Discount on every consultation", value: tier => (tier.consultDiscount ? pct(tier.consultDiscount) : false) },
];

export const doctorRows = [
  { label: "Commission per consultation", value: tier => pct(tier.commissionRate) },
  { label: "How far ahead patients can book", value: tier => `${tier.bookingWindowDays} days` },
  { label: "Instant booking", value: tier => Boolean(tier.instantBooking) },
  { label: "\"Available today\" badge", value: tier => Boolean(tier.availableToday) },
  { label: "Featured in search", value: tier => ({ none: false, rotate: "Taking turns", priority: "First" }[tier.featured] ?? false) },
  { label: "Analytics", value: tier => ({ none: false, basic: "Basic", full: "Full" }[tier.analytics] ?? false) },
  { label: "AI prescription drafts and review summary", value: tier => Boolean(tier.aiTools) },
  { label: "Clinic name, logo and photos", value: tier => Boolean(tier.clinicBranding) },
  { label: "Planned breaks at a time", value: tier => (tier.timeOffEntries > 10 ? "No real limit" : `${tier.timeOffEntries}`) },
];
