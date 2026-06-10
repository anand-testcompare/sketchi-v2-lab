import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Suggestion } from "@/components/ai-elements/suggestion";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Route = createFileRoute("/")({
  component: StudioRoute,
});

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  streaming: boolean;
  error?: boolean;
}

const STARTERS = [
  "Sketch a login flow with retries and a fraud check",
  "Diagram a CI/CD pipeline from commit to production",
  "Map the data flow for an AI chat app with streaming",
];

function newId(): string {
  return crypto.randomUUID();
}

function StudioRoute() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const patch = useCallback((id: string, update: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, ...update } : message,
      ),
    );
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busy) {
        return;
      }

      const userMessage: ChatMessage = {
        id: newId(),
        role: "user",
        content: text,
        streaming: false,
      };
      const assistantId = newId();
      const history = [...messages, userMessage];

      setMessages([
        ...history,
        { id: assistantId, role: "assistant", content: "", streaming: true },
      ]);
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
          signal: controller.signal,
        });

        if (!(response.ok && response.body)) {
          const detail = await response.text().catch(() => "");
          patch(assistantId, {
            content: detail || `Request failed (HTTP ${response.status}).`,
            streaming: false,
            error: true,
          });
          return;
        }

        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader();

        let accumulated = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          if (value) {
            accumulated += value;
            patch(assistantId, { content: accumulated });
          }
        }
        patch(assistantId, { streaming: false });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    streaming: false,
                    content: message.content || "_(stopped)_",
                  }
                : message,
            ),
          );
        } else {
          patch(assistantId, {
            content:
              error instanceof Error ? error.message : "Something went wrong.",
            streaming: false,
            error: true,
          });
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, messages, patch],
  );

  const handleSubmit = useCallback(
    (message: { text?: string }) => {
      if (busy) {
        abortRef.current?.abort();
        return;
      }
      if (message.text) {
        void send(message.text);
      }
    },
    [busy, send],
  );

  const isEmpty = messages.length === 0;

  return (
    <TooltipProvider delayDuration={300}>
      <main className="studio">
        <header className="studio__head">
          <span className="studio__mark">sketchi</span>
          <span className="studio__sub">studio · ephemeral</span>
        </header>

        {isEmpty ? (
          <div className="studio__empty-wrap">
            <div className="studio__empty">
              <p className="studio__empty-title">What should we draw?</p>
              <p className="studio__empty-sub">
                Describe a system or flow and Sketchi will talk through the
                diagram.
              </p>
              <div className="studio__starters">
                {STARTERS.map((starter) => (
                  <Suggestion
                    key={starter}
                    onClick={(value) => void send(value)}
                    suggestion={starter}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Conversation>
            <ConversationContent>
              {messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.role === "user" ? (
                      message.content
                    ) : message.streaming && message.content.length === 0 ? (
                      <span className="studio__thinking">Sketching…</span>
                    ) : (
                      <MessageResponse>{message.content}</MessageResponse>
                    )}
                  </MessageContent>
                </Message>
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        )}

        <div className="studio__composer">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea placeholder="Describe a diagram…" />
            </PromptInputBody>
            <PromptInputFooter>
              <span className="studio__composer-hint">
                Enter to send · Shift+Enter for a new line
              </span>
              <PromptInputSubmit status={busy ? "streaming" : "ready"} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </main>
    </TooltipProvider>
  );
}
