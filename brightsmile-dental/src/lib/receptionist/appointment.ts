/**
 * Appointment-request rules shared by the chat widget and the /api/chat function:
 * field sanitising and validation (reusing the booking form's rules), and the WhatsApp message.
 * Imported by Node ESM on the server, so relative imports carry ".js" specifiers.
 */
import { treatmentOptions, type TreatmentValue } from "../../content/clinic.js";
import { initialValues, parseISODate, validateField } from "../../components/appointment/validation.js";
import { formatBookingDate } from "../bookingMessage.js";
import { whatsappUrl } from "../whatsapp.js";
import {
  REQUIRED_APPOINTMENT_FIELDS,
  type AppointmentDraft,
  type AppointmentField,
  type Locale,
  type PatientType,
  type RequiredAppointmentField,
} from "./protocol.js";

const MAX_LENGTH: Record<"name" | "contact" | "preferredTime" | "notes", number> = {
  name: 80,
  contact: 120,
  preferredTime: 60,
  notes: 300,
};

const treatmentValues = new Set<string>(treatmentOptions.map((option) => option.value));
const patientTypes = new Set<string>(["new", "existing"] satisfies PatientType[]);

const codePoint = (code: number) => String.fromCharCode(code);
// C0/C1 control characters, zero-width and bidi-override marks, and line/paragraph separators.
const UNSAFE_CHARACTERS = new RegExp(
  `[${codePoint(0x00)}-${codePoint(0x1f)}${codePoint(0x7f)}-${codePoint(0x9f)}${codePoint(0x200b)}-${codePoint(0x200f)}${codePoint(0x2028)}-${codePoint(0x202e)}${codePoint(0x2066)}-${codePoint(0x2069)}]`,
  "g",
);

/** Single-line plain text: strips control/bidi characters and angle brackets, collapses whitespace, caps length. */
export function cleanText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value
    .normalize("NFC")
    .replace(UNSAFE_CHARACTERS, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned ? cleaned.slice(0, maxLength).trim() : undefined;
}

export type AppointmentUpdateResult = {
  draft: AppointmentDraft;
  accepted: AppointmentField[];
  /** Field -> reason it was not saved. The previous value (if any) is kept. */
  rejected: Partial<Record<AppointmentField, string>>;
  warnings: string[];
};

/**
 * Merges `patch` into `current`, keeping only values that pass validation.
 * `today` is the clinic's current date (Europe/Lisbon), used for the booking window.
 */
export function applyAppointmentUpdate(
  current: AppointmentDraft,
  patch: Record<string, unknown>,
  today: Date,
): AppointmentUpdateResult {
  const draft: AppointmentDraft = { ...current };
  const accepted: AppointmentField[] = [];
  const rejected: AppointmentUpdateResult["rejected"] = {};
  const warnings: string[] = [];

  if (patch.name !== undefined) {
    const name = cleanText(patch.name, MAX_LENGTH.name);
    const error = !name
      ? "Please provide a name."
      : !/\p{L}/u.test(name) || /https?:|www\.|@/i.test(name)
        ? "That doesn't look like a name."
        : validateField("fullName", { ...initialValues, fullName: name });
    if (error) rejected.name = error;
    else {
      draft.name = name;
      accepted.push("name");
    }
  }

  if (patch.contact !== undefined) {
    const contact = cleanText(patch.contact, MAX_LENGTH.contact);
    let error: string | undefined;
    if (!contact) error = "Please provide a phone number or email address.";
    else if (contact.includes("@")) error = validateField("email", { ...initialValues, email: contact });
    else error = validateField("phone", { ...initialValues, phone: contact });
    if (error || !contact) rejected.contact = error ?? "Invalid contact.";
    else {
      draft.contact = contact;
      accepted.push("contact");
    }
  }

  if (patch.service !== undefined) {
    if (typeof patch.service === "string" && treatmentValues.has(patch.service)) {
      draft.service = patch.service as TreatmentValue;
      accepted.push("service");
    } else {
      rejected.service = `Service must be one of: ${[...treatmentValues].join(", ")}.`;
    }
  }

  if (patch.preferredDate !== undefined) {
    const date = typeof patch.preferredDate === "string" ? patch.preferredDate.trim() : "";
    const error = validateField("date", { ...initialValues, date }, today);
    if (error) rejected.preferredDate = error;
    else {
      draft.preferredDate = date;
      accepted.push("preferredDate");
    }
  }

  if (patch.preferredTime !== undefined) {
    const time = cleanText(patch.preferredTime, MAX_LENGTH.preferredTime);
    if (!time) rejected.preferredTime = "Please provide a preferred time or time range.";
    else {
      draft.preferredTime = time;
      accepted.push("preferredTime");
    }
  }

  if (patch.notes !== undefined) {
    const notes = cleanText(patch.notes, MAX_LENGTH.notes);
    if (notes) {
      draft.notes = notes;
      accepted.push("notes");
    } else {
      delete draft.notes;
    }
  }

  if (patch.patientType !== undefined) {
    if (typeof patch.patientType === "string" && patientTypes.has(patch.patientType)) {
      draft.patientType = patch.patientType as PatientType;
      accepted.push("patientType");
    } else {
      rejected.patientType = 'Patient type must be "new" or "existing".';
    }
  }

  const hoursWarning = openingHoursWarning(draft.preferredDate, draft.preferredTime);
  if (hoursWarning) warnings.push(hoursWarning);

  return { draft, accepted, rejected, warnings };
}

