import { clinic, testimonials } from "../../content/site";
import { Reveal } from "../ui/Reveal";
import { Stars } from "../ui/Stars";
import "./Testimonials.css";

export function Testimonials() {
  return (
    <section id="reviews" className="reviews section" aria-labelledby="reviews-title">
      <div className="container">
        <Reveal className="section-head section-head--center">
          <p className="eyebrow">Patient reviews</p>
          <h2 id="reviews-title" className="section-title">
            Loved by patients across {clinic.city}.
          </h2>
        </Reveal>

        <div className="reviews__grid">
          <Reveal className="review-summary">
            <div>
              <p className="review-summary__score" aria-hidden="true">
                {clinic.rating.score}
              </p>
              <Stars className="review-summary__stars" label={`Rated ${clinic.rating.score} out of 5`} />
            </div>
            <p className="review-summary__text">
              {clinic.rating.score} out of 5 from {clinic.rating.reviewCount} happy patients
            </p>
          </Reveal>

          <ul className="reviews__list">
            {testimonials.map((review, index) => (
              <Reveal as="li" key={review.name} delay={0.08 + index * 0.08}>
                <figure className="review-card">
                  <Stars />
                  <blockquote className="review-card__quote">
                    <p>“{review.quote}”</p>
                  </blockquote>
                  <figcaption className="review-card__author">
                    <span className={`review-card__avatar review-card__avatar--${index}`} aria-hidden="true">
                      {review.initials}
                    </span>
                    <span>
                      <span className="review-card__name">{review.name}</span>
                      <span className="review-card__treatment">{review.treatment}</span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
