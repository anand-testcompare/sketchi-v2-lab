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

Inspect and summarize logs through the Cloudflare API MCP instead of keeping
repo-local Cloudflare API scripts. Configure Codex or another MCP client with
Cloudflare's Code Mode server:

```json
{
  "mcpServers": {
    "cloudflare-api": {
      "url": "https://mcp.cloudflare.com/mcp"
    }
  }
}
```

Use the repo-local `$sketchi-log-analysis` skill in
[.agents/skills/sketchi-log-analysis/SKILL.md](../.agents/skills/sketchi-log-analysis/SKILL.md)
for reusable analysis. The skill keeps the operational behavior read-only, asks
for payload inspection only when retained by the Gateway, and turns model
failures into scenario or prompt-tuning follow-up.
