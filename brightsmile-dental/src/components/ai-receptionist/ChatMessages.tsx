import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import type { QuickActionId } from "./i18n";
import { QuickActions } from "./QuickActions";
import type { ReceptionistChat } from "./useReceptionistChat";

type ChatMessagesProps = {
  chat: ReceptionistChat;
  onQuickAction: (id: QuickActionId, message: string) => void;
  onEditAppointment: () => void;
};

const NEAR_BOTTOM_PX = 120;

export function ChatMessages({ chat, onQuickAction, onEditAppointment }: ChatMessagesProps) {
  const { messages, locale, sending } = chat;
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);
  const hasVisitorMessage = messages.some((message) => message.role === "user");
  let lastCardMessageId: string | undefined;
  for (const message of messages) {
    if (message.cards.some((card) => card.kind === "summary" || card.kind === "ready")) lastCardMessageId = message.id;
  }
  const lastMessage = messages[messages.length - 1];

  // Follow new content while the visitor is at (or near) the bottom; leave them be if they scrolled up to read.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    if (pinnedToBottom.current || lastMessage?.role === "user") element.scrollTop = element.scrollHeight;
  }, [messages, lastMessage]);

  const onScroll = () => {
    const element = scrollRef.current;
    if (element) pinnedToBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < NEAR_BOTTOM_PX;
  };

  return (
    <div ref={scrollRef} className="ai-chat__scroll" onScroll={onScroll}>
      <ol className="ai-chat__messages" role="log" aria-live="polite" aria-busy={sending} aria-labelledby="ai-chat-title">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            locale={locale}
            appointment={chat.appointment}
            appointmentSent={chat.appointmentSent}
            showAppointmentCard={message.id === lastCardMessageId && chat.appointmentComplete}
            isLast={message === lastMessage}
            sending={sending}
            onRetry={chat.retry}
            onAppointmentSent={chat.markAppointmentSent}
            onEditAppointment={onEditAppointment}
          />
        ))}
      </ol>
      {!hasVisitorMessage && <QuickActions locale={locale} disabled={sending} onSelect={onQuickAction} />}
    </div>
  );
}
