# Provider Model Architecture Plan

v0.4 is a planning milestone only. It defines the provider model that future real integrations should follow, but it does not implement Tauri, Rust, IPC, Windows APIs, system readers, real providers, or background services.

The goal is to make the future provider layer boring, testable, and replaceable before any operating-system integration is added.

## Provider Contract

Providers are small lifecycle objects that describe one external or simulated source of hub events.

```ts
interface ProviderMetadata {
  id: string;
  name: string;
  kind: ProviderKind;
  version: string;
  mock: boolean;
}

interface ProviderStatus {
  lifecycle: "Registered" | "Started" | "Publishing" | "Paused" | "Stopped" | "Failed";
  health: "Healthy" | "Degraded" | "Unhealthy";
  message?: string;
  lastStartedAt?: number;
  lastEventAt?: number;
  lastErrorAt?: number;
}

interface Provider {
  metadata: ProviderMetadata;
  status(): ProviderStatus;
  start(): void | Promise<void>;
  stop(): void | Promise<void>;
  subscribe(listener: ProviderListener): () => void;
}

type ProviderListener = (events: HubEvent[]) => void;
```

### Metadata

Provider metadata should be static after construction.

- `id` is the stable internal key used for logs, tests, and adapter registration.
- `name` is the readable provider label for debug and future settings UI.
- `kind` groups providers by product surface, such as music, download, notification, system, developer, or AI-agent.
- `version` tracks provider contract compatibility, not app release version.
- `mock` makes test/demo sources explicit and prevents fake sources from being mistaken for real integrations.
- Provider metadata must not contain resolver priority, display priority, or other fields that influence final hub-mode selection. Priority policy is resolver-owned.

### Start

`start()` connects the provider to its data source or begins deterministic mock playback. It must be idempotent.

- Calling `start()` while already `Started` or `Publishing` should not create duplicate timers, watchers, listeners, processes, or subscriptions.
- A failed start should move lifecycle to `Failed`, set health to `Unhealthy`, and include a short diagnostic message.
- Providers should not publish events until their internal setup is complete enough to produce coherent output.
- Startup work should stay provider-owned; adapters should not know source-specific setup details.

### Stop

`stop()` disconnects the provider from its data source and releases all resources. It must be idempotent.

- Calling `stop()` while already `Stopped` should be a no-op.
- Stop must clear timers, detach source listeners, abort pending reads, and close provider-owned handles.
- Stop should not emit fresh domain events unless a future provider explicitly needs a terminal event and the resolver contract supports it.
- Stop should leave the provider reusable so a later `start()` can begin cleanly.

### Subscribe and Listener

`subscribe(listener)` registers a listener for batches of `HubEvent` objects and returns an unsubscribe function.

- Listener registration should not implicitly start the provider.
- Unsubscribe must be idempotent.
- A listener should receive future events only; replay behavior should be a separate explicit feature if needed later.
- Providers should catch listener errors so one bad listener does not break other listeners or provider lifecycle.
- Event delivery should use arrays even for single events so batching can be introduced without changing the contract.

### Lifecycle And Health

`status()` returns a lightweight snapshot for tests, diagnostics, future settings UI, and provider supervision.

- Status must not perform I/O.
- Status should be safe to call frequently.
- Status should expose provider lifecycle, provider health, and recent timestamps, not source-specific private data.
- Lifecycle must use only `Registered`, `Started`, `Publishing`, `Paused`, `Stopped`, or `Failed`.
- Health must use only `Healthy`, `Degraded`, or `Unhealthy`.
- Event delivery status, task progress, download state, AI task state, and other domain statuses belong in HubEvents, not provider lifecycle.
- Failure diagnostics should help debugging without leaking secrets, message content, file contents, command output, or credentials.

## Lifecycle Model

Providers move through a small lifecycle:

```text
Registered -> Started -> Publishing -> Paused -> Stopped
                         \-> Failed
```

Recovery from `Failed` should be explicit:

- `stop()` clears active resources and moves the provider toward `Stopped`.
- A later `start()` may retry setup.
- Automatic restart policy belongs to a future provider supervisor, not individual provider implementations.

Provider construction should be cheap and side-effect free. Real source access belongs in `start()`, while cleanup belongs in `stop()`.

## Idempotency Rules

The provider layer should be safe under repeated calls from tests, hot reload, future settings toggles, and desktop-shell lifecycle changes.

- `start()` may be called more than once.
- `stop()` may be called more than once.
- `unsubscribe()` may be called more than once.
- `status()` may be called at any time.
- Duplicate subscriptions from the same callback are allowed but treated as separate registrations unless a future registry chooses to dedupe them.

Idempotency is a contract requirement, not a convenience. It protects the hub from duplicate events, leaked watchers, stuck timers, and confusing resolver output.

## Cleanup Rules

Every provider must own and clean up the resources it creates.

- Timers and intervals are cleared on `stop()`.
- File watchers and OS listeners are detached on `stop()`.
- Child processes are not created in v0.4; future providers that create them must define termination rules before implementation.
- Pending async work should be ignored or aborted after `stop()` so stale events do not reach the hub.
- Provider adapters must unsubscribe from providers when disabled or disposed.
- Tests should verify cleanup by proving no events are emitted after stop/unsubscribe.

