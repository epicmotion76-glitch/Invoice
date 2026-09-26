/**
 * Lightweight keyword intent detection (English + Portuguese). It is a hint for the model and
 * drives the deterministic routes (reception hand-off, instruction-extraction refusal); the model
 * still reads the full message, so a wrong guess here is harmless.
 */
import { clinic } from "../../src/content/clinic.js";
import type { Locale } from "../../src/lib/receptionist/protocol.js";

export type Intent =
  | "BOOK_APPOINTMENT"
  | "SERVICE_QUESTION"
  | "CLINIC_QUESTION"
  | "TOOTH_PAIN"
  | "DENTAL_EMERGENCY"
  | "COSMETIC_DENTISTRY"
  | "IMPLANTS"
  | "INVISALIGN"
  | "WHITENING"
  | "GENERAL_DENTISTRY"
  | "CONTACT_RECEPTION"
  | "UNKNOWN";

// Most specific first: the first match wins.
const INTENT_PATTERNS: [Intent, RegExp][] = [
  ["DENTAL_EMERGENCY", /\b(emergency|urgent|urgently|knocked out|broken tooth|abscess)\b|urg[êe]ncia|urgente|dente partido|abcesso/],
  ["TOOTH_PAIN", /\b(tooth ?ache|pain|hurts?|hurting|sore|sensitive|throbbing|ache)\b|\bdor\b|d[óo]i|sens[íi]vel/],
  ["CONTACT_RECEPTION", /\breception(ist)?\b|\b(speak|talk)\s+(to|with)\s+(a |the )?(someone|person|human|staff|team)\b|\bcall me\b|rece[çc][ãa]o|rec?e[cç]?cionista|falar com (algu[ée]m|uma pessoa)/],
  ["INVISALIGN", /\b(invisalign|aligners?|braces|straighten|crooked|orthodont\w*)\b|alinhador|aparelho|ortodon/],
  ["IMPLANTS", /\b(implants?|missing (tooth|teeth))\b|implante/],
  ["WHITENING", /\b(whiten(ing)?|white(r)? teeth|stain(s|ed)?|bleach(ing)?|yellow)\b|branque|manchas?/],
  ["COSMETIC_DENTISTRY", /\b(cosmetic|veneers?|bonding|contouring|smile makeover|makeover|gaps?)\b|est[ée]tica|facetas?|faceta/],
  ["GENERAL_DENTISTRY", /\b(check ?-?ups?|clean(ing)?|hygiene|fillings?|cavity|cavities|x-?rays?)\b|limpeza|higieniza|obtura|c[áa]rie|check-?up/],
  ["BOOK_APPOINTMENT", /\b(book|booking|appointment|schedule|reserve|consultation|slot|available|availability)\b|marcar|marca[çc][ãa]o|consulta|agendar|vaga/],
  ["CLINIC_QUESTION", /\b(open|opening|hours|close|closing|address|where|located|location|parking|phone|email|contact|price|prices|cost|costs|how much|insurance|payment|pay|finance)\b|hor[áa]rio|morada|onde|pre[çc]o|quanto|custa|seguro|pagamento/],
  ["SERVICE_QUESTION", /\b(services?|treatments?|offer|do you (do|have))\b|servi[çc]os?|tratamentos?/],
];

export function classifyIntent(message: string): Intent {
  const text = message.toLowerCase();
  return INTENT_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] ?? "UNKNOWN";
}

// Explicit requests to reach a person. Kept narrow so questions like "what's the reception phone number?" still reach the model.
const HANDOFF_REQUEST =
  /^\s*(i('d| would)? (like|want|need) to |can i |could i |please |let me |)(contact|speak (to|with)|talk (to|with)|reach|call) (the )?(reception|receptionist|a human|a real person|a person|someone|staff|the team|the clinic)\b|^\s*(contact|speak to|talk to) reception\b|^\s*(quero|gostaria de|preciso de|posso) (falar|contactar|ligar)( com)? (a |o )?(rece[çc][ãa]o|rececionista|recepcionista|algu[ée]m|uma pessoa|a equipa|a cl[íi]nica)/i;

export function isHandoffRequest(message: string) {
  return HANDOFF_REQUEST.test(message.trim());
}

// Attempts to extract or override hidden instructions. Matching messages get a fixed refusal.
const INSTRUCTION_EXTRACTION = [
  /\b(ignore|disregard|forget|override|bypass)\b.{0,20}\b(all|any|your|previous|prior|above|earlier|system|these)\b.{0,20}\b(instructions?|rules|prompts?|guidelines|guardrails|restrictions)\b/i,
  /\b(system|hidden|initial|original|developer|internal)\s+(prompts?|instructions?)\b/i,
  /\b(show|reveal|print|repeat|display|output|leak|tell me|what (is|are)|give me)\b.{0,30}\byour\s+(prompts?|instructions?|configuration|config)\b/i,
  /\b(api[ _-]?keys?|environment variables?|env vars?|\.env\b|secret keys?)\b/i,
  /\b(jailbreak|dan mode|developer mode|god mode)\b/i,
  /\b(ignora|esquece)\b.{0,30}\b(as tuas|as suas|todas as|anteriores)\b.{0,20}\b(instru[çc][õo]es|regras)\b/i,
  /\b(mostra|revela|diz-me|repete)\b.{0,30}\b(as tuas|as suas|o teu|o seu)\s+(instru[çc][õo]es|regras|prompt)\b/i,
];

export function isInstructionExtractionAttempt(message: string) {
  return INSTRUCTION_EXTRACTION.some((pattern) => pattern.test(message));
}

export function instructionRefusal(locale: Locale) {
  return locale === "pt"
    ? "Não posso partilhar as minhas instruções internas nem detalhes técnicos. Mas terei todo o gosto em ajudar com os tratamentos da BrightSmile, questões sobre a clínica ou um pedido de consulta. Em que posso ajudar?"
    : "I can't share my internal instructions or technical details. I'm happy to help with BrightSmile treatments, clinic questions or an appointment request, though. What can I help you with?";
}

export function handoffReply(locale: Locale, openNow: boolean) {
  const phone = clinic.phone.display;
  if (locale === "pt") {
    return openNow
      ? `Claro. A receção está aberta agora: pode ligar para ${phone}, enviar mensagem por WhatsApp ou email. Deixo os contactos abaixo.`
      : `Claro. A receção está fechada neste momento, mas pode enviar mensagem por WhatsApp ou email e a equipa responde quando abrir. Deixo os contactos e o horário abaixo.`;
  }
  return openNow
    ? `Of course. Reception is open now: you can call ${phone}, or message the team on WhatsApp or by email. The details are below.`
    : "Of course. Reception is closed right now, but you can message the team on WhatsApp or by email and they'll reply when they're back. Contact details and opening hours are below.";
}
