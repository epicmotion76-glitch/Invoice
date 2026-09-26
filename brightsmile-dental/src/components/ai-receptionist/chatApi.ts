import type { ChatErrorCode, ChatRequestBody, ServerEvent } from "../../lib/receptionist/protocol";

export const CHAT_ENDPOINT = "/api/chat";
const CLIENT_TIMEOUT_MS = 60_000;

export class ChatRequestError extends Error {
  constructor(readonly code: ChatErrorCode) {
    super(code);
    this.name = "ChatRequestError";
  }
}

const isServerEvent = (value: unknown): value is ServerEvent =>
  Boolean(value) && typeof value === "object" && typeof (value as { type?: unknown }).type === "string";

/**
 * POSTs the conversation and calls `onEvent` for each streamed event.
 * Rejects with `ChatRequestError` for HTTP errors, timeouts and network failures.
 */
export async function streamChat(body: ChatRequestBody, onEvent: (event: ServerEvent) => void, signal: AbortSignal) {
  const timeout = new AbortController();
  const timer = window.setTimeout(() => timeout.abort(), CLIENT_TIMEOUT_MS);
  const abortOnCancel = () => timeout.abort();
  signal.addEventListener("abort", abortOnCancel);

  try {
    let response: Response;
    try {
      response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: timeout.signal,
      });
    } catch {
      throw new ChatRequestError(signal.aborted ? "invalid_request" : timeout.signal.aborted ? "timeout" : "unavailable");
    }

    if (!response.ok || !response.body) {
      if (response.status === 429) throw new ChatRequestError("rate_limited");
      throw new ChatRequestError(response.status === 400 || response.status === 413 ? "invalid_request" : "unavailable");
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (value) buffer += value;
        const lines = buffer.split("\n");
        buffer = done ? "" : lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let event: unknown;
          try {
            event = JSON.parse(line);
          } catch {
            continue; // Skip a malformed line rather than failing the whole reply.
          }
          if (isServerEvent(event)) onEvent(event);
        }
        if (done) break;
      }
    } catch {
      throw new ChatRequestError(timeout.signal.aborted && !signal.aborted ? "timeout" : "unavailable");
    }
  } finally {
    window.clearTimeout(timer);
    signal.removeEventListener("abort", abortOnCancel);
  }
}
