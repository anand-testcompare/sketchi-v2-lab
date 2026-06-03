# Sketchi v2 Lab

This fork is the clean-start lab for rebuilding Sketchi around a maintainable diagram-generation core.

The original repository, `shpitdev/sketchi`, remains the star-bearing upstream. This lab exists so the rewrite can progress without noise, then land back as one deliberate pull request when the v2 path is proven.

## Stack

- Nx workspace for package boundaries, affected checks, and Storybook wiring.
- TanStack Start web app, prepared for Cloudflare deployment.
- Typed diagram intermediate representation in `packages/diagram-core`.
- Deterministic scene renderer in `packages/diagram-renderer`.
- Real Excalidraw conversion and validation in `packages/diagram-excalidraw`.
- Reusable React UI and Storybook in `packages/diagram-studio-ui`.
- Workspace Nx generators in `tools/sketchi-generators`.

## Commands

```sh
pnpm install
pnpm nx run-many -t typecheck,test,build
pnpm nx build-storybook diagram-studio-ui
pnpm nx dev web
```

Generate new owned surfaces through the workspace plugin:

```sh
pnpm nx g @sketchi/generators:ui-component StatusBadge
pnpm nx g @sketchi/generators:diagram-type mindmap --title "Sketchi mindmap fixture"
```

## Workspace Shape

```text
apps/web                         TanStack Start application
packages/diagram-core            Diagram IR, validation, fixtures
packages/diagram-renderer        Deterministic scene generation
packages/diagram-excalidraw      Real Excalidraw conversion and validation
packages/diagram-studio-ui       React components and Storybook
tools/sketchi-generators         Workspace generators for components and diagram types
docs/architecture.md             v2 architecture notes
```
