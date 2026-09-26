import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { trackReceptionistEvent } from "./analytics";
import { ChatButton } from "./ChatButton";
import { useReceptionistChat } from "./useReceptionistChat";
import "./AiReceptionist.css";

const loadChatWindow = () => import("./ChatWindow");
const ChatWindow = lazy(loadChatWindow);

const WINDOW_ID = "ai-chat";

/**
 * AI receptionist widget: floating launcher + chat panel. Conversation state lives here, so it
 * survives minimising and reopening during the page session (it is not persisted to storage).
 */
export function AiReceptionist() {
  const chat = useReceptionistChat();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const openChat = useCallback(() => {
    setMounted(true);
    setOpen(true);
    trackReceptionistEvent("ai_chat_opened");
  }, []);

  const closeChat = useCallback(() => setOpen(false), []);

  // Return focus to the launcher after closing. Done in an effect because on phones the launcher
  // stays hidden until the panel's own effect cleanup has run.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) launcherRef.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  return (
    <div className="ai-receptionist">
      {mounted && (
        <Suspense fallback={null}>
          <ChatWindow id={WINDOW_ID} open={open} chat={chat} onClose={closeChat} />
        </Suspense>
      )}
      <ChatButton
        ref={launcherRef}
        open={open}
        locale={chat.locale}
        controlsId={mounted ? WINDOW_ID : undefined}
        onClick={open ? closeChat : openChat}
        onIntent={() => void loadChatWindow()}
      />
    </div>
  );
}
