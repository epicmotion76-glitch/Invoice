import { useEffect, useRef, useState, type ChangeEvent, type FocusEvent, type FormEvent } from "react";
import { CircleAlert, LockKeyhole } from "lucide-react";
import { clinic, treatmentOptions } from "../../content/site";
import { composeBookingMessage, formatBookingDate } from "../../lib/bookingMessage";
import { whatsappUrl } from "../../lib/whatsapp";
import { Calendar } from "../booking/Calendar";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { useAppointment } from "./AppointmentContext";
import { Field } from "./Field";
import {
  MESSAGE_MAX_LENGTH,
  fieldOrder,
  initialValues,
  validateAll,
  validateField,
  type AppointmentFormValues,
  type FieldName,
  type FormErrors,
} from "./validation";

type SentRequest = { values: AppointmentFormValues; url: string };

const treatmentLabel = (value: string) => treatmentOptions.find((option) => option.value === value)?.label ?? value;

export function AppointmentForm() {
  const { requestedTreatment } = useAppointment();
  const [values, setValues] = useState<AppointmentFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitCount, setSubmitCount] = useState(0);
  const [sent, setSent] = useState<SentRequest | null>(null);
  const fieldRefs = useRef<Partial<Record<FieldName, HTMLElement | null>>>({});
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!requestedTreatment) return;
    setValues((previous) => ({ ...previous, treatment: requestedTreatment.value }));
    setErrors((previous) => ({ ...previous, treatment: undefined }));
    setSent(null);
  }, [requestedTreatment]);

  useEffect(() => {
    if (sent) successHeadingRef.current?.focus();
  }, [sent]);

  const register = (name: FieldName) => (element: HTMLElement | null) => {
    fieldRefs.current[name] = element;
  };

  const setField = (name: FieldName, value: string | boolean) => {
    const next = { ...values, [name]: value } as AppointmentFormValues;
    setValues(next);

    // Once a field shows an error (or the form was submitted), re-check it as the visitor types.
    if (errors[name] || submitCount > 0) {
      setErrors((previous) => ({ ...previous, [name]: validateField(name, next) }));
    }
  };

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = event.target;
    const value = target instanceof HTMLInputElement && target.type === "checkbox" ? target.checked : target.value;
    setField(target.name as FieldName, value);
  };

  const onBlur = (event: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const name = event.target.name as FieldName;
    const value = values[name];
    const hasInput = typeof value === "string" ? value.trim() !== "" : value;
    if (hasInput || submitCount > 0) {
      setErrors((previous) => ({ ...previous, [name]: validateField(name, values) }));
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateAll(values);
    setErrors(nextErrors);
    setSubmitCount((count) => count + 1);

    const firstInvalid = fieldOrder.find((name) => nextErrors[name]);
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    const message = composeBookingMessage({
      name: values.fullName,
      phone: values.phone,
      date: values.date,
      extra: [
        ["Email", values.email],
        ["Treatment", treatmentLabel(values.treatment)],
        ["Message", values.message],
      ],
    });
    const url = whatsappUrl(message);
    // Opened directly inside the submit handler so browsers treat it as a user action, not a pop-up.
    window.open(url, "_blank", "noopener,noreferrer");
    setSent({ values, url });
  };

  const editRequest = () => {
    setSent(null);
    requestAnimationFrame(() => fieldRefs.current.fullName?.focus());
  };

  if (sent) {
    const firstName = sent.values.fullName.trim().split(/\s+/)[0];

    return (
      <div className="form-success">
        <span className="form-success__icon" aria-hidden="true">
          <WhatsAppIcon />
        </span>
        <h3 ref={successHeadingRef} tabIndex={-1} className="form-success__title">
          Almost done, {firstName}! Send your request in WhatsApp.
        </h3>
        <p>
          We've opened WhatsApp with your request for <strong>{treatmentLabel(sent.values.treatment)}</strong> on{" "}
          <strong>{formatBookingDate(sent.values.date)}</strong> already filled in. Press <strong>Send</strong> and our
          friendly team will reply shortly to confirm a time that suits you.
        </p>
        <p className="form-success__note">
          WhatsApp didn't open? Use the button below, or call us on{" "}
          <a className="text-link" href={clinic.phone.href}>
            {clinic.phone.display}
          </a>
          . Your visit isn't booked until we confirm it with you.
        </p>
        <div className="form-success__actions">
          <a className="btn btn--primary" href={sent.url} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="wa-icon" />
            Open WhatsApp
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <button type="button" className="btn btn--secondary" onClick={editRequest}>
            Edit request
          </button>
        </div>
      </div>
    );
  }

  const errorCount = fieldOrder.filter((name) => errors[name]).length;
  const describedBy = (name: FieldName, hint?: boolean) =>
    [hint && `${name}-hint`, errors[name] && `${name}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <form className="appt-form" noValidate onSubmit={onSubmit} aria-labelledby="appointment-title">
      <p className="appt-form__required">
        Fields marked <span aria-hidden="true">*</span>
        <span className="sr-only">with an asterisk</span> are required.
      </p>

      {submitCount > 0 && errorCount > 0 && (
        <div className="form-alert" role="alert">
          <CircleAlert aria-hidden="true" />
          {errorCount === 1 ? "Please check the highlighted field below." : `Please check the ${errorCount} highlighted fields below.`}
        </div>
      )}

      <div className="appt-form__grid">
        <Field id="fullName" label="Full Name" required error={errors.fullName}>
          <input
            ref={register("fullName")}
            id="fullName"
            name="fullName"
            type="text"
            className="input"
            autoComplete="name"
            maxLength={80}
            required
            value={values.fullName}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={describedBy("fullName")}
          />
        </Field>

        <Field id="phone" label="Phone Number" required error={errors.phone}>
          <input
            ref={register("phone")}
            id="phone"
            name="phone"
            type="tel"
            className="input"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+351 912 345 678"
            maxLength={24}
            required
            value={values.phone}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy("phone")}
          />
        </Field>

        <Field id="email" label="Email Address" required error={errors.email}>
          <input
            ref={register("email")}
            id="email"
            name="email"
            type="email"
            className="input"
            autoComplete="email"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="name@example.com"
            maxLength={120}
            required
            value={values.email}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
          />
        </Field>

        <Field id="treatment" label="Treatment of Interest" required error={errors.treatment}>
          <select
            ref={register("treatment")}
            id="treatment"
            name="treatment"
            className="input input--select"
            required
            value={values.treatment}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={Boolean(errors.treatment)}
            aria-describedby={describedBy("treatment")}
          >
            <option value="" disabled>
              Select a treatment
            </option>
            {treatmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id="date"
          label="Preferred Appointment Date"
          required
          group
          full
          error={errors.date}
          hint="Monday to Saturday. We'll confirm the exact time with you."
        >
          <Calendar
            value={values.date}
            onChange={(isoDate) => setField("date", isoDate)}
            labelledBy="date-label"
            describedBy={describedBy("date", true)}
            invalid={Boolean(errors.date)}
            focusRef={register("date")}
          />
        </Field>

        <Field
          id="message"
          label="Message"
          optional
          error={errors.message}
          full
          hint="Anything we should know, such as dental anxiety, preferred times or questions about cost."
          counter={`${values.message.length}/${MESSAGE_MAX_LENGTH}`}
        >
          <textarea
            ref={register("message")}
            id="message"
            name="message"
            className="input input--textarea"
            rows={4}
            value={values.message}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={describedBy("message", true)}
          />
        </Field>
      </div>

      <div className="appt-form__consent">
        <label className="checkbox" htmlFor="consent">
          <input
            ref={register("consent")}
            id="consent"
            name="consent"
            type="checkbox"
            required
            checked={values.consent}
            onChange={onChange}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={describedBy("consent")}
          />
          <span>
            I agree to be contacted about my appointment request.
            <span className="field__req" aria-hidden="true">
              {" "}
              *
            </span>
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" className="field__error">
            <CircleAlert aria-hidden="true" />
            {errors.consent}
          </p>
        )}
      </div>

      <button type="submit" className="btn btn--primary btn--lg btn--block appt-form__submit">
        <WhatsAppIcon className="wa-icon" />
        Request My Appointment
        <span className="sr-only"> (opens WhatsApp)</span>
      </button>

      <p className="appt-form__privacy">
        <LockKeyhole aria-hidden="true" />
        Your request opens in WhatsApp, ready to send to our team. It's a request, not a confirmed booking, and nothing
        is stored on this website.
      </p>
    </form>
  );
}
