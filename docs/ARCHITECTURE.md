# Cober-Windows-Bar Architecture

This document describes the v0.4 architecture plan for new contributors. v0.4 is planning only: the current runtime remains mock-only and does not include Tauri, Rust, IPC, Windows/system APIs, real providers, tray behavior, or always-on-top desktop behavior.

## Product Shape

Cober-Windows-Bar is a Windows 11 Unified Status Hub. The application starts as a React showcase with deterministic mock events, then grows toward a desktop shell and real providers only after the event model is stable.

The planned architecture keeps every source of status data behind a provider boundary, normalizes provider output into hub events, resolves those events into one visible hub mode, and lets the UI render that resolved mode without knowing where the data came from.

## Planned Flow

```mermaid
flowchart LR
  Provider["Provider\nmock now, real later"]
  EventBus["Event Bus\npublish and fan out HubEvent"]
  Store["Store\nactive event snapshot"]
  Resolver["Resolver\ndeterministic mode selection"]
  UI["Hub UI\nIdle, Music, AI, Download,\nNotification, MultiTask"]

  Provider --> EventBus
  EventBus --> Store
  Store --> Resolver
  Resolver --> UI
```

Text form:

```text
Provider -> Event Bus -> Store -> Resolver -> UI
```

Current mock runtime:

```text
Mock Provider or Event Controls -> event path -> store/resolver -> existing Hub UI
```

Future real runtime:

```text
Real Provider -> adapter -> Event Bus -> Store -> Resolver -> Hub UI
```

The future runtime is a design direction, not a v0.4 implementation commitment.

## Layer Responsibilities

### Providers

Providers own data collection and translation from a domain source into hub events.

Current providers are mock-only. Future providers may represent music sessions, downloads, notifications, system status, developer tooling, or AI agent work, but those real integrations belong to later roadmap stages.

Provider responsibilities:

- Start and stop cleanly.
- Subscribe listeners to emitted events.
- Emit normalized `HubEvent` objects or batches.
- Avoid direct UI imports, state mutations, resolver logic, or desktop-shell assumptions.
- Treat provider-specific details as private implementation details.

Boundary:

- Providers do not decide the current hub mode.
- Providers do not render React components.
- Providers do not call Windows/system APIs in v0.4.

### Event Bus

The Event Bus is the narrow transport layer for hub events.

Responsibilities:

- Accept published `HubEvent` objects.
- Notify subscribers in publication order.
- Keep provider adapters decoupled from store internals.
- Remain synchronous and deterministic unless a later stage proves a need for queueing.

Boundary:

- The Event Bus should not contain resolver priority rules.
- The Event Bus should not own long-lived hub state beyond subscriber management.
- The Event Bus should not know about React components.

### Store

The Store owns the current active event snapshot used by the resolver.

Responsibilities:

- Add, update, replace, expire, or clear events.
- Keep event records deterministic for tests and replay.
- Expose enough state for the resolver and showcase visualization.
- Preserve mock event behavior until real provider stages are approved.

Boundary:

- The Store should not fetch provider data.
- The Store should not render UI.
- The Store should not contain domain-specific provider code.

### Resolver

The Resolver turns the Store snapshot into one visible hub mode.

Responsibilities:

- Apply deterministic priority rules.
- Resolve one primary mode for the compact hub.
- Return MultiTask when multiple meaningful events compete.
- Return Idle when no active event remains.
- Keep behavior stable enough for tests, screenshots, and contributor reasoning.

Boundary:

- The Resolver should not mutate provider state.
- The Resolver should not depend on timers except through event timestamps or store expiry.
- The Resolver should not import React components.

### UI

The UI renders the resolved hub mode and supporting showcase diagnostics.

Responsibilities:

- Render Idle, Music, AI Progress, Download, Notification, and MultiTask states.
- Display event playground controls and resolver visualization in showcase mode.
- Preserve the Windows 11 Fluent/Mica/Acrylic visual direction.
- Treat resolver output as view data, not as a place to recompute priority rules.

Boundary:

- UI components should not call providers directly.
- UI components should not implement system integrations.
- UI components should not decide cross-event priority.

## Contributor Rules

- Keep mock behavior deterministic until the architecture is ready for real providers.
- Add or change resolver behavior with tests because priority changes affect the whole hub.
- Keep provider contracts small; prefer adapters over provider-specific UI paths.
- Document future integrations as proposals unless the roadmap stage explicitly includes implementation.
- Do not add Tauri, Rust, IPC, Windows/system APIs, real providers, tray behavior, or always-on-top behavior as part of v0.4 planning.

## Current v0.4 Status

v0.4 should clarify architecture before expanding runtime capability. The current app remains a React/Vite/Tailwind showcase with mock events and mock providers only.
