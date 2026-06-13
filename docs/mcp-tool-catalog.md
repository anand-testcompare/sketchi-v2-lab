# Sketchi Code Mode API Contract

This is the implementation spec for the first Sketchi agent-facing API surface.
It replaces the earlier "MCP tool catalog" framing with a narrower boundary:
Sketchi exposes a small MCP server for external agent harnesses, and the Code
Mode sandbox calls curated host APIs. The host APIs are normal Worker APIs backed
by the shared diagram packages.

The goal is not to make every internal function callable. The goal is to let
Claude Code, Codex, OpenCode, and similar harnesses build a correct flowchart
artifact through one clear contract, get structured repair feedback when they
are wrong, and retrieve the finished artifact.

## Decisions

- Use Code Mode for agent orchestration.
- Do not model the diagram runtime as a set of granular MCP tools.
- Do not expose `validate`, `grade`, `render`, or `export` as public operations.
- Use normal host APIs as the source of truth for request and response shapes.
- Register curated Code Mode functions over those host APIs.
- Start with `buildFlowchart` and `getArtifact`.
- Keep `draft` and managed threads out of this slice.
- Keep Effect, storage, auth, rendering, and model credentials host-side.

```mermaid
flowchart LR
  Harness["external harness<br/>Claude Code / Codex / OpenCode"]
  McpServer["Sketchi MCP server"]
  Execute["execute<br/>Code Mode"]
  Sandbox["dynamic Worker sandbox<br/>agent-written JavaScript"]
  HostApi["host APIs<br/>normal Worker routes"]
  Packages["shared diagram packages"]
  Artifact["artifact handle"]

  Harness --> McpServer
  McpServer --> Execute
  Execute --> Sandbox
  Sandbox -->|"sketchi.buildFlowchart(...)"| HostApi
  HostApi --> Packages
  HostApi --> Artifact
```

## Boundary

Sketchi has three layers. Only the top layer is MCP. The middle layer is Code
Mode. The bottom layer is the product API/runtime.

```mermaid
flowchart TB
  subgraph External["external agent harness"]
    Agent["LLM + harness loop"]
  end

  subgraph MCP["Sketchi MCP transport"]
    Docs["docs"]
    Search["search"]
    Execute["execute"]
  end

  subgraph CodeMode["Code Mode sandbox"]
    JS["agent-written async JavaScript"]
    Client["sketchi.* typed client"]
  end

  subgraph Host["host Worker"]
    Auth["auth + identity"]
    Api["normal API handlers"]
    Effects["Effect/package pipeline"]
    Store["artifact storage"]
  end

  subgraph Packages["Nx packages"]
    Core["diagram-core"]
    Renderer["diagram-renderer"]
    Excalidraw["diagram-excalidraw"]
    AgentRuntime["diagram-agent"]
  end

  Agent --> Docs
  Agent --> Search
  Agent --> Execute
  Execute --> JS
  JS --> Client
  Client --> Api
  Auth --> Api
  Api --> Effects
  Effects --> Core
  Effects --> Renderer
  Effects --> Excalidraw
  Effects --> AgentRuntime
  Effects --> Store
```

The sandbox is not trusted with secrets, tokens, storage bindings, model
credentials, or direct network access. It receives typed functions only.

```mermaid
flowchart LR
  Sandbox["sandbox code"]
  HostFunction["host function dispatcher"]
  WorkerApi["Worker API handler"]
  Secret["secrets and bindings"]

  Sandbox -. "no env / no secrets / no fetch" .-> Secret
  Sandbox -->|"typed call"| HostFunction
  HostFunction --> WorkerApi
  WorkerApi --> Secret
```

## Public MCP Surface

The external MCP server should stay small. The names below are MCP tools from
the harness point of view, not diagram runtime functions.

| MCP tool  | Purpose                                                           | Calls diagram runtime? |
| --------- | ----------------------------------------------------------------- | ---------------------- |
| `docs`    | Return the curated API contract, examples, and current non-goals. | No                     |
| `search`  | Search operation docs, issue codes, examples, and schema notes.   | No                     |
| `execute` | Run Code Mode JavaScript with the `sketchi.*` client injected.    | Yes                    |

