# Sketchi v2 Architecture

Sketchi v2 should make diagram generation boring in the best way: inputs are validated, rendering is deterministic, and UI states are exercised outside the app shell.

## Package Boundaries

- `diagram-core` owns the intermediate representation, semantic validation, and reusable fixtures.
- `diagram-renderer` converts validated diagrams into a deterministic scene model.
- `diagram-studio-ui` renders the scene model and owns user-facing component states.
- `apps/web` composes the packages in a TanStack Start app.

## Diagram Pipeline

1. Generation produces or edits a plain JSON intermediate diagram.
2. `diagram-core` validates shape, references, and graph-level invariants.
3. `diagram-renderer` converts the diagram into scene primitives.
4. UI packages display those primitives and expose stateful review workflows.

This makes defects local: invalid references fail in core tests, visual drift fails in renderer/UI tests, and app routing/deploy failures stay in the app boundary.

## Deployment Direction

The app is scaffolded for Cloudflare Workers through Vite and Wrangler. The initial lab keeps deployment config small until the runtime path is proven by a preview deployment.
