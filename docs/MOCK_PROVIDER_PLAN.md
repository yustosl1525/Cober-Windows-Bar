# Mock Provider SDK Plan

This document is the v0.5.0 planning note for the mock Provider SDK path. v0.5.0 is documentation and design planning only. It does not implement mock providers, provider adapters, timers, Tauri APIs, Rust code, IPC, Windows integrations, or runtime behavior.

Implementation belongs to v0.5.1 or later, after the provider contract, event quality rules, deterministic timing strategy, and test expectations are agreed.

## Scope

v0.5.0 defines how mock providers should behave when they are implemented later:

- Describe deterministic mock provider behavior.
- Define event examples as design examples only.
- Clarify how mock providers can be swapped for real providers.
- Plan lifecycle, adapter, cleanup, unsubscribe, duplicate start, notification expiry, and progress sequence tests.
- Identify event quality rules and known risks before runtime code exists.

v0.5.0 does not add:

- `MockMusicProvider`, `MockAIProvider`, `MockDownloadProvider`, or `MockNotificationProvider` implementation.
- Provider adapter implementation.
- Tauri, Rust, IPC, Windows, media session, notification center, file watcher, shell, tray, or system API behavior.
- Changes to runtime state, resolver code, assets, package metadata, scripts, or source files.

## Provider Behavior Table

| Provider | Planned mock behavior | Event shape intention | Cleanup expectation |
| --- | --- | --- | --- |
| `MockMusicProvider` | Emits a stable active music event for a fake track, then optional paused or cleared updates in scripted scenarios. | `kind: "music"`, stable `id`, provider `source`, track title, optional artist/album metadata in `payload`. | Stops interval work, clears listeners, and emits no further events after `stop()`. |
| `MockAIProvider` | Emits deterministic progress for a fake long-running AI task, then complete or error depending on the scenario. | `kind: "ai"`, stable task `id`, monotonic `progress`, lifecycle `status` values such as `progress`, `complete`, or `error`. | Cancels pending ticks and prevents stale completion events after unsubscribe or stop. |
| `MockDownloadProvider` | Emits a fake download with predictable progress steps from start to completion. | `kind: "download"`, stable download `id`, file title, byte or phase metadata in `payload` only when needed. | Stops progress ticks and clears active download events when the scenario ends. |
| `MockNotificationProvider` | Emits short-lived notification events with deterministic expiration timestamps. | `kind: "notification"`, unique notification `id`, short `title`, optional `expiresAt`, and minimal non-private `payload`. | Ensures expired notifications disappear and no late notification events fire after cleanup. |

## Design Example Events

These are design examples only. They are not implementation fixtures and should not be treated as committed runtime output for v0.5.0.

```ts
const musicEventExample = {
  id: "mock-music:session",
  kind: "music",
  source: "MockMusicProvider",
  status: "active",
  title: "Night Window",
  subtitle: "Demo Artist",
  priority: 20,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  payload: {
    album: "Mock Sessions",
    playbackState: "playing",
  },
};
```

```ts
const aiEventExample = {
  id: "mock-ai:task",
  kind: "ai",
  source: "MockAIProvider",
  status: "progress",
  title: "Summarizing notes",
  progress: 45,
  priority: 40,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_004_000,
  payload: {
    phase: "drafting",
  },
};
```

```ts
const downloadEventExample = {
  id: "mock-download:installer",
  kind: "download",
  source: "MockDownloadProvider",
  status: "progress",
  title: "Cober-Setup.exe",
  progress: 72,
  priority: 30,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_006_000,
  payload: {
    receivedBytes: 72_000_000,
    totalBytes: 100_000_000,
  },
};
```

```ts
const notificationEventExample = {
  id: "mock-notification:calendar-reminder",
  kind: "notification",
  source: "MockNotificationProvider",
  status: "active",
  title: "Design review in 10 minutes",
  priority: 90,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  expiresAt: 1_700_000_010_000,
  payload: {
    category: "calendar",
  },
};
```

## Mock-to-Real Swap Principle

Mock providers should use the same public provider contract expected from real providers:

```ts
interface Provider {
  start(): void;
  stop(): void;
  subscribe(listener: (events: HubEvent[]) => void): () => void;
}
```

The swap boundary is the provider contract and adapter, not the UI. A real provider should be able to replace a mock provider without changing hub rendering, resolver rules, or store semantics. Mock-specific sequencing, fake timers, and canned payloads must stay inside the mock provider layer or test harness.

