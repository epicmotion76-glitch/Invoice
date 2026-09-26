/**
 * Deterministic safety triage, run on every visitor message before the language model.
 *
 * - "emergency": possible medical emergency. The handler answers with fixed guidance (call 112)
 *   and never lets the model continue a booking conversation first.
 * - "urgent": an urgent *dental* problem (severe pain, broken tooth, ordinary swelling...). The model
 *   answers, but is told to point the visitor to same-day care and screen for red flags.
 *
 * Patterns lean towards over-triggering: a false alarm costs one extra message, a miss could cost far more.
 */
import { clinic } from "../../src/content/clinic.js";
import type { Locale } from "../../src/lib/receptionist/protocol.js";

export type SafetyLevel = "none" | "urgent" | "emergency";

export type EmergencySignal = "breathing" | "swallowing" | "rapid_swelling" | "heavy_bleeding" | "consciousness" | "trauma" | "swelling_with_fever";

export type SafetyAssessment = { level: SafetyLevel; signals: EmergencySignal[] };

const EMERGENCY_PATTERNS: [EmergencySignal, RegExp][] = [
  // English
  ["breathing", /\b(can'?t|cannot|can not|could ?n'?t|hard to|difficult(y|ies)?( with)?|trouble|struggling( to)?|unable to|problems?( with)?|not able to)\s+(breath(e|ing)?)\b/],
  ["breathing", /\b(short(ness)? of breath|out of breath|gasping|not breathing|stopped breathing|throat (is )?(closing|swelling|tight))\b/],
  ["swallowing", /\b(can'?t|cannot|can not|could ?n'?t|hard to|difficult(y|ies)?( with)?|trouble|struggling( to)?|unable to|problems?( with)?|not able to)\s+swallow(ing)?\b/],
  ["swallowing", /\bswallowing (is )?(hard|difficult|impossible)\b/],
  ["rapid_swelling", /\b(swell(ing|s)?|swollen)\b.{0,40}\b(getting (bigger|worse)|spreading|rapid(ly)?|fast|quickly|growing|increasing|to (my |the )?(eye|neck|throat))\b/],
  ["rapid_swelling", /\b(rapid(ly)?|quickly|fast)[- ]?(increasing|growing|spreading|worsening)?\s*(facial |face )?swell/],
  ["rapid_swelling", /\b(eye|face) (is )?swollen shut\b/],
  ["heavy_bleeding", /\b(heavy|heavily|uncontrolled|uncontrollable|nonstop|non-stop|profuse(ly)?|a lot of|lots of|severe)\s+(bleed(ing)?|blood)\b/],
  ["heavy_bleeding", /\b(bleed(ing)?|blood)\b.{0,30}\b(won'?t|will not|doesn'?t|does not|isn'?t|is not|can'?t|cannot|not)\s+(stop|stopping|slow)/],
  ["heavy_bleeding", /\bbleeding (heavily|a lot|everywhere|badly)\b/],
  ["consciousness", /\b(pass(ed|ing)? out|faint(ed|ing)?|unconscious|lost consciousness|loss of consciousness|black(ed)? out|unresponsive|collapsed)\b/],
  ["trauma", /\b(car (accident|crash)|hit by a car|broken jaw|jaw (is |was )?(broken|fractured)|fractured jaw|serious (facial |face )?(injury|trauma)|major (facial |face )?(injury|trauma)|facial (injury|trauma)|head injury|hit (my|his|her|their) head|fell on (my|his|her|their) face|was assaulted|got punched)\b/],
  ["swelling_with_fever", /\b((swell(ing)?|swollen)\b.{0,60}\bfever|fever\b.{0,60}\b(swell(ing)?|swollen))\b/],
  // Portuguese
  ["breathing", /(dificuldade|dificuldades|custa|n[ãa]o consigo|n[ãa]o consegue|problemas?)\s+(em |a |para )?respirar/],
  ["breathing", /(falta de ar|sem ar\b|garganta (a )?(fechar|inchar|apertad))/],
  ["swallowing", /(dificuldade|dificuldades|custa|n[ãa]o consigo|n[ãa]o consegue|problemas?)\s+(em |a |para )?engolir/],
  ["rapid_swelling", /(incha[çc]o|inchad[ao]|inchar)\b.{0,40}(r[áa]pid|aument|espalh|pior|a crescer|olho|pesco[çc]o)/],
  ["heavy_bleeding", /(hemorragia|sangra(r|mento)? (muito|imenso|sem parar)|sangue sem parar|(sangra|sangue|sangramento).{0,30}n[ãa]o (p[áa]ra|parar|estanca))/],
  ["consciousness", /(desmai|perdi (a )?consci[êe]ncia|perdeu (a )?consci[êe]ncia|inconsciente)/],
  ["trauma", /(acidente de (carro|viação|viacao|mota)|maxilar partido|mand[íi]bula partida|traumatismo|pancada (forte )?na (cara|cabe[çc]a))/],
  ["swelling_with_fever", /(incha[çc]o|inchad[ao]).{0,60}febre|febre.{0,60}(incha[çc]o|inchad[ao])/],
];

