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
import { images, type BeforeAfterImages } from "./images";

// Clinic facts, treatments and services live in clinic.ts (shared with the AI receptionist).
export { clinic, services, treatmentOptions } from "./clinic";
export type { Service, TreatmentValue } from "./clinic";

export type NavLink = { id: string; label: string };

export const navLinks: NavLink[] = [
  { id: "home", label: "Home" },
  { id: "services", label: "Services" },
  { id: "why-us", label: "Why Us" },
  { id: "gallery", label: "Smile Gallery" },
  { id: "reviews", label: "Reviews" },
  { id: "contact", label: "Contact" },
];

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
