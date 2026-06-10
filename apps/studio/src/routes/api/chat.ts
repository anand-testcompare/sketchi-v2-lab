import { createFileRoute } from "@tanstack/react-router";

import type { ChatMessageInput } from "../../lib/chat-gateway";

function sanitizeMessages(value: unknown): ChatMessageInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is ChatMessageInput =>
        Boolean(item) &&
        typeof item === "object" &&
        (item as ChatMessageInput).role !== undefined &&
        typeof (item as ChatMessageInput).content === "string",
    )
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content,
    }));
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { messages?: unknown };
          const messages = sanitizeMessages(body.messages);

          if (messages.length === 0) {
            return new Response("No messages provided.", { status: 400 });
          }

          const [{ streamStudioChat }, { getStudioBindings }] =
            await Promise.all([
              import("../../lib/chat-gateway"),
              import("../../lib/cloudflare-bindings.server"),
            ]);

          const stream = await streamStudioChat(getStudioBindings(), messages);

          return new Response(stream, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store",
              "X-Accel-Buffering": "no",
            },
          });
        } catch (error) {
          return new Response(
            error instanceof Error ? error.message : "Chat request failed.",
            { status: 400 },
          );
        }
      },
    },
  },
});