```mermaid
sequenceDiagram
  participant H as Harness
  participant M as Sketchi MCP
  participant S as Code Mode sandbox
  participant A as Host API

  H->>M: docs({ topic: "buildFlowchart" })
  M-->>H: contract + examples
  H->>M: execute({ code })
  M->>S: run async JavaScript
  S->>A: sketchi.buildFlowchart(input)
  A-->>S: BuildFlowchartResult
  S-->>M: returned result
  M-->>H: result
```

### `docs`

```ts
interface DocsRequest {
  topic?:
    | "overview"
    | "execute"
    | "buildFlowchart"
    | "getArtifact"
    | "issues"
    | "examples";
}

interface DocsResult {
  topic: string;
  content: string;
  examples: CodeExample[];
  version: string;
}

interface CodeExample {
  title: string;
  language: "ts" | "js" | "json";
  code: string;
}
```

### `search`

```ts
interface SearchRequest {
  query: string;
  limit?: number;
}

interface SearchResult {
  query: string;
  results: SearchHit[];
}

interface SearchHit {
  id: string;
  kind: "operation" | "schema" | "issue" | "example" | "non_goal";
  title: string;
  snippet: string;
  score: number;
}
```

### `execute`

The `execute` tool runs an async JavaScript arrow function in Code Mode. The
tool description must include the current `sketchi.*` TypeScript declarations
and one flowchart repair-loop example.

```ts
interface ExecuteRequest {
  code: string;
}

type ExecuteResult =
  | {
      ok: true;
      result: unknown;
      logs: string[];
    }
  | {
      ok: false;
      error: string;
      logs: string[];
    };
```

Inside `execute`, the sandbox receives this namespace:

```ts
declare const sketchi: {
  buildFlowchart(input: BuildFlowchartRequest): Promise<BuildFlowchartResult>;
  getArtifact(input: GetArtifactRequest): Promise<GetArtifactResult>;
};
```

The sandbox must not receive low-level API keys, tokens, bindings, or raw
storage handles.

## Host API Surface

These are normal host API operations. Code Mode functions call them through the
host dispatcher. A future HTTP adapter can expose the same contracts directly.

```mermaid
flowchart LR
  Code["sandbox<br/>sketchi.*"]
  Dispatcher["host dispatcher"]
  Build["POST /v1/flowcharts/build"]
  Artifact["GET /v1/artifacts/:artifactId"]
  Runtime["shared runtime"]

  Code --> Dispatcher
  Dispatcher --> Build
  Dispatcher --> Artifact
  Build --> Runtime
  Artifact --> Runtime
```

| Host operation                  | Code Mode function              | Public now?           |
| ------------------------------- | ------------------------------- | --------------------- |
| `POST /v1/flowcharts/build`     | `sketchi.buildFlowchart(input)` | Yes                   |
| `GET /v1/artifacts/:artifactId` | `sketchi.getArtifact(input)`    | Yes                   |
| validate IR                     | none                            | No, internal to build |
| grade quality                   | none                            | No, internal to build |
| render scene                    | none                            | No, internal to build |
| export Excalidraw               | none                            | No, internal to build |
| draft from prompt               | none                            | No, later             |
| managed thread                  | none                            | No, later             |

## `buildFlowchart`

`buildFlowchart` is the first real product operation. It accepts a creation
friendly flowchart spec, validates it, grades it, renders it, exports it to
Excalidraw, stores requested artifacts, and returns either an accepted artifact
or structured repair feedback.

```mermaid
flowchart TD
  Input["BuildFlowchartRequest"]
  Decode["decode request"]
  Normalize["normalize ids, layout, style"]
  Validate["validate flowchart contract"]
  Quality["grade quality"]
  Render["render deterministic scene"]
  Export["export Excalidraw"]
  ValidateScene["validate exported scene"]
  Store["store artifacts"]
  Success["ok: true"]
  Failure["ok: false + Issue[]"]

  Input --> Decode
  Decode --> Normalize
  Normalize --> Validate
  Validate --> Quality
  Quality --> Render
  Render --> Export
  Export --> ValidateScene
  ValidateScene --> Store
  Store --> Success

  Decode -.-> Failure
  Validate -.-> Failure
  Quality -.-> Failure
  Render -.-> Failure
  Export -.-> Failure
  ValidateScene -.-> Failure
  Store -.-> Failure
```

### Request

```ts
interface BuildFlowchartRequest {
  requestId?: string;
  spec: FlowchartSpec;
  options?: BuildFlowchartOptions;
}

interface BuildFlowchartOptions {
  artifactFormats?: ArtifactFormat[];
  inlineArtifacts?: InlineArtifactFormat[];
  minQualityScore?: number;
}

type ArtifactFormat = "excalidraw" | "scene" | "png";
type InlineArtifactFormat = "excalidraw" | "scene";
```

