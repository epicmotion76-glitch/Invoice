import { clinic } from "../../src/content/clinic.js";
import { parseISODate } from "../../src/components/appointment/validation.js";

const { timeZone } = clinic.openingTimes;

const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
const timeParts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const longDate = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** Today's date at the clinic as YYYY-MM-DD. */
export function clinicISODate(now: Date) {
  return dateParts.format(now);
}

/** Today's date at the clinic as a local midnight Date, the form the booking validation expects. */
export function clinicToday(now: Date) {
  return parseISODate(clinicISODate(now))!;
}

export function isClinicOpen(now: Date) {
  const day = clinicToday(now).getDay();
  const hours = clinic.openingTimes.days[day];
  if (!hours) return false;
  const [hour, minute] = timeParts.format(now).split(":").map(Number);
  const minutes = hour * 60 + minute;
  return minutes >= hours.opens && minutes < hours.closes;
}

/** e.g. "Saturday, 26 September 2026, 14:05 (Europe/Lisbon)" */
export function describeClinicNow(now: Date) {
  return `${longDate.format(now)}, ${timeParts.format(now)} (${timeZone})`;
}
