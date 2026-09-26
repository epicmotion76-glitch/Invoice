import { useEffect, useRef, type KeyboardEvent } from "react";
import { trackReceptionistEvent } from "./analytics";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";
import { uiStrings, type QuickActionId } from "./i18n";
import type { ReceptionistChat } from "./useReceptionistChat";

type ChatWindowProps = {
  id: string;
  open: boolean;
  chat: ReceptionistChat;
  onClose: () => void;
};

const DESKTOP_QUERY = "(min-width: 641px)";

/** The chat panel. Stays mounted while minimised so the conversation and draft message are kept. */
export default function ChatWindow({ id, open, chat, onClose }: ChatWindowProps) {
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    // On phones, focusing the input would pop the keyboard over the greeting; focus the panel instead.
    const target = window.matchMedia(DESKTOP_QUERY).matches ? inputRef.current : panelRef.current;
    const frame = requestAnimationFrame(() => target?.focus({ preventScroll: true }));
    const root = document.documentElement;
    root.classList.add("ai-chat-open");
    return () => {
      cancelAnimationFrame(frame);
      root.classList.remove("ai-chat-open");
    };
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
  };

  const onQuickAction = (actionId: QuickActionId, message: string) => {
    trackReceptionistEvent("ai_quick_action_clicked", { action: actionId });
    chat.send(message);
  };

  const onEditAppointment = () => {
    chat.send(uiStrings[chat.locale].summary.editMessage);
  };

  const hasConversation = chat.messages.some((message) => message.role === "user");

  return (
    <section
      ref={panelRef}
      id={id}
      className="ai-chat"
      role="dialog"
      aria-modal="false"
      aria-labelledby="ai-chat-title"
      hidden={!open}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      lang={chat.locale}
    >
      <ChatHeader
        locale={chat.locale}
        canRestart={hasConversation}
        onRestart={() => {
          chat.reset();
          inputRef.current?.focus();
        }}
        onMinimize={onClose}
      />
      <ChatMessages chat={chat} onQuickAction={onQuickAction} onEditAppointment={onEditAppointment} />
      <ChatInput locale={chat.locale} sending={chat.sending} onSend={chat.send} inputRef={inputRef} />
    </section>
  );
}
