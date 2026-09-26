import { RotateCcw } from "lucide-react";
import type { AppointmentDraft, Locale } from "../../lib/receptionist/protocol";
import { AppointmentSummary } from "./AppointmentSummary";
import { AssistantAvatar } from "./ChatHeader";
import { ContactCard, EmergencyCard } from "./ContactCard";
import { FormattedText } from "./FormattedText";
import { uiStrings } from "./i18n";
import type { UiMessage } from "./useReceptionistChat";

type ChatMessageProps = {
  message: UiMessage;
  locale: Locale;
  appointment: AppointmentDraft;
  appointmentSent: boolean;
  /** Only the latest summary card is live; older ones are hidden to avoid stale duplicates. */
  showAppointmentCard: boolean;
  isLast: boolean;
  sending: boolean;
  onRetry: () => void;
  onAppointmentSent: () => void;
  onEditAppointment: () => void;
};

export function ChatMessage({
  message,
  locale,
  appointment,
  appointmentSent,
  showAppointmentCard,
  isLast,
  sending,
  onRetry,
  onAppointmentSent,
  onEditAppointment,
}: ChatMessageProps) {
  const t = uiStrings[locale];
  const text = message.localKey ? t[message.localKey] : message.text;
  const isAssistant = message.role === "assistant";
  const readyCard = message.cards.find((card) => card.kind === "ready");

  return (
    <li className={`ai-msg ai-msg--${message.role}`}>
      {isAssistant && <AssistantAvatar className="ai-avatar--message" />}
      <div className="ai-msg__body">
        {text && (
          <div className="ai-msg__bubble">
            <span className="sr-only">{isAssistant ? `${t.title}: ` : `${t.userLabel}: `}</span>
            <FormattedText text={text} />
          </div>
        )}

        {message.pending && !text && (
          <div className="ai-msg__bubble ai-typing" role="status">
            <span className="sr-only">{t.typing}</span>
            <span className="ai-typing__dot" aria-hidden="true" />
            <span className="ai-typing__dot" aria-hidden="true" />
            <span className="ai-typing__dot" aria-hidden="true" />
          </div>
        )}

        {message.cards.map((card) => {
          switch (card.kind) {
            case "summary":
              return showAppointmentCard && !readyCard ? (
                <AppointmentSummary
                  key="summary"
                  appointment={appointment}
                  locale={locale}
                  variant="confirm"
                  sent={appointmentSent}
                  disabled={sending}
                  onSent={onAppointmentSent}
                  onEdit={onEditAppointment}
                />
              ) : null;
            case "ready":
              return showAppointmentCard ? (
                <AppointmentSummary
                  key="ready"
                  appointment={appointment}
                  locale={locale}
                  variant="ready"
                  readyUrl={card.url}
                  sent={appointmentSent}
                  disabled={sending}
                  onSent={onAppointmentSent}
                  onEdit={onEditAppointment}
                />
              ) : null;
            case "contact":
              return <ContactCard key="contact" locale={locale} />;
            case "emergency":
              return <EmergencyCard key="emergency" locale={locale} />;
            case "retry":
              return isLast ? (
                <button key="retry" type="button" className="ai-retry" onClick={onRetry} disabled={sending}>
                  <RotateCcw aria-hidden="true" />
                  {t.retry}
                </button>
              ) : null;
          }
        })}
      </div>
    </li>
  );
}
