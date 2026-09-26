/**
 * Claude implementation of `ReceptionistModel`: a streaming tool-use loop on the Messages API.
 * All Anthropic-specific code lives in this file.
 */
import Anthropic from "@anthropic-ai/sdk";
import { ModelError, type ReceptionistModel, type ReceptionistReplyRequest } from "./model.js";

type Beta = Anthropic.Beta.Messages.BetaMessageParam;
type BetaBlock = Anthropic.Beta.Messages.BetaContentBlock;
type BetaBlockParam = Anthropic.Beta.Messages.BetaContentBlockParam;
type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export const DEFAULT_ANTHROPIC_MODEL = "claude-opus-5";

export type AnthropicModelOptions = {
  apiKey: string;
  model?: string;
  /** Thinking depth / token spend. Chat replies do well at "low". */
  effort?: Effort;
  maxToolRounds?: number;
  /** Custom fetch implementation (tests). */
  fetch?: typeof fetch;
};

const EFFORTS = new Set<string>(["low", "medium", "high", "xhigh", "max"]);

export function parseEffort(value: string | undefined): Effort | undefined {
  return value && EFFORTS.has(value) ? (value as Effort) : undefined;
}

// Older models reject `effort`; server-side refusal fallbacks are only offered on the newest models.
const supportsEffort = (model: string) => !/haiku-4-5|sonnet-4-5|-3-/.test(model);
const supportsFallbacks = (model: string) => /^claude-(opus-5|fable-5)/.test(model);

/**
 * After a mid-output refusal fallback, blocks produced before the last `fallback` marker
 * (except text) must not be echoed back, and the marker itself is dropped.
 */
function echoableContent(content: BetaBlock[]): BetaBlock[] {
  const lastFallback = content.map((block) => block.type).lastIndexOf("fallback");
  return content.filter(
    (block, index) =>
      block.type !== "fallback" &&
      !(index < lastFallback && (block.type === "thinking" || block.type === "redacted_thinking" || block.type === "tool_use")),
  );
}

function toModelError(error: unknown, signal: AbortSignal): ModelError {
  if (error instanceof ModelError) return error;
  if (signal.aborted || error instanceof Anthropic.APIUserAbortError || error instanceof Anthropic.APIConnectionTimeoutError) {
    return new ModelError("timeout");
  }
  if (error instanceof Anthropic.RateLimitError) return new ModelError("busy", "rate limited by provider");
  if (error instanceof Anthropic.InternalServerError) return new ModelError("busy", `provider error ${error.status}`);
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return new ModelError("unavailable", "provider credentials rejected");
  }
  if (error instanceof Anthropic.APIError) return new ModelError("unavailable", `provider error ${error.status ?? ""}`.trim());
  return new ModelError("unavailable", error instanceof Error ? error.name : "unknown error");
}

export function createAnthropicModel(options: AnthropicModelOptions): ReceptionistModel {
  const model = options.model || DEFAULT_ANTHROPIC_MODEL;
  const effort = options.effort ?? "low";
  const maxToolRounds = options.maxToolRounds ?? 5;
  const client = new Anthropic({ apiKey: options.apiKey, maxRetries: 1, timeout: 30_000, fetch: options.fetch });

  return {
    async reply({ systemPrompt, turnContext, history, tools, runTool, onText, signal }: ReceptionistReplyRequest) {
      const toolDefinitions: Anthropic.Beta.Messages.BetaTool[] = tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema as Anthropic.Beta.Messages.BetaTool.InputSchema,
        eager_input_streaming: true,
      }));
      const messages: Beta[] = history.map((turn) => ({ role: turn.role, content: turn.content }));
      let wroteText = false;
      let separateNextText = false;
      let malformedToolInputRetries = 0;

      try {
        for (let round = 0; round < maxToolRounds; round++) {
          const stream = client.beta.messages.stream(
            {
              model,
              max_tokens: 4096,
              system: [
                { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
                { type: "text", text: turnContext },
              ],
              tools: toolDefinitions,
              messages,
              ...(supportsEffort(model) && { output_config: { effort } }),
              ...(supportsFallbacks(model) && { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }),
            },
            { signal },
          );

          let roundText = false;
          let message: Anthropic.Beta.Messages.BetaMessage;
          try {
            for await (const event of stream) {
              if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                let text = event.delta.text;
                if (separateNextText && text.trim()) {
                  text = `\n\n${text.trimStart()}`;
                  separateNextText = false;
                }
                roundText = true;
                wroteText = true;
                onText(text);
              }
            }
            message = await stream.finalMessage();
          } catch (error) {
            // With eager input streaming a tool input can arrive as unparseable JSON. Re-issue the
            // turn once if nothing was shown yet; provider/API errors are handled by the caller.
            const isApiError = error instanceof Anthropic.APIError;
            if (!isApiError && !signal.aborted && !roundText && malformedToolInputRetries++ < 1) {
              round--;
              continue;
            }
            throw error;
          }

          if (message.stop_reason === "refusal") throw new ModelError("refused");

          const content = echoableContent(message.content);
          if (message.stop_reason === "pause_turn") {
            messages.push({ role: "assistant", content: content as BetaBlockParam[] });
            continue;
          }

          const toolUses = content.filter((block) => block.type === "tool_use");
          // A tool call cut off by max_tokens may look valid but be truncated, so only run complete turns.
          if (message.stop_reason !== "tool_use" || toolUses.length === 0) return;

          messages.push({ role: "assistant", content: content as BetaBlockParam[] });
          const results: Anthropic.Beta.Messages.BetaToolResultBlockParam[] = [];
          // Sequential on purpose: appointment updates must apply in order.
          for (const toolUse of toolUses) {
            const outcome = await runTool(toolUse.name, toolUse.input);
            results.push({ type: "tool_result", tool_use_id: toolUse.id, content: outcome.content, is_error: outcome.isError });
          }
          messages.push({ role: "user", content: results });
          if (wroteText) separateNextText = true;
        }
        if (!wroteText) throw new ModelError("unavailable", "tool round limit reached");
      } catch (error) {
        throw toModelError(error, signal);
      }
    },
  };
}
