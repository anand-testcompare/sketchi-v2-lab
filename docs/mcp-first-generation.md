# MCP-First Generation Scope

## Decision

Do every useful generation capability that does **not** require Sketchi-owned
threads, durable runs, user accounts, or Convex storage.

The product bet is that most early usage comes through MCP and external agent
harnesses. The repo should therefore make generation valuable before the normal
managed UI exists.

```mermaid
flowchart LR
  Agent["Codex, Claude, OpenCode,<br/>custom harnesses"] --> MCP["MCP tools"]
  Agent --> HTTP["HTTP APIs"]
  CLI["Local CLI/evals"] --> Core["shared generation packages"]
  MCP --> Core
  HTTP --> Core
  Core --> Artifact["diagram artifact"]
  Core --> Evidence["grade, warnings,<br/>render proof, exports"]
```

## In Scope

| Capability                  | User value                                             | Convex dependency |
| --------------------------- | ------------------------------------------------------ | ----------------- |
| Draft a diagram from intent | Get a usable first artifact from messy input           | None              |
| Revise a supplied diagram   | Caller keeps state, Sketchi applies a requested change | None              |
| Normalize model/tool output | Recover useful IR from imperfect model output          | None              |
| Validate IR                 | Explain structural defects before rendering            | None              |
| Grade artifact quality      | Tell agents whether the result is strong enough        | None              |
| Render proof                | Produce visual evidence for tests and agents           | None              |
| Export Excalidraw           | Give callers a real portable artifact                  | None              |
| Run scenarios               | Regression/demo suite for generation quality           | None              |
| Serve MCP tools             | Let many agent harnesses call the same capabilities    | None              |

## Out Of Scope

| Defer                          | Why                                             |
| ------------------------------ | ----------------------------------------------- |
| Managed threads                | Requires Convex messages/runs/artifact history  |
| User-owned artifact library    | Requires auth, persistence, and product records |
| Studio version history         | Requires durable lineage                        |
| Account/team/rate-limit policy | Requires product state                          |
| Confect/Convex refactor        | Useful later, not needed for MCP-first value    |

## Target Tool Surface

These are product tools, not internal function names.

```mermaid
flowchart TB
  Draft["draft_diagram"] --> Artifact["diagram artifact"]
  Revise["revise_diagram"] --> Artifact
  Normalize["normalize_diagram"] --> IR["valid or invalid IR"]
  Validate["validate_diagram_ir"] --> Report["diagnostic report"]
  Grade["grade_diagram"] --> Report
  Render["render_diagram"] --> Preview["PNG or render evidence"]
  Export["export_excalidraw"] --> File[".excalidraw JSON"]
  Scenario["run_generation_scenario"] --> Report
```

| Tool                      | Input                             | Output                                                   |
| ------------------------- | --------------------------------- | -------------------------------------------------------- |
| `draft_diagram`           | prompt, optional scenario/profile | candidate IR, diagnostics, grade                         |
| `revise_diagram`          | existing IR, revision request     | revised IR, diagnostics, grade                           |
| `normalize_diagram`       | raw model/tool output             | normalized IR or structured errors                       |
| `validate_diagram_ir`     | IR                                | validation result, defects, suggested repair hints       |
| `grade_diagram`           | IR or rendered scene              | acceptance result, rubric scores, warnings               |
| `render_diagram`          | IR or scene                       | render evidence, optional PNG when renderer is available |
| `export_excalidraw`       | valid IR or scene                 | Excalidraw JSON                                          |
| `run_generation_scenario` | scenario id, mode                 | scenario result and artifact evidence                    |

Do not add thread tools yet:

- no `create_thread`;
- no `continue_thread`;
- no `list_user_artifacts`;
- no `accept_artifact`;
- no `get_run_status`.

## Package Plan

```mermaid
flowchart LR
  StudioSpike["apps/studio current spike"] -.extract.-> Agent["packages/diagram-agent"]
  Agent --> Generation["packages/diagram-generation"]
  Agent --> Core["packages/diagram-core"]
  Agent --> Renderer["packages/diagram-renderer"]
  Renderer --> Excalidraw["packages/diagram-excalidraw"]
  Agent --> RenderTool["packages/diagram-render-proof"]
  MCP["apps/agents or apps/api-mcp"] --> Agent
  CLI["tools/diagram-cli"] --> Agent
```

