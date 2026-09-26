/**
 * The receptionist's tools. Definitions are provider-neutral (JSON Schema); results are produced
 * here on the server from validated state, so the model can't fabricate a booking or a WhatsApp link.
 */
import { clinic, treatmentOptions } from "../../src/content/clinic.js";
import {
  appointmentRequestUrl,
  applyAppointmentUpdate,
  missingAppointmentFields,
} from "../../src/lib/receptionist/appointment.js";
import type { AppointmentDraft, Locale, ServerEvent } from "../../src/lib/receptionist/protocol.js";
import { knowledgeTopicIds, type KnowledgeSource } from "./knowledge.js";

export type ToolSpec = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type ToolContext = {
  /** Mutated by update_appointment_request. */
  appointment: AppointmentDraft;
  locale: Locale;
  /** Clinic-local midnight today, for date validation. */
  today: Date;
  openNow: boolean;
  knowledge: KnowledgeSource;
  emit: (event: ServerEvent) => void;
};

export type ToolOutcome = { content: string; isError?: boolean };

export const receptionistTools: ToolSpec[] = [
  {
    name: "get_clinic_information",
    description:
      "Returns confirmed BrightSmile information for a topic (treatments, contact, hours, appointments, pricing and payment, technology and comfort). Use it before answering clinic-specific questions. If the result doesn't cover the question, say you don't have confirmed information.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", enum: knowledgeTopicIds, description: "The topic that best matches the question." },
        question: { type: "string", description: "The visitor's question in a few words, used to find related facts." },
      },
      required: ["topic"],
      additionalProperties: false,
    },
  },
  {
    name: "update_appointment_request",
    description:
      "Saves appointment-request details the visitor has given (any subset). Each field is validated; the result lists saved and rejected fields, warnings, and what is still missing. Call it whenever the visitor provides or changes a detail.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Visitor's name as they gave it." },
        contact: { type: "string", description: "Phone number (with country code if given) or email address." },
        service: {
          type: "string",
          enum: treatmentOptions.map((option) => option.value),
          description: "Closest service option for the reason for the visit.",
        },
        preferred_date: { type: "string", description: "Preferred date as YYYY-MM-DD, resolved from what the visitor said." },
        preferred_time: { type: "string", description: 'Preferred time or range in a few words, e.g. "afternoon", "after 4pm", "10:30".' },
        notes: { type: "string", description: "Optional short note for reception. No detailed health information." },
        patient_type: { type: "string", enum: ["new", "existing"] },
      },
      additionalProperties: false,
    },
  },
  {
    name: "prepare_whatsapp_appointment",
    description:
      "Prepares the saved appointment request as a WhatsApp message to BrightSmile reception and shows the visitor a button to send it. Only call after all required details are saved AND the visitor has explicitly confirmed the summary. It does not book or confirm an appointment.",
    inputSchema: {
      type: "object",
      properties: {
        visitor_confirmed: { type: "boolean", description: "True only if the visitor explicitly confirmed the summary." },
      },
      required: ["visitor_confirmed"],
      additionalProperties: false,
    },
  },
  {
    name: "request_human_reception",
    description:
      "Shows the visitor BrightSmile reception's phone, WhatsApp and email, and returns whether reception is open now. Use when the visitor wants a person, or needs information you don't have.",
    inputSchema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          enum: ["visitor_request", "unconfirmed_information", "complaint_or_account", "other"],
        },
      },
      additionalProperties: false,
    },
  },
];

const asObject = (input: unknown): Record<string, unknown> =>
  input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};

const json = (value: unknown): ToolOutcome => ({ content: JSON.stringify(value) });
const error = (message: string): ToolOutcome => ({ content: JSON.stringify({ error: message }), isError: true });

export async function executeReceptionistTool(name: string, rawInput: unknown, context: ToolContext): Promise<ToolOutcome> {
  const input = asObject(rawInput);

  switch (name) {
    case "get_clinic_information": {
      if (typeof input.topic !== "string") return error("topic is required.");
      const question = typeof input.question === "string" ? input.question.slice(0, 200) : undefined;
      return json(await context.knowledge.lookup(input.topic, question));
    }

    case "update_appointment_request": {
      const patch: Record<string, unknown> = {};
      const fieldMap = {
        name: "name",
        contact: "contact",
        service: "service",
        preferred_date: "preferredDate",
        preferred_time: "preferredTime",
        notes: "notes",
        patient_type: "patientType",
      } as const;
      for (const [inputKey, field] of Object.entries(fieldMap)) {
        if (input[inputKey] !== undefined && input[inputKey] !== null) patch[field] = input[inputKey];
      }
      if (Object.keys(patch).length === 0) return error("Provide at least one field to save.");

      const result = applyAppointmentUpdate(context.appointment, patch, context.today);
      context.appointment = result.draft;
      const missing = missingAppointmentFields(result.draft);
      context.emit({ type: "appointment", appointment: result.draft, missing, complete: missing.length === 0 });
      return json({
        saved: result.accepted,
        rejected: result.rejected,
        warnings: result.warnings,
        appointment: result.draft,
        missing,
        next:
          missing.length === 0
            ? "All required details are saved. Summarise them and ask the visitor to confirm before calling prepare_whatsapp_appointment."
            : `Ask for: ${missing.slice(0, 2).join(", ")}.`,
      });
    }

    case "prepare_whatsapp_appointment": {
      if (input.visitor_confirmed !== true) {
        return error("The visitor has not confirmed. Summarise the details and ask them to confirm first.");
      }
      const missing = missingAppointmentFields(context.appointment);
      if (missing.length > 0) return error(`Missing required details: ${missing.join(", ")}.`);
      try {
        const { message, url } = appointmentRequestUrl(context.appointment, context.locale);
        context.emit({ type: "appointment_ready", appointment: context.appointment, message, url });
        return json({
          status: "ready_to_send",
          note: "A 'Send on WhatsApp' button is now shown. The visitor must press it and then Send in WhatsApp. This is a request, not a confirmed booking; reception will reply to confirm a time.",
        });
      } catch {
        return error("Could not prepare the WhatsApp message. Offer the clinic's phone number instead.");
      }
    }

    case "request_human_reception": {
      context.emit({ type: "handoff" });
      return json({
        shown_to_visitor: true,
        reception_open_now: context.openNow,
        phone: clinic.phone.display,
        whatsapp: clinic.phone.display,
        email: clinic.email,
        opening_hours: clinic.hours.map((row) => `${row.days}: ${row.time}`),
      });
    }

    default:
      return error(`Unknown tool: ${name}`);
  }
}
