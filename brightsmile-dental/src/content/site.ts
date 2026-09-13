/**
 * Business details and page copy. Edit this file to update the site's content.
 */
import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  CalendarCheck,
  HeartHandshake,
  MonitorSmartphone,
  ReceiptText,
  ScanLine,
  Users,
  Wallet,
} from "lucide-react";
import type { ServiceIconName } from "../components/icons/ServiceIcon";
import { images, type BeforeAfterImages } from "./images";

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
  rating: { score: "4.9", reviewCount: "300+" },
  // Placeholder profile links.
  social: [
    { network: "instagram", label: "Instagram", href: "#" },
    { network: "facebook", label: "Facebook", href: "#" },
    { network: "linkedin", label: "LinkedIn", href: "#" },
  ],
} as const;

export type NavLink = { id: string; label: string };

export const navLinks: NavLink[] = [
  { id: "home", label: "Home" },
  { id: "services", label: "Services" },
  { id: "why-us", label: "Why Us" },
  { id: "gallery", label: "Smile Gallery" },
  { id: "reviews", label: "Reviews" },
  { id: "contact", label: "Contact" },
];

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

export type Benefit = { icon: LucideIcon; title: string; text: string };

export const benefits: Benefit[] = [
  {
    icon: CalendarCheck,
    title: "Same-week appointments",
    text: "Early, late and Saturday slots so care fits your week.",
  },
  {
    icon: ScanLine,
    title: "Advanced digital dentistry",
    text: "3D scans and low-dose digital X-rays. No messy moulds.",
  },
  {
    icon: Wallet,
    title: "Flexible payment options",
    text: "Written quotes up front and manageable monthly plans.",
  },
  {
    icon: HeartHandshake,
    title: "Friendly, anxiety-aware care",
    text: "We go at your pace, with breaks whenever you need.",
  },
];

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

export type Reason = { icon: LucideIcon; title: string; text: string };

export const reasons: Reason[] = [
  {
    icon: Armchair,
    title: "Comfortable care, never rushed",
    text: "Longer appointments, numbing we always check, and time to ask every question.",
  },
  {
    icon: MonitorSmartphone,
    title: "Technology that makes visits easier",
    text: "Digital scans and same-visit imaging mean fewer appointments and less discomfort.",
  },
  {
    icon: ReceiptText,
    title: "Clear treatment plans and transparent pricing",
    text: "Your options, timeline and costs in writing before anything begins.",
  },
  {
    icon: Users,
    title: "A team that remembers your goals",
    text: "Familiar faces who know what matters to you, from nerves to a wedding date.",
  },
];

export const stats = [
  { value: "15+", label: "Years of Care" },
  { value: "5,000+", label: "Smiles Treated" },
  { value: "4.9", label: "Average Rating" },
];

export type GalleryItem = {
  id: string;
  treatment: string;
  outcome: string;
  details: { label: string; value: string }[];
  images: BeforeAfterImages;
};

export const galleryItems: GalleryItem[] = [
  {
    id: "whitening",
    treatment: "Teeth Whitening",
    outcome: "Years of coffee and tea staining lifted for a naturally brighter shade, with no lingering sensitivity.",
    details: [
      { label: "Treatment time", value: "1 visit" },
      { label: "Approach", value: "In-clinic whitening" },
    ],
    images: images.gallery.whitening,
  },
  {
    id: "veneers",
    treatment: "Porcelain Veneers",
    outcome: "Chipped, uneven front teeth refined with ultra-thin veneers colour-matched to natural enamel.",
    details: [
      { label: "Treatment time", value: "3 visits" },
      { label: "Approach", value: "6 porcelain veneers" },
    ],
    images: images.gallery.veneers,
  },
  {
    id: "aligners",
    treatment: "Invisalign® Clear Aligners",
    outcome: "Crowded teeth gently straightened with removable, near-invisible aligners and digital check-ins.",
    details: [
      { label: "Treatment time", value: "8 months" },
      { label: "Approach", value: "Clear aligners" },
    ],
    images: images.gallery.aligners,
  },
  {
    id: "implants",
    treatment: "Dental Implant",
    outcome: "A missing tooth replaced with an implant crown that blends seamlessly with the rest of the smile.",
    details: [
      { label: "Treatment time", value: "4 months" },
      { label: "Approach", value: "Single implant crown" },
    ],
    images: images.gallery.implants,
  },
  {
    id: "makeover",
    treatment: "Complete Smile Makeover",
    outcome: "Whitening, bonding and gentle gum contouring combined for a balanced, confident smile.",
    details: [
      { label: "Treatment time", value: "6 weeks" },
      { label: "Approach", value: "Whitening + bonding" },
    ],
    images: images.gallery.makeover,
  },
  {
    id: "bonding",
    treatment: "Composite Bonding",
    outcome: "Small gaps and worn edges rebuilt in one relaxed appointment, without drilling healthy enamel.",
    details: [
      { label: "Treatment time", value: "1 visit" },
      { label: "Approach", value: "Composite bonding" },
    ],
    images: images.gallery.bonding,
  },
];

export type Testimonial = { quote: string; name: string; initials: string; treatment: string };

// Sample reviews: replace with genuine patient feedback (with permission).
export const testimonials: Testimonial[] = [
  {
    quote:
      "I'd avoided the dentist for years because of nerves. They explained every step before starting and checked in constantly. I actually left smiling.",
    name: "Mariana S.",
    initials: "MS",
    treatment: "General dentistry",
  },
  {
    quote:
      "My implant feels completely natural. The digital scan meant no uncomfortable moulds, and the price I was quoted is exactly what I paid.",
    name: "Tiago R.",
    initials: "TR",
    treatment: "Dental implant",
  },
  {
    quote:
      "I chipped a tooth days before a work trip and they fitted me in that same week. Calm, friendly and genuinely thorough.",
    name: "Emily C.",
    initials: "EC",
    treatment: "Emergency care",
  },
];
