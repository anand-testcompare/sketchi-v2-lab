import type {
  DiagramGenerationClient,
  DiagramGenerationRequest,
  DiagramGenerationUsage,
} from "./candidates.js";
import {
  candidateFromText,
  responseErrorDiagnostic,
  timeGenerationCandidate,
} from "./candidates.js";
import { buildDiagramGenerationMessages } from "./messages.js";

interface CompatChoice {
  message?: {
    content?: unknown;
  };
}

interface CompatUsage {
  completion_tokens?: unknown;
  prompt_tokens?: unknown;
  total_tokens?: unknown;
}

interface CompatResponse {
  choices?: CompatChoice[];
  usage?: CompatUsage;
}

export interface CloudflareAiGatewayCompatClientOptions {
  endpointUrl: string;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
}

export function extractCompatText(response: unknown): string {
  const text = (response as CompatResponse).choices?.find(
    (choice) => typeof choice.message?.content === "string",
  )?.message?.content;

  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Compat chat response did not include message content.");
  }

  return text.trim();
}

function numberUsage(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

export function extractCompatUsage(
  response: unknown,
): DiagramGenerationUsage | undefined {
  const usage = (response as CompatResponse).usage;

  if (!usage) {
    return undefined;
  }

  const inputTokens = numberUsage(usage.prompt_tokens);
  const outputTokens = numberUsage(usage.completion_tokens);
  const totalTokens = numberUsage(usage.total_tokens);
  const result: DiagramGenerationUsage = {};

  if (inputTokens !== undefined) {
    result.inputTokens = inputTokens;
  }

  if (outputTokens !== undefined) {
    result.outputTokens = outputTokens;
  }

  if (totalTokens !== undefined) {
    result.totalTokens = totalTokens;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { text };
  }
}

export function createCloudflareAiGatewayCompatClient({
  endpointUrl,
  fetch: fetcher = fetch,
  headers = {},
}: CloudflareAiGatewayCompatClientOptions): DiagramGenerationClient {
  return {
    provider: "cloudflare-ai-gateway-compat",
    generate: (request: DiagramGenerationRequest) =>
      timeGenerationCandidate(async () => {
        const prompt = buildDiagramGenerationMessages(request.scenario);
        const response = await fetcher(endpointUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({
            max_tokens: request.maxOutputTokens ?? 2_048,
            messages: prompt.messages,
            model: request.model,
            response_format: { type: "json_object" },
            temperature: request.temperature ?? 0.1,
          }),
        });
        const raw = await readJsonResponse(response);

        if (!response.ok) {
          const errorDiagnostic = responseErrorDiagnostic(raw);

          return candidateFromText({
            diagnostics: [
              `AI Gateway compat request failed with HTTP ${response.status}.`,
              ...(errorDiagnostic ? [errorDiagnostic] : []),
            ],
            error: `HTTP ${response.status}`,
            model: request.model,
            provider: "cloudflare-ai-gateway-compat",
            raw,
            text: "",
          });
        }

        const usage = extractCompatUsage(raw);

        return candidateFromText({
          model: request.model,
          provider: "cloudflare-ai-gateway-compat",
          raw,
          text: extractCompatText(raw),
          ...(usage ? { usage } : {}),
        });
      }),
  };
}
