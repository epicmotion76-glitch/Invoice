import { useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays, X } from "lucide-react";
import { composeBookingMessage, formatBookingDate } from "../../lib/bookingMessage";
import { whatsappUrl } from "../../lib/whatsapp";
import { useAppointment } from "../appointment/AppointmentContext";
import { Field } from "../appointment/Field";
import { initialValues, validateField } from "../appointment/validation";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { Calendar } from "./Calendar";
import "./BookingDialog.css";

/** Modal opened by every "Book Your Visit" button: name, phone and a date, sent to the clinic on WhatsApp. */
export function BookingDialog() {
  const { bookingOpen, closeBooking } = useAppointment();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const root = document.documentElement;

    if (bookingOpen) {
      if (!dialog.open) dialog.showModal();
      dialog.querySelector<HTMLInputElement>("#booking-name")?.focus();
      root.classList.add("dialog-open");
    } else {
      if (dialog.open) dialog.close();
      root.classList.remove("dialog-open");
    }
  }, [bookingOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="booking-dialog"
      aria-labelledby="booking-title"
      onClose={closeBooking}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeBooking();
        }
      }}
      onClick={(event) => {
        // The inner panel fills the dialog, so only backdrop clicks land on the dialog itself.
        if (event.target === event.currentTarget) closeBooking();
      }}
    >
      {bookingOpen && <BookingForm onClose={closeBooking} />}
    </dialog>
  );
}

type BookingField = "fullName" | "phone" | "date";
type BookingValues = Record<BookingField, string>;

const bookingFields: BookingField[] = ["fullName", "phone", "date"];

function BookingForm({ onClose }: { onClose: () => void }) {
  const [values, setValues] = useState<BookingValues>({ fullName: "", phone: "", date: "" });
  const [errors, setErrors] = useState<Partial<Record<BookingField, string>>>({});
  const [attempted, setAttempted] = useState(false);
  const [sent, setSent] = useState<{ url: string; message: string } | null>(null);
  const fieldRefs = useRef<Partial<Record<BookingField, HTMLElement | null>>>({});
  const sentHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (sent) sentHeadingRef.current?.focus();
  }, [sent]);

  const check = (name: BookingField, next: BookingValues) => validateField(name, { ...initialValues, ...next });

  const update = (name: BookingField, value: string) => {
    const next = { ...values, [name]: value };
    setValues(next);
    if (attempted || errors[name]) setErrors((previous) => ({ ...previous, [name]: check(name, next) }));
  };

  const onBlur = (name: BookingField) => {
    if (values[name].trim()) setErrors((previous) => ({ ...previous, [name]: check(name, values) }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);

    const nextErrors = Object.fromEntries(bookingFields.map((name) => [name, check(name, values)]));
    setErrors(nextErrors);
    const firstInvalid = bookingFields.find((name) => nextErrors[name]);
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    const message = composeBookingMessage({ name: values.fullName, phone: values.phone, date: values.date });
    const url = whatsappUrl(message);
    // Opened directly inside the submit handler so browsers treat it as a user action, not a pop-up.
    window.open(url, "_blank", "noopener,noreferrer");
    setSent({ url, message });
  };

  const closeButton = (
    <button type="button" className="booking-dialog__close" onClick={onClose} aria-label="Close">
      <X aria-hidden="true" />
    </button>
  );

  if (sent) {
    const firstName = values.fullName.trim().split(/\s+/)[0];
    return (
      <div className="booking-dialog__inner booking-sent">
        {closeButton}
        <span className="booking-sent__icon" aria-hidden="true">
          <WhatsAppIcon />
        </span>
        <h2 id="booking-title" ref={sentHeadingRef} tabIndex={-1} className="booking__title">
          Almost done, {firstName}!
        </h2>
        <p className="booking__lede">
          WhatsApp is open with your booking details. Press <strong>Send</strong> and our team will reply shortly to
          confirm your time.
        </p>
        <pre className="booking-sent__preview" aria-label="Your WhatsApp message">
          {sent.message}
        </pre>
        <p className="booking-sent__note">Your visit isn't booked until we confirm it with you.</p>
        <div className="booking-sent__actions">
          <a className="btn btn--primary" href={sent.url} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="wa-icon" />
            Open WhatsApp
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }

  const describedBy = (name: BookingField, id: string) => (errors[name] ? `${id}-error` : undefined);

  return (
    <form className="booking-dialog__inner booking" noValidate onSubmit={onSubmit}>
      {closeButton}

      <div className="booking__head">
        <p className="eyebrow">Book your visit</p>
        <h2 id="booking-title" className="booking__title">
          Pick a day that suits you
        </h2>
        <p className="booking__lede">
          Tell us your name and number and choose a date. We'll confirm the exact time with you on WhatsApp.
        </p>
      </div>

      <div className="booking__grid">
        <Field id="booking-name" label="Name" required error={errors.fullName} className="booking__name">
          <input
            ref={(element) => {
              fieldRefs.current.fullName = element;
            }}
            id="booking-name"
            name="fullName"
            type="text"
            className="input"
            autoComplete="name"
            maxLength={80}
            required
            value={values.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            onBlur={() => onBlur("fullName")}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={describedBy("fullName", "booking-name")}
          />
        </Field>

        <Field id="booking-phone" label="Phone" required error={errors.phone} className="booking__phone">
          <input
            ref={(element) => {
              fieldRefs.current.phone = element;
            }}
            id="booking-phone"
            name="phone"
            type="tel"
            className="input"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+351 912 345 678"
            maxLength={24}
            required
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            onBlur={() => onBlur("phone")}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy("phone", "booking-phone")}
          />
        </Field>

        <Field id="booking-date" label="Date" required group error={errors.date} className="booking__calendar">
          <Calendar
            value={values.date}
            onChange={(isoDate) => update("date", isoDate)}
            labelledBy="booking-date-label"
            describedBy={describedBy("date", "booking-date")}
            invalid={Boolean(errors.date)}
            focusRef={(element) => {
              fieldRefs.current.date = element;
            }}
          />
        </Field>

        <div className="booking__footer">
          <p className="booking__summary" aria-live="polite">
            <CalendarDays aria-hidden="true" />
            {values.date ? (
              <span>
                Selected: <strong>{formatBookingDate(values.date)}</strong>
              </span>
            ) : (
              <span>No date selected yet</span>
            )}
          </p>
          <button type="submit" className="btn btn--primary btn--lg btn--block">
            <WhatsAppIcon className="wa-icon" />
            Send on WhatsApp
            <span className="sr-only"> (opens WhatsApp)</span>
          </button>
          <p className="booking__note">Opens WhatsApp with your details ready to send. We're closed on Sundays.</p>
        </div>
      </div>
    </form>
  );
}
