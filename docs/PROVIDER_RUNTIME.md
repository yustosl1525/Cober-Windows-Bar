# Provider Runtime Plan

Version: v0.5.1 docs-only

This document defines the planned Provider Runtime model for the Mock Provider SDK. v0.5.1 does not implement runtime code, provider code, IPC, Tauri/Rust integration, Windows API integration, or system API behavior. The code implementation is reserved for v0.6.

## Conceptual Execution Order

The planned runtime flow is:

```text
ProviderRegistry -> Provider -> HubEvent -> Store
```

1. `ProviderRegistry` owns provider discovery, registration state, health state, and provider selection.
2. `Provider` performs provider-specific work and emits normalized runtime output.
3. `HubEvent` is the normalized event envelope produced from provider output, including success, status, and error events.
4. `Store` receives HubEvents and updates application-visible state.

The Provider Runtime should keep these boundaries clear. Providers should not mutate the Store directly. The Store should not call provider implementation details directly. HubEvents are the planned boundary between provider execution and state updates.

## Runtime Responsibilities

The Provider Runtime is responsible for coordinating provider execution, event normalization, and health tracking.

Planned responsibilities:

- Register available providers through the ProviderRegistry.
- Select a provider for a requested capability or mock scenario.
- Start, stop, and dispose providers through a consistent lifecycle.
- Convert provider output into HubEvents.
- Forward HubEvents to the Store.
- Track provider health and availability.
- Surface provider failures as error HubEvents.
- Mark providers unhealthy after crashes or unrecoverable failures.
- Preserve a mock-first interface that can later be backed by real providers.

## Runtime Non-Responsibilities

The Provider Runtime should not own platform-specific implementation details or business-specific state decisions.

Planned non-responsibilities:

- It does not implement Windows system APIs.
- It does not implement Tauri, Rust, IPC, or native bridge code.
- It does not directly mutate Store internals outside the HubEvent path.
- It does not define final UI behavior.
- It does not persist provider data unless a future Store contract explicitly does so.
- It does not make mock providers indistinguishable from real providers at the implementation layer.
- It does not hide provider health or error state from the registry.

## Provider Lifecycle Sequence

The planned lifecycle sequence is:

```text
Register -> Initialize -> Start -> Emit HubEvents -> Stop -> Dispose
```

1. `Register`: ProviderRegistry receives provider metadata, capability declarations, and initial health state.
2. `Initialize`: The runtime prepares provider configuration and validates required mock inputs.
3. `Start`: The selected provider begins execution for a capability or scenario.
4. `Emit HubEvents`: Provider output is normalized into HubEvents and delivered to the Store.
5. `Stop`: The runtime asks the provider to end active work without destroying registry metadata.
6. `Dispose`: The runtime releases provider resources and removes active runtime handles.

Lifecycle calls should be ordered and observable. A provider should not emit HubEvents before it is initialized and started. A disposed provider should not continue emitting events.

## Failure Handling

The planned failure path is:

```text
Provider Crash -> Error Event -> Registry Marks Unhealthy
```

When a provider crashes or throws an unrecoverable runtime error:

1. The runtime captures the failure.
2. The failure is normalized into an error HubEvent.
3. The error HubEvent is forwarded to the Store.
4. ProviderRegistry marks the provider as unhealthy.
5. The unhealthy provider is excluded from future automatic selection until a future recovery policy marks it healthy again.

The Store should receive the error as application-visible state, but the Registry remains the source of truth for provider health. The runtime should not silently swallow provider failures or keep routing work to a provider after a crash.

## Mock-To-Real Boundary

v0.5.1 plans a mock-first provider boundary that can later support real providers without changing the conceptual execution order.

Mock providers may use static fixtures, deterministic responses, timers, or in-memory scenario data. Real providers may later use platform APIs, IPC, background processes, or native capabilities. Both forms should produce HubEvents through the same runtime-facing contract.

The boundary is:

- Mock-specific data stays inside mock providers and fixtures.
- Real provider implementation details stay inside future real providers.
- ProviderRegistry tracks metadata and health for both mock and real providers.
- HubEvents remain the common output shape.
- Store updates remain driven by HubEvents, not provider internals.

This lets v0.5.1 document the intended architecture without committing to implementation details prematurely. v0.6 will implement the first code version of these runtime concepts.
