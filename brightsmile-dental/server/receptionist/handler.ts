/**
 * POST /api/chat: the AI receptionist endpoint, written against the Web Request/Response API
 * so it runs unchanged as a Vercel Function and in the Vite dev server.
 *
 * Order of work for each visitor message:
 * 1. HTTP checks: method, origin, content type, size, rate limit, body validation.
 * 2. Deterministic routes that never reach the model: emergency guidance, attempts to extract
 *    hidden instructions, explicit requests for reception.
 * 3. Otherwise the model replies, using server-side tools for clinic facts and appointment state.
 * The reply streams back as newline-delimited JSON `ServerEvent`s.
 */
import { sanitizeDraft, missingAppointmentFields } from "../../src/lib/receptionist/appointment.js";
import { CHAT_LIMITS, type ChatErrorCode, type Locale, type ServerEvent } from "../../src/lib/receptionist/protocol.js";
import { createAnthropicModel, parseEffort } from "./anthropic.js";
import { clinicISODate, clinicToday, describeClinicNow, isClinicOpen } from "./clinicTime.js";
import { createGeminiModel } from "./gemini.js";
import { classifyIntent, handoffReply, instructionRefusal, isHandoffRequest, isInstructionExtractionAttempt } from "./intent.js";
import { staticKnowledgeSource, type KnowledgeSource } from "./knowledge.js";
import { detectLocale } from "./language.js";
import { ModelError, type ReceptionistModel } from "./model.js";
import { RECEPTIONIST_SYSTEM_PROMPT, buildTurnContext } from "./prompt.js";
import { clientKey, createRateLimiter, type RateLimiter } from "./rateLimit.js";
import { parseChatRequest, type ParsedChatRequest } from "./request.js";
import { assessSafety, emergencyGuidance } from "./safety.js";
import { executeReceptionistTool, receptionistTools, type ToolContext } from "./tools.js";

type Env = Record<string, string | undefined>;

export type HandlerDeps = {
  /** Injected in tests. `null` simulates a missing API key. Defaults to a model built from env. */
  model?: ReceptionistModel | null;
  knowledge?: KnowledgeSource;
  rateLimiter?: RateLimiter;
  now?: () => Date;
  env?: Env;
};

const REPLY_TIMEOUT_MS = 45_000;

const defaultRateLimiter = createRateLimiter([
  { limit: 12, windowMs: 60_000 },
  { limit: 80, windowMs: 60 * 60_000 },
]);

let cachedModel: { key: string; model: ReceptionistModel } | undefined;

/** AI_PROVIDER if set, otherwise inferred from the key format (Google keys start with "AIza" or "AQ."). */
export function resolveProvider(env: Env): "anthropic" | "gemini" | null {
  const explicit = env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "anthropic" || explicit === "claude") return "anthropic";
  if (explicit === "gemini" || explicit === "google") return "gemini";
  if (explicit) return null;
  return /^(AIza|AQ\.)/.test(env.AI_API_KEY?.trim() ?? "") ? "gemini" : "anthropic";
}

/** Builds the model from AI_* environment variables, or returns null when no key is configured. */
export function createModelFromEnv(env: Env): ReceptionistModel | null {
  const apiKey = env.AI_API_KEY?.trim();
  if (!apiKey) return null;
  const provider = resolveProvider(env);
  if (!provider) {
    console.error(`[receptionist] Unsupported AI_PROVIDER "${env.AI_PROVIDER}"`);
    return null;
  }
  const key = [provider, apiKey, env.AI_MODEL, env.AI_EFFORT].join("|");
  if (cachedModel?.key !== key) {
    const options = { apiKey, model: env.AI_MODEL?.trim(), effort: parseEffort(env.AI_EFFORT?.trim()) };
    cachedModel = { key, model: provider === "gemini" ? createGeminiModel(options) : createAnthropicModel(options) };
  }
  return cachedModel.model;
}

const SECURITY_HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function jsonError(status: number, error: ChatErrorCode | "method_not_allowed" | "forbidden", extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS, ...extraHeaders },
  });
}

