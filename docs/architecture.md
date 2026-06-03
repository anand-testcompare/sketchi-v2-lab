# Sketchi v2 Architecture

Sketchi v2 should make diagram generation boring in the best way: inputs are validated, rendering is deterministic, and UI states are exercised outside the app shell.

## Package Boundaries

- `diagram-core` owns the intermediate representation, semantic validation, and reusable fixtures.
- `diagram-renderer` converts validated diagrams into a deterministic scene model.
- `diagram-excalidraw` converts deterministic scenes into persisted Excalidraw elements and validates real-scene invariants.
- `diagram-studio-ui` renders the scene model and owns user-facing component states.
- `apps/web` composes the packages in a TanStack Start app.

## Diagram Pipeline

1. The remote thread planner chooses a generated tool such as `generateDiagram`, `restructureDiagram`, or `tweakDiagram`.
2. Generation produces or edits a typed intermediate diagram. The first hard target is the `flowchart` contract.
3. `diagram-core` validates shape, references, and diagram-type invariants.
4. `diagram-renderer` converts the diagram into deterministic scene primitives.
5. `diagram-excalidraw` converts the scene into Excalidraw elements and validates real output constraints such as arrow bindings and bound text fit.
6. UI packages display those primitives and expose stateful review workflows.

This makes defects local: invalid references fail in core tests, scene drift fails in renderer tests, Excalidraw syntax issues fail before persistence, visual UI states fail in Storybook/component tests, and app routing/deploy failures stay in the app boundary.

## Flowchart First

The first high-reliability path is decision-heavy flowchart generation. The LLM should produce typed flowchart IR: start/process/decision/end nodes, labeled decision branches, and explicit edges. Code owns layout, real Excalidraw conversion, arrow bindings, and text wrapping. The canonical evaluation fixture is the pharma batch disposition flow.

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

The app is scaffolded for Cloudflare Workers through Vite and Wrangler. The initial lab keeps deployment config small until the runtime path is proven by a preview deployment.
