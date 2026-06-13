# Agentic Generation

## Decision

Keep **normal Convex** for product state. Put the valuable generation behavior in
shared Nx packages. Use **Effect inside those packages** when it improves
schemas, typed errors, and pipeline tests.

AI SDK stays narrow: chat streaming, model calls, and tool-call transport.
Gemini 3.1 Flash Lite is the only planned model path for now.

```mermaid
flowchart LR
  User["User or external agent"]
  Studio["Studio UI"]
  Convex["Convex<br/>threads, runs, artifacts"]
  Worker["Cloudflare Worker<br/>HTTP, MCP, AI Gateway"]
  Core["Nx packages<br/>contracts, IR, validation,<br/>grading, rendering"]
  Gemini["Gemini 3.1 Flash Lite"]
  Files["Exports<br/>Excalidraw, PNG, JSON"]

  User --> Studio
  Studio --> Convex
  User --> Worker
  Convex --> Core
  Worker --> Core
  Core --> Gemini
  Core --> Files
```

## Route Surfaces

```mermaid
flowchart TB
  Managed["1. Managed thread<br/>Sketchi owns chat state"]
  Stateless["2. Stateless agent tools<br/>Caller owns chat state"]
  Deterministic["3. Deterministic APIs<br/>Caller owns IR or output"]

  Managed --> ConvexAdapter["Convex adapter"]
  Stateless --> ApiAdapter["HTTP or MCP adapter"]
  Deterministic --> ApiAdapter

  ConvexAdapter --> Runtime["diagram-generation runtime"]
  ApiAdapter --> Runtime

  Runtime --> Contracts["schemas and errors"]
  Runtime --> Normalize["normalize"]
  Runtime --> Validate["validate"]
  Runtime --> Grade["grade"]
  Runtime --> Render["render/export"]
```

| Surface              | Owns                                       | Example calls                                      | Best runtime                         |
| -------------------- | ------------------------------------------ | -------------------------------------------------- | ------------------------------------ |
| Managed thread       | Messages, async progress, artifact history | `createThread`, `continueThread`, `acceptArtifact` | Convex                               |
| Stateless agent tool | One request/response generation task       | `draft_diagram`, `revise_diagram`, `grade_diagram` | Worker, MCP, or Convex action        |
| Deterministic API    | Pure checks and conversions                | `normalize`, `validateIr`, `render`, `export`      | Shared package, wrapped by any route |

## Package Shape

```mermaid
flowchart LR
  AgentServer["apps/studio/src/lib/agent.server.ts<br/>route adapter"]

  subgraph Packages["Shared Nx packages"]
    Core["diagram-core<br/>IR + semantic validation"]
    Renderer["diagram-renderer<br/>scene layout"]
    Excalidraw["diagram-excalidraw<br/>real Excalidraw conversion"]
    Generation["diagram-generation<br/>prompt contracts + candidates"]
    Agent["diagram-agent<br/>graded tool runtime"]
  end

  AgentServer --> Agent
  Agent --> Generation
  Agent --> Core
  Agent --> Renderer
  Renderer --> Excalidraw
```

| Package              | Keep here                                                    | Keep out                           |
| -------------------- | ------------------------------------------------------------ | ---------------------------------- |
| `diagram-core`       | IR types, parsing, semantic validation, fixtures             | Model calls, storage               |
| `diagram-renderer`   | Deterministic scene model                                    | Provider logic, user/session state |
| `diagram-excalidraw` | Excalidraw conversion and validation                         | Chat orchestration                 |
| `diagram-generation` | Gemini request/response helpers, prompt messages, candidates | Durable threads                    |
| `diagram-agent`      | Tool contract, normalize, grade, repair, revise, eval replay | App routes, auth, provider menus   |

## Effect + Nx

Effect and Nx do not compete.

```mermaid
flowchart TB
  Nx["Nx<br/>project graph, builds, affected tests"]
  EffectPkg["Effect-powered package<br/>schema, typed errors, pipeline"]
  App["App or backend route<br/>plain adapter"]
  Tests["Vitest/evals<br/>fixtures and failure modes"]

  Nx --> EffectPkg
  Nx --> App
  Nx --> Tests
  App --> EffectPkg
  Tests --> EffectPkg
```

| Question                            | Answer                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| Does Nx need special Effect config? | No. Effect is just TypeScript inside an Nx package.                               |
| What does Nx add?                   | Boundaries, imports, cacheable targets, affected checks.                          |
| What does Effect add?               | Typed pipelines, typed failures, schema-first parsing, testable retries/timeouts. |
| Where should Effect live first?     | `packages/diagram-generation` or the planned `packages/diagram-agent`.            |
| Where should it not leak yet?       | React UI, Convex schema, or Cloudflare route handlers unless that buys clarity.   |

Preferred shape:

```mermaid
sequenceDiagram
  participant Route as Convex/Worker/MCP route
  participant Adapter as Thin adapter
  participant EffectCore as Effect pipeline
  participant Store as Convex storage

  Route->>Adapter: plain args
  Adapter->>EffectCore: parse + run
  EffectCore-->>Adapter: typed success or typed failure
  Adapter->>Store: persist run/artifact when needed
  Adapter-->>Route: plain JSON response
```

## Runtime Ownership

```mermaid
flowchart LR
  Convex["Convex"]
  Worker["Cloudflare Worker"]
  MCP["MCP server"]
  Packages["Shared packages"]

  Convex -->|"stateful imports"| Packages
  Worker -->|"edge/API imports"| Packages
  MCP -->|"tool imports"| Packages

  Convex -.stores.-> State["threads, messages,<br/>runs, artifacts"]
  Worker -.uses.-> Gateway["Cloudflare AI Gateway"]
  MCP -.exposes.-> Tools["managed, stateless,<br/>deterministic tools"]
```

| Runtime | Good at                                                 | Should not become                      |
| ------- | ------------------------------------------------------- | -------------------------------------- |
| Convex  | Product state, auth, threads, artifacts, async progress | The only way to run generation         |
| Worker  | Public HTTP, MCP, AI Gateway, independent deploys       | The source of truth for shared logic   |
| MCP     | Agent-facing tools                                      | A parallel implementation              |
| AI SDK  | Model calls, streaming, tool-call plumbing              | Artifact contract or provider strategy |

## Next Slice

The next implementation slice should be MCP-first and non-Convex. See
[MCP-First Generation Scope](mcp-first-generation.md) for the concrete steps.

```mermaid
flowchart TD
  A["Extract tool contract"] --> B["Move normalize + validate"]
  B --> C["Move grade + acceptance"]
  C --> D["Add bounded repair/revision"]
  D --> E["Expose one route adapter"]
  E --> F["Fixture/eval coverage"]
```

Acceptance criteria:

- `agent.server.ts` becomes a route adapter, not the generation runtime.
- Tool schema, normalization, grading, and repair are importable from a package.
- Studio still streams a real Gemini 3.1 Flash Lite generation.
- Tests cover malformed tool args, invalid edges, weak branching, accepted IR,
  and revision against prior accepted context.
- No OpenRouter path, provider menu, or generalized model router.

## References

- Convex Agent overview: https://docs.convex.dev/agents/overview
- Convex Agent streaming: https://docs.convex.dev/agents/streaming
- Cloudflare AI Gateway Worker binding methods:
  https://developers.cloudflare.com/changelog/post/2025-01-26-worker-binding-methods/