## Event Output Rules

Providers output canonical `HubEvent` objects only. They do not update React state, choose hub modes, render UI, or emit UI-specific view models.

```text
Provider -> Event Bus -> Store -> Resolver -> UI
```

Rules:

- Events should be normalized to the canonical HubEvent contract before leaving the provider boundary.
- Events should include stable source identity so diagnostics can trace them back to provider metadata.
- Providers may emit empty batches only if the adapter explicitly treats them as no-ops.
- Providers should avoid sending private payloads when a derived status is enough.
- Providers should prefer semantic status events over raw logs or source dumps.
- Resolver priority remains centralized. Providers do not suggest resolver priority, display priority, or final hub mode through metadata or emitted events.
- Mock providers must emit deterministic event sequences for tests and showcase capture.
- A runtime or adapter may supervise, batch, validate, or forward HubEvents, but it must not bypass the Event Bus, Store, or Resolver.
- UI-specific conversion happens after Store and Resolver processing, not inside providers.

## Error Handling Principles

Provider errors should degrade the integration without taking down the hub.

- Source failures move provider lifecycle to `Failed` when the provider can no longer produce reliable events.
- Recoverable source glitches may degrade provider health without changing lifecycle away from `Started` or `Publishing`.
- Listener errors are isolated from provider lifecycle.
- Recoverable source glitches should be summarized, rate-limited, and kept out of the main hub unless they affect user-visible status.
- Errors must not include secrets, private notification text, full paths beyond what is needed, command output dumps, or credentials.
- The adapter should be able to log provider failures and keep other providers running.
- The resolver should continue using the latest valid events from other providers.

Future real providers should classify failures before implementation:

- permission denied
- source unavailable
- unsupported platform
- malformed source data
- timeout
- rate limit
- provider bug

## Mock-First Provider Approach

Every provider family should begin as a mock provider before any real integration is attempted.

Mock-first goals:

- Prove the event shape.
- Prove resolver behavior.
- Prove UI states.
- Prove lifecycle and cleanup tests.
- Prove that no provider needs direct UI access.
- Provide deterministic demo data for screenshots and product review.

Promotion path:

1. Define mock metadata, lifecycle, health, and event fixtures.
2. Add lifecycle and health tests for start, stop, subscribe, unsubscribe, and status.
3. Validate adapter output into the existing event bus and resolver.
4. Document privacy, permissions, and source risk for the real provider.
5. Only then consider real data-source implementation in a later phase.

v0.4 stops at planning this path. Real provider code belongs to later stages after the desktop shell and provider supervision model are ready.

## Future Provider Matrix

| Provider | Data Source | Risk | Priority | Phase Notes |
| --- | --- | --- | --- | --- |
| Music | Mock playback events first; later Windows Media Session-compatible apps | Medium: app compatibility, metadata privacy, playback-state edge cases | High | Mock in Provider SDK; real reader after desktop shell proves lifecycle and permissions. |
| System Status | Mock CPU, RAM, battery, network, and focus states first; later OS/system metrics | Medium: polling cost, platform differences, misleading noisy metrics | High | Likely first real provider family because it proves always-on status without private content. |
| Download | Mock progress events first; later Downloads folder watcher and browser/download APIs where available | Medium: file watcher reliability, path privacy, partial-file conventions | Medium | Start with generic progress semantics; avoid exposing filenames unless explicitly needed. |
| Notification | Mock notification summaries first; later Windows notification center or app-level bridges | High: privacy, permissions, duplication, sensitive message content | Medium | Prefer derived counts and app/source summaries over raw notification text. |
| Git | Mock repository status first; later local git command/status reader | Medium: large repo performance, worktree privacy, shelling out safely | Medium | Developer Hub candidate; should avoid running mutating git commands. |
| Docker | Mock container/build states first; later Docker CLI/API status | Medium: daemon availability, permissions, command latency | Medium | Developer Hub candidate; provider should handle daemon offline as normal status. |
| WSL | Mock distro status first; later WSL command/status reader | Medium: command latency, distro variance, Windows-only assumptions | Medium | Developer Hub candidate; likely depends on a command execution safety policy. |
| Build Tools | Mock task progress first; later npm, pnpm, Maven, Gradle, Cargo, and related process/task integrations | High: heterogeneous output, long-running processes, log privacy | Medium | Needs a normalized task model before real process integration. |
| AI Agents | Mock agent task states first; later Codex, Claude, GPT/OpenCode/Gemini-style session integrations | High: privacy, vendor variance, unstable APIs, user trust | High | Strategic differentiator; should show progress/status, not transcript content by default. |

## v0.4 Non-Goals

v0.4 does not include:

- real provider implementations
- Tauri, Rust, IPC, tray, always-on-top, or desktop-window behavior
- Windows Media Session access
- system metrics access
- file watchers
- notification center readers
- Docker, WSL, Git, or build tool command execution
- AI agent API or transcript integration
- source changes under `src/`

The planning output is this architecture model only. Implementation should wait until the contract, lifecycle tests, privacy rules, and desktop-shell boundaries are agreed.
