import { clinic } from "../../content/site";
import "./ui.css";

export function HoursList({ className = "" }: { className?: string }) {
  return (
    <dl className={`hours ${className}`}>
      {clinic.hours.map((row) => (
        <div className="hours__row" key={row.days}>
          <dt>{row.days}</dt>
          <dd>{row.time}</dd>
        </div>
      ))}
    </dl>
  );
}