Defaults:

```json
{
  "artifactFormats": ["excalidraw", "scene"],
  "inlineArtifacts": ["excalidraw"],
  "minQualityScore": 8
}
```

### Flowchart Spec

The public input is not the full internal IR. It is the smallest shape agents
need to author correctly.

```ts
interface FlowchartSpec {
  id?: string;
  title: string;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  layout?: FlowchartLayout;
  style?: FlowchartStyle;
}

interface FlowchartNode {
  id: string;
  label: string;
  kind: "start" | "process" | "decision" | "end";
  description?: string;
}

interface FlowchartEdge {
  id?: string;
  source: string;
  target: string;
  label?: string;
}

interface FlowchartLayout {
  direction?: "TB" | "LR";
}

interface FlowchartStyle {
  accentColor?: HexColor;
  backgroundColor?: HexColor;
}

type HexColor = `#${string}`;
```

### Required Flowchart Invariants

```mermaid
flowchart TB
  Start["exactly one start"]
  End["at least one end"]
  Reachable["every non-start node has incoming edge"]
  Outgoing["every non-end node has outgoing edge"]
  Decision["every decision has >= 2 outgoing edges"]
  Branches["decision branch labels are present and unique"]
  Edges["edges reference existing nodes"]
  NoLoops["no self-loops"]

  Start --> Reachable
  Reachable --> Outgoing
  Outgoing --> Decision
  Decision --> Branches
  End --> Outgoing
  Edges --> NoLoops
```

Rules:

- Node ids must be unique.
- Edge ids, when supplied, must be unique.
- Every edge source and target must match a node id.
- Edges cannot connect a node to itself.
- A flowchart must have exactly one `start` node.
- A flowchart must have at least one `end` node.
- The `start` node cannot have incoming edges.
- Every non-start node must be reachable from another node.
- Every `end` node must have zero outgoing edges.
- Every non-end node must have at least one outgoing edge.
- Every `decision` node must have at least two outgoing edges.
- Every outgoing decision branch must have a non-empty label.
- Decision branch labels from the same decision must be unique.

### Result

```ts
type BuildFlowchartResult = BuildFlowchartSuccess | BuildFlowchartFailure;

interface BuildFlowchartSuccess {
  ok: true;
  status: "accepted";
  buildId: string;
  requestId?: string;
  normalizedSpec: NormalizedFlowchartSpec;
  quality: QualityReport;
  artifact: ArtifactBundle;
  issues: Issue[];
}

interface BuildFlowchartFailure {
  ok: false;
  status:
    | "invalid_input"
    | "invalid_flowchart"
    | "quality_failed"
    | "render_failed"
    | "export_failed"
    | "storage_failed";
  buildId?: string;
  requestId?: string;
  normalizedSpec?: NormalizedFlowchartSpec;
  quality?: QualityReport;
  partial?: PartialArtifactBundle;
  issues: Issue[];
}

type NormalizedFlowchartSpec = Required<
  Pick<FlowchartSpec, "id" | "title" | "nodes" | "edges" | "layout" | "style">
>;
```

`issues` is empty when the build is accepted and there are no warnings. Warnings
may still be present on accepted builds.

```mermaid
stateDiagram-v2
  [*] --> InvalidInput: schema decode fails
  [*] --> InvalidFlowchart: flowchart invariant fails
  [*] --> QualityFailed: valid but weak
  [*] --> RenderFailed: layout/render fails
  [*] --> ExportFailed: Excalidraw validation fails
  [*] --> StorageFailed: artifact write fails
  [*] --> Accepted: stored artifact

  InvalidInput --> [*]
  InvalidFlowchart --> [*]
  QualityFailed --> [*]
  RenderFailed --> [*]
  ExportFailed --> [*]
  StorageFailed --> [*]
  Accepted --> [*]
```

### Quality Report

```ts
interface QualityReport {
  accepted: boolean;
  score: number;
  threshold: number;
  summary: {
    nodeCount: number;
    edgeCount: number;
  };
  checks: QualityCheck[];
}

