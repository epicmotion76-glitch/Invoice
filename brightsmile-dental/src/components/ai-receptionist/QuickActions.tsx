import type { Locale } from "../../lib/receptionist/protocol";
import { uiStrings, type QuickActionId } from "./i18n";

type QuickActionsProps = {
  locale: Locale;
  disabled: boolean;
  onSelect: (id: QuickActionId, message: string) => void;
};

/** Starter prompts shown before the first visitor message. Typing freely works just as well. */
export function QuickActions({ locale, disabled, onSelect }: QuickActionsProps) {
  const t = uiStrings[locale];
  return (
    <div className="ai-quick" role="group" aria-label={t.quickActionsLabel}>
      {t.quickActions.map((action) => (
        <button
          key={action.id}
          type="button"
          className={`ai-quick__btn${action.id === "emergency" ? " ai-quick__btn--urgent" : ""}`}
          disabled={disabled}
          onClick={() => onSelect(action.id, action.message)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
