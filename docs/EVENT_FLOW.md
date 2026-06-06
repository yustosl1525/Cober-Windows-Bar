# Cober-Windows-Bar Event Flow

This document is a v0.5.3 documentation-alignment note for contributors. It freezes terminology for the event model and resolver path, but the current runtime remains mock-only. v0.5.3 does not implement Tauri, Rust, IPC, Windows/system APIs, real providers, tray behavior, always-on-top desktop behavior, or v0.6 provider/runtime changes.

## Canonical HubEvent Contract

`HubEvent` is the normalized status message passed from providers into the hub event path. For v0.6 documentation, the canonical top-level field set is frozen as:

```ts
type HubEventType =
  | "music"
  | "ai"
  | "download"
  | "notification"
  | "system"
  | "developer";

interface HubEvent {
  id: string;
  type: HubEventType;
  source: string;
  createdAt: number;
  expiresAt?: number;
  progress?: number;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
```

Design notes:

- `id` gives the Store a stable key for replace/update behavior.
- `type` lets the Resolver map events to hub modes.
- `source` identifies the provider or mock scenario that emitted the event.
- `createdAt` is the canonical event timestamp.
- `expiresAt` is optional and lets the Store expire time-bound events.
- `progress` is optional and should be clamped from `0` to `100` when present.
- `payload` is the event-specific data envelope. Provider-specific task status, display copy, and domain details belong here unless a future version promotes them.
- `metadata` is optional descriptive metadata. It is not a resolver contract unless a later version explicitly says so.

Non-canonical top-level fields:

- `kind` is replaced by canonical `type`.
- Event-level `status` is not canonical. Task status such as active, progress, complete, paused, error, or cleared belongs in `payload` unless a future contract promotes it.
- `title` and `subtitle` are display payload, not top-level contract fields.
- `priority` is a future resolver concern, not a canonical event field.
- `updatedAt` is not part of the frozen top-level contract.

This is a documentation alignment for v0.5.3, not a runtime migration requirement or v0.6 implementation authorization.

## Event Bus Semantics

The Event Bus is the transport boundary between providers and hub state.

Planned semantics:

- Publish accepts one `HubEvent` or a small batch of `HubEvent` objects.
- Subscribers receive events in publication order.
- Publishing is deterministic and side-effect-light.
- The bus does not resolve UI modes.
- The bus does not fetch provider data.
- The bus does not retain business state beyond listener registration.
- Provider adapters may use the bus, but UI components should not subscribe to provider internals directly.

Canonical runtime path:

```text
Provider -> Event Bus -> Store -> Resolver -> UI
```

Provider registries and provider adapters are auxiliary lifecycle and integration helpers. They must publish through the Event Bus and must not bypass the Event Bus, Store, or Resolver when affecting hub UI state.

For v0.5.3 alignment, the Event Bus should stay small. More complex queueing, debouncing, async delivery, persistence, or cross-process IPC should wait until a later stage needs it.

## Store Responsibilities

The Store owns the active event snapshot.

Responsibilities:

- Insert new events by `id`.
- Replace or merge updates for an existing `id`.
- Remove events when a canonical event operation or payload-level task state indicates clearing.
- Expire events when `expiresAt` is in the past.
- Clear all events for Idle/demo reset flows.
- Expose active events to the Resolver and showcase diagnostics.
- Keep event ordering and timestamps stable enough for tests.

The Store should not know how music sessions, downloads, notifications, developer tools, or AI agents are collected. Those details belong to providers.

## Resolver Rules

The Resolver turns active events into one visible hub mode.

Proposed priority order:

1. Notification: urgent, user-visible interruption.
2. MultiTask: multiple active meaningful events.
3. AI Progress: long-running agent or generation work.
4. Download: file transfer or installation progress.
5. Music: ongoing media status.
6. Idle: no active events.

Deterministic rules:

- Ignore expired events before resolving.
- Ignore events that have been cleared by Store behavior.
- If no active events remain, resolve Idle.
- If two or more active events remain after filtering, resolve MultiTask unless one event has explicit interruption priority.
- Notifications may temporarily override MultiTask when resolver rules or payload-level data mark them as interruptions.
- For events of the same `type`, prefer deterministic resolver rules and lexical `id` as the final tie-breaker. Top-level `priority` and `updatedAt` are not canonical fields.
- The same Store snapshot must always produce the same resolver output.

The exact interruption threshold is a future detail. Until then, tests should protect the documented mock behavior.

## Example Flow

The canonical v0.5.3 documentation example:

```text
Idle -> Music -> AI -> Notification -> MultiTask -> Idle
```

Step-by-step:

1. Idle
   - Store has no active events.
   - Resolver returns `Idle`.

2. Music starts
   - Mock MusicProvider or Event Controls publish a `music` event type.
   - Event Bus forwards the event.
   - Store records one active music event.
   - Resolver returns `Music`.
   - UI renders the Music hub.

3. AI task starts
   - Mock AITaskProvider or Event Controls publish an `ai` event type with optional `progress`.
   - Store now has music and AI events.
   - Resolver can return `MultiTask` when both should be visible, or `AI` when the scenario intentionally demonstrates focused AI priority.
   - The demo should make the selected rule explicit in tests and visualization.

4. Notification arrives
   - Mock NotificationProvider or Event Controls publish a `notification` event type.
   - Resolver treats it as the highest-priority interruption.
   - UI renders the Notification hub.

5. Notification settles into MultiTask
   - Notification expires or is cleared while music and AI remain active.
   - Store removes or deactivates the notification.
   - Resolver returns `MultiTask` because multiple meaningful events remain.
   - UI renders the MultiTask hub.

6. Clear to Idle
   - Demo reset or clear event removes all active events.
   - Resolver returns `Idle`.
   - UI renders the Idle hub.

## Current Runtime Caveat

Today this flow is still demonstrated with mock events, mock providers, tests, and showcase controls. Real desktop input, Windows APIs, notification center reads, media session reads, file watchers, Tauri IPC, and system tray behavior remain future roadmap work.
