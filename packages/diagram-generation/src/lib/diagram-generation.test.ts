import { getScenario } from "@sketchi/diagram-scenarios";
import { describe, expect, it, vi } from "vitest";

import { createCloudflareAiGatewayCompatClient } from "./cloudflare-ai-gateway-compat.js";
import { createCloudflareGoogleAiStudioClient } from "./cloudflare-google-ai-studio.js";
import { createCloudflareWorkersAiClient } from "./cloudflare-workers-ai.js";
import { createFixtureGenerationClient } from "./fixture-client.js";
import {
  buildGeminiGenerateContentBody,
  stripCloudflareGoogleModelPrefix,
} from "./gemini.js";
import { buildDiagramGenerationMessages } from "./messages.js";
import { candidateFromText, responseErrorDiagnostic } from "./candidates.js";

const scenario = getScenario("sketchi-onboarding-decision-flow");
const expectedText = JSON.stringify(scenario.expectedDiagram, null, 2);
const geminiResponse = {
  candidates: [
    {
      content: {
        role: "model",
        parts: [{ text: expectedText }],
      },
      finishReason: "STOP",
    },
  ],
  usageMetadata: {
    candidatesTokenCount: 23,
    promptTokenCount: 11,
    totalTokenCount: 34,
  },
};

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("diagram generation prompt mapping", () => {
  it("keeps system and user instructions as separate messages", () => {
    const prompt = buildDiagramGenerationMessages(scenario);

    expect(prompt.messages).toHaveLength(2);
    expect(prompt.messages[0]).toMatchObject({ role: "system" });
    expect(prompt.messages[0].content).toContain("Flowchart IR rules");
    expect(prompt.messages[1]).toMatchObject({ role: "user" });
    expect(prompt.messages[1].content).toContain(scenario.prompt);
  });

  it("maps flowchart prompts into Gemini REST system instruction and contents", () => {
    const body = buildGeminiGenerateContentBody({
      maxOutputTokens: 512,
      model: "google/gemini-3.1-flash-lite",
      scenario,
      temperature: 0.2,
    });

    expect(body.system_instruction.parts[0]?.text).toContain(
      "Flowchart IR rules",
    );
    expect(body.contents[0]?.parts[0]?.text).toContain(scenario.prompt);
    expect(body.generationConfig).toEqual({
      maxOutputTokens: 512,
      response_mime_type: "application/json",
      temperature: 0.2,
    });
  });

  it("normalizes Cloudflare Google model ids for provider-native calls", () => {
    expect(
      stripCloudflareGoogleModelPrefix("google/gemini-3.1-flash-lite"),
    ).toBe("gemini-3.1-flash-lite");
    expect(
      stripCloudflareGoogleModelPrefix(
        "google-ai-studio/gemini-3.1-flash-lite",
      ),
    ).toBe("gemini-3.1-flash-lite");
  });
});

describe("diagram generation clients", () => {
  it("preserves explicit provider errors instead of replacing them with parse errors", () => {
    const candidate = candidateFromText({
      diagnostics: ["AI Gateway compat request failed with HTTP 401."],
      error: "HTTP 401",
      model: "google-ai-studio/gemini-3.1-flash-lite",
      provider: "cloudflare-ai-gateway-compat",
      text: "",
    });

    expect(candidate.error).toBe("HTTP 401");
    expect(candidate.diagnostics).toContain(
      "AI Gateway compat request failed with HTTP 401.",
    );
  });

  it("extracts common provider error diagnostics from HTTP response bodies", () => {
    expect(
      responseErrorDiagnostic({
        errors: [{ message: "Gateway authentication failed." }],
      }),
    ).toBe("Gateway authentication failed.");
    expect(
      responseErrorDiagnostic({ error: { message: "Unknown model." } }),
    ).toBe("Unknown model.");
  });

  it("returns parseable flowchart IR from the fixture client", async () => {
    const candidate = await createFixtureGenerationClient().generate({
      model: "fixture",
      scenario,
    });

    expect(candidate.error).toBeUndefined();
    expect(candidate.diagram?.id).toBe(scenario.expectedDiagram.id);
  });

  it("uses the Cloudflare AI Gateway provider-native Google route", async () => {
    const run = vi.fn(async () => jsonResponse(geminiResponse));
    const client = createCloudflareGoogleAiStudioClient({
      ai: {
        gateway: () => ({
          getUrl: vi.fn(),
          run,
        }),
      },
      gatewayId: "sketchi",
    });

    const candidate = await client.generate({
      model: "google/gemini-3.1-flash-lite",
      scenario,
    });

    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v1beta/models/gemini-3.1-flash-lite:generateContent",
        provider: "google-ai-studio",
      }),
      expect.objectContaining({
        gateway: expect.objectContaining({
          collectLog: true,
          metadata: expect.objectContaining({
            scenarioId: scenario.id,
          }),
        }),
      }),
    );
    expect(candidate.diagram?.id).toBe(scenario.expectedDiagram.id);
    expect(candidate.usage?.totalTokens).toBe(34);
  });

  it("uses Cloudflare native AI.run with the requested model", async () => {
    const run = vi.fn(async () => ({
      choices: [{ message: { content: expectedText } }],
      usage: {
        completion_tokens: 5,
        prompt_tokens: 8,
        total_tokens: 13,
      },
    }));
    const client = createCloudflareWorkersAiClient({
      ai: { run },
      gatewayId: "sketchi",
    });

    const candidate = await client.generate({
      model: "google/gemini-3.1-flash-lite",
      scenario,
    });

    expect(run).toHaveBeenCalledWith(
      "google/gemini-3.1-flash-lite",
      expect.objectContaining({
        messages: expect.any(Array),
        response_format: { type: "json_object" },
      }),
      expect.objectContaining({
        gateway: expect.objectContaining({
          id: "sketchi",
        }),
      }),
    );
    expect(candidate.diagram?.id).toBe(scenario.expectedDiagram.id);
    expect(candidate.usage?.totalTokens).toBe(13);
  });

  it("can call the experimental Gateway compat endpoint without provider keys", async () => {
    const fetcher = vi.fn(
      async (
        _input: RequestInfo | URL,
        _init?: RequestInit,
      ): Promise<Response> =>
        jsonResponse({
          choices: [{ message: { content: expectedText } }],
          usage: {
            completion_tokens: 5,
            prompt_tokens: 8,
            total_tokens: 13,
          },
        }),
    );
    const client = createCloudflareAiGatewayCompatClient({
      endpointUrl:
        "https://gateway.ai.cloudflare.com/v1/account/sketchi/compat/chat/completions",
      fetch: fetcher,
    });

    const candidate = await client.generate({
      model: "google/gemini-3.1-flash-lite",
      scenario,
    });

    const requestInit = fetcher.mock.calls[0]?.[1];
    const body = JSON.parse(String(requestInit?.body));

    expect(fetcher).toHaveBeenCalledWith(
      "https://gateway.ai.cloudflare.com/v1/account/sketchi/compat/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
    expect(body.model).toBe("google/gemini-3.1-flash-lite");
    expect(body.messages[0].role).toBe("system");
    expect(candidate.diagram?.id).toBe(scenario.expectedDiagram.id);
    expect(candidate.usage?.totalTokens).toBe(13);
  });
});
