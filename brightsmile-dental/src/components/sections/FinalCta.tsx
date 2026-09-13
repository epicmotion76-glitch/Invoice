import { Phone } from "lucide-react";
import { clinic } from "../../content/site";
import { BookVisitLink } from "../ui/BookVisitLink";
import { Reveal } from "../ui/Reveal";
import "./FinalCta.css";

export function FinalCta() {
  return (
    <section className="final-cta" aria-labelledby="final-cta-title">
      <div className="container">
        <Reveal className="final-cta__card">
          <h2 id="final-cta-title" className="final-cta__title">
            Your best smile is closer than you think.
          </h2>
          <p className="final-cta__text">
            Book a relaxed first visit and leave with a clear, personalised plan. No pressure, no surprises.
          </p>
          <div className="final-cta__actions">
            <BookVisitLink className="btn btn--light btn--lg" />
            <a className="final-cta__phone" href={clinic.phone.href}>
              <Phone aria-hidden="true" />
              or call {clinic.phone.display}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