function isAllowedOrigin(request: Request, env: Env) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Same-origin navigations and non-browser clients; rate limiting still applies.
  const allowed = (env.AI_ALLOWED_ORIGINS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (allowed.includes(origin)) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function handleChatRequest(request: Request, deps: HandlerDeps = {}): Promise<Response> {
  const env = deps.env ?? process.env;

  if (request.method !== "POST") return jsonError(405, "method_not_allowed", { Allow: "POST" });
  if (!isAllowedOrigin(request, env)) return jsonError(403, "forbidden");
  if (!request.headers.get("content-type")?.includes("application/json")) return jsonError(415, "invalid_request");

  const limit = (deps.rateLimiter ?? defaultRateLimiter).check(clientKey(request));
  if (!limit.allowed) return jsonError(429, "rate_limited", { "Retry-After": String(limit.retryAfterSeconds) });

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > CHAT_LIMITS.bodyBytes) return jsonError(413, "invalid_request");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > CHAT_LIMITS.bodyBytes) return jsonError(413, "invalid_request");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return jsonError(400, "invalid_request");
  }
  const parsed = parseChatRequest(body);
  if (!parsed.ok) return jsonError(400, "invalid_request");

  const abort = new AbortController();
  const signal = AbortSignal.any([abort.signal, request.signal, AbortSignal.timeout(REPLY_TIMEOUT_MS)]);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: ServerEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The client went away; nothing left to deliver.
        }
      };
      try {
        await respond(parsed.value, deps, env, signal, emit);
      } finally {
        emit({ type: "done" });
        try {
          controller.close();
        } catch {
          // Already closed by a cancelled client.
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", ...SECURITY_HEADERS },
  });
}

async function respond(
  { messages, appointment: appointmentInput, locale: previousLocale }: ParsedChatRequest,
  deps: HandlerDeps,
  env: Env,
  signal: AbortSignal,
  emit: (event: ServerEvent) => void,
) {
  const now = deps.now?.() ?? new Date();
  const today = clinicToday(now);
  const openNow = isClinicOpen(now);

  const latest = messages[messages.length - 1].content;
  const previousAssistant = [...messages].reverse().find((turn) => turn.role === "assistant")?.content;
  const locale = detectLocale(latest, previousLocale);
  emit({ type: "locale", locale });

  const appointment = sanitizeDraft(appointmentInput, today);
  if (appointmentInput && typeof appointmentInput === "object" && Object.keys(appointmentInput).length > 0) {
    const missing = missingAppointmentFields(appointment);
    emit({ type: "appointment", appointment, missing, complete: missing.length === 0 });
  }

  // 1. Possible medical emergency: fixed guidance, no model, no booking talk.
  const safety = assessSafety(latest, previousAssistant);
  if (safety.level === "emergency") {
    emit({ type: "text", delta: emergencyGuidance(locale) });
    emit({ type: "emergency" });
    return;
  }

  // 2. Attempts to read or override hidden instructions get a fixed refusal.
  if (isInstructionExtractionAttempt(latest)) {
    emit({ type: "text", delta: instructionRefusal(locale) });
    return;
  }

  // 3. "I want to talk to reception": answer instantly with contact options.
  if (isHandoffRequest(latest)) {
    emit({ type: "text", delta: handoffReply(locale, openNow) });
    emit({ type: "handoff" });
    return;
  }

  const model = deps.model !== undefined ? deps.model : createModelFromEnv(env);
  if (!model) {
    console.error("[receptionist] AI_API_KEY is not configured");
    emit({ type: "error", code: "unavailable" });
    return;
  }

  let requestPrepared = false;
  const context: ToolContext = {
    appointment,
    locale,
    today,
    openNow,
    knowledge: deps.knowledge ?? staticKnowledgeSource,
    emit: (event) => {
      if (event.type === "appointment_ready") requestPrepared = true;
      emit(event);
    },
  };

  // If the WhatsApp request was already prepared, a failed follow-up must not read as an error.
  const finishWithoutModelText = (code: ChatErrorCode) => {
    if (requestPrepared) emit({ type: "text", delta: requestReadyReply(locale) });
    else emit({ type: "error", code });
  };

  let wroteText = false;
  try {
    await model.reply({
      systemPrompt: RECEPTIONIST_SYSTEM_PROMPT,
      turnContext: buildTurnContext({
        now: describeClinicNow(now),
        todayISO: clinicISODate(now),
        openNow,
        locale,
        intent: classifyIntent(latest),
        safety: safety.level,
        appointment,
        missing: missingAppointmentFields(appointment),
      }),
      history: messages,
      tools: receptionistTools,
      runTool: (name, input) => executeReceptionistTool(name, input, context),
      onText: (delta) => {
        wroteText = true;
        emit({ type: "text", delta });
      },
      signal,
    });
    if (!wroteText) finishWithoutModelText("unavailable");
  } catch (error) {
    const code = error instanceof ModelError ? error.code : "unavailable";
    // Log the failure class only; never visitor messages or appointment details.
    console.error(`[receptionist] reply failed: ${code}${error instanceof Error ? ` (${error.message})` : ""}`);
    if (wroteText && requestPrepared) return; // The visitor already has the text and the WhatsApp button.
    finishWithoutModelText(code);
  }
}

function requestReadyReply(locale: Locale) {
  return locale === "pt"
    ? "O seu pedido de consulta está pronto para enviar à receção. Carregue no botão do WhatsApp abaixo e depois em Enviar. A consulta só fica confirmada quando a equipa responder."
    : "Your appointment request is ready to send to reception. Press the WhatsApp button below, then Send in WhatsApp. Your appointment isn't confirmed until the team replies.";
}
