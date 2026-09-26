import { useCallback, useEffect, useRef, useState } from "react";
import { isAppointmentComplete } from "../../lib/receptionist/appointment";
import type { AppointmentDraft, ChatErrorCode, ChatTurn, Locale, ServerEvent } from "../../lib/receptionist/protocol";
import { CHAT_LIMITS } from "../../lib/receptionist/protocol";
import { trackReceptionistEvent } from "./analytics";
import { ChatRequestError, streamChat } from "./chatApi";
import { uiStrings } from "./i18n";

export type ChatCard =
  | { kind: "summary" }
  | { kind: "ready"; url: string; message: string }
  | { kind: "contact" }
  | { kind: "emergency" }
  | { kind: "retry" };

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  cards: ChatCard[];
  /** Still streaming. */
  pending?: boolean;
  /** Written by the widget itself (greeting, errors): not sent back to the server as history. */
  local?: boolean;
  /** Text is a localised string key rendered in the current language instead of `text`. */
  localKey?: "greeting" | "fallback" | "rateLimited" | "sentMessage" | "whatsappError";
};

let nextId = 0;
const newId = () => `m${++nextId}`;

const greeting = (): UiMessage => ({ id: newId(), role: "assistant", text: "", cards: [], local: true, localKey: "greeting" });

function initialLocale(): Locale {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang.toLowerCase().startsWith("pt") ? "pt" : "en";
}

/** History sent to the server: real conversation turns only, newest last. */
function toHistory(messages: UiMessage[]): ChatTurn[] {
  return messages
    .filter((message) => !message.local && !message.pending && message.text.trim())
    .map((message) => ({ role: message.role, content: message.text }))
    .slice(-CHAT_LIMITS.historyTurns);
}

