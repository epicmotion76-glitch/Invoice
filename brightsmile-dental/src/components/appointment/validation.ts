import type { TreatmentValue } from "../../content/site";

export type AppointmentFormValues = {
  fullName: string;
  phone: string;
  email: string;
  date: string;
  treatment: TreatmentValue | "";
  message: string;
  consent: boolean;
};

export type FieldName = keyof AppointmentFormValues;
export type FormErrors = Partial<Record<FieldName, string>>;

// Matches the on-page order, so the first invalid field gets focus.
export const fieldOrder: FieldName[] = ["fullName", "phone", "email", "treatment", "date", "message", "consent"];

export const initialValues: AppointmentFormValues = {
  fullName: "",
  phone: "",
  email: "",
  date: "",
  treatment: "",
  message: "",
  consent: false,
};

export const MESSAGE_MAX_LENGTH = 800;
const BOOKING_WINDOW_MONTHS = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[\d\s().-]+$/;

export function toISODate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getDate() === Number(match[3]) ? date : null;
}

/** The clinic is closed on Sundays. */
export const isClosedDay = (date: Date) => date.getDay() === 0;

export function bookingWindow(today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setMonth(end.getMonth() + BOOKING_WINDOW_MONTHS);
  return { start, end };
}

export function validateField(name: FieldName, values: AppointmentFormValues, today = new Date()): string | undefined {
  switch (name) {
    case "fullName": {
      const value = values.fullName.trim();
      if (!value) return "Please enter your full name.";
      if (value.length < 2) return "Your name should be at least 2 characters.";
      return undefined;
    }
    case "phone": {
      const value = values.phone.trim();
      if (!value) return "Please enter a phone number so we can reach you.";
      const digits = value.replace(/\D/g, "").length;
      if (!PHONE_PATTERN.test(value) || digits < 9 || digits > 15) {
        return "Please enter a valid phone number, e.g. +351 912 345 678.";
      }
      return undefined;
    }
    case "email": {
      const value = values.email.trim();
      if (!value) return "Please enter your email address.";
      if (!EMAIL_PATTERN.test(value)) return "Please enter a valid email address, e.g. name@example.com.";
      return undefined;
    }
    case "date": {
      if (!values.date) return "Please choose a preferred date.";
      const date = parseISODate(values.date);
      if (!date) return "Please enter a valid date.";
      const { start, end } = bookingWindow(today);
      if (date < start) return "Please choose today or a future date.";
      if (date > end) return "Please choose a date within the next 6 months.";
      if (isClosedDay(date)) return "We're closed on Sundays. Please choose Monday to Saturday.";
      return undefined;
    }
    case "treatment":
      return values.treatment ? undefined : "Please choose a treatment, or select “Not sure yet”.";
    case "message":
      return values.message.length > MESSAGE_MAX_LENGTH
        ? `Please keep your message under ${MESSAGE_MAX_LENGTH} characters.`
        : undefined;
    case "consent":
      return values.consent ? undefined : "Please confirm we can contact you about this request.";
  }
}

export function validateAll(values: AppointmentFormValues, today = new Date()): FormErrors {
  const errors: FormErrors = {};
  for (const name of fieldOrder) {
    const error = validateField(name, values, today);
    if (error) errors[name] = error;
  }
  return errors;
}