Provider events should be normalized before they reach the store. Real providers may have richer source data, but the hub path should only rely on stable `HubEvent` fields and documented resolver behavior.

## Deterministic Interval and Fake Timer Strategy

Mock providers should be deterministic by default:

- Use fake timers in tests so progress sequences, expiration, cleanup, and duplicate start behavior are repeatable.
- Avoid wall-clock `Date.now()` reads inside provider logic unless time is injected.
- Prefer an injected clock or scheduler interface for `now()`, `setInterval`, `clearInterval`, `setTimeout`, and `clearTimeout`.
- Keep progress steps fixed, monotonic, and documented per scenario.
- Emit small batches only when the scenario intentionally demonstrates batched provider output.
- Ensure `stop()` clears every scheduled interval and timeout.
- Ensure unsubscribe removes only the target listener and does not affect other listeners.

Planned fake timer scenarios:

- Music start, pause, resume, and clear at known ticks.
- AI progress from `0` to `100` with deterministic complete/error endings.
- Download progress sequence with no skipped or regressive values.
- Notification activation followed by expiration at the exact expected tick.
- Cleanup before the next tick to prove no stale events are emitted.

## Event Quality Rules

### No Event Spam

Providers should emit only meaningful state changes. Progress events should be rate-limited or step-based so the hub does not receive noisy updates for every internal tick. Mock providers should model this discipline from the start.

### Duplicate Event Handling

Duplicate `start()` calls should be idempotent. A provider that is already running should not create duplicate intervals, duplicate listeners, or duplicate active events. Repeated event IDs should update existing store entries instead of multiplying visible items.

### Event Expiration

Events with `expiresAt` should be removed or ignored after expiration. Notification mocks must include deterministic expiry examples so resolver behavior can be tested without waiting on real time.

### Provider Health Reporting

Providers should have a planned path for health status without flooding the hub. Health reporting should distinguish running, stopped, degraded, and failed provider states, but v0.5.0 does not define a runtime health API.

### Error Event Strategy

Provider failures should emit a concise `error` status event when the user or diagnostics need to know. Error payloads must avoid secrets, full file paths, raw request bodies, or private system data. Recoverable mock failures should be scripted and deterministic.

### Backpressure Rules

Provider adapters should be able to drop, coalesce, or defer low-priority events if a future runtime produces too many updates. Backpressure should preserve the latest state for stable IDs and should not drop terminal `complete`, `error`, or `cleared` events.

## Future Test Plan

These tests are planned for v0.5.1 implementation or later:

| Test area | Expected coverage |
| --- | --- |
| Lifecycle | `start()` begins emission, `stop()` ends emission, restart works without stale state. |
| Adapter | Provider events are forwarded into the event bus in publication order. |
| Cleanup | Intervals, timeouts, and listeners are removed on `stop()` and test teardown. |
| Unsubscribe | Returned unsubscribe functions remove only the subscribed listener and are safe to call twice. |
| Duplicate start | Calling `start()` repeatedly does not create duplicate intervals or duplicate event streams. |
| Notification expiry | Notification events expire at deterministic timestamps and no longer resolve as active. |
| Progress sequence | AI and download progress are monotonic, deterministic, clamped to `0` through `100`, and end in terminal status. |

## Risks

| Risk | Concern | Planned mitigation |
| --- | --- | --- |
| Event spam | High-frequency provider ticks could overload the event path or make hub transitions jittery. | Step-based mock output, future coalescing, and clear backpressure rules. |
| Stale events | Timers may emit after `stop()` or unsubscribe, causing phantom hub state. | Fake timer cleanup tests and idempotent lifecycle rules. |
| Privacy payload | Mock examples can accidentally normalize unsafe payload patterns that real providers copy. | Keep payload examples minimal and forbid secrets, raw paths, raw request bodies, and private system data. |
| Crashes | Provider errors could interrupt the whole hub path. | Isolate provider failure handling and model deterministic error events. |
| Long-running tasks | AI or download mocks may never complete if progress sequencing is unclear. | Fixed progress sequences with terminal `complete` or `error` states. |
| Unsubscribe leaks | Listener cleanup bugs could multiply event delivery over time. | Double-unsubscribe and multi-listener tests. |

## v0.5.1 Handoff Notes

When implementation begins, keep the first runtime slice small:

- Implement one provider and its tests before adding all four.
- Prove lifecycle and cleanup with fake timers before wiring demo scenarios.
- Preserve the mock-to-real swap boundary by keeping UI and resolver code independent from mock internals.
- Treat this document as planning guidance, not as proof that runtime behavior already exists.
