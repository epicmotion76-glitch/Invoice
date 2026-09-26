import { Minus, RotateCcw } from "lucide-react";
import type { Locale } from "../../lib/receptionist/protocol";
import { uiStrings } from "./i18n";

/** The BrightSmile tooth mark, used as the assistant's avatar. */
export function AssistantAvatar({ className = "" }: { className?: string }) {
  return (
    <span className={`ai-avatar ${className}`} aria-hidden="true">
      <svg viewBox="0 0 40 40">
        <path
          transform="translate(9 10) scale(.9)"
          fill="currentColor"
          d="M8 3.5c-2.6 0-4.5 2-4.5 4.8 0 1.9.7 3.3 1.3 4.9.6 1.7.8 3.5 1.2 5.3.3 1.6.8 2.5 1.8 2.5 1.2 0 1.5-1.5 1.8-3 .3-1.4.7-2.8 2.4-2.8s2.1 1.4 2.4 2.8c.3 1.5.6 3 1.8 3 1 0 1.5-.9 1.8-2.5.4-1.8.6-3.6 1.2-5.3.6-1.6 1.3-3 1.3-4.9 0-2.8-1.9-4.8-4.5-4.8-1.7 0-2.6.9-4 .9s-2.3-.9-4-.9Z"
        />
        <path d="M30 7.2l.95 2.15 2.15.95-2.15.95L30 13.4l-.95-2.15-2.15-.95 2.15-.95z" fill="#E08D5B" />
      </svg>
    </span>
  );
}

type ChatHeaderProps = {
  locale: Locale;
  canRestart: boolean;
  onRestart: () => void;
  onMinimize: () => void;
};

export function ChatHeader({ locale, canRestart, onRestart, onMinimize }: ChatHeaderProps) {
  const t = uiStrings[locale];
  return (
    <header className="ai-chat__header">
      <AssistantAvatar className="ai-avatar--header" />
      <div className="ai-chat__heading">
        <h2 id="ai-chat-title" className="ai-chat__title">
          {t.title}
        </h2>
        <p className="ai-chat__status">
          <span className="ai-chat__status-dot" aria-hidden="true" />
          {t.status}
        </p>
      </div>
      <div className="ai-chat__header-actions">
        {canRestart && (
          <button type="button" className="ai-icon-btn" onClick={onRestart} aria-label={t.restart} title={t.restart}>
            <RotateCcw aria-hidden="true" />
          </button>
        )}
        <button type="button" className="ai-icon-btn" onClick={onMinimize} aria-label={t.minimize} title={t.minimize}>
          <Minus aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
