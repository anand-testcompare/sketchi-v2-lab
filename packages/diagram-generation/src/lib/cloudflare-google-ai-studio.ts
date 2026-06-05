import type {
  DiagramGenerationClient,
  DiagramGenerationRequest,
} from "./candidates.js";
import {
  candidateFromText,
  responseErrorDiagnostic,
  timeGenerationCandidate,
} from "./candidates.js";
import {
  buildGeminiGenerateContentBody,
  extractGeminiText,
  extractGeminiUsage,
  stripCloudflareGoogleModelPrefix,
} from "./gemini.js";

export interface CloudflareAiGateway {
  run(
    data: {
      endpoint: string;
      headers: Record<string, string>;
      provider: string;
      query: unknown;
    },
    options?: {
      gateway?: {
        collectLog?: boolean;
        metadata?: Record<string, number | string | boolean | null | bigint>;
      };
    },
  ): Promise<Response>;
  getUrl(provider?: string): Promise<string>;
}

export interface CloudflareAiGatewayProvider {
  gateway(gatewayId: string): CloudflareAiGateway;
}

export interface CloudflareGoogleAiStudioClientOptions {
  ai: CloudflareAiGatewayProvider;
  collectLog?: boolean;
  gatewayId: string;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { text };
  }
}

export function createCloudflareGoogleAiStudioClient({
  ai,
  collectLog = true,
  gatewayId,
}: CloudflareGoogleAiStudioClientOptions): DiagramGenerationClient {
  return {
    provider: "cloudflare-google-ai-studio",
    generate: (request: DiagramGenerationRequest) =>
      timeGenerationCandidate(async () => {
        const model = stripCloudflareGoogleModelPrefix(request.model);
        const gateway = ai.gateway(gatewayId);
        const response = await gateway.run(
          {
            endpoint: `v1beta/models/${model}:generateContent`,
            provider: "google-ai-studio",
            headers: {
              "Content-Type": "application/json",
            },
            query: buildGeminiGenerateContentBody(request),
          },
          {
            gateway: {
              collectLog,
              metadata: {
                scenarioId: request.scenario.id,
                sketchiProvider: "cloudflare-google-ai-studio",
              },
            },
          },
        );
        const raw = await readJsonResponse(response);

        if (!response.ok) {
          const errorDiagnostic = responseErrorDiagnostic(raw);

          return candidateFromText({
            diagnostics: [
              `Google AI Studio Gateway request failed with HTTP ${response.status}.`,
              ...(errorDiagnostic ? [errorDiagnostic] : []),
            ],
            error: `HTTP ${response.status}`,
            model,
            provider: "cloudflare-google-ai-studio",
            raw,
            text: "",
          });
        }

        const text = extractGeminiText(raw);
        const usage = extractGeminiUsage(raw);

        return candidateFromText({
          model,
          provider: "cloudflare-google-ai-studio",
          raw,
          text,
          ...(usage ? { usage } : {}),
        });
      }),
  };
}

export interface CloudflareGoogleAiStudioFetchClientOptions {
  endpointBaseUrl: string;
  fetch?: typeof fetch;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function createCloudflareGoogleAiStudioFetchClient({
  endpointBaseUrl,
  fetch: fetcher = fetch,
}: CloudflareGoogleAiStudioFetchClientOptions): DiagramGenerationClient {
  return {
    provider: "cloudflare-google-ai-studio",
    generate: (request: DiagramGenerationRequest) =>
      timeGenerationCandidate(async () => {
        const model = stripCloudflareGoogleModelPrefix(request.model);
        const response = await fetcher(
          joinUrl(endpointBaseUrl, `v1beta/models/${model}:generateContent`),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(buildGeminiGenerateContentBody(request)),
          },
        );
        const raw = await readJsonResponse(response);

        if (!response.ok) {
          const errorDiagnostic = responseErrorDiagnostic(raw);

          return candidateFromText({
            diagnostics: [
              `Google AI Studio Gateway request failed with HTTP ${response.status}.`,
              ...(errorDiagnostic ? [errorDiagnostic] : []),
            ],
            error: `HTTP ${response.status}`,
            model,
            provider: "cloudflare-google-ai-studio",
            raw,
            text: "",
          });
        }

        const usage = extractGeminiUsage(raw);

        return candidateFromText({
          model,
          provider: "cloudflare-google-ai-studio",
          raw,
          text: extractGeminiText(raw),
          ...(usage ? { usage } : {}),
        });
      }),
  };
}
