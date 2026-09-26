/**
 * Analytics hooks for the AI receptionist. Events carry only non-identifying metadata
 * (never message text or appointment details).
 *
 * Each event is pushed to `window.dataLayer` when present (Google Tag Manager) and dispatched as a
 * `brightsmile:analytics` DOM event, so any analytics tool can subscribe:
 *   window.addEventListener("brightsmile:analytics", (e) => track(e.detail.event, e.detail));
 */
export type ReceptionistEvent =
  | "ai_chat_opened"
  | "ai_message_sent"
  | "ai_quick_action_clicked"
  | "ai_booking_started"
  | "ai_booking_completed"
  | "ai_whatsapp_clicked"
  | "ai_human_handoff"
  | "ai_emergency_guidance_shown"
  | "ai_error_shown";

type EventProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function trackReceptionistEvent(event: ReceptionistEvent, props: EventProps = {}) {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer?.push({ event, ...props });
    window.dispatchEvent(new CustomEvent("brightsmile:analytics", { detail: { event, ...props } }));
  } catch {
    // Analytics must never break the chat.
  }
}
