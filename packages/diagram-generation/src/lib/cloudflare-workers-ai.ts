import type {
  DiagramGenerationClient,
  DiagramGenerationRequest,
} from "./candidates.js";
import { candidateFromText, timeGenerationCandidate } from "./candidates.js";
import {
  extractCompatText,
  extractCompatUsage,
} from "./cloudflare-ai-gateway-compat.js";
import { buildDiagramGenerationMessages } from "./messages.js";

export interface CloudflareWorkersAiBinding {
  run(
    model: string,
    inputs: Record<string, unknown>,
    options?: {
      gateway?: {
        collectLog?: boolean;
        id: string;
        metadata?: Record<string, number | string | boolean | null | bigint>;
      };
    },
  ): Promise<unknown>;
}

export interface CloudflareWorkersAiClientOptions {
  ai: CloudflareWorkersAiBinding;
  collectLog?: boolean;
  gatewayId: string;
}

export function createCloudflareWorkersAiClient({
  ai,
  collectLog = true,
  gatewayId,
}: CloudflareWorkersAiClientOptions): DiagramGenerationClient {
  return {
    provider: "cloudflare-workers-ai",
    generate: (request: DiagramGenerationRequest) =>
      timeGenerationCandidate(async () => {
        const raw = await ai.run(
          request.model,
          {
            max_tokens: request.maxOutputTokens ?? 2_048,
            messages: buildDiagramGenerationMessages(request.scenario).messages,
            response_format: { type: "json_object" },
            temperature: request.temperature ?? 0.1,
          },
          {
            gateway: {
              collectLog,
              id: gatewayId,
              metadata: {
                scenarioId: request.scenario.id,
                sketchiProvider: "cloudflare-workers-ai",
              },
            },
          },
        );
        const usage = extractCompatUsage(raw);

        return candidateFromText({
          model: request.model,
          provider: "cloudflare-workers-ai",
          raw,
          text: extractCompatText(raw),
          ...(usage ? { usage } : {}),
        });
      }),
  };
}
