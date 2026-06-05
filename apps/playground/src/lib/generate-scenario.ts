import {
  createCloudflareGoogleAiStudioClient,
  DiagramGenerationProviderIdSchema,
  type CloudflareAiGatewayProvider,
  type DiagramGenerationCandidateSummary,
  type DiagramGenerationClient,
  type DiagramGenerationProviderId,
  summarizeGenerationCandidate,
} from "@sketchi/diagram-generation";
import { getScenario } from "@sketchi/diagram-scenarios";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { z } from "zod";

const DEFAULT_GATEWAY_ID = "google-ai-studio";
const DEFAULT_MODEL = "google/gemini-3.1-flash-lite";
const DEFAULT_PROVIDERS: readonly DiagramGenerationProviderId[] = [
  "cloudflare-google-ai-studio",
];

const GenerateScenarioInputSchema = z.object({
  providers: z
    .array(DiagramGenerationProviderIdSchema)
    .default([...DEFAULT_PROVIDERS]),
  scenarioId: z.string().min(1),
});

export type GenerateScenarioInput = z.input<typeof GenerateScenarioInputSchema>;

export interface GenerateScenarioOutput {
  candidates: DiagramGenerationCandidateSummary[];
  model: string;
  scenarioId: string;
}

interface PlaygroundEnv {
  AI?: CloudflareAiGatewayProvider;
  SKETCHI_AI_GATEWAY_ID?: string;
  SKETCHI_AI_MODEL?: string;
}

function envString(
  bindings: PlaygroundEnv,
  key: keyof PlaygroundEnv,
  fallback: string,
): string {
  const value = bindings[key];

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function errorCandidate(
  provider: DiagramGenerationProviderId,
  model: string,
  message: string,
): DiagramGenerationCandidateSummary {
  return {
    diagnostics: [message],
    diagramValid: false,
    error: message,
    model,
    provider,
    text: "",
  };
}

function createGenerationClients(
  providers: readonly DiagramGenerationProviderId[],
  bindings: PlaygroundEnv,
  gatewayId: string,
): DiagramGenerationClient[] {
  const clients: DiagramGenerationClient[] = [];

  for (const provider of providers) {
    if (provider === "cloudflare-google-ai-studio" && bindings.AI) {
      clients.push(
        createCloudflareGoogleAiStudioClient({
          ai: bindings.AI,
          gatewayId,
        }),
      );
    }
  }

  return clients;
}

async function runClient(
  client: DiagramGenerationClient,
  model: string,
  scenarioId: string,
): Promise<DiagramGenerationCandidateSummary> {
  try {
    return summarizeGenerationCandidate(
      await client.generate({
        model,
        scenario: getScenario(scenarioId),
      }),
    );
  } catch (error) {
    return errorCandidate(
      client.provider,
      model,
      error instanceof Error ? error.message : "Generation failed.",
    );
  }
}

export const generateScenarioCandidates = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GenerateScenarioInputSchema.parse(input))
  .handler(async ({ data }): Promise<GenerateScenarioOutput> => {
    const bindings = env as unknown as PlaygroundEnv;
    const gatewayId = envString(
      bindings,
      "SKETCHI_AI_GATEWAY_ID",
      DEFAULT_GATEWAY_ID,
    );
    const model = envString(bindings, "SKETCHI_AI_MODEL", DEFAULT_MODEL);
    const clients = createGenerationClients(
      data.providers,
      bindings,
      gatewayId,
    );
    const clientProviders = new Set(clients.map((client) => client.provider));
    const missingCandidates = data.providers
      .filter((provider) => !clientProviders.has(provider))
      .map((provider) =>
        errorCandidate(
          provider,
          model,
          `Provider "${provider}" is not configured in this Worker environment.`,
        ),
      );
    const candidates = await Promise.all(
      clients.map((client) => runClient(client, model, data.scenarioId)),
    );

    return {
      candidates: [...candidates, ...missingCandidates],
      model,
      scenarioId: data.scenarioId,
    };
  });
