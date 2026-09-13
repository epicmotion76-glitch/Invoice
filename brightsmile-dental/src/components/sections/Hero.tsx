import { CalendarCheck, HeartHandshake, Smile, Star } from "lucide-react";
import { images } from "../../content/images";
import { clinic } from "../../content/site";
import { BookVisitLink } from "../ui/BookVisitLink";
import { SmartImage } from "../ui/SmartImage";
import { Stars } from "../ui/Stars";
import "./Hero.css";

const trustIndicators = [
  { icon: Star, label: `${clinic.rating.score}/5 patient rating` },
  { icon: CalendarCheck, label: "Same-week appointments" },
  { icon: Smile, label: "Gentle, modern care" },
];

export function Hero() {
  return (
    <section id="home" className="hero" aria-labelledby="hero-title">
      <div className="hero__backdrop" aria-hidden="true" />

      <div className="container hero__grid">
        <div className="hero__content">
          <p className="hero__badge hero-enter">
            <span className="hero__badge-dot" aria-hidden="true" />
            Modern dental care in {clinic.city}
          </p>

          <h1 id="hero-title" className="hero__title hero-enter" style={{ animationDelay: "60ms" }}>
            A healthier, <span className="hero__highlight">brighter smile</span> starts here.
          </h1>

          <p className="hero__lede hero-enter" style={{ animationDelay: "140ms" }}>
            Comfort-first, modern dental care for every stage of your smile—from routine checkups to complete smile
            transformations.
          </p>

          <div id="hero-actions" className="hero__actions hero-enter" style={{ animationDelay: "220ms" }}>
            <BookVisitLink className="btn btn--primary btn--lg" />
            <a className="btn btn--secondary btn--lg" href="#services">
              Explore Our Services
            </a>
          </div>

          <ul className="hero__trust hero-enter" style={{ animationDelay: "300ms" }}>
            {trustIndicators.map(({ icon: Icon, label }) => (
              <li key={label}>
                <span className="hero__trust-icon" aria-hidden="true">
                  <Icon />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero__media hero-enter" style={{ animationDelay: "120ms" }}>
          <div className="hero__frame">
            <SmartImage image={images.hero} sizes="(min-width: 960px) 46vw, 92vw" priority />
          </div>

          <div className="hero__card hero__card--rating">
            <span className="hero__card-score">{clinic.rating.score}</span>
            <span className="hero__card-body">
              <Stars label={`Rated ${clinic.rating.score} out of 5`} />
              <span className="hero__card-text">From {clinic.rating.reviewCount} happy patients</span>
            </span>
          </div>

          <div className="hero__card hero__card--care" aria-hidden="true">
            <span className="hero__card-icon">
              <HeartHandshake />
            </span>
            Anxiety-aware care
          </div>
        </div>
      </div>
    </section>
  );
}
