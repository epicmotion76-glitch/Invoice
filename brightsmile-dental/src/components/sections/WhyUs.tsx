import { Sparkles } from "lucide-react";
import { images } from "../../content/images";
import { reasons, stats } from "../../content/site";
import { Reveal } from "../ui/Reveal";
import { SmartImage } from "../ui/SmartImage";
import "./WhyUs.css";

export function WhyUs() {
  return (
    <section id="why-us" className="why section" aria-labelledby="why-title">
      <div className="container why__grid">
        <Reveal className="why__media">
          <div className="why__photo">
            <SmartImage image={images.clinicRoom} sizes="(min-width: 960px) 40vw, 90vw" />
            <p className="why__photo-tag">
              <Sparkles aria-hidden="true" />
              Calm, spotless treatment rooms
            </p>
          </div>
          <div className="why__inset">
            <SmartImage image={images.digitalScan} sizes="(min-width: 960px) 22vw, 50vw" />
          </div>
        </Reveal>

        <div className="why__content">
          <Reveal>
            <p className="eyebrow">Why BrightSmile</p>
            <h2 id="why-title" className="section-title">
              Gentle expertise, with time for you.
            </h2>
            <p className="section-lede">
              We built BrightSmile for people who want excellent dentistry without feeling hurried, judged or surprised by
              the bill.
            </p>
          </Reveal>

          <ul className="why__reasons">
            {reasons.map(({ icon: Icon, title, text }, index) => (
              <Reveal as="li" key={title} className="reason" delay={index * 0.06}>
                <span className="reason__icon icon-circle" aria-hidden="true">
                  <Icon />
                </span>
                <h3 className="reason__title">{title}</h3>
                <p className="reason__text">{text}</p>
              </Reveal>
            ))}
          </ul>

          <Reveal>
            <dl className="stats">
              {stats.map((stat) => (
                <div className="stat" key={stat.label}>
                  <dt className="stat__label">{stat.label}</dt>
                  <dd className="stat__value">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
