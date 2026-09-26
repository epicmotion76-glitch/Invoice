// Also imported by the AI receptionist's serverless function (Node ESM), hence the ".js" specifier.
import { parseISODate } from "../components/appointment/validation.js";

const dateFormats = new Map<string, Intl.DateTimeFormat>();

/** "Tuesday, 15 September 2026" (or "terça-feira, 15 de setembro de 2026" for `pt-PT`). */
export function formatBookingDate(iso: string, locale = "en-GB") {
  const date = parseISODate(iso);
  if (!date) return iso;
  let format = dateFormats.get(locale);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    dateFormats.set(locale, format);
  }
  return format.format(date);
}

type BookingDetails = {
  name: string;
  phone: string;
  date: string;
  /** Optional extra lines, e.g. [["Email", "ana@example.com"]]. Empty values are skipped. */
  extra?: [label: string, value: string][];
};

/**
 * The WhatsApp message the clinic receives, one "Label = value" line per detail:
 *
 *   Name = Ana Ferreira
 *   Phone = +351 912 345 678
 *   Date = Tuesday, 15 September 2026
 */
export function composeBookingMessage({ name, phone, date, extra = [] }: BookingDetails) {
  const lines: [string, string][] = [["Name", name], ["Phone", phone], ["Date", formatBookingDate(date)], ...extra];
  return lines
    .filter(([, value]) => value.trim() !== "")
    .map(([label, value]) => `${label} = ${value.trim()}`)
    .join("\n");
}
