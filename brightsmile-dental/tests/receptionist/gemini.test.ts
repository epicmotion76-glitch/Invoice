import { describe, expect, it } from "vitest";
import { createGeminiModel } from "../../server/receptionist/gemini";
import { resolveProvider } from "../../server/receptionist/handler";
import { ModelError, type ReceptionistReplyRequest } from "../../server/receptionist/model";
import { receptionistTools } from "../../server/receptionist/tools";

function sse(chunks: unknown[]) {
  const body = chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\r\n\r\n`).join("");
  return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
}

const textChunk = (text: string, finishReason?: string) => ({
  candidates: [{ content: { role: "model", parts: [{ text }] }, ...(finishReason && { finishReason }) }],
});

function fakeFetch(responses: (() => Response)[]) {
  const requests: { url: string; headers: Headers; body: Record<string, any> }[] = [];
  const fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: String(url), headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) });
    const next = responses.shift();
    if (!next) throw new Error("unexpected request");
    return next();
  }) as typeof globalThis.fetch;
  return { fetch, requests };
}

function replyRequest() {
  const text: string[] = [];
  const toolCalls: { name: string; input: unknown }[] = [];
  const request: ReceptionistReplyRequest = {
    systemPrompt: "SYSTEM",
    turnContext: "CONTEXT",
    history: [
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello! How can I help?" },
      { role: "user", content: "When are you open?" },
    ],
    tools: receptionistTools,
    runTool: async (name, input) => {
      toolCalls.push({ name, input });
      return { content: '{"facts":["Saturday: 9:00 AM – 1:00 PM."]}' };
    },
    onText: (delta) => text.push(delta),
    signal: new AbortController().signal,
  };
  return { request, text, toolCalls };
}

describe("createGeminiModel", () => {
  it("streams text, runs function calls between rounds and echoes thought signatures", async () => {
    const { fetch, requests } = fakeFetch([
      () =>
        sse([
          {
            candidates: [
              {
                content: {
                  role: "model",
                  parts: [
                    { text: "Let me check." },
                    { functionCall: { name: "get_clinic_information", args: { topic: "opening_hours" } }, thoughtSignature: "sig-1" },
                  ],
                },
                finishReason: "STOP",
              },
            ],
          },
        ]),
      () => sse([textChunk("We're open "), textChunk("Saturday 9–1.", "STOP")]),
    ]);
    const { request, text, toolCalls } = replyRequest();

    await createGeminiModel({ apiKey: "test-key", fetch }).reply(request);

    expect(text.join("")).toBe("Let me check.\n\nWe're open Saturday 9–1.");
    expect(toolCalls).toEqual([{ name: "get_clinic_information", input: { topic: "opening_hours" } }]);

    const first = requests[0];
    expect(first.url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse");
    expect(first.headers.get("x-goog-api-key")).toBe("test-key");
    expect(first.body.systemInstruction.parts[0].text).toBe("SYSTEM\n\nCONTEXT");
    expect(first.body.contents.map((content: { role: string }) => content.role)).toEqual(["user", "model", "user"]);
    expect(first.body.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
    const declarations = first.body.tools[0].functionDeclarations;
    expect(declarations.map((declaration: { name: string }) => declaration.name)).toEqual(receptionistTools.map((tool) => tool.name));
    expect(JSON.stringify(declarations)).not.toContain("additionalProperties");

    // Second round: the model turn is echoed unchanged (with its signature), followed by the function response.
    const contents = requests[1].body.contents;
    expect(contents[3].parts[1]).toEqual({
      functionCall: { name: "get_clinic_information", args: { topic: "opening_hours" } },
      thoughtSignature: "sig-1",
    });
    expect(contents[4]).toEqual({
      role: "user",
      parts: [{ functionResponse: { name: "get_clinic_information", response: { facts: ["Saturday: 9:00 AM – 1:00 PM."] } } }],
    });
  });

  it("uses a thinking level for Gemini 3 models and hides thought parts", async () => {
    const { fetch, requests } = fakeFetch([
      () => sse([{ candidates: [{ content: { parts: [{ text: "internal", thought: true }, { text: "Hi!" }] }, finishReason: "STOP" }] }]),
    ]);
    const { request, text } = replyRequest();
    await createGeminiModel({ apiKey: "k", model: "gemini-3.5-flash", fetch }).reply(request);
    expect(requests[0].body.generationConfig.thinkingConfig).toEqual({ thinkingLevel: "low" });
    expect(text.join("")).toBe("Hi!");
  });

  it("maps safety blocks to ModelError('refused')", async () => {
    const { fetch } = fakeFetch([() => sse([{ promptFeedback: { blockReason: "SAFETY" } }])]);
    await expect(createGeminiModel({ apiKey: "k", fetch }).reply(replyRequest().request)).rejects.toMatchObject({ code: "refused" });
  });

  it.each([
    [400, "unavailable"],
    [403, "unavailable"],
    [429, "busy"],
    [503, "busy"],
  ])("maps HTTP %i to ModelError('%s')", async (status, code) => {
    const error = () => new Response(JSON.stringify({ error: { code: status } }), { status });
    const { fetch, requests } = fakeFetch([error, error]);
    const failure = await createGeminiModel({ apiKey: "k", fetch })
      .reply(replyRequest().request)
      .catch((reason: unknown) => reason);
    expect(failure).toBeInstanceOf(ModelError);
    expect((failure as ModelError).code).toBe(code);
    expect(requests).toHaveLength(status === 429 || status === 503 ? 2 : 1);
  });
});

describe("resolveProvider", () => {
  it("honours AI_PROVIDER and otherwise infers from the key format", () => {
    expect(resolveProvider({ AI_API_KEY: "AIzaSyExample" })).toBe("gemini");
    expect(resolveProvider({ AI_API_KEY: "AQ.Example" })).toBe("gemini");
    expect(resolveProvider({ AI_API_KEY: "sk-ant-example" })).toBe("anthropic");
    expect(resolveProvider({ AI_API_KEY: "AQ.Example", AI_PROVIDER: "anthropic" })).toBe("anthropic");
    expect(resolveProvider({ AI_API_KEY: "x", AI_PROVIDER: "gemini" })).toBe("gemini");
    expect(resolveProvider({ AI_API_KEY: "x", AI_PROVIDER: "other" })).toBeNull();
  });
});