interface QualityCheck {
  code: string;
  passed: boolean;
  severity: "error" | "warning";
  message: string;
  refs: IssueRef[];
}
```

## Issue Contract

Issues are the main repair interface. They must be stable, machine-readable, and
good enough for an agent to patch its spec without guessing.

```ts
interface Issue {
  code: IssueCode;
  severity: "error" | "warning";
  stage: "input" | "flowchart" | "quality" | "render" | "export" | "storage";
  ref?: IssueRef;
  message: string;
  hint: string;
}

interface IssueRef {
  kind: "request" | "diagram" | "node" | "edge" | "artifact";
  id?: string;
  path?: string;
}
```

```mermaid
flowchart LR
  Agent["agent repair loop"]
  Issue["Issue"]
  Code["code"]
  Ref["ref"]
  Hint["hint"]
  Patch["patch spec"]

  Agent --> Issue
  Issue --> Code
  Issue --> Ref
  Issue --> Hint
  Code --> Patch
  Ref --> Patch
  Hint --> Patch
```

Initial issue codes:

```ts
type IssueCode =
  | "missing_field"
  | "invalid_type"
  | "invalid_enum"
  | "invalid_color"
  | "duplicate_node_id"
  | "duplicate_edge_id"
  | "missing_edge_source"
  | "missing_edge_target"
  | "self_loop"
  | "missing_start"
  | "multiple_starts"
  | "missing_end"
  | "start_has_incoming"
  | "end_has_outgoing"
  | "unreachable_node"
  | "missing_outgoing_edge"
  | "underbranched_decision"
  | "unlabeled_decision_branch"
  | "duplicate_decision_branch_label"
  | "disconnected_graph"
  | "generic_label"
  | "label_too_long"
  | "quality_below_threshold"
  | "render_failed"
  | "text_overflow"
  | "arrow_binding_invalid"
  | "arrow_overlap"
  | "export_invalid_scene"
  | "storage_write_failed";
```

Example:

```json
{
  "code": "unlabeled_decision_branch",
  "severity": "error",
  "stage": "flowchart",
  "ref": {
    "kind": "edge",
    "id": "risk-review-to-approve",
    "path": "spec.edges[4].label"
  },
  "message": "Decision node \"risk-review\" has an outgoing branch without a label.",
  "hint": "Add a short branch label such as \"approved\" or \"rejected\"."
}
```

## Artifact Contract

`buildFlowchart` stores artifacts only after the flowchart is accepted and the
requested formats are generated successfully.

```mermaid
flowchart LR
  Accepted["accepted build"]
  Scene["scene artifact"]
  Excalidraw["Excalidraw artifact"]
  Png["PNG artifact<br/>later"]
  R2["R2 storage"]
  Ref["ArtifactBundle"]

  Accepted --> Scene
  Accepted --> Excalidraw
  Accepted -. "optional/later" .-> Png
  Scene --> R2
  Excalidraw --> R2
  Png --> R2
  R2 --> Ref
```

```ts
interface ArtifactBundle {
  artifactId: string;
  diagramId: string;
  formats: ArtifactFormatRef[];
  preview?: ArtifactFormatRef;
}

interface PartialArtifactBundle {
  artifactId?: string;
  diagramId?: string;
  formats?: ArtifactFormatRef[];
}

interface ArtifactFormatRef {
  format: ArtifactFormat;
  mimeType: string;
  url?: string;
  expiresAt?: string;
  inline?: unknown;
  sizeBytes?: number;
}
```

The first implementation should support:

- `scene`: rendered deterministic scene JSON.
- `excalidraw`: portable Excalidraw scene JSON.

`png` is allowed in the contract for forward compatibility, but it should not be
advertised as available until the hosted render proof adapter exists.

## `getArtifact`

`getArtifact` retrieves a stored artifact format by `artifactId`. `diagramId`
is semantic and not unique enough for retrieval.

```mermaid
sequenceDiagram
  participant S as Sandbox
  participant A as Host API
  participant R as R2

  S->>A: sketchi.getArtifact({ artifactId, format })
  A->>R: read artifact object
  R-->>A: artifact bytes/json
  A-->>S: GetArtifactResult
```

```ts
interface GetArtifactRequest {
  artifactId: string;
  format?: ArtifactFormat;
  inline?: boolean;
}

type GetArtifactResult = GetArtifactSuccess | GetArtifactFailure;

interface GetArtifactSuccess {
  ok: true;
  artifactId: string;
  diagramId: string;
  format: ArtifactFormat;
  mimeType: string;
  url?: string;
  expiresAt?: string;
  inline?: unknown;
  sizeBytes?: number;
}