| Package/app                     | Responsibility                                                    |
| ------------------------------- | ----------------------------------------------------------------- |
| `diagram-agent`                 | draft/revise orchestration, grading, repair policy, Effect errors |
| `diagram-generation`            | Gemini request/response and candidate parsing                     |
| `diagram-core`                  | IR schema, parse, semantic validation                             |
| `diagram-renderer`              | deterministic scene generation                                    |
| `diagram-excalidraw`            | Excalidraw conversion/export validation                           |
| `diagram-render-proof`          | browser-backed visual proof adapter                               |
| `apps/api-mcp` or `apps/agents` | remote MCP/HTTP adapters over the package runtime                 |
| `tools/diagram-cli`             | local commands for evals and non-hosted tests                     |

## Effect Refactor

Use Effect where it improves the actual generation runtime. Do not spread it
through every package for aesthetics.

```mermaid
sequenceDiagram
  participant Adapter as MCP/HTTP/CLI adapter
  participant Schema as Effect schema decode
  participant Runtime as Effect runtime pipeline
  participant Core as deterministic packages
  participant Result as plain JSON result

  Adapter->>Schema: unknown input
  Schema->>Runtime: typed request or typed parse error
  Runtime->>Core: validate, grade, render, export
  Core-->>Runtime: artifact or defect
  Runtime-->>Result: success/error union
  Result-->>Adapter: transport-safe JSON
```

| Step                                                     | Scope                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| 1. Add Effect to the generation package layer            | Keep Zod at route boundaries until replacement earns itself |
| 2. Define typed request/result/error contracts           | Same contracts feed MCP, HTTP, CLI, tests                   |
| 3. Convert model output parsing into Effect decode paths | Bad model output becomes structured recoverable failure     |
| 4. Encode grading and repair as typed results            | Agents can decide whether to retry, revise, or accept       |
| 5. Add adapters back to plain JSON/Zod when needed       | MCP clients should not need to understand Effect            |

Do not use Effect for React state, Convex schemas, or route handler plumbing in
this slice.

## Rendering Plan

We need two separate rendering concepts:

| Need                               | First answer                  | Later answer                                    |
| ---------------------------------- | ----------------------------- | ----------------------------------------------- |
| Deterministic diagram layout       | existing `diagram-renderer`   | same                                            |
| Excalidraw export                  | existing `diagram-excalidraw` | same                                            |
| Visual proof for tests/agents      | local Playwright utility      | serverless browser adapter                      |
| Production PNG/PDF-style rendering | defer                         | Cloudflare Browser Run or Browserbase Functions |

Start local:

```mermaid
flowchart LR
  IR["valid IR"] --> Scene["scene model"]
  Scene --> Excalidraw["Excalidraw JSON"]
  Excalidraw --> LocalPage["local render page"]
  LocalPage --> Playwright["Playwright screenshot"]
  Playwright --> Evidence["PNG + render assertions"]
```

Why local first:

- the repo already has Playwright;
- it unblocks grading/eval proof immediately;
- it avoids choosing hosted browser infrastructure too early;
- it gives Browserbase/Cloudflare adapters a precise compatibility target.

Then add a hosted render port:

```mermaid
flowchart TB
  RenderPort["RenderProofPort"]
  Local["Local Playwright adapter"]
  Browserbase["Browserbase Functions adapter"]
  Cloudflare["Cloudflare Browser Run adapter"]

  RenderPort --> Local
  RenderPort --> Browserbase
  RenderPort --> Cloudflare
```

### Hosted Candidates

| Option                 | Good for                                                                      | Watch out                                                        |
| ---------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Browserbase Functions  | Playwright-native scripts deployed as API-callable browser functions          | Adds another vendor and provider/runtime constraints to review   |
| Cloudflare Browser Run | Worker-aligned screenshots/PDFs/browser sessions near existing deploy surface | Needs Worker binding/API setup and browser-runtime limits review |
| Local Playwright only  | Fastest proof and deterministic CI/local tests                                | Not a production render service                                  |