export function useReceptionistChat() {
  const [messages, setMessages] = useState<UiMessage[]>(() => [greeting()]);
  const [appointment, setAppointment] = useState<AppointmentDraft>({});
  const [appointmentSent, setAppointmentSent] = useState(false);
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [sending, setSending] = useState(false);

  // Refs mirror state so `send` always reads the latest values without re-creating callbacks.
  const messagesRef = useRef(messages);
  const appointmentRef = useRef(appointment);
  const localeRef = useRef(locale);
  const sendingRef = useRef(false);
  const appointmentSentRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  messagesRef.current = messages;
  appointmentRef.current = appointment;
  localeRef.current = locale;

  useEffect(() => () => abortRef.current?.abort(), []);

  const updateMessage = useCallback((id: string, update: (message: UiMessage) => UiMessage) => {
    setMessages((previous) => previous.map((message) => (message.id === id ? update(message) : message)));
  }, []);

  const addCard = useCallback(
    (id: string, card: ChatCard) =>
      updateMessage(id, (message) =>
        message.cards.some((existing) => existing.kind === card.kind) ? message : { ...message, cards: [...message.cards, card] },
      ),
    [updateMessage],
  );

  /** Streams a reply for the conversation in `history` into a new assistant message. */
  const requestReply = useCallback(
    async (history: UiMessage[]) => {
      const replyId = newId();
      setMessages([...history, { id: replyId, role: "assistant", text: "", cards: [], pending: true }]);
      sendingRef.current = true;
      setSending(true);

      const controller = new AbortController();
      abortRef.current = controller;
      let receivedText = false;
      let failure: ChatErrorCode | null = null;

      const onEvent = (event: ServerEvent) => {
        switch (event.type) {
          case "locale":
            setLocale(event.locale);
            break;
          case "text":
            receivedText = true;
            updateMessage(replyId, (message) => ({ ...message, text: message.text + event.delta }));
            break;
          case "appointment": {
            const hadDetails = Object.keys(appointmentRef.current).length > 0;
            if (!hadDetails && Object.keys(event.appointment).length > 0) trackReceptionistEvent("ai_booking_started");
            appointmentRef.current = event.appointment;
            setAppointment(event.appointment);
            appointmentSentRef.current = false;
            setAppointmentSent(false);
            if (event.complete) addCard(replyId, { kind: "summary" });
            break;
          }
          case "appointment_ready":
            appointmentRef.current = event.appointment;
            setAppointment(event.appointment);
            addCard(replyId, { kind: "ready", url: event.url, message: event.message });
            break;
          case "handoff":
            trackReceptionistEvent("ai_human_handoff", { source: "assistant" });
            addCard(replyId, { kind: "contact" });
            break;
          case "emergency":
            trackReceptionistEvent("ai_emergency_guidance_shown");
            addCard(replyId, { kind: "emergency" });
            break;
          case "error":
            failure = event.code;
            break;
          case "done":
            break;
        }
      };

      try {
        await streamChat(
          { messages: toHistory(history), appointment: appointmentRef.current, locale: localeRef.current },
          onEvent,
          controller.signal,
        );
        if (!failure && !receivedText) failure = "unavailable";
      } catch (error) {
        if (controller.signal.aborted) return; // Reset or unmounted: drop the reply silently.
        failure = error instanceof ChatRequestError ? error.code : "unavailable";
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          sendingRef.current = false;
          setSending(false);
        }
      }

      if (failure) {
        trackReceptionistEvent("ai_error_shown", { code: failure });
        updateMessage(replyId, (message) => ({
          ...message,
          text: "",
          pending: false,
          local: true,
          localKey: failure === "rate_limited" ? "rateLimited" : "fallback",
          cards: [{ kind: "contact" }, ...(failure === "invalid_request" ? [] : [{ kind: "retry" } as const])],
        }));
      } else {
        updateMessage(replyId, (message) => ({ ...message, pending: false }));
      }
    },
    [addCard, updateMessage],
  );

  const send = useCallback(
    (rawText: string) => {
      const text = rawText.trim().slice(0, CHAT_LIMITS.messageLength);
      if (!text || sendingRef.current) return false;
      trackReceptionistEvent("ai_message_sent", { locale: localeRef.current });
      const history = [...messagesRef.current, { id: newId(), role: "user" as const, text, cards: [] }];
      void requestReply(history);
      return true;
    },
    [requestReply],
  );

  /** Re-sends the last visitor message after a failed reply. */
  const retry = useCallback(() => {
    if (sendingRef.current) return;
    const current = messagesRef.current;
    const last = current[current.length - 1];
    if (!last || last.role !== "assistant" || !last.cards.some((card) => card.kind === "retry")) return;
    void requestReply(current.slice(0, -1));
  }, [requestReply]);

  /** Adds a message written by the widget (e.g. after the visitor opens WhatsApp). */
  const addLocalMessage = useCallback((localKey: NonNullable<UiMessage["localKey"]>, cards: ChatCard[] = []) => {
    setMessages((previous) => [...previous, { id: newId(), role: "assistant", text: "", cards, local: true, localKey }]);
  }, []);

  const markAppointmentSent = useCallback(() => {
    if (appointmentSentRef.current) return;
    appointmentSentRef.current = true;
    setAppointmentSent(true);
    trackReceptionistEvent("ai_booking_completed");
    // Kept in history (not `local`) so the assistant knows the request was handed over.
    setMessages((previous) => [
      ...previous,
      { id: newId(), role: "assistant", text: uiStrings[localeRef.current].sentMessage, cards: [] },
    ]);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    sendingRef.current = false;
    appointmentSentRef.current = false;
    appointmentRef.current = {};
    setSending(false);
    setMessages([greeting()]);
    setAppointment({});
    setAppointmentSent(false);
  }, []);

  return {
    messages,
    appointment,
    appointmentComplete: isAppointmentComplete(appointment),
    appointmentSent,
    locale,
    sending,
    send,
    retry,
    reset,
    addLocalMessage,
    markAppointmentSent,
  };
}

export type ReceptionistChat = ReturnType<typeof useReceptionistChat>;
