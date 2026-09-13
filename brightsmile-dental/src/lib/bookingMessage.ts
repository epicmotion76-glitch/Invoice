import { parseISODate } from "../components/appointment/validation";

const dateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function formatBookingDate(iso: string) {
  const date = parseISODate(iso);
  return date ? dateFormat.format(date) : iso;
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
