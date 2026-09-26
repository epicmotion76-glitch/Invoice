/**
 * Google Gemini implementation of `ReceptionistModel`: a streaming function-calling loop on the
 * Gemini REST API (generativelanguage.googleapis.com, v1beta). All Gemini-specific code lives here.
 */
import { ModelError, type ReceptionistModel, type ReceptionistReplyRequest } from "./model.js";

/** Google's maintained alias for the current Flash model. Pin a specific version with AI_MODEL. */
export const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export type GeminiModelOptions = {
  apiKey: string;
  model?: string;
  effort?: Effort;
  maxToolRounds?: number;
  /** Custom fetch implementation (tests). */
  fetch?: typeof fetch;
};

type Part = {
  text?: string;
  /** Thought-summary parts are internal and never shown to the visitor. */
  thought?: boolean;
  /** Gemini 3 models require this to be echoed back unchanged with the part it came on. */
  thoughtSignature?: string;
  functionCall?: { id?: string; name: string; args?: Record<string, unknown> };
  functionResponse?: { id?: string; name: string; response: Record<string, unknown> };
};

type Content = { role: "user" | "model"; parts: Part[] };

type StreamChunk = {
  candidates?: { content?: { parts?: Part[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
};

const BLOCKED_FINISH_REASONS = new Set(["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "RECITATION", "IMAGE_SAFETY"]);

/** Gemini's function schemas are an OpenAPI subset without `additionalProperties`. */
function toGeminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (!schema || typeof schema !== "object") return schema;
  return Object.fromEntries(
    Object.entries(schema)
      .filter(([key]) => key !== "additionalProperties")
      .map(([key, value]) => [key, toGeminiSchema(value)]),
  );
}

function thinkingConfig(model: string, effort: Effort) {
  // Gemini 3+ (and the "-latest" aliases, which track it) take a thinking level; 2.5 Flash models
  // can switch thinking off. Thinking counts against maxOutputTokens, so keep it low for chat.
  const version = /-latest$/.test(model) ? 3 : Number(/gemini-(\d+(?:\.\d+)?)/.exec(model)?.[1] ?? 0);
  if (version >= 3) return { thinkingLevel: effort === "low" ? "low" : "high" };
  if (/gemini-2\.5-flash/.test(model) && effort === "low") return { thinkingBudget: 0 };
  return undefined;
}

function toolResponse(content: string, isError: boolean | undefined): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch {
    value = content;
  }
  const response = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : { result: value };
  return isError && !("error" in response) ? { error: response } : response;
}

async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamChunk> {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (value) buffer += value;
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = done ? "" : events.pop() ?? "";
    for (const event of events) {
      const data = event
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (data) yield JSON.parse(data) as StreamChunk;
    }
    if (done) return;
  }
}

/** Includes Google's error message (e.g. "model not found"); it never contains visitor messages. */
async function errorForResponse(response: Response): Promise<ModelError> {
  let detail = "";
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    detail = body.error?.message ? `: ${body.error.message.slice(0, 200)}` : "";
  } catch {
    // No JSON body.
  }
  const message = `provider error ${response.status}${detail}`;
  return new ModelError(response.status === 429 || response.status >= 500 ? "busy" : "unavailable", message);
}

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new ModelError("timeout"));
      },
      { once: true },
    );
  });

export function createGeminiModel(options: GeminiModelOptions): ReceptionistModel {
  const model = options.model || DEFAULT_GEMINI_MODEL;
  const effort = options.effort ?? "low";
  const maxToolRounds = options.maxToolRounds ?? 5;
  const fetchImpl = options.fetch ?? fetch;
  const url = `${API_BASE}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;

  async function post(body: unknown, signal: AbortSignal) {
    // One retry for overload/rate-limit responses; nothing has been shown to the visitor yet.
    for (let attempt = 0; ; attempt++) {
      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": options.apiKey },
          body: JSON.stringify(body),
          signal,
        });
      } catch {
        throw new ModelError(signal.aborted ? "timeout" : "unavailable", "network error");
      }
      if (response.ok && response.body) return response.body;
      const retryable = response.status === 429 || response.status === 500 || response.status === 503;
      if (!retryable || attempt >= 1) throw await errorForResponse(response);
      await response.body?.cancel().catch(() => undefined);
      await wait(800, signal);
    }
  }

  return {
    async reply({ systemPrompt, turnContext, history, tools, runTool, onText, signal }: ReceptionistReplyRequest) {
      const contents: Content[] = history.map((turn) => ({
        role: turn.role === "assistant" ? "model" : "user",
        parts: [{ text: turn.content }],
      }));
      const requestBase = {
        systemInstruction: { parts: [{ text: `${systemPrompt}\n\n${turnContext}` }] },
        tools: [
          {
            functionDeclarations: tools.map((tool) => ({
              name: tool.name,
              description: tool.description,
              parameters: toGeminiSchema(tool.inputSchema),
            })),
          },
        ],
        generationConfig: { maxOutputTokens: 8192, thinkingConfig: thinkingConfig(model, effort) },
      };

      let wroteText = false;
      let separateNextText = false;

      try {
        for (let round = 0; round < maxToolRounds; round++) {
          const body = await post({ ...requestBase, contents }, signal);
          const modelParts: Part[] = [];
          let finishReason: string | undefined;

          for await (const chunk of readSse(body)) {
            if (chunk.promptFeedback?.blockReason) throw new ModelError("refused", `blocked: ${chunk.promptFeedback.blockReason}`);
            const candidate = chunk.candidates?.[0];
            if (candidate?.finishReason) finishReason = candidate.finishReason;
            for (const part of candidate?.content?.parts ?? []) {
              modelParts.push(part);
              if (part.text && !part.thought) {
                let text = part.text;
                if (separateNextText && text.trim()) {
                  text = `\n\n${text.trimStart()}`;
                  separateNextText = false;
                }
                wroteText = true;
                onText(text);
              }
            }
          }

          if (finishReason && BLOCKED_FINISH_REASONS.has(finishReason)) throw new ModelError("refused", `finish: ${finishReason}`);

          if (finishReason === "MAX_TOKENS") console.warn(`[receptionist] ${model} reply hit the output token limit`);
          const calls = modelParts.flatMap((part) => (part.functionCall ? [part.functionCall] : []));
          // A call cut off by the token limit may be truncated, so only run calls from complete turns.
          if (calls.length === 0 || finishReason === "MAX_TOKENS") return;

          contents.push({ role: "model", parts: modelParts });
          const responses: Part[] = [];
          // Sequential on purpose: appointment updates must apply in order.
          for (const call of calls) {
            const outcome = await runTool(call.name, call.args ?? {});
            responses.push({
              functionResponse: {
                ...(call.id && { id: call.id }),
                name: call.name,
                response: toolResponse(outcome.content, outcome.isError),
              },
            });
          }
          contents.push({ role: "user", parts: responses });
          if (wroteText) separateNextText = true;
        }
        if (!wroteText) throw new ModelError("unavailable", "tool round limit reached");
      } catch (error) {
        if (error instanceof ModelError) throw error;
        if (signal.aborted) throw new ModelError("timeout");
        throw new ModelError("unavailable", error instanceof Error ? error.name : "unknown error");
      }
    },
  };
}
