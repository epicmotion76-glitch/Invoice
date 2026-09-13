import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { clinic } from "../../content/site";
import { BookVisitLink } from "../ui/BookVisitLink";
import "./MobileCtaBar.css";

/**
 * Keeps the appointment CTA within thumb reach on small screens once the hero
 * buttons have scrolled away, and steps aside while the form itself is on screen.
 */
export function MobileCtaBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const heroActions = document.getElementById("hero-actions");
    const contact = document.getElementById("contact");
    if (!heroActions || !contact || !("IntersectionObserver" in window)) return;

    let pastHero = false;
    let contactInView = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === heroActions) {
          pastHero = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        } else {
          contactInView = entry.isIntersecting;
        }
      }
      setVisible(pastHero && !contactInView);
    });
    observer.observe(heroActions);
    observer.observe(contact);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`mobile-cta${visible ? " is-visible" : ""}`} inert={!visible}>
      <a className="btn btn--secondary mobile-cta__call" href={clinic.phone.href}>
        <Phone aria-hidden="true" />
        Call
      </a>
      <BookVisitLink className="btn btn--primary" />
    </div>
  );
}
