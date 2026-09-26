import { CHAT_LIMITS, type ChatTurn, type Locale } from "../../src/lib/receptionist/protocol.js";

export type ParsedChatRequest = {
  messages: ChatTurn[];
  appointment: unknown;
  locale: Locale;
};

type ParseResult = { ok: true; value: ParsedChatRequest } | { ok: false; reason: string };

const ASSISTANT_TURN_MAX = 4000;

/** Validates and normalises the JSON body of POST /api/chat. */
export function parseChatRequest(body: unknown): ParseResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, reason: "Body must be a JSON object." };
  const { messages, appointment, locale } = body as Record<string, unknown>;

  if (!Array.isArray(messages) || messages.length === 0) return { ok: false, reason: "messages must be a non-empty array." };

  const turns: ChatTurn[] = [];
  for (const message of messages.slice(-CHAT_LIMITS.historyTurns)) {
    if (!message || typeof message !== "object") return { ok: false, reason: "Invalid message." };
    const { role, content } = message as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      return { ok: false, reason: "Each message needs a user/assistant role and string content." };
    }
    const text = content.trim();
    if (!text) continue;
    if (role === "user" && text.length > CHAT_LIMITS.messageLength) {
      return { ok: false, reason: `Messages are limited to ${CHAT_LIMITS.messageLength} characters.` };
    }
    turns.push({ role, content: role === "assistant" ? text.slice(0, ASSISTANT_TURN_MAX) : text });
  }

  // The conversation must start with the visitor and end with their new message.
  while (turns.length > 0 && turns[0].role !== "user") turns.shift();
  if (turns.length === 0 || turns[turns.length - 1].role !== "user") {
    return { ok: false, reason: "The last message must be from the user." };
  }

  // Drop the oldest turns until the history fits the size budget.
  let total = turns.reduce((sum, turn) => sum + turn.content.length, 0);
  while (total > CHAT_LIMITS.historyLength && turns.length > 1) {
    total -= turns.shift()!.content.length;
    while (turns.length > 1 && turns[0].role !== "user") total -= turns.shift()!.content.length;
  }

  return {
    ok: true,
    value: { messages: turns, appointment, locale: locale === "pt" ? "pt" : "en" },
  };
}
