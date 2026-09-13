import type { MouseEvent, ReactNode } from "react";
import { bookingUrl } from "../../lib/whatsapp";
import { useAppointment } from "../appointment/AppointmentContext";
import { WhatsAppIcon } from "./WhatsAppIcon";

type BookVisitLinkProps = {
  className: string;
  children?: ReactNode;
  onClick?: () => void;
};

/**
 * "Book Your Visit" call to action. Opens the booking dialog (name, phone, calendar).
 * Before the page's JavaScript loads, or on ctrl/cmd-click, it falls back to a plain WhatsApp chat link.
 */
export function BookVisitLink({ className, children = "Book Your Visit", onClick }: BookVisitLinkProps) {
  const { openBooking } = useAppointment();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.();
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openBooking();
  };

  return (
    <a
      className={className}
      href={bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-haspopup="dialog"
      onClick={handleClick}
    >
      <WhatsAppIcon className="wa-icon" />
      {children}
    </a>
  );
}
