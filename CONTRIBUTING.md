# Contributing

## First Read

Before opening a PR, read in this order:

1. [README](README.md)
2. [Repository Guide](docs/README.md)
3. [Architecture Overview](docs/architecture/ARCHITECTURE.md)
4. [Roadmap](docs/product/ROADMAP.md)

## How To Navigate The Repo

Use this mental model:

- `src/features/desktop`
  product-facing desktop status center

- `src/features/showcase`
  demo, QA, and review surface

- `src/shared/ui`
  reusable visual primitives only

- `src/runtime`
  desktop/runtime behavior and Tauri-facing frontend boundary

- `src-tauri`
  native shell and Rust commands

- `src/providers`
  provider contracts, mocks, adapters, and registries

- `src/state`
  event bus and store logic

## What Kind Of PR To Open

Prefer small PRs with one clear purpose.

Good examples:

- improve desktop status center UI without changing showcase behavior
- add or refine runtime boundary logic in `src/runtime`
- add a new mock provider or provider diagnostic path
- improve docs for a specific subsystem

Avoid mixing these together in one PR:

- desktop UI redesign
- runtime/window behavior changes
- native Rust command changes
- broad doc rewrites

## Suggested PR Paths

If you are working on desktop product behavior:

- start in `src/features/desktop`
- then inspect `src/runtime`
- then inspect `src-tauri/src/lib.rs` if native behavior is needed

If you are working on the showcase:

- start in `src/features/showcase`
- then inspect `src/state` and `src/providers`

If you are working on system/provider boundaries:

- start in `src/providers`, `src/runtime`, and `src/types`

## Validation Before PR

Run the checks that match your change. For most PRs:

```bash
npm run build
npm run test:runtime
```

For broader UI/state/provider work:

```bash
npm run qa
```

## Documentation Rules

When you move or reshape project structure:

- update `README.md`
- update `docs/README.md`
- update any active doc links that point at moved files

Historical files under `docs/archive/` are archival context and should not be treated as the current source of truth.

## Ground Rules

- Keep product-facing desktop work separate from showcase-only demo work.
- Reuse `src/shared/ui` instead of duplicating primitives.
- Put shared types in `src/types`.
- Keep runtime behavior centralized instead of scattering it across UI components.
- Do not add fake "website preview" flows to the desktop product path.

## Questions To Ask Before A Large PR

- Is this a `desktop` change, a `showcase` change, or a `runtime/native` change?
- Does this belong in `shared`, or is it feature-specific?
- Does this need a doc update so a new contributor can still follow the repo?
