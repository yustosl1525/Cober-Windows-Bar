# Cober-Windows-Bar

Cober-Windows-Bar is a Tauri + React prototype for a compact Windows desktop status center.

This repository currently contains two parallel product surfaces:

- `desktop`: the real product-facing desktop status center shell
- `showcase`: the demo and QA surface for state flows, mock providers, and visual review

The goal of this repo is to make the product direction, runtime boundary, and future native integration path easy to understand before the project expands into deeper Windows-specific features.

## Start Here

If you just forked the repo and want to understand it quickly:

1. Read [Repository Guide](docs/README.md)
2. Read [Architecture Overview](docs/architecture/ARCHITECTURE.md)
3. Read [Roadmap](docs/product/ROADMAP.md)
4. Read [Contributing](CONTRIBUTING.md)

## Project Structure

Top-level layout:

```text
src/
  features/
    desktop/      desktop product surface
    showcase/     demo and QA surface
  shared/
    ui/           reusable UI building blocks
  runtime/        desktop/runtime boundary and Tauri-facing logic
  providers/      provider contracts, adapters, registries, mocks
  state/          event bus, store, resolver-friendly state
  data/           mock data and desktop status configuration
  types/          shared domain types
  styles/         global styling

src-tauri/
  Rust native shell, system/runtime commands, window behavior

docs/
  architecture/   system shape and runtime flow
  product/        PRD, UI spec, roadmap
  providers/      provider model and mock/provider plans
  qa/             QA and test strategy
  plans/          active implementation plans
  decisions/      current decision records
  archive/        historical freeze/alignment reports

scripts/
  local helpers such as desktop launch and showcase QA
```

## Source Guide

If you want to change a specific area:

- Desktop status center UI:
  `src/features/desktop/`

- Showcase/demo flows:
  `src/features/showcase/`

- Shared visual primitives:
  `src/shared/ui/`

- Window drag, floating, fullscreen avoidance, display correction:
  `src/runtime/statusWindowRuntime.ts`

- System performance loading:
  `src/runtime/systemPerformanceRuntime.ts`

- Tauri runtime bridge and fixture/runtime capability parsing:
  `src/runtime/tauriRuntime.ts`

- Native Tauri/Rust commands:
  `src-tauri/src/lib.rs`

- Mock data and desktop menu/config labels:
  `src/data/`

## Current Product State

What is already present:

- Desktop route at `/desktop` for the compact status center
- Showcase route at `/showcase` for review, QA, and mock state demos
- Window dragging, work-area clamping, fullscreen avoidance, and floating policy groundwork
- Mock CPU / memory / network status center data flow
- Mock provider/event bus/store/resolver pipeline
- Tauri runtime fixture and capability bridge scaffolding

What is still in progress:

- Native desktop context menu replacing the default web-style menu
- Real settings/persistence boundary for desktop preferences
- Tray/recall/click-through product behavior
- Real Windows-backed providers

## Local Development

Install dependencies:

```bash
npm install
```

Start the web dev server:

```bash
npm run dev
```

Useful routes:

```text
http://localhost:5173/desktop
http://localhost:5173/showcase
```

Launch the desktop mock shell:

```bash
npm run desktop:mock
```

## Validation

Main checks:

```bash
npm run build
npm run qa
```

Focused checks:

```bash
npm run test:runtime
npm run qa:showcase:interactions
```

## Docs

- [Repository Guide](docs/README.md)
- [Architecture](docs/architecture/ARCHITECTURE.md)
- [Event Flow](docs/architecture/EVENT_FLOW.md)
- [Tauri Strategy](docs/architecture/TAURI_STRATEGY.md)
- [PRD](docs/product/PRD.md)
- [UI Spec](docs/product/UI_SPEC.md)
- [Roadmap](docs/product/ROADMAP.md)
- [Provider SDK](docs/providers/PROVIDER_SDK.md)
- [Showcase QA](docs/qa/SHOWCASE_QA.md)
- [Implementation Plan](docs/plans/IMPLEMENTATION_PLAN.md)

## Collaboration

For contribution expectations and a suggested PR path, see [Contributing](CONTRIBUTING.md).

## License

MIT
