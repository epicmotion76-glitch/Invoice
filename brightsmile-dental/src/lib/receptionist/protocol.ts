/**
 * Types shared by the chat widget and the /api/chat function.
 * The server streams newline-delimited JSON, one `ServerEvent` per line.
 */
import type { TreatmentValue } from "../../content/clinic";

export type Locale = "en" | "pt";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type PatientType = "new" | "existing";

/** Appointment details collected during the conversation. Only what reception needs. */
export type AppointmentDraft = {
  name?: string;
  /** Phone number or email address. */
  contact?: string;
  service?: TreatmentValue;
  /** ISO date, YYYY-MM-DD. */
  preferredDate?: string;
  /** Free text such as "afternoon" or "after 4pm". */
  preferredTime?: string;
  notes?: string;
  patientType?: PatientType;
};

export type AppointmentField = keyof AppointmentDraft;

export const REQUIRED_APPOINTMENT_FIELDS = ["name", "contact", "service", "preferredDate", "preferredTime"] as const;
export type RequiredAppointmentField = (typeof REQUIRED_APPOINTMENT_FIELDS)[number];

export type ChatRequestBody = {
  messages: ChatTurn[];
  appointment?: AppointmentDraft;
  locale?: Locale;
};

export type ChatErrorCode = "unavailable" | "timeout" | "busy" | "rate_limited" | "invalid_request" | "refused";

export type ServerEvent =
  | { type: "locale"; locale: Locale }
  | { type: "text"; delta: string }
  | { type: "appointment"; appointment: AppointmentDraft; missing: RequiredAppointmentField[]; complete: boolean }
  /** The visitor confirmed their details; the request is ready to send to reception on WhatsApp. */
  | { type: "appointment_ready"; appointment: AppointmentDraft; message: string; url: string }
  | { type: "handoff" }
  | { type: "emergency" }
  | { type: "error"; code: ChatErrorCode }
  | { type: "done" };

export const CHAT_LIMITS = {
  /** Characters per visitor message. */
  messageLength: 1000,
  /** Most recent turns sent to the server. */
  historyTurns: 20,
  /** Characters across the whole history (assistant turns included). */
  historyLength: 16000,
  /** Raw request body size in bytes. */
  bodyBytes: 48_000,
} as const;
