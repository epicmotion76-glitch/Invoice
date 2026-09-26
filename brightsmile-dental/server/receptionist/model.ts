/**
 * Provider-neutral contract for the language model. The handler only talks to this interface;
 * to change providers, add another implementation next to `anthropic.ts` and select it in `createModelFromEnv`.
 */
import type { ChatTurn } from "../../src/lib/receptionist/protocol.js";
import type { ToolOutcome, ToolSpec } from "./tools.js";

export type ReceptionistReplyRequest = {
  /** Static instructions (cacheable). */
  systemPrompt: string;
  /** Per-request context appended after the system prompt. */
  turnContext: string;
  /** Conversation so far; the last turn is the visitor's new message. */
  history: ChatTurn[];
  tools: ToolSpec[];
  runTool: (name: string, input: unknown) => Promise<ToolOutcome>;
  /** Called with each chunk of visible reply text as it streams. */
  onText: (delta: string) => void;
  signal: AbortSignal;
};

export interface ReceptionistModel {
  reply(request: ReceptionistReplyRequest): Promise<void>;
}

export type ModelErrorCode = "unavailable" | "timeout" | "busy" | "refused";

export class ModelError extends Error {
  constructor(
    readonly code: ModelErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "ModelError";
  }
}
