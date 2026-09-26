/**
 * Clinic facts and services as plain data (no React/icon imports), so the AI receptionist's
 * serverless function can import them too. `site.ts` re-exports everything here.
 */
import type { ServiceIconName } from "../components/icons/ServiceIcon";

export const clinic = {
  name: "BrightSmile Dental Clinic",
  shortName: "BrightSmile",
  tagline: "Confident smiles begin with exceptional care.",
  city: "Viseu",
  phone: { display: "+351 920 008 205", href: "tel:+351920008205" },
  whatsapp: {
    // International format, digits only (no +, spaces or leading zeros).
    number: "351920008205",
    bookingMessage: "Hello BrightSmile Dental Clinic! I'd like to book a visit.",
  },
  email: "ankitdawadi82@gmail.com",
  // Sample street address: replace with the clinic's real address.
  address: {
    line1: "Rua Formosa 112",
    line2: "3500-135 Viseu, Portugal",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Viseu%2C%20Portugal",
  },
  hours: [
    { days: "Monday – Friday", time: "8:00 AM – 6:00 PM" },
    { days: "Saturday", time: "9:00 AM – 1:00 PM" },
    { days: "Sunday", time: "Closed" },
  ],
  /**
   * The same hours in machine-readable form (Europe/Lisbon time, minutes after midnight),
   * keyed by `Date.getDay()`. Keep in sync with `hours` above.
   */
  openingTimes: {
    timeZone: "Europe/Lisbon",
    days: {
      1: { opens: 8 * 60, closes: 18 * 60 },
      2: { opens: 8 * 60, closes: 18 * 60 },
      3: { opens: 8 * 60, closes: 18 * 60 },
      4: { opens: 8 * 60, closes: 18 * 60 },
      5: { opens: 8 * 60, closes: 18 * 60 },
      6: { opens: 9 * 60, closes: 13 * 60 },
    } as Partial<Record<number, { opens: number; closes: number }>>,
  },
  /** Emergency number shown in the site's "Dental emergency?" note (EU/Portugal). */
  emergencyNumber: "112",
  rating: { score: "4.9", reviewCount: "300+" },
  // Placeholder profile links.
  social: [
    { network: "instagram", label: "Instagram", href: "#" },
    { network: "facebook", label: "Facebook", href: "#" },
    { network: "linkedin", label: "LinkedIn", href: "#" },
  ],
} as const;

export const treatmentOptions = [
  { value: "checkup", label: "Checkup & hygiene clean" },
  { value: "general", label: "General dentistry" },
  { value: "cosmetic", label: "Cosmetic dentistry" },
  { value: "whitening", label: "Teeth whitening" },
  { value: "implants", label: "Dental implants" },
  { value: "invisalign", label: "Invisalign® clear aligners" },
  { value: "emergency", label: "Emergency dental care" },
  { value: "unsure", label: "Not sure yet, I'd like advice" },
] as const;

export type TreatmentValue = (typeof treatmentOptions)[number]["value"];

export type Service = {
  icon: ServiceIconName;
  title: string;
  text: string;
  treatment: TreatmentValue;
};

export const services: Service[] = [
  {
    icon: "general",
    title: "General Dentistry",
    text: "Thorough checkups, hygiene cleans and tooth-coloured fillings that keep your whole mouth healthy for the long run.",
    treatment: "general",
  },
  {
    icon: "cosmetic",
    title: "Cosmetic Dentistry",
    text: "Veneers, bonding and contouring planned around your features, for results that look naturally like you.",
    treatment: "cosmetic",
  },
  {
    icon: "whitening",
    title: "Teeth Whitening",
    text: "Professional in-clinic and take-home whitening that lifts stains safely, even for sensitive teeth.",
    treatment: "whitening",
  },
  {
    icon: "implants",
    title: "Dental Implants",
    text: "Permanent, natural-looking replacements for missing teeth that feel and function like your own.",
    treatment: "implants",
  },
  {
    icon: "aligners",
    title: "Invisalign® Clear Aligners",
    text: "Straighten your smile discreetly with removable, near-invisible aligners and digital progress check-ins.",
    treatment: "invisalign",
  },
  {
    icon: "emergency",
    title: "Emergency Dentistry",
    text: "Toothache, a chipped tooth or swelling? We keep same-day slots aside for urgent care.",
    treatment: "emergency",
  },
];
