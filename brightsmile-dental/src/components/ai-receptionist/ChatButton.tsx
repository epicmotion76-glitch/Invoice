import type { Ref } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import type { Locale } from "../../lib/receptionist/protocol";
import { uiStrings } from "./i18n";

type ChatButtonProps = {
  ref?: Ref<HTMLButtonElement>;
  open: boolean;
  locale: Locale;
  controlsId?: string;
  onClick: () => void;
  /** Hover/focus: a hint to start loading the chat window. */
  onIntent: () => void;
};

/** Floating launcher in the bottom-right corner. */
export function ChatButton({ ref, open, locale, controlsId, onClick, onIntent }: ChatButtonProps) {
  const t = uiStrings[locale];
  return (
    <button
      ref={ref}
      type="button"
      className={`ai-launcher${open ? " is-open" : ""}`}
      aria-expanded={open}
      aria-controls={controlsId}
      aria-label={open ? t.minimize : undefined}
      onClick={onClick}
      onPointerEnter={onIntent}
      onFocus={onIntent}
    >
      <span className="ai-launcher__icon" aria-hidden="true">
        {open ? <ChevronDown /> : <MessageCircle />}
      </span>
      {!open && (
        <span className="ai-launcher__label">
          <span className="ai-launcher__label-full">{t.launcher}</span>
          <span className="ai-launcher__label-short" aria-hidden="true">
            {t.launcherShort}
          </span>
        </span>
      )}
    </button>
  );
}
