# Sketchi v2 Architecture

Sketchi v2 should make diagram generation boring in the best way: inputs are validated, rendering is deterministic, and UI states are exercised outside the app shell.

## Package Boundaries

- `diagram-core` owns the intermediate representation, semantic validation, and reusable fixtures.
- `diagram-renderer` converts validated diagrams into a deterministic scene model.
- `diagram-excalidraw` converts deterministic scenes into persisted Excalidraw elements and validates real-scene invariants.
- `diagram-scenarios` owns maintained prompts, assertions, fixture evaluation, and local command-provider runs.
- `diagram-studio-ui` renders the scene model and owns user-facing component states.
- `apps/playground` composes the packages in a TanStack Start testing ground.

## Diagram Pipeline

1. The remote thread planner chooses a generated tool such as `generateDiagram`, `restructureDiagram`, or `tweakDiagram`.
2. Generation produces or edits a typed intermediate diagram. The first hard target is the `flowchart` contract.
3. `diagram-core` validates shape, references, and diagram-type invariants.
4. `diagram-renderer` converts the diagram into deterministic scene primitives.
5. `diagram-excalidraw` converts the scene into Excalidraw elements and validates real output constraints such as arrow bindings and bound text fit.
6. `diagram-scenarios` runs maintained assertions against fixture or one-shot model output.
7. UI packages display those primitives in a real Excalidraw canvas and expose stateful review workflows.

This makes defects local: invalid references fail in core tests, scene drift fails in renderer tests, Excalidraw syntax issues fail before persistence, visual UI states fail in Storybook/component tests, and app routing/deploy failures stay in the app boundary.

## Flowchart First

The first high-reliability path is decision-heavy flowchart generation. The LLM should produce typed flowchart IR: start/process/decision/end nodes, labeled decision branches, and explicit edges. Code owns layout, real Excalidraw conversion, arrow bindings, and text wrapping. The canonical evaluation fixture is the pharma batch disposition flow.

## Playground

The playground is not the product app and does not include the Convex remote
agent loop. It is an independently deployable testing ground for maintained
scenarios, pasted model output, and deterministic IR-to-Excalidraw conversion.
The intended public shape is `playground.sketchi.app` once preview deployment is
worth keeping on.

The portable CLI path is:

```sh
pnpm nx scenario diagram-scenarios -- --scenario pharma-batch-disposition --fixture --out .memory/pharma-batch.excalidraw
```

For one-shot model runs through Nx, pass a local command in
`SKETCHI_GENERATOR_COMMAND`. The command reads the scenario prompt from stdin and
writes candidate IR JSON to stdout:

```sh
SKETCHI_GENERATOR_COMMAND="your-llm-command" pnpm nx scenario diagram-scenarios -- --scenario pharma-batch-disposition
```

The CLI also supports direct `--generator-command` usage when it is invoked
outside Nx; put that flag last because the scenario CLI treats the rest of the
argv as the provider command.

This keeps local/OpenCode-style integrations separate from Convex auth, thread
orchestration, and persistence.

## Generator Contract

New UI components should be created with `@sketchi/generators:ui-component`.
The generator expands EJS templates into a component folder with implementation,
Vitest coverage, Storybook story, barrel export, and package export wiring.

New diagram types should be created with `@sketchi/generators:diagram-type`.
The generator updates the core diagram type registry and expands EJS templates
for a typed fixture, core contract test, renderer contract test, and Storybook
story. This keeps each diagram type previewable and testable before it is
connected to generation.

The registry is guarded by tests: every registered diagram type must have core,
renderer, and Storybook coverage, and every reusable Studio component must have
an implementation, test, story, local export, and package export.

## Deployment Direction

The playground is scaffolded for Cloudflare Workers through Vite and Wrangler.
Deployment should remain independent from the product app and can be skipped
when the playground is only needed as a local scenario/eval surface.

## AI Gateway Observability

The live playground uses the Cloudflare AI Gateway Worker binding with
`collectLog: true` and scenario metadata on each request. Cloudflare stores
Gateway logs and can retain request/response payloads for prompt tuning when
the gateway is configured to keep payloads.

Inspect recent logs with:

```sh
pnpm ai-gateway:logs -- --limit 5
```

Inspect stored prompt/response payloads with:

```sh
pnpm ai-gateway:logs -- --include-payload --limit 3
```

When running through Infisical, use the `/github` path so the same Cloudflare
account/token values used by CI are available locally:

```sh
infisical run --env staging --path /github -- pnpm ai-gateway:logs -- --include-payload --limit 3
```

The token used for this command must include Cloudflare `AI Gateway Read`. The
Cloudflare `cf` CLI can introspect the relevant AI Gateway log schemas with
`cf agent-context ai-gateway` and `cf schema ai-gateway logs list`, but this
repo currently keeps the executable path in this script because the installed
`cf` CLI does not execute `cf ai-gateway logs ...` commands and Wrangler's `ai`
commands do not expose Gateway logs. If the deploy token is intentionally
narrower, provide a separate `CLOUDFLARE_AI_GATEWAY_API_TOKEN` for this script.

The script calls Cloudflare's AI Gateway Logs API endpoints for list, detail,
request payload, and response payload inspection.
