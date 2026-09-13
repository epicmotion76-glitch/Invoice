import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  full?: boolean;
  /** Labels a composite widget (like the calendar) via `${id}-label` instead of a <label for>. */
  group?: boolean;
  hint?: string;
  counter?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

/** Label, optional hint and inline error around a form control. */
export function Field({ id, label, required, optional, full, group, hint, counter, error, className, children }: FieldProps) {
  const labelContent = (
    <>
      {label}
      {required && (
        <span className="field__req" aria-hidden="true">
          {" "}
          *
        </span>
      )}
      {optional && <span className="field__optional"> (optional)</span>}
    </>
  );

  return (
    <div className={["field", full && "field--full", error && "has-error", className].filter(Boolean).join(" ")}>
      <div className="field__label-row">
        {group ? (
          <span id={`${id}-label`} className="field__label">
            {labelContent}
          </span>
        ) : (
          <label className="field__label" htmlFor={id}>
            {labelContent}
          </label>
        )}
        {counter && (
          <span className="field__counter" aria-hidden="true">
            {counter}
          </span>
        )}
      </div>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error">
          <CircleAlert aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