/** Rebuilds a draft received from the browser, dropping anything that no longer validates. */
export function sanitizeDraft(input: unknown, today: Date): AppointmentDraft {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const fields: AppointmentField[] = ["name", "contact", "service", "preferredDate", "preferredTime", "notes", "patientType"];
  const patch = Object.fromEntries(
    fields.filter((field) => field in input).map((field) => [field, (input as Record<string, unknown>)[field]]),
  );
  return applyAppointmentUpdate({}, patch, today).draft;
}

export function missingAppointmentFields(draft: AppointmentDraft): RequiredAppointmentField[] {
  return REQUIRED_APPOINTMENT_FIELDS.filter((field) => !draft[field]);
}

export function isAppointmentComplete(draft: AppointmentDraft) {
  return missingAppointmentFields(draft).length === 0;
}

// Saturday closes at 1 pm, weekdays at 6 pm. Loose matching: this only adds a hint for the assistant.
const AFTER_SATURDAY_CLOSE = /\b(afternoon|evening|night|tarde|noite)\b|\b(1[3-9]|2[0-3])\s*[:h.]|\b([1-9]|1[01])\s*pm\b/i;
const AFTER_WEEKDAY_CLOSE = /\b(evening|night|noite)\b|\b(1[89]|2[0-3])\s*[:h.]|\b([6-9]|1[01])\s*pm\b/i;

function openingHoursWarning(isoDate: string | undefined, time: string | undefined) {
  if (!isoDate || !time) return undefined;
  const date = parseISODate(isoDate);
  if (!date) return undefined;
  if (date.getDay() === 6 && AFTER_SATURDAY_CLOSE.test(time)) {
    return "The clinic is open 9:00 AM – 1:00 PM on Saturdays, so this time may not be available. Suggest a morning slot or a weekday.";
  }
  if (date.getDay() !== 6 && AFTER_WEEKDAY_CLOSE.test(time)) {
    return "The clinic closes at 6:00 PM on weekdays, so this time may not be available. Suggest an earlier time.";
  }
  return undefined;
}

// ---------- Labels and the WhatsApp message ----------

const treatmentLabelsPt: Record<TreatmentValue, string> = {
  checkup: "Check-up e higienização",
  general: "Medicina dentária geral",
  cosmetic: "Dentisteria estética",
  whitening: "Branqueamento dentário",
  implants: "Implantes dentários",
  invisalign: "Alinhadores invisíveis Invisalign®",
  emergency: "Urgência dentária",
  unsure: "Ainda não sei, gostaria de aconselhamento",
};

export function treatmentLabel(value: TreatmentValue, locale: Locale = "en") {
  if (locale === "pt") return treatmentLabelsPt[value];
  return treatmentOptions.find((option) => option.value === value)?.label ?? value;
}

export const dateLocale: Record<Locale, string> = { en: "en-GB", pt: "pt-PT" };

const messageCopy = {
  en: {
    intro: "Hello BrightSmile, I would like to request an appointment.",
    name: "Name",
    service: "Service",
    date: "Preferred date",
    time: "Preferred time",
    contact: "Contact",
    patient: "Patient",
    patientType: { new: "New patient", existing: "Existing patient" },
    notes: "Notes",
    outro: "Request submitted through BrightSmile AI Assistant.",
  },
  pt: {
    intro: "Olá BrightSmile, gostaria de pedir uma consulta.",
    name: "Nome",
    service: "Serviço",
    date: "Data preferida",
    time: "Hora preferida",
    contact: "Contacto",
    patient: "Paciente",
    patientType: { new: "Novo paciente", existing: "Paciente existente" },
    notes: "Notas",
    outro: "Pedido enviado através do Assistente IA BrightSmile.",
  },
} as const;

export function formatAppointmentDate(isoDate: string, locale: Locale = "en") {
  return formatBookingDate(isoDate, dateLocale[locale]);
}

/** The request reception receives on WhatsApp. Empty optional fields are left out. */
export function composeAppointmentRequestMessage(draft: AppointmentDraft, locale: Locale = "en") {
  const copy = messageCopy[locale];
  const lines: [string, string | undefined][] = [
    [copy.name, draft.name],
    [copy.service, draft.service && treatmentLabel(draft.service, locale)],
    [copy.date, draft.preferredDate && formatAppointmentDate(draft.preferredDate, locale)],
    [copy.time, draft.preferredTime],
    [copy.contact, draft.contact],
    [copy.patient, draft.patientType && copy.patientType[draft.patientType]],
    [copy.notes, draft.notes],
  ];
  return [
    copy.intro,
    ...lines.filter(([, value]) => value?.trim()).map(([label, value]) => `${label}: ${value!.trim()}`),
    copy.outro,
  ].join("\n");
}

/** WhatsApp click-to-chat link for a complete request. Throws if required details are missing. */
export function appointmentRequestUrl(draft: AppointmentDraft, locale: Locale = "en") {
  const missing = missingAppointmentFields(draft);
  if (missing.length > 0) throw new Error(`Appointment request is missing: ${missing.join(", ")}`);
  const message = composeAppointmentRequestMessage(draft, locale);
  return { message, url: whatsappUrl(message) };
}
