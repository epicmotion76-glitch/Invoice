import { Clock, Mail, Phone, Siren } from "lucide-react";
import { clinic } from "../../content/site";
import type { Locale } from "../../lib/receptionist/protocol";
import { bookingUrl } from "../../lib/whatsapp";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { trackReceptionistEvent } from "./analytics";
import { uiStrings } from "./i18n";

/** Reception contact options: phone, WhatsApp (the site's existing chat link), email and hours. */
export function ContactCard({ locale }: { locale: Locale }) {
  const t = uiStrings[locale];
  const translate = (value: string) => t.hoursDays[value] ?? value;

  return (
    <section className="ai-card ai-contact" aria-label={t.contact.title}>
      <p className="ai-card__title">{t.contact.title}</p>
      <div className="ai-contact__actions">
        <a className="ai-contact__link" href={clinic.phone.href}>
          <Phone aria-hidden="true" />
          <span>
            <span className="ai-contact__label">{t.contact.call}</span>
            {clinic.phone.display}
          </span>
        </a>
        <a
          className="ai-contact__link"
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackReceptionistEvent("ai_whatsapp_clicked", { source: "reception" })}
        >
          <WhatsAppIcon className="ai-contact__wa" />
          <span>
            <span className="ai-contact__label">{t.contact.whatsapp}</span>
            {clinic.phone.display}
            <span className="sr-only"> {t.opensNewTab}</span>
          </span>
        </a>
        <a className="ai-contact__link" href={`mailto:${clinic.email}`}>
          <Mail aria-hidden="true" />
          <span>
            <span className="ai-contact__label">{t.contact.email}</span>
            <span className="ai-contact__email">{clinic.email}</span>
          </span>
        </a>
      </div>
      <div className="ai-contact__hours">
        <p className="ai-contact__label">
          <Clock aria-hidden="true" />
          {t.contact.hours}
        </p>
        <dl>
          {clinic.hours.map((row) => (
            <div key={row.days}>
              <dt>{translate(row.days)}</dt>
              <dd>{translate(row.time)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Shown with the fixed emergency guidance: emergency services first, clinic second. */
export function EmergencyCard({ locale }: { locale: Locale }) {
  const t = uiStrings[locale].emergency;
  return (
    <section className="ai-card ai-emergency" aria-label={t.title}>
      <p className="ai-card__title">
        <Siren aria-hidden="true" />
        {t.title}
      </p>
      <div className="ai-card__actions">
        <a className="btn btn--sm ai-emergency__call" href={`tel:${clinic.emergencyNumber}`}>
          <Phone aria-hidden="true" />
          {t.call112}
        </a>
        <a className="btn btn--secondary btn--sm" href={clinic.phone.href}>
          {t.callClinic}
        </a>
      </div>
    </section>
  );
}