Recommendation: implement the local render utility first, then run one small
adapter spike. Prefer Cloudflare Browser Run if the MCP/API surface stays on
Workers. Prefer Browserbase Functions if we want browser rendering isolated from
the Worker and closer to standard Playwright deployment.

## Implementation Steps

```mermaid
flowchart TD
  A["1. Extract non-Convex runtime"] --> B["2. Add Effect contracts"]
  B --> C["3. Define MCP tool catalog"]
  C --> D["4. Add CLI/eval harness"]
  D --> E["5. Add local render proof"]
  E --> F["6. Add remote MCP or HTTP adapter"]
  F --> G["7. Prove with multiple harnesses"]
  G --> H["8. Decide hosted renderer"]
```

### 1. Extract Non-Convex Runtime

Move existing Studio spike behavior into importable package functions:

- draft;
- revise;
- normalize;
- validate;
- grade;
- render/export.

The Studio app can keep calling the package, but it should no longer own the
behavior.

### 2. Add Effect Contracts

Create stable request/result/error contracts around generation operations.

Acceptance:

- bad input returns typed errors;
- malformed model output is recoverable;
- public JSON result shape is documented;
- tests cover success, validation failure, model-output failure, and repairable
  failure.

### 3. Define MCP Tool Catalog

Document tool names, descriptions, input schemas, and output schemas before
writing transport code.

Acceptance:

- tools are discoverable by name;
- descriptions explain when an agent should call each tool;
- no managed thread tools are included;
- MCP, HTTP, and CLI can use the same catalog.

### 4. Add CLI/Eval Harness

Build local commands that exercise the exact same package runtime as MCP will.

Acceptance:

- run one scenario with fixture mode;
- run one scenario with Gemini mode when credentials are present;
- write `.memory/` evidence for artifacts and render screenshots;
- no Convex env required.

### 5. Add Local Render Proof

Create a local Playwright-backed utility that opens a minimal render page and
captures evidence.

Acceptance:

- PNG evidence exists for a valid flowchart;
- assertions catch blank canvas, missing nodes, and obvious text/layout failure;
- this works without a deployed app.

### 6. Add Remote Adapter

Expose the same catalog through a remote MCP or HTTP app, likely Worker-backed.

Acceptance:

- endpoint is independently deployable;
- local package imports are native Nx imports;
- tool calls return the same result shape as CLI;
- no Convex calls or Convex env vars.

### 7. Prove With Multiple Harnesses

The first proof should not be "works in our UI."

Acceptance:

- CLI proof;
- local MCP client proof;
- Codex or Claude MCP proof;
- Worker preview proof if remote adapter is included;
- one scenario matrix proof with generated artifact evidence.

### 8. Decide Hosted Renderer

Only after local render proof is stable, pick a hosted adapter.

Acceptance:

- one Browserbase Functions or Cloudflare Browser Run proof renders the same
  artifact as local Playwright;
- failures are mapped to the same typed render errors;
- the hosted renderer is optional behind a capability flag.

## Proof Matrix

| Proof                             | Required before Convex?     |
| --------------------------------- | --------------------------- |
| `pnpm nx test diagram-agent`      | yes                         |
| `pnpm nx test diagram-generation` | yes                         |
| local CLI scenario fixture        | yes                         |
| local CLI Gemini scenario         | yes when credentials exist  |
| local render screenshot           | yes                         |
| MCP tool listing                  | yes                         |
| MCP draft/revise/grade call       | yes                         |
| remote Worker preview smoke       | yes if adapter is in the PR |
| managed thread smoke              | no                          |
| Studio artifact history           | no                          |

## References

- Agentic generation overview: [docs/agentic-generation.md](agentic-generation.md)
- Cloudflare Browser Run: https://developers.cloudflare.com/browser-run/
- Browserbase Functions:
  https://docs.browserbase.com/platform/runtime/overview
- Effect Schema: https://effect.website/docs/schema/introduction/
- MCP TypeScript SDK: https://ts.sdk.modelcontextprotocol.io/
