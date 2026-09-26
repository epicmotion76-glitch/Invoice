import { describe, expect, it } from "vitest";
import {
  appointmentRequestUrl,
  applyAppointmentUpdate,
  cleanText,
  composeAppointmentRequestMessage,
  formatAppointmentDate,
  isAppointmentComplete,
  missingAppointmentFields,
  sanitizeDraft,
} from "../../src/lib/receptionist/appointment";
import type { AppointmentDraft } from "../../src/lib/receptionist/protocol";

// Wednesday 23 September 2026 (local midnight, as the booking validation expects).
const today = new Date(2026, 8, 23);

const complete: AppointmentDraft = {
  name: "Sarah Costa",
  contact: "+351 912 345 678",
  service: "invisalign",
  preferredDate: "2026-09-25",
  preferredTime: "afternoon",
};

describe("applyAppointmentUpdate", () => {
  it("keeps details across separate updates", () => {
    const first = applyAppointmentUpdate({}, { name: "Sarah" }, today);
    const second = applyAppointmentUpdate(first.draft, { preferredDate: "2026-09-25", preferredTime: "Friday afternoon" }, today);
    expect(second.draft).toEqual({ name: "Sarah", preferredDate: "2026-09-25", preferredTime: "Friday afternoon" });
    expect(missingAppointmentFields(second.draft)).toEqual(["contact", "service"]);
  });

  it("accepts a phone number or an email address as contact", () => {
    expect(applyAppointmentUpdate({}, { contact: "+351 912 345 678" }, today).accepted).toContain("contact");
    expect(applyAppointmentUpdate({}, { contact: "sarah@example.com" }, today).accepted).toContain("contact");
  });

  it("rejects invalid values with a reason and keeps the previous value", () => {
    const result = applyAppointmentUpdate(
      { contact: "+351 912 345 678" },
      { contact: "12", service: "root-canal", preferredDate: "2026-09-27", name: "http://spam.example" },
      today,
    );
    expect(result.draft.contact).toBe("+351 912 345 678");
    expect(result.rejected.contact).toMatch(/valid phone/);
    expect(result.rejected.service).toBeDefined();
    expect(result.rejected.preferredDate).toMatch(/closed on Sundays/);
    expect(result.rejected.name).toBeDefined();
  });

  it("rejects past dates and dates beyond the booking window", () => {
    expect(applyAppointmentUpdate({}, { preferredDate: "2026-09-01" }, today).rejected.preferredDate).toMatch(/future/);
    expect(applyAppointmentUpdate({}, { preferredDate: "2027-06-01" }, today).rejected.preferredDate).toMatch(/6 months/);
    expect(applyAppointmentUpdate({}, { preferredDate: "next friday" }, today).rejected.preferredDate).toBeDefined();
  });

  it("warns when the preferred time is outside opening hours", () => {
    const saturday = applyAppointmentUpdate({}, { preferredDate: "2026-09-26", preferredTime: "afternoon" }, today);
    expect(saturday.warnings[0]).toMatch(/Saturdays/);
    const weekday = applyAppointmentUpdate({}, { preferredDate: "2026-09-25", preferredTime: "7pm" }, today);
    expect(weekday.warnings[0]).toMatch(/6:00 PM/);
    expect(applyAppointmentUpdate({}, { preferredDate: "2026-09-26", preferredTime: "10am" }, today).warnings).toEqual([]);
  });

  it("sanitises free text", () => {
    expect(cleanText("  <b>Sarah</b>\n\tCosta  ", 80)).toBe("bSarah/b Costa");
    expect(cleanText("x".repeat(500), 300)).toHaveLength(300);
    expect(cleanText(42, 10)).toBeUndefined();
  });

  it("drops invalid fields from a draft sent by the browser", () => {
    const draft = sanitizeDraft({ ...complete, preferredDate: "2020-01-01", extra: "ignored", service: "bogus" }, today);
    expect(draft).toEqual({ name: "Sarah Costa", contact: "+351 912 345 678", preferredTime: "afternoon" });
    expect(sanitizeDraft("nonsense", today)).toEqual({});
  });
});

describe("WhatsApp request", () => {
  it("reports completeness", () => {
    expect(isAppointmentComplete(complete)).toBe(true);
    expect(isAppointmentComplete({ ...complete, preferredTime: undefined })).toBe(false);
  });

  it("composes the English message reception receives", () => {
    const message = composeAppointmentRequestMessage({ ...complete, notes: "Nervous patient", patientType: "new" }, "en");
    expect(message).toBe(
      [
        "Hello BrightSmile, I would like to request an appointment.",
        "Name: Sarah Costa",
        "Service: Invisalign® clear aligners",
        `Preferred date: ${formatAppointmentDate("2026-09-25")}`,
        "Preferred time: afternoon",
        "Contact: +351 912 345 678",
        "Patient: New patient",
        "Notes: Nervous patient",
        "Request submitted through BrightSmile AI Assistant.",
      ].join("\n"),
    );
  });

  it("composes a Portuguese message and leaves out empty optional fields", () => {
    const message = composeAppointmentRequestMessage(complete, "pt");
    expect(message).toContain("Olá BrightSmile, gostaria de pedir uma consulta.");
    expect(message).toContain("Serviço: Alinhadores invisíveis Invisalign®");
    expect(message).toMatch(/Data preferida: sexta-feira,? 25 de setembro de 2026/);
    expect(message).not.toContain("Notas");
  });

  it("builds a correctly encoded wa.me link to the clinic", () => {
    const { url, message } = appointmentRequestUrl({ ...complete, notes: "Can I pay 50% & book? #1" }, "en");
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://wa.me/351920008205");
    expect(parsed.searchParams.get("text")).toBe(message);
    // Spaces, newlines, "&" and "#" must be percent-encoded so they can't break the query string.
    expect(url.split("?text=")[1]).not.toMatch(/[ \n&#]/);
    expect(url).toContain("%26");
  });

  it("refuses to build a link for an incomplete request", () => {
    expect(() => appointmentRequestUrl({ name: "Sarah" })).toThrow(/missing/);
  });
});
