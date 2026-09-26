/**
 * Clinic knowledge lookup used by the `get_clinic_information` tool.
 * `KnowledgeSource` is the seam for a later RAG/vector-search upgrade: implement `lookup`
 * against a vector store and pass it to the handler; the tool and chat UI stay unchanged.
 */
import { clinic, services } from "../../src/content/clinic.js";
import {
  clinicKnowledge,
  unconfirmedTopics,
  type KnowledgeEntry,
  type KnowledgeTopicId,
} from "../../src/content/clinicKnowledge.js";

export type KnowledgeResult = {
  topic: string;
  entries: Pick<KnowledgeEntry, "id" | "title" | "facts">[];
  /** Reminder of what is NOT confirmed, so the model says "I don't know" instead of guessing. */
  unconfirmed: string[];
};

export interface KnowledgeSource {
  lookup(topic: string, question?: string): Promise<KnowledgeResult>;
}

export const knowledgeTopicIds = clinicKnowledge.map((entry) => entry.id) as KnowledgeTopicId[];

function keywordScore(entry: KnowledgeEntry, text: string) {
  return entry.keywords.reduce((score, keyword) => (text.includes(keyword) ? score + 1 : score), 0);
}

export const staticKnowledgeSource: KnowledgeSource = {
  async lookup(topic, question) {
    const exact = clinicKnowledge.find((entry) => entry.id === topic);
    let entries: KnowledgeEntry[];
    if (exact) {
      entries = [exact];
    } else {
      const text = `${topic} ${question ?? ""}`.toLowerCase();
      entries = clinicKnowledge
        .map((entry) => ({ entry, score: keywordScore(entry, text) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map(({ entry }) => entry);
    }
    return {
      topic,
      entries: entries.map(({ id, title, facts }) => ({ id, title, facts })),
      unconfirmed: unconfirmedTopics,
    };
  },
};

/** The short, always-needed facts placed directly in the system prompt. */
export function coreClinicFacts() {
  return [
    `Clinic: ${clinic.name}, ${clinic.city}, Portugal.`,
    `Phone: ${clinic.phone.display}. WhatsApp: same number. Email: ${clinic.email}.`,
    `Address: ${clinic.address.line1}, ${clinic.address.line2}.`,
    `Opening hours: ${clinic.hours.map((row) => `${row.days} ${row.time}`).join("; ")}.`,
    `Services: ${services.map((service) => service.title).join(", ")}.`,
    `Emergency guidance published by the clinic: call ${clinic.phone.display} for dental emergencies (same-day slots for severe pain, swelling or a broken tooth); for facial swelling that affects breathing or swallowing, call ${clinic.emergencyNumber}.`,
    "Booking: requests go to reception (website or WhatsApp) and are only booked once the team confirms. Monday to Saturday, up to 6 months ahead.",
    "Prices are not published; costs depend on the treatment plan and are given in writing before treatment.",
  ].join("\n");
}
