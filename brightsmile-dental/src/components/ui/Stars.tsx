import "./ui.css";

type StarsProps = { rating?: number; label?: string; className?: string };

export function Stars({ rating = 5, label, className = "" }: StarsProps) {
  return (
    <span className={`stars ${className}`} role="img" aria-label={label ?? `Rated ${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <svg key={index} viewBox="0 0 20 20" aria-hidden="true" className={index < rating ? "is-filled" : ""}>
          <path d="M10 1.8l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.4l-4.94 2.6.94-5.5-4-3.9 5.53-.8z" />
        </svg>
      ))}
    </span>
  );
}
