import { CalendarCheck, Check, PencilLine } from "lucide-react";
import {
  appointmentRequestUrl,
  formatAppointmentDate,
  treatmentLabel,
} from "../../lib/receptionist/appointment";
import type { AppointmentDraft, Locale } from "../../lib/receptionist/protocol";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { trackReceptionistEvent } from "./analytics";
import { uiStrings } from "./i18n";

type AppointmentSummaryProps = {
  appointment: AppointmentDraft;
  locale: Locale;
  /** "confirm": awaiting the visitor's confirmation. "ready": confirmed in chat; the server prepared the link. */
  variant: "confirm" | "ready";
  readyUrl?: string;
  sent: boolean;
  disabled: boolean;
  onSent: () => void;
  onEdit: () => void;
};

/** Appointment request summary with the WhatsApp hand-off to reception. */
export function AppointmentSummary({ appointment, locale, variant, readyUrl, sent, disabled, onSent, onEdit }: AppointmentSummaryProps) {
  const t = uiStrings[locale].summary;

  let url = readyUrl;
  if (!url) {
    try {
      url = appointmentRequestUrl(appointment, locale).url;
    } catch {
      url = undefined;
    }
  }

  const rows: [string, string | undefined][] = [
    [t.name, appointment.name],
    [t.contact, appointment.contact],
    [t.service, appointment.service && treatmentLabel(appointment.service, locale)],
    [t.date, appointment.preferredDate && formatAppointmentDate(appointment.preferredDate, locale)],
    [t.time, appointment.preferredTime],
    [t.patient, appointment.patientType && t.patientType[appointment.patientType]],
    [t.notes, appointment.notes],
  ];

  const title = sent ? t.sentTitle : variant === "ready" ? t.readyTitle : t.title;

  return (
    <section className={`ai-card ai-summary${sent ? " is-sent" : ""}`} aria-label={t.title}>
      <p className="ai-card__title">
        {sent ? <Check aria-hidden="true" /> : <CalendarCheck aria-hidden="true" />}
        {title}
      </p>
      <dl className="ai-summary__list">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="ai-summary__row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
      {url ? (
        <div className="ai-card__actions">
          <a
            className="btn btn--primary btn--sm ai-card__primary"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackReceptionistEvent("ai_whatsapp_clicked", { source: "appointment" });
              onSent();
            }}
          >
            <WhatsAppIcon className="wa-icon" />
            {sent ? t.sendAgain : variant === "ready" ? t.send : t.confirm}
            <span className="sr-only"> {uiStrings[locale].opensNewTab}</span>
          </a>
          {!sent && (
            <button type="button" className="btn btn--secondary btn--sm" onClick={onEdit} disabled={disabled}>
              <PencilLine aria-hidden="true" />
              {t.edit}
            </button>
          )}
        </div>
      ) : (
        <p className="ai-card__note" role="alert">
          {uiStrings[locale].whatsappError}
        </p>
      )}
      <p className="ai-card__note">{t.note}</p>
    </section>
  );
}
