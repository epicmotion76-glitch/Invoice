/**
 * Approved facts the AI receptionist may share. Everything here is already published on the website;
 * add to it only with information the clinic has confirmed. The assistant is told to say it doesn't
 * know anything that isn't listed, so an omission is safe and an invented fact is not.
 *
 * Server-only: imported by /api/chat (Node ESM), hence the ".js" specifiers.
 */
import { clinic, services, type TreatmentValue } from "./clinic.js";

export type KnowledgeTopicId =
  | "clinic_overview"
  | "services_overview"
  | "general_dentistry"
  | "cosmetic_dentistry"
  | "teeth_whitening"
  | "dental_implants"
  | "invisalign"
  | "emergency_dentistry"
  | "contact_and_location"
  | "opening_hours"
  | "appointments"
  | "pricing_and_payment"
  | "technology_and_comfort";

export type KnowledgeEntry = {
  id: KnowledgeTopicId;
  title: string;
  /** Lower-case words used for simple keyword lookup. */
  keywords: string[];
  facts: string[];
  /** Treatment option this topic maps to in the booking flow. */
  treatment?: TreatmentValue;
};

const serviceText = (treatment: TreatmentValue) => services.find((service) => service.treatment === treatment)?.text ?? "";

const hoursFacts = clinic.hours.map((row) => `${row.days}: ${row.time}.`);

const ASSESSMENT_NOTE =
  "Suitability and the right treatment plan can only be confirmed by a BrightSmile dentist at a consultation.";

