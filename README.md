# Sketchi v2 Lab

This fork is the clean-start lab for rebuilding Sketchi around a maintainable diagram-generation core.

The original repository, `shpitdev/sketchi`, remains the star-bearing upstream. This lab exists so the rewrite can progress without noise, then land back as one deliberate pull request when the v2 path is proven.

## Stack

- Nx workspace for package boundaries, affected checks, and Storybook wiring.
- TanStack Start playground app, prepared for optional Cloudflare deployment.
- TanStack Start app surfaces for `sketchi.app`, `excalidraw.sketchi.app`,
  and `icons.sketchi.app`.
- Typed diagram intermediate representation in `packages/diagram-core`.
- Deterministic scene renderer in `packages/diagram-renderer`.
- Real Excalidraw conversion and validation in `packages/diagram-excalidraw`.
- Maintained scenarios and local fixture/model-output evaluation in `packages/diagram-scenarios`.
- Reusable React UI and Storybook in `packages/diagram-studio-ui`.
- Workspace Nx generators in `tools/sketchi-generators`.

## Commands

```sh
pnpm install
pnpm nx run-many -t typecheck,test,build
pnpm nx run-many -t build-storybook
pnpm dev
pnpm nx dev playground
pnpm nx dev web
pnpm nx dev excalidraw
pnpm nx dev icons
pnpm nx scenario diagram-scenarios -- --scenario pharma-batch-disposition --fixture --out .memory/pharma-batch.excalidraw
SKETCHI_GENERATOR_COMMAND="your-llm-command" pnpm nx scenario diagram-scenarios -- --scenario pharma-batch-disposition
```

`pnpm dev` runs every Nx app with a `dev` target in parallel. The playground
defaults to port `6200`; Vite will increment to the next free port when needed.

Generate new owned surfaces through the workspace plugin:

```sh
pnpm nx g @sketchi/generators:ui-component StatusBadge
pnpm nx g @sketchi/generators:diagram-type mindmap --title "Sketchi mindmap fixture"
```

## Preview Deploys

Pull requests deploy each app to PR-specific Cloudflare Workers and update one
sticky PR comment per app with the URL when Cloudflare credentials are
configured.
See [docs/preview-deploys.md](docs/preview-deploys.md).

Production Worker deploy targets are app-scoped:

```sh
pnpm deploy:playground
pnpm deploy:web
pnpm deploy:excalidraw
pnpm deploy:icons
```

## Workspace Shape

```text
apps/playground                  TanStack Start playground
apps/web                         Sketchi public home and docs
apps/excalidraw                  No-auth Excalidraw product shell
apps/icons                       Standalone curated icon output browser
packages/diagram-core            Diagram IR, validation, fixtures
packages/diagram-renderer        Deterministic scene generation
packages/diagram-excalidraw      Real Excalidraw conversion and validation
packages/diagram-scenarios       Scenario prompts, checks, and CLI evals
packages/diagram-studio-ui       React components and Storybook
tools/sketchi-generators         Workspace generators for components and diagram types
docs/architecture.md             v2 architecture notes
```
