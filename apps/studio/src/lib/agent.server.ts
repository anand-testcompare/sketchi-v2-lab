import "@tanstack/react-start/server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { CloudflareAiGatewayProvider } from "@sketchi/diagram-generation";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";

import {
  DiagramToolInputSchema,
  gradeDiagram,
  normalizeDiagramInput,
} from "./diagram-tool";

/**
 * Sketchi studio agent: AI SDK agent loop over the Cloudflare AI Gateway.
 *
 * The Workers `env.AI` binding stays the single auth path (gateway-stored
 * provider keys, no local secrets); a fetch shim translates the google
 * provider's HTTP requests into `gateway.run()` calls. The agent has two
 * jobs — requirement intake in chat, then building the diagram through the
 * graded `create_diagram` tool until accepted.
 */

export interface StudioEnv {
  AI?: CloudflareAiGatewayProvider;
  SKETCHI_AI_GATEWAY_ID?: string;
  SKETCHI_AI_MODEL?: string;
}

const DEFAULT_GATEWAY_ID = "google-ai-studio";
const DEFAULT_MODEL = "google/gemini-3.1-flash-lite";
const MAX_AGENT_STEPS = 8;
const MAX_OUTPUT_TOKENS = 4_096;

/** Never fetched — exists only so the shim can split off the request path. */
const SHIM_BASE_URL = "https://sketchi-gateway.invalid/v1beta";

const SYSTEM_PROMPT = `You are Sketchi, a diagramming agent with two jobs.

JOB 1 — INTAKE. On a new request, decide whether you can already name the diagram's purpose, its audience, and the 4–12 things it must show. If not, ask at most 3 sharp clarifying questions in one short message and wait. If the request is already specific — or the user says to just draw — go straight to job 2. Never ask a second round of questions unless the user invites it.

JOB 2 — BUILD. Say in one short sentence what you are about to sketch, then call create_diagram. The tool validates and grades your work and the result appears on the user's canvas — never paste the diagram into chat as JSON, mermaid, or ASCII art.
- Accepted: close with 1–2 sentences on how to read the diagram, then offer exactly one concrete refinement.
- Not accepted: say in one clause what you are fixing, fix every listed issue, and call create_diagram again. Hard limit of 3 attempts per turn; if still not accepted, keep the best version and say what you'd change with more guidance.
- Later change requests: call create_diagram again with the complete revised diagram — it replaces the canvas.

DIAGRAM CRAFT
- Node ids: short kebab-case. Labels: 5 words max, specific ("Validate card details", never "Step 2").
- kind: "start"/"end" for entry and exit points, "decision" for branch points (every decision needs at least 2 outgoing edges, each labeled, e.g. "yes"/"no"), "data" for stores, "external" for third parties, "process" otherwise.
- Connect every node into the flow. Label any edge whose meaning isn't obvious.
- direction: "TB" for step-by-step flows, "LR" for pipelines and lifecycles.

VOICE: warm, concise, concrete. Short paragraphs, markdown only where it clarifies. You are a sketchbook companion, not a form.`;

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

function createStudioModel(env: StudioEnv) {
  if (!env.AI) {
    throw new Error(
      "AI binding is not configured in this Worker environment (env.AI).",
    );
  }

  const gateway = env.AI.gateway(
    envString(env, "SKETCHI_AI_GATEWAY_ID", DEFAULT_GATEWAY_ID),
  );
  const modelId = stripGoogleModelPrefix(
    envString(env, "SKETCHI_AI_MODEL", DEFAULT_MODEL),
  );

  const gatewayFetch: typeof fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    const body =
      typeof init?.body === "string" ? JSON.parse(init.body) : undefined;

    return gateway.run(
      {
        endpoint: `${url.pathname.replace(/^\//, "")}${url.search}`,
        provider: "google-ai-studio",
        headers: { "Content-Type": "application/json" },
        query: body,
      },
      {
        gateway: {
          collectLog: true,
          metadata: { sketchiSurface: "studio-agent" },
        },
      },
    );
  };

  const provider = createGoogleGenerativeAI({
    // Real auth is the gateway's stored provider key (BYOK); the shim drops
    // this placeholder header before the request leaves the Worker.
    apiKey: "managed-by-cloudflare-gateway",
    baseURL: SHIM_BASE_URL,
    fetch: gatewayFetch,
  });

  return provider(modelId);
}

function buildAgentTools() {
  let attempt = 0;

  return {
    create_diagram: tool({
      description:
        "Create or replace the diagram on the user's canvas. Validates the structure and returns a grade report; revise and call again until accepted.",
      inputSchema: DiagramToolInputSchema,
      execute: (input) => {
        attempt += 1;
        try {
          const diagram = normalizeDiagramInput(input);
          return Promise.resolve({ ...gradeDiagram(diagram), attempt });
        } catch (error) {
          return Promise.resolve({
            accepted: false,
            grade: 0,
            attempt,
            issues: [
              `error: ${error instanceof Error ? error.message : "invalid diagram structure"}`,
            ],
            summary: "did not validate",
          });
        }
      },
    }),
  };
}

export async function runStudioAgent(
  env: StudioEnv,
  messages: UIMessage[],
): Promise<Response> {
  const result = streamText({
    model: createStudioModel(env),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: buildAgentTools(),
    stopWhen: stepCountIs(MAX_AGENT_STEPS),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    temperature: 0.4,
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    onError: (error) =>
      error instanceof Error ? error.message : "The agent run failed.",
  });
}
