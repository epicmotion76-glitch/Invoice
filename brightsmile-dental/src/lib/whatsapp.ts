// Also imported by the AI receptionist's serverless function (Node ESM), hence the ".js" specifier.
import { clinic } from "../content/clinic.js";

/** Builds a click-to-chat link that opens WhatsApp with `message` ready to send to the clinic. */
export function whatsappUrl(message: string = clinic.whatsapp.bookingMessage) {
  return `https://wa.me/${clinic.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export const bookingUrl = whatsappUrl();
