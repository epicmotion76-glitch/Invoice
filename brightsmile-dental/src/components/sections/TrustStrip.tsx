import { benefits } from "../../content/site";
import { Reveal } from "../ui/Reveal";
import "./TrustStrip.css";

export function TrustStrip() {
  return (
    <section className="trust" aria-labelledby="trust-title">
      <h2 id="trust-title" className="sr-only">
        Why patients feel at ease with us
      </h2>
      <div className="container">
        <Reveal className="trust__card">
          <ul className="trust__list">
            {benefits.map(({ icon: Icon, title, text }) => (
              <li key={title} className="trust__item">
                <span className="trust__icon icon-circle" aria-hidden="true">
                  <Icon />
                </span>
                <div>
                  <h3 className="trust__title">{title}</h3>
                  <p className="trust__text">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
