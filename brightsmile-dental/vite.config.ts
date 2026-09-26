import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Serves /api/chat from `vite` dev so the AI receptionist works locally without the Vercel CLI.
 * In production the same handler runs as the Vercel Function in api/chat.ts.
 */
function receptionistDevApi(): Plugin {
  return {
    name: "brightsmile-receptionist-dev-api",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/chat", async (req: IncomingMessage & { originalUrl?: string }, res: ServerResponse) => {
        try {
          const { handleChatRequest } = (await server.ssrLoadModule(
            "/server/receptionist/handler.ts",
          )) as typeof import("./server/receptionist/handler");

          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === "string") headers.set(key, value);
            else if (Array.isArray(value)) headers.set(key, value.join(", "));
          }
          if (!headers.has("x-forwarded-for") && req.socket.remoteAddress) {
            headers.set("x-forwarded-for", req.socket.remoteAddress);
          }

          const aborted = new AbortController();
          res.on("close", () => aborted.abort());
          const hasBody = req.method !== "GET" && req.method !== "HEAD";
          const request = new Request(`http://${req.headers.host ?? "localhost"}${req.originalUrl ?? req.url ?? "/api/chat"}`, {
            method: req.method,
            headers,
            body: hasBody ? Buffer.concat(chunks) : undefined,
            signal: aborted.signal,
          });

          const response = await handleChatRequest(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          if (response.body) {
            const reader = response.body.getReader();
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
          }
          res.end();
        } catch (error) {
          server.config.logger.error(`[receptionist] dev API error: ${error instanceof Error ? error.message : error}`);
          if (!res.headersSent) res.statusCode = 500;
          res.end();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Server-only secrets for the dev API. Only AI_* variables are read, and Vite never exposes
  // non-VITE_ variables to browser code.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), "AI_"))) {
    process.env[key] ??= value;
  }

  return {
    plugins: [react(), receptionistDevApi()],
    build: {
      target: "es2020",
      cssCodeSplit: false,
    },
  };
});
