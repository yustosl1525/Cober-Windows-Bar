# Provider Runtime Plan

Version: v0.5.3 alignment

This document aligns the planned Provider Runtime model for the Mock Provider SDK. v0.5.3 does not implement runtime code, provider code, IPC, Tauri/Rust integration, Windows API integration, or system API behavior. v0.6 implementation remains unauthorized until v0.5.4 Review & Freeze approves the aligned documentation.

## Conceptual Execution Order

The planned runtime flow is:

```text
Provider -> Event Bus -> Store -> Resolver -> UI
```

1. `Provider` performs provider-specific work and emits canonical HubEvents.
2. `Event Bus` receives provider HubEvents and provides the common runtime delivery boundary.
3. `Store` receives HubEvents from the Event Bus and updates application-visible state.
4. `Resolver` derives the active hub mode, priority, and display-ready state from Store data.
5. `UI` renders resolved state.

The ProviderRegistry and any provider adapter are auxiliary runtime layers. They may select, supervise, subscribe to, batch, validate, or forward provider output, but they must not bypass the Event Bus, Store, or Resolver. Providers should not mutate the Store directly. The Store should not call provider implementation details directly. HubEvents are the planned boundary between provider execution and state updates.

## Runtime Responsibilities

The Provider Runtime is responsible for coordinating provider execution, event normalization, and health tracking.

Planned responsibilities:

- Register available providers through the ProviderRegistry.
- Select a provider for a requested capability or mock scenario.
- Start, stop, and dispose providers through a consistent lifecycle.
- Supervise or forward canonical HubEvents emitted by providers.
- Forward HubEvents through the Event Bus to the Store.
- Track provider health and availability.
- Surface provider failures as failure HubEvents.
- Mark providers `Unhealthy` after crashes or unrecoverable failures.
- Preserve a mock-first interface that can later be backed by real providers.

## Runtime Non-Responsibilities

The Provider Runtime should not own platform-specific implementation details or business-specific state decisions.

Planned non-responsibilities:

- It does not implement Windows system APIs.
- It does not implement Tauri, Rust, IPC, or native bridge code.
- It does not directly mutate Store internals outside the HubEvent path.
- It does not route provider events around the Event Bus, Store, or Resolver.
- It does not define final UI behavior.
- It does not convert provider output into UI-specific state.
- It does not persist provider data unless a future Store contract explicitly does so.
- It does not make mock providers indistinguishable from real providers at the implementation layer.
- It does not hide provider health or failure state from the registry.

## Provider Lifecycle Sequence

The planned lifecycle sequence is:

```text
Register -> Initialize -> Start -> Emit HubEvents -> Stop -> Dispose
```

1. `Register`: ProviderRegistry receives provider metadata, capability declarations, initial lifecycle, and initial health.
2. `Initialize`: The runtime prepares provider configuration and validates required mock inputs.
3. `Start`: The selected provider begins execution for a capability or scenario.
4. `Emit HubEvents`: The provider emits canonical HubEvents that are delivered through the Event Bus to the Store.
5. `Stop`: The runtime asks the provider to end active work without destroying registry metadata.
6. `Dispose`: The runtime releases provider resources and removes active runtime handles.

Lifecycle calls should be ordered and observable. A provider should not emit HubEvents before it is initialized and started. A disposed provider should not continue emitting events.

Provider lifecycle is separate from health and event or task status:

- Lifecycle values are `Registered`, `Started`, `Publishing`, `Paused`, `Stopped`, and `Failed`.
- Health values are `Healthy`, `Degraded`, and `Unhealthy`.
- Event status, task progress, download state, notification state, and AI agent run state are HubEvent payload concerns, not provider lifecycle values.

## Failure Handling

The planned failure path is:

```text
Provider Crash -> Failure HubEvent -> Registry Marks Unhealthy
```

When a provider crashes or throws an unrecoverable runtime failure:

1. The runtime captures the failure.
2. The failure is normalized into a failure HubEvent.
3. The failure HubEvent is forwarded through the Event Bus to the Store.
4. ProviderRegistry marks provider health as `Unhealthy` and lifecycle as `Failed` if the provider can no longer run.
5. The unhealthy provider is excluded from future automatic selection until a future recovery policy marks it `Healthy` again.

The Store should receive the failure as application-visible state, but the Registry remains the source of truth for provider health. The runtime should not silently swallow provider failures or keep routing work to a provider after a crash.

## Mock-To-Real Boundary

v0.5.3 aligns a mock-first provider boundary that can later support real providers without changing the conceptual execution order.

Mock providers may use static fixtures, deterministic responses, timers, or in-memory scenario data. Real providers may later use platform APIs, IPC, background processes, or native capabilities. Both forms should produce HubEvents through the same runtime-facing contract.

The boundary is:

- Mock-specific data stays inside mock providers and fixtures.
- Real provider implementation details stay inside future real providers.
- ProviderRegistry tracks metadata and health for both mock and real providers.
- HubEvents remain the common output shape.
- Store updates remain driven by HubEvents delivered through the Event Bus, not provider internals.
- Resolver output remains the source for UI-facing state.

This lets v0.5.3 document the intended architecture without committing to implementation details prematurely. v0.6 may implement the first code version of these runtime concepts only after v0.5.4 approves the freeze.
