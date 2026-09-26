import { describe, expect, it } from "vitest";
import { createAnthropicModel } from "../../server/receptionist/anthropic";
import { ModelError, type ReceptionistReplyRequest } from "../../server/receptionist/model";
import { receptionistTools } from "../../server/receptionist/tools";

type SseEvent = Record<string, unknown> & { type: string };

function sse(events: SseEvent[]) {
  const body = events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
  return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
}

const start = (id: string): SseEvent => ({
  type: "message_start",
  message: {
    id,
    type: "message",
    role: "assistant",
    model: "claude-opus-5",
    content: [],
    stop_reason: null,
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 0 },
  },
});

const textBlock = (index: number, ...chunks: string[]): SseEvent[] => [
  { type: "content_block_start", index, content_block: { type: "text", text: "" } },
  ...chunks.map((text) => ({ type: "content_block_delta", index, delta: { type: "text_delta", text } })),
  { type: "content_block_stop", index },
];

const toolBlock = (index: number, id: string, name: string, input: unknown): SseEvent[] => [
  { type: "content_block_start", index, content_block: { type: "tool_use", id, name, input: {} } },
  { type: "content_block_delta", index, delta: { type: "input_json_delta", partial_json: JSON.stringify(input) } },
  { type: "content_block_stop", index },
];

const end = (stopReason: string): SseEvent[] => [
  { type: "message_delta", delta: { stop_reason: stopReason, stop_sequence: null }, usage: { output_tokens: 20 } },
  { type: "message_stop" },
];

/** A fetch that returns the scripted responses in order and records each request. */
function fakeFetch(responses: (() => Response)[]) {
  const requests: { headers: Headers; body: Record<string, unknown> }[] = [];
  const fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) });
    const next = responses.shift();
    if (!next) throw new Error("unexpected request");
    return next();
  }) as typeof globalThis.fetch;
  return { fetch, requests };
}

function replyRequest(overrides: Partial<ReceptionistReplyRequest> = {}) {
  const text: string[] = [];
  const toolCalls: { name: string; input: unknown }[] = [];
  const request: ReceptionistReplyRequest = {
    systemPrompt: "SYSTEM",
    turnContext: "CONTEXT",
    history: [{ role: "user", content: "When are you open?" }],
    tools: receptionistTools,
    runTool: async (name, input) => {
      toolCalls.push({ name, input });
      return { content: '{"facts":["Saturday: 9:00 AM – 1:00 PM."]}' };
    },
    onText: (delta) => text.push(delta),
    signal: new AbortController().signal,
    ...overrides,
  };
  return { request, text, toolCalls };
}

describe("createAnthropicModel", () => {
  it("streams text, runs tools between rounds and sends the expected request", async () => {
    const { fetch, requests } = fakeFetch([
      () => sse([start("msg_1"), ...textBlock(0, "Let me check."), ...toolBlock(1, "toolu_1", "get_clinic_information", { topic: "opening_hours" }), ...end("tool_use")]),
      () => sse([start("msg_2"), ...textBlock(0, "We're open ", "Saturday 9–1."), ...end("end_turn")]),
    ]);
    const model = createAnthropicModel({ apiKey: "test-key", fetch });
    const { request, text, toolCalls } = replyRequest();

    await model.reply(request);

    expect(text.join("")).toBe("Let me check.\n\nWe're open Saturday 9–1.");
    expect(toolCalls).toEqual([{ name: "get_clinic_information", input: { topic: "opening_hours" } }]);

    const first = requests[0];
    expect(first.body.model).toBe("claude-opus-5");
    expect(first.body.stream).toBe(true);
    expect(first.body.fallbacks).toBe("default");
    expect(first.headers.get("anthropic-beta")).toContain("server-side-fallback-2026-07-01");
    expect(first.body.output_config).toEqual({ effort: "low" });
    expect(first.body.system).toEqual([
      { type: "text", text: "SYSTEM", cache_control: { type: "ephemeral" } },
      { type: "text", text: "CONTEXT" },
    ]);
    expect((first.body.tools as { name: string; eager_input_streaming: boolean }[]).map((tool) => tool.name)).toEqual(
      receptionistTools.map((tool) => tool.name),
    );

    // Second round carries the assistant tool call and its result.
    const secondMessages = requests[1].body.messages as { role: string; content: unknown }[];
    expect(secondMessages).toHaveLength(3);
    expect(secondMessages[2]).toEqual({
      role: "user",
      content: [{ type: "tool_result", tool_use_id: "toolu_1", content: '{"facts":["Saturday: 9:00 AM – 1:00 PM."]}' }],
    });
  });

  it("omits effort and fallbacks for models that don't support them", async () => {
    const { fetch, requests } = fakeFetch([() => sse([start("msg_1"), ...textBlock(0, "Hi"), ...end("end_turn")])]);
    await createAnthropicModel({ apiKey: "test-key", model: "claude-haiku-4-5", fetch }).reply(replyRequest().request);
    expect(requests[0].body.output_config).toBeUndefined();
    expect(requests[0].body.fallbacks).toBeUndefined();
  });

  it("maps a refusal to ModelError('refused')", async () => {
    const { fetch } = fakeFetch([() => sse([start("msg_1"), ...end("refusal")])]);
    const model = createAnthropicModel({ apiKey: "test-key", fetch });
    await expect(model.reply(replyRequest().request)).rejects.toMatchObject({ code: "refused" });
  });

  it.each([
    [401, "unavailable"],
    [429, "busy"],
    [529, "busy"],
  ])("maps HTTP %i to ModelError('%s')", async (status, code) => {
    const error = () =>
      new Response(JSON.stringify({ type: "error", error: { type: "error", message: "nope" } }), {
        status,
        headers: { "content-type": "application/json" },
      });
    const { fetch } = fakeFetch([error, error, error]);
    const model = createAnthropicModel({ apiKey: "test-key", fetch });
    const failure = await model.reply(replyRequest().request).catch((reason: unknown) => reason);
    expect(failure).toBeInstanceOf(ModelError);
    expect((failure as ModelError).code).toBe(code);
  });
});