const URGENT_PATTERN = new RegExp(
  [
    "\\b(emergency|urgent|urgently|asap|severe|unbearable|excruciating|agony|throbbing|knocked out|broken tooth|tooth (is )?broken|cracked tooth|chipped|abscess|swelling|swollen|bleeding|lost (a |my )?(filling|crown)|fell out)\\b",
    "(urg[êe]ncia|urgente|dor (muito )?forte|insuport[áa]vel|dente partido|parti um dente|incha[çc]o|inchad[ao]|abcesso|sangra|caiu)",
  ].join("|"),
);

// A negation within the three words before a match ("no swelling or trouble breathing") cancels it.
const NEGATION = /\b(no|not|never|without|nor|don'?t|doesn'?t|haven'?t|hasn'?t|isn'?t|aren'?t|sem|n[ãa]o|nem|nenhum|nenhuma)\b/;

function isNegated(text: string, matchIndex: number) {
  const before = text.slice(Math.max(0, matchIndex - 40), matchIndex);
  const clause = before.split(/[.!?;\n]|\bbut\b|\bmas\b/).pop() ?? "";
  const lastWords = clause.trim().split(/\s+/).slice(-3).join(" ");
  return NEGATION.test(lastWords);
}

function emergencySignals(text: string, respectNegation: boolean) {
  const signals = new Set<EmergencySignal>();
  for (const [signal, pattern] of EMERGENCY_PATTERNS) {
    for (const match of text.matchAll(new RegExp(pattern.source, "g"))) {
      if (!respectNegation || !isNegated(text, match.index ?? 0)) {
        signals.add(signal);
        break;
      }
    }
  }
  return signals;
}

const normalize = (text: string) => text.toLowerCase().replace(/[’`]/g, "'");

const AFFIRMATIVE = /^\s*(yes|yeah|yep|yup|yes,|i do|i am|i have|it is|it does|correct|right|sim|tenho|estou|está|esta|sim,)\b/;
const HAS_NEGATIVE = /\b(no|not|nope|none|neither|nothing|n[ãa]o|nada|nenhum|nenhuma|nem)\b/;

/**
 * @param previousAssistant The assistant's last message. If it asked about red-flag symptoms
 * (e.g. "...difficulty breathing or swallowing?") a plain "yes" counts as an emergency.
 */
export function assessSafety(message: string, previousAssistant?: string): SafetyAssessment {
  const text = normalize(message);
  const signals = emergencySignals(text, true);

  if (signals.size === 0 && previousAssistant?.includes("?") && AFFIRMATIVE.test(text) && !HAS_NEGATIVE.test(text)) {
    for (const signal of emergencySignals(normalize(previousAssistant), false)) signals.add(signal);
  }

  if (signals.size > 0) return { level: "emergency", signals: [...signals] };

  const urgent = new RegExp(URGENT_PATTERN.source, "g");
  for (const match of text.matchAll(urgent)) {
    if (!isNegated(text, match.index ?? 0)) return { level: "urgent", signals: [] };
  }
  return { level: "none", signals: [] };
}

/** Fixed guidance shown instead of a model reply when emergency signs are reported. */
export function emergencyGuidance(locale: Locale) {
  const n = clinic.emergencyNumber;
  if (locale === "pt") {
    return [
      `Os sintomas que descreve podem precisar de atenção médica urgente. Por favor, ligue já para o ${n} (serviços de emergência) ou dirija-se às urgências mais próximas.`,
      "Não espere por uma consulta dentária e não conduza se não se sentir bem.",
      `Quando estiver em segurança, pode contactar a BrightSmile pelo ${clinic.phone.display} para acompanhamento dentário.`,
    ].join("\n\n");
  }
  return [
    `The symptoms you describe may need urgent medical attention. Please call ${n} (emergency services) now or go to the nearest emergency department.`,
    "Please don't wait for a dental appointment, and don't drive yourself if you feel unwell.",
    `Once you're safe, you can contact BrightSmile on ${clinic.phone.display} for dental follow-up.`,
  ].join("\n\n");
}
