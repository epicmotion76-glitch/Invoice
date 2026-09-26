/**
 * Vercel Function: POST /api/chat (AI receptionist).
 * Runs as Node ESM, so server-side relative imports use ".js" specifiers.
 * Requires the AI_API_KEY environment variable; see .env.example.
 */
import { handleChatRequest } from "../server/receptionist/handler.js";

export default {
  fetch(request: Request) {
    return handleChatRequest(request);
  },
};
