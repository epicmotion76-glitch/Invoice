import { ArrowRight } from "lucide-react";
import { services } from "../../content/site";
import { useAppointment } from "../appointment/AppointmentContext";
import { ServiceIcon } from "../icons/ServiceIcon";
import { Reveal } from "../ui/Reveal";
import "./Services.css";

export function Services() {
  const { requestTreatment } = useAppointment();

  return (
    <section id="services" className="services section" aria-labelledby="services-title">
      <div className="container">
        <Reveal className="section-head section-head--center">
          <p className="eyebrow">Our services</p>
          <h2 id="services-title" className="section-title">
            Dental care designed around you.
          </h2>
          <p className="section-lede">
            From your six-monthly checkup to a full smile transformation, every treatment is planned around your comfort,
            goals and budget.
          </p>
        </Reveal>

        <ul className="services__grid">
          {services.map((service, index) => (
            <Reveal as="li" key={service.title} delay={(index % 3) * 0.08}>
              <article className="service-card">
                <span className="service-card__icon icon-circle">
                  <ServiceIcon name={service.icon} />
                </span>
                <h3 className="service-card__title">{service.title}</h3>
                <p className="service-card__text">{service.text}</p>
                <a
                  className="service-card__link"
                  href="#contact"
                  onClick={() => requestTreatment(service.treatment)}
                >
                  Ask about this treatment
                  <span className="sr-only">: {service.title}</span>
                  <ArrowRight aria-hidden="true" />
                </a>
              </article>
            </Reveal>
          ))}
        </ul>

        <Reveal className="services__footer">
          <a className="btn btn--secondary btn--lg" href="#contact">
            Find the right treatment for you
            <ArrowRight className="btn__arrow" aria-hidden="true" />
          </a>
          <p className="services__note">Not sure what you need? We'll talk you through the options at your first visit.</p>
        </Reveal>
      </div>
    </section>
  );
}
