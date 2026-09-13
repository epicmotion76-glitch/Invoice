import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { clinic, navLinks } from "../../content/site";
import { bookingUrl } from "../../lib/whatsapp";
import { HoursList } from "../ui/HoursList";
import { Logo } from "../ui/Logo";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import "./Footer.css";

const socialIcons = { instagram: Instagram, facebook: Facebook, linkedin: Linkedin };

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Logo />
            <p className="footer__tagline">{clinic.tagline}</p>
            <ul className="footer__social" aria-label="Social media">
              {clinic.social.map((profile) => {
                const Icon = socialIcons[profile.network];
                return (
                  <li key={profile.network}>
                    <a href={profile.href} aria-label={`${clinic.shortName} on ${profile.label}`}>
                      <Icon aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore" className="footer__heading">
              Explore
            </h2>
            <ul className="footer__links">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <a href={`#${link.id}`}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="footer__heading">Contact</h2>
            <address className="footer__contact">
              <a href={clinic.phone.href}>
                <Phone aria-hidden="true" />
                {clinic.phone.display}
              </a>
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon />
                WhatsApp us
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a href={`mailto:${clinic.email}`}>
                <Mail aria-hidden="true" />
                {clinic.email}
              </a>
              <a href={clinic.address.mapUrl} target="_blank" rel="noopener noreferrer">
                <MapPin aria-hidden="true" />
                <span>
                  {clinic.address.line1}
                  <br />
                  {clinic.address.line2}
                  <span className="sr-only"> (opens map in a new tab)</span>
                </span>
              </a>
            </address>
          </div>

          <div>
            <h2 className="footer__heading">Opening hours</h2>
            <HoursList className="footer__hours" />
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            © <span suppressHydrationWarning>{year}</span> {clinic.name}. All rights reserved.
          </p>
          <ul className="footer__legal">
            <li>
              {/* Placeholder: link to the clinic's privacy policy. */}
              <a href="#">Privacy Policy</a>
            </li>
            <li>
              <a href="#home">Back to top</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
