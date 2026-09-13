import { Clock, Mail, MapPin, Phone, Siren } from "lucide-react";
import { clinic } from "../../content/site";
import { bookingUrl } from "../../lib/whatsapp";
import { HoursList } from "../ui/HoursList";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { AppointmentForm } from "./AppointmentForm";
import "./Appointment.css";

export function Appointment() {
  return (
    <section id="contact" className="appointment section" aria-labelledby="appointment-title">
      <div className="container">
        <div className="appointment__card">
          <div className="appointment__main">
            <p className="eyebrow">Request an appointment</p>
            <h2 id="appointment-title" className="section-title">
              Ready to love your smile?
            </h2>
            <p className="section-lede">Request an appointment and our friendly team will contact you shortly.</p>
            <AppointmentForm />
          </div>

          <aside className="appointment__info" aria-labelledby="contact-details-title">
            <h3 id="contact-details-title" className="appointment__info-title">
              Prefer to talk to us?
            </h3>
            <p className="appointment__info-lede">Our reception team is happy to answer questions and find a time that works.</p>

            <ul className="contact-list">
              <li>
                <span className="contact-list__icon icon-circle" aria-hidden="true">
                  <Phone />
                </span>
                <span>
                  <span className="contact-list__label">Phone</span>
                  <a className="contact-list__value" href={clinic.phone.href}>
                    {clinic.phone.display}
                  </a>
                </span>
              </li>
              <li>
                <span className="contact-list__icon icon-circle" aria-hidden="true">
                  <WhatsAppIcon />
                </span>
                <span>
                  <span className="contact-list__label">WhatsApp</span>
                  <a className="contact-list__value" href={bookingUrl} target="_blank" rel="noopener noreferrer">
                    Message us on WhatsApp
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </span>
              </li>
              <li>
                <span className="contact-list__icon icon-circle" aria-hidden="true">
                  <Mail />
                </span>
                <span>
                  <span className="contact-list__label">Email</span>
                  <a className="contact-list__value" href={`mailto:${clinic.email}`}>
                    {clinic.email}
                  </a>
                </span>
              </li>
              <li>
                <span className="contact-list__icon icon-circle" aria-hidden="true">
                  <MapPin />
                </span>
                <span>
                  <span className="contact-list__label">Address</span>
                  <a
                    className="contact-list__value"
                    href={clinic.address.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {clinic.address.line1}, {clinic.address.line2}
                    <span className="sr-only"> (opens map in a new tab)</span>
                  </a>
                </span>
              </li>
            </ul>

            <div className="appointment__hours">
              <p className="contact-list__label appointment__hours-title">
                <Clock aria-hidden="true" />
                Opening hours
              </p>
              <HoursList />
            </div>

            <div className="emergency-note">
              <Siren aria-hidden="true" />
              <div>
                <p className="emergency-note__title">Dental emergency?</p>
                <p>
                  Call{" "}
                  <a href={clinic.phone.href} className="emergency-note__link">
                    {clinic.phone.display}
                  </a>
                  . We keep same-day slots for severe pain, swelling or a broken tooth. For facial swelling that affects
                  breathing or swallowing, call 112.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