export const clinicKnowledge: KnowledgeEntry[] = [
  {
    id: "clinic_overview",
    title: "About BrightSmile",
    keywords: ["about", "clinic", "who", "experience", "years", "rating", "reviews", "team"],
    facts: [
      `${clinic.name} is a modern, comfort-first dental clinic in ${clinic.city}, Portugal.`,
      `Tagline: "${clinic.tagline}"`,
      "Care covers every stage of your smile, from routine checkups to complete smile transformations.",
      "15+ years of care and 5,000+ smiles treated.",
      `Patients rate the clinic ${clinic.rating.score}/5 from ${clinic.rating.reviewCount} reviews.`,
      "The team is known for friendly, anxiety-aware care: they go at your pace, with breaks whenever you need.",
    ],
  },
  {
    id: "services_overview",
    title: "Services offered",
    keywords: ["services", "treatments", "offer", "do you do", "options"],
    facts: [
      ...services.map((service) => `${service.title}: ${service.text}`),
      "Not sure what you need? The team talks you through the options at your first visit.",
    ],
  },
  {
    id: "general_dentistry",
    title: "General dentistry",
    treatment: "general",
    keywords: ["checkup", "check-up", "clean", "cleaning", "hygiene", "filling", "fillings", "general", "routine"],
    facts: [
      serviceText("general"),
      "Routine care includes six-monthly checkups and hygiene cleans.",
      "Fillings are tooth-coloured.",
    ],
  },
  {
    id: "cosmetic_dentistry",
    title: "Cosmetic dentistry",
    treatment: "cosmetic",
    keywords: ["cosmetic", "veneers", "veneer", "bonding", "contouring", "makeover", "smile design", "gap", "chipped"],
    facts: [
      serviceText("cosmetic"),
      "Options shown on the website include porcelain veneers, composite bonding, gum contouring and complete smile makeovers (for example whitening combined with bonding).",
      "Composite bonding can rebuild small gaps and worn edges without drilling healthy enamel.",
      ASSESSMENT_NOTE,
    ],
  },
  {
    id: "teeth_whitening",
    title: "Teeth whitening",
    treatment: "whitening",
    keywords: ["whitening", "whiten", "white", "stains", "stain", "bleaching", "yellow"],
    facts: [
      serviceText("whitening"),
      "Both in-clinic whitening and take-home whitening are offered.",
      ASSESSMENT_NOTE,
    ],
  },
  {
    id: "dental_implants",
    title: "Dental implants",
    treatment: "implants",
    keywords: ["implant", "implants", "missing tooth", "missing teeth", "replace", "replacement", "crown"],
    facts: [
      serviceText("implants"),
      "Implants are planned with digital 3D scans rather than traditional moulds.",
      "Treatment length varies by case; a consultation gives you a personalised plan and written quote.",
      ASSESSMENT_NOTE,
    ],
  },
  {
    id: "invisalign",
    title: "Invisalign® clear aligners",
    treatment: "invisalign",
    keywords: ["invisalign", "aligners", "aligner", "braces", "straighten", "crooked", "crowded", "orthodontic"],
    facts: [
      serviceText("invisalign"),
      "Aligners are removable and near-invisible, with digital progress check-ins.",
      "Treatment length varies by case; a consultation gives you a personalised plan and written quote.",
      ASSESSMENT_NOTE,
    ],
  },
  {
    id: "emergency_dentistry",
    title: "Emergency dental care",
    treatment: "emergency",
    keywords: ["emergency", "urgent", "pain", "toothache", "broken", "chipped", "swelling", "knocked", "same-day", "same day"],
    facts: [
      serviceText("emergency"),
      `For a dental emergency, call the clinic on ${clinic.phone.display}. Same-day slots are kept for severe pain, swelling or a broken tooth.`,
      `For facial swelling that affects breathing or swallowing, call ${clinic.emergencyNumber} (emergency services).`,
      `Any symptoms that could be life-threatening (for example difficulty breathing, heavy bleeding that won't stop, or loss of consciousness) need emergency services: call ${clinic.emergencyNumber}.`,
    ],
  },
  {
    id: "contact_and_location",
    title: "Contact details and location",
    keywords: ["contact", "phone", "call", "email", "whatsapp", "address", "where", "location", "directions", "map"],
    facts: [
      `Phone: ${clinic.phone.display}.`,
      `WhatsApp: ${clinic.phone.display} (the same number).`,
      `Email: ${clinic.email}.`,
      `Address: ${clinic.address.line1}, ${clinic.address.line2}.`,
      "The contact section at the bottom of the page has a map link.",
    ],
  },
  {
    id: "opening_hours",
    title: "Opening hours",
    keywords: ["hours", "open", "opening", "close", "closing", "saturday", "sunday", "weekend", "time"],
    facts: [...hoursFacts, "Early, late and Saturday slots are available so care fits your week."],
  },
  {
    id: "appointments",
    title: "Appointments and booking",
    keywords: ["book", "booking", "appointment", "schedule", "availability", "first visit", "new patient", "consultation"],
    facts: [
      "Appointments are requested through the website or WhatsApp; the reception team replies to confirm a time.",
      "A request is not a booking: the visit is only booked once the team confirms it with the patient.",
      "Appointments are Monday to Saturday (closed Sundays) and can be requested up to 6 months ahead.",
      "Same-week appointments are often available.",
      "A first visit is relaxed and ends with a clear, personalised plan. No pressure, no surprises.",
      `Patients can also call ${clinic.phone.display} to book.`,
    ],
  },
  {
    id: "pricing_and_payment",
    title: "Pricing and payment",
    keywords: ["price", "prices", "cost", "costs", "how much", "fee", "fees", "pay", "payment", "finance", "insurance", "quote", "plan"],
    facts: [
      "The website does not publish prices. Costs depend on the individual treatment plan.",
      "Patients receive their options, timeline and costs in writing before any treatment begins (transparent pricing, written quotes up front).",
      "The website mentions flexible payment options with manageable monthly plans; details are available from reception.",
      "There is no confirmed information about insurance acceptance on the website.",
    ],
  },
  {
    id: "technology_and_comfort",
    title: "Technology and comfort",
    keywords: ["technology", "scan", "scanner", "x-ray", "xray", "digital", "anxiety", "nervous", "scared", "fear", "comfort", "pain-free"],
    facts: [
      "Digital dentistry: 3D scans and low-dose digital X-rays, with no messy moulds.",
      "Same-visit imaging means fewer appointments and less discomfort.",
      "Longer appointments, numbing that is always checked, and time to ask every question.",
      "Anxiety-aware care: the team goes at your pace, with breaks whenever you need.",
      "Calm, spotless treatment rooms.",
    ],
  },
];

/** Things visitors commonly ask about that the clinic has NOT published. The assistant must not guess these. */
export const unconfirmedTopics = [
  "specific prices or price ranges",
  "insurance providers or coverage",
  "financing providers, interest rates or plan terms",
  "names, qualifications or credentials of dentists and staff",
  "parking, public transport or accessibility details",
  "languages spoken by staff",
  "treatment durations or outcomes for a specific person",
  "availability of a specific time slot",
];