interface GetArtifactFailure {
  ok: false;
  status: "not_found" | "format_unavailable" | "expired" | "storage_failed";
  issues: Issue[];
}
```

## Expected Agent Loop

The harness should write a spec, call `buildFlowchart`, inspect structured
issues, patch the spec, and stop when `ok` is true.

```mermaid
sequenceDiagram
  participant H as Harness model
  participant E as execute tool
  participant S as sandbox code
  participant B as buildFlowchart

  H->>E: async repair-loop code
  E->>S: run code
  loop up to 3 attempts
    S->>B: buildFlowchart({ spec })
    B-->>S: accepted or Issue[]
    alt ok
      S-->>E: artifact
    else repairable
      S->>S: patch spec from Issue[]
    end
  end
  E-->>H: artifact or final failure
```

Example sandbox code:

```js
async () => {
  let spec = {
    title: "Incident triage flow",
    nodes: [
      { id: "report", label: "Report received", kind: "start" },
      { id: "severity", label: "Severity high?", kind: "decision" },
      { id: "page", label: "Page responder", kind: "end" },
      { id: "queue", label: "Queue for review", kind: "end" },
    ],
    edges: [
      { source: "report", target: "severity" },
      { source: "severity", target: "page", label: "yes" },
      { source: "severity", target: "queue", label: "no" },
    ],
    layout: { direction: "TB" },
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await sketchi.buildFlowchart({ spec });
    if (result.ok) {
      return result.artifact;
    }

    // Real agents should patch from result.issues. This tiny fallback shows
    // the intended control flow without making the example its own repair engine.
    const missingLabels = result.issues.filter(
      (issue) => issue.code === "unlabeled_decision_branch",
    );
    if (missingLabels.length === 0) {
      return result;
    }
  }

  return { ok: false, error: "Unable to produce an accepted flowchart." };
};
```

## Implementation Shape

The Worker can implement the host APIs as route handlers, in-process service
functions, or both. The contract stays the same.

```mermaid
flowchart TB
  subgraph App["apps/api-mcp or equivalent Worker"]
    M["MCP docs/search/execute"]
    D["DynamicWorkerExecutor"]
    T["sketchi tool provider"]
    R["normal API route handlers"]
  end

  subgraph Runtime["shared runtime"]
    E["Effect pipeline"]
    C["diagram-core"]
    G["diagram-agent quality"]
    Render["diagram-renderer"]
    X["diagram-excalidraw"]
  end

  M --> D
  D --> T
  T --> R
  R --> E
  E --> C
  E --> G
  E --> Render
  E --> X
```

Recommended first slice:

```mermaid
flowchart LR
  A["1. Build host contract types"]
  B["2. Implement buildFlowchart pipeline"]
  C["3. Convert thrown/string errors to Issue[]"]
  D["4. Store scene + Excalidraw artifacts"]
  E["5. Add getArtifact"]
  F["6. Add docs/search/execute MCP shell"]
  G["7. Pressure-test with harnesses"]

  A --> B --> C --> D --> E --> F --> G
```

## Non-Goals

```mermaid
flowchart TB
  Public["public Code Mode API"]
  Internal["internal runtime"]

  Public --> Build["buildFlowchart"]
  Public --> Artifact["getArtifact"]

  Internal -. not public .-> Validate["validate"]
  Internal -. not public .-> Grade["grade"]
  Internal -. not public .-> Render["render"]
  Internal -. not public .-> Export["export"]
  Internal -. later .-> Draft["draft"]
  Internal -. later .-> Threads["managed threads"]
```

Out of scope for this document:

- Managed thread APIs.
- Convex run or artifact history.
- User artifact library.
- Auth policy details beyond "host-owned".
- Hosted PNG rendering details.
- Free-prompt drafting.
- OpenAPI search/execute over a large generated spec.
- Direct public tools for validation, grading, rendering, or export.

## References

- [MCP-first generation scope](mcp-first-generation.md)
- [Agentic generation architecture](agentic-generation.md)
- [System architecture](architecture.md)
- Cloudflare Code Mode documentation:
  <https://developers.cloudflare.com/agents/model-context-protocol/protocol/codemode/>
- Worker Loader documentation:
  <https://developers.cloudflare.com/workers/runtime-apis/bindings/worker-loader/>
