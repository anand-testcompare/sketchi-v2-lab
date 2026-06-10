import type { CloudflareAiGatewayProvider } from "@sketchi/diagram-generation";

/**
 * Ephemeral studio chat over the Cloudflare AI Gateway.
 *
 * Mirrors the playground gateway wiring (env.AI -> ai.gateway(id).run) but hits
 * Gemini's `:streamGenerateContent?alt=sse` endpoint and transforms the provider
 * SSE into a plain UTF-8 token stream the browser can read incrementally.
 *
 * There is no persistence: the full conversation is sent up on every turn.
 */

export interface StudioEnv {
  AI?: CloudflareAiGatewayProvider;
  SKETCHI_AI_GATEWAY_ID?: string;
  SKETCHI_AI_MODEL?: string;
}

export interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_GATEWAY_ID = "google-ai-studio";
const DEFAULT_MODEL = "google/gemini-3.1-flash-lite";
const DEFAULT_MAX_OUTPUT_TOKENS = 2_048;
const DEFAULT_TEMPERATURE = 0.6;

const SYSTEM_PROMPT = [
  "You are Sketchi, an AI companion for turning ideas into clean diagrams.",
  "You are warm, concise, and concrete. Prefer short paragraphs and tight lists.",
  "When a user describes a system or flow, talk through the structure you would draw:",
  "the nodes, how they connect, and any branches or decision points.",
  "Use markdown (headings, bold, lists, fenced code) where it improves clarity.",
  "Diagram rendering is wired up separately — focus on a great conversational pass.",
].join(" ");

function envString(
  env: StudioEnv,
  key: "SKETCHI_AI_GATEWAY_ID" | "SKETCHI_AI_MODEL",
  fallback: string,
): string {
  const value = env[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function stripGoogleModelPrefix(model: string): string {
  return model.replace(/^google-ai-studio\//, "").replace(/^google\//, "");
}

function toGeminiContents(
  messages: readonly ChatMessageInput[],
): { role: "model" | "user"; parts: { text: string }[] }[] {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
}

function extractDeltaText(payload: unknown): string {
  const candidates = (payload as { candidates?: unknown[] }).candidates;
  if (!Array.isArray(candidates)) {
    return "";
  }

  let text = "";
  for (const candidate of candidates) {
    const parts = (candidate as { content?: { parts?: unknown[] } }).content
      ?.parts;
    if (!Array.isArray(parts)) {
      continue;
    }
    for (const part of parts) {
      const partText = (part as { text?: unknown }).text;
      if (typeof partText === "string") {
        text += partText;
      }
    }
  }
  return text;
}

/**
 * TransformStream: Gemini `alt=sse` bytes -> concatenated text deltas (UTF-8).
 * SSE frames arrive as `data: {json}\n`; JSON objects are single-line, so we can
 * split on newlines and keep a trailing partial line buffered between chunks.
 */
function geminiSseToTextDeltas(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const drainLine = (
    line: string,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) {
      return;
    }
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") {
      return;
    }
    try {
      const text = extractDeltaText(JSON.parse(payload));
      if (text) {
        controller.enqueue(encoder.encode(text));
      }
    } catch {
      // Ignore unparseable frames (keepalive/comment lines).
    }
  };

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        drainLine(line, controller);
      }
    },
    flush(controller) {
      if (buffer) {
        drainLine(buffer, controller);
      }
    },
  });
}

export async function streamStudioChat(
  env: StudioEnv,
  messages: readonly ChatMessageInput[],
): Promise<ReadableStream<Uint8Array>> {
  if (!env.AI) {
    throw new Error(
      "AI binding is not configured in this Worker environment (env.AI).",
    );
  }

  const gatewayId = envString(env, "SKETCHI_AI_GATEWAY_ID", DEFAULT_GATEWAY_ID);
  const model = stripGoogleModelPrefix(
    envString(env, "SKETCHI_AI_MODEL", DEFAULT_MODEL),
  );

  const gateway = env.AI.gateway(gatewayId);
  const upstream = await gateway.run(
    {
      endpoint: `v1beta/models/${model}:streamGenerateContent?alt=sse`,
      provider: "google-ai-studio",
      headers: { "Content-Type": "application/json" },
      query: {
        contents: toGeminiContents(messages),
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: {
          maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
          temperature: DEFAULT_TEMPERATURE,
        },
      },
    },
    {
      gateway: {
        collectLog: true,
        metadata: { sketchiSurface: "studio" },
      },
    },
  );

  if (!(upstream.ok && upstream.body)) {
    const detail = await upstream.text().catch(() => "");
    throw new Error(
      `Gemini gateway request failed (HTTP ${upstream.status}). ${detail.slice(0, 240)}`.trim(),
    );
  }

  return upstream.body.pipeThrough(geminiSseToTextDeltas());
}
