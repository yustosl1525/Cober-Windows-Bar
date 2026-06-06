# Cober-Windows-Bar Event Flow

This document is a v0.4 design proposal for contributors. It describes the intended event model and resolver behavior, but the current runtime remains mock-only. v0.4 does not implement Tauri, Rust, IPC, Windows/system APIs, real providers, tray behavior, or always-on-top desktop behavior.

## HubEvent Shape Proposal

`HubEvent` is the normalized status message passed from providers into the hub event path.

```ts
type HubEventKind =
  | "music"
  | "ai"
  | "download"
  | "notification"
  | "system"
  | "developer";

type HubEventStatus =
  | "active"
  | "progress"
  | "complete"
  | "paused"
  | "error"
  | "cleared";

interface HubEvent {
  id: string;
  kind: HubEventKind;
  source: string;
  status: HubEventStatus;
  title: string;
  subtitle?: string;
  progress?: number;
  priority?: number;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  payload?: Record<string, unknown>;
}
```

Design notes:

- `id` gives the Store a stable key for replace/update behavior.
- `kind` lets the Resolver map events to hub modes.
- `source` identifies the provider or mock scenario that emitted the event.
- `status` describes lifecycle without leaking provider-specific internals.
- `progress` is optional and should be clamped from `0` to `100` when present.
- `priority` is optional. Resolver defaults should remain deterministic without it.
- `payload` is an escape hatch for future provider-specific metadata, not a UI contract.

This shape is a proposal, not a runtime migration requirement for v0.4.

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

For v0.4 planning, the Event Bus should stay small. More complex queueing, debouncing, async delivery, persistence, or cross-process IPC should wait until a later stage needs it.

## Store Responsibilities

The Store owns the active event snapshot.

Responsibilities:

- Insert new events by `id`.
- Replace or merge updates for an existing `id`.
- Remove events when a `cleared` status arrives.
- Expire events when `expiresAt` is in the past.
- Clear all events for Idle/demo reset flows.
- Expose active events to the Resolver and showcase diagnostics.
- Keep update order and timestamps stable enough for tests.

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
- Ignore events with `cleared` status.
- If no active events remain, resolve Idle.
- If two or more active events remain after filtering, resolve MultiTask unless one event has explicit interruption priority.
- Notifications may temporarily override MultiTask when marked as interruption priority.
- For events of the same kind, prefer higher `priority`, then newer `updatedAt`, then lexical `id` as the final tie-breaker.
- The same Store snapshot must always produce the same resolver output.

The exact interruption threshold is a future detail. Until then, tests should protect the documented mock behavior.

## Example Flow

The canonical v0.4 planning example:

```text
Idle -> Music -> AI -> Notification -> MultiTask -> Idle
```

Step-by-step:

1. Idle
   - Store has no active events.
   - Resolver returns `Idle`.

2. Music starts
   - Mock MusicProvider or Event Controls publish a `music` event.
   - Event Bus forwards the event.
   - Store records one active music event.
   - Resolver returns `Music`.
   - UI renders the Music hub.

3. AI task starts
   - Mock AITaskProvider or Event Controls publish an `ai` progress event.
   - Store now has music and AI events.
   - Resolver can return `MultiTask` when both should be visible, or `AI` when the scenario intentionally demonstrates focused AI priority.
   - The demo should make the selected rule explicit in tests and visualization.

4. Notification arrives
   - Mock NotificationProvider or Event Controls publish a `notification` event.
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
