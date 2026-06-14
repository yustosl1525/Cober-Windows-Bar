# Provider Tutorial: Build a Custom Provider

> How to add a new `HubProvider` implementation in 5 minutes, with the patterns and pitfalls that keep the data pipeline healthy.

## 1. 目标读者 (Who this is for)

A developer who wants Cober-Windows-Bar to surface a new kind of status — for example, a Pomodoro timer, a CI build watcher, a chat-notification poller, or a custom dev-tool inspector — and is comfortable enough with TypeScript and React to write a small module.

This guide assumes you have already read [`docs/providers/PROVIDER_SDK.md`](./PROVIDER_SDK.md) and understand the role of the `HubEvent` envelope, the event bus, and the store/resolver pipeline. If you have not, read that first.

## 2. 前置条件 (Prerequisites)

- Node 20+ and pnpm/npm installed.
- The Cober-Windows-Bar repo cloned and `npm install` run.
- A working `npm run test:providers` baseline (all green).
- Familiarity with the [`HubProvider` contract in `src/providers/types.ts`](../../src/providers/types.ts).

You do **not** need to know Tauri, Rust, or the IPC layer to build a mock-style provider. Real-system providers use the same factory and add a runtime client.

## 3. 5 分钟教程: 创建 `MyProvider`

We will build a `PomodoroProvider` that emits a `notification` event when a work block finishes. The complete file lives in `src/providers/realPomodoroProvider.ts`.

```ts
// src/providers/realPomodoroProvider.ts
import { createProviderShell } from "./providerShell";
import type { HubProvider, HubProviderCapability, HubProviderMetadata } from "./types";
import type { HubEvent } from "../types/hub";

const PROVIDER_ID = "real-pomodoro-provider";
const TICK_INTERVAL_MS = 1_000;
const WORK_BLOCK_MS = 25 * 60 * 1_000;

function pomodoroEvent(elapsed: number): HubEvent {
  const createdAt = Date.now();
  return {
    id: `${PROVIDER_ID}-pomodoro-${createdAt}`,
    type: "notification",
    source: "notification",
    createdAt,
    expiresAt: createdAt + 30_000,
    payload: {
      app: "Pomodoro",
      sender: "Focus Timer",
      message: elapsed >= WORK_BLOCK_MS ? "Work block complete" : "Focusing",
    },
  };
}

export function createRealPomodoroProvider(): HubProvider {
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let elapsed = 0;

  const metadata: HubProviderMetadata = {
    id: PROVIDER_ID,
    name: "Pomodoro Provider",
    kind: "notification",
    version: "1.0.0",
    mock: false,
  };

  const capabilities: HubProviderCapability[] = [
    { id: "notification", kind: "notification", origin: "real", support: "available" },
  ];

  return createProviderShell({
    metadata,
    capabilities,

    start(handle) {
      pollTimer = setInterval(() => {
        elapsed += TICK_INTERVAL_MS;
        handle.emit([pomodoroEvent(elapsed)]);
      }, TICK_INTERVAL_MS);
    },

    stop() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = undefined;
      }
    },
  });
}
```

### Anatomy of the file

| Part | What it does |
|------|--------------|
| `PROVIDER_ID` | Stable string used in event ids and the registry. Never change it once shipped. |
| `pomodoroEvent()` | Pure builder: maps domain state into a `HubEvent`. No side effects, no IO. |
| `metadata` | Describes identity (`id`, `name`, `kind`, `version`, `mock`). |
| `capabilities` | One row per `HubEventType` the provider can produce, with `origin` and `support`. |
| `start(handle)` | Opens timers/subscriptions and pushes events through `handle.emit(...)`. |
| `stop()` | Releases every resource opened in `start`. Idempotent and safe to call twice. |

`createProviderShell` (`src/providers/providerShell.ts`) gives you `emit`, `markDegraded`, `subscribe`, and `status` for free — you only write the lifecycle hooks.

## 4. Provider 生命周期详解 (Lifecycle in detail)

The shell drives a small state machine:

```text
Registered -> Publishing (after start)
                       \-> Stopped (after stop)
```

- `start()` is **idempotent**: calling it twice does not create a second timer or subscription. The shell returns early if `lifecycle === "Publishing"`.
- `start()` is called by `ProviderManager.start()` after the registry accepts the provider. You do not call it yourself.
- `stop()` is also idempotent and is always called, even on a provider that was never started. Use it to clear `setInterval`, detach listeners, and reset pointers to `undefined`.
- `markDegraded()` flips health to `Degraded` but does not stop the provider. Use it when the source is partial but still useful (e.g., one of two API calls failed).

`status()` returns `{ lifecycle, health }`. Treat this as a diagnostic surface, not a UI signal — the store and resolver still decide what the hub shows.

## 5. Emit 模式 (Emit patterns)

### Single event

```ts
handle.emit([buildEvent(state)]);
```

Always pass an array. Even a single event is a one-element batch — this keeps the listener signature stable and lets providers batch cheaply.

### Batch emit

```ts
handle.emit([musicEvent, downloadEvent, aiEvent]);
```

Useful when one tick produces multiple independent events. The hub store and resolver will dedupe by `event.id`.

### Do not mutate events downstream

Listeners (the provider adapter) pass the array to `publishHubEvent`, which feeds the store. Never call `event.payload.foo = ...` from inside your provider after emit. Build a new event instead:

```ts
// WRONG
handle.emit([event]);
event.payload.message = "updated";

// CORRECT
handle.emit([buildEvent({ ...state, message: "updated" })]);
```

## 6. 常见陷阱 (Common pitfalls)

1. **Forgetting to clear `setInterval` in `stop()`** — leaks a timer per restart. Always keep the handle in a closure variable and `clearInterval` it in `stop()`. See `realDownloadProvider.ts` for the canonical pattern.

2. **Calling `emit` after `stop()`** — the shell already guards this, but a slow async source can race. Use a `lifecycle` check before emit, or ignore the result once you have detached. The shell returns early when `lifecycle !== "Publishing"`, so emitting from a stale callback is a no-op, but you still get noisy logs if you await-then-emit.

3. **Non-idempotent `start()`** — if you allocate resources inside `start` without an early return, calling `start()` twice doubles them. The shell guards this at the lifecycle level, but a hand-rolled provider without the shell can drift. Always check `lifecycle === "Publishing"` before allocating.

4. **Sharing one `setInterval` between providers** — each provider owns its own timer. Cross-provider coordination belongs in a supervisor, not the provider.

5. **Trusting payload identity** — treat every `HubEvent` you build as immutable after emit. Listeners may keep references; mutating the payload later will corrupt downstream state.

6. **Hardcoding event ids** — always derive from provider id + timestamp (`${PROVIDER_ID}-${kind}-${createdAt}`) so the resolver can dedupe.

## 7. 测试 (Testing)

The shell makes testing trivial. Subscribe a listener, drive the provider, and assert on captured events:

```ts
// src/providers/realPomodoroProvider.test.ts
import { describe, expect, it, vi } from "vitest";
import { createRealPomodoroProvider } from "./realPomodoroProvider";

describe("createRealPomodoroProvider", () => {
  it("emits notification events while running", () => {
    vi.useFakeTimers();
    const provider = createRealPomodoroProvider();
    const listener = vi.fn();
    provider.subscribe(listener);

    provider.start();
    vi.advanceTimersByTime(2_000);

    expect(listener).toHaveBeenCalled();
    const events = listener.mock.calls[0][0];
    expect(events[0].type).toBe("notification");
    expect(events[0].payload.app).toBe("Pomodoro");

    vi.useRealTimers();
  });

  it("stops emitting after stop()", () => {
    vi.useFakeTimers();
    const provider = createRealPomodoroProvider();
    const listener = vi.fn();
    provider.subscribe(listener);

    provider.start();
    provider.stop();
    vi.advanceTimersByTime(5_000);

    expect(listener).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
```

Run with `npm run test:providers -- realPomodoroProvider`. The existing `providerShell.test.ts` covers the shell itself; you only need to test your provider's domain logic.

## 8. 注册到 ProviderManager (Registering)

Open `src/providers/providerManager.ts` and add the provider inside the appropriate branch:

```ts
import { createRealPomodoroProvider } from "./realPomodoroProvider";

// inside createProviderManager(...)
if (realProviders) {
  registerProvider(createRealClipboardProvider());
  registerProvider(createRealDownloadProvider());
  registerProvider(createRealFocusProvider());
  registerProvider(createRealMediaSessionProvider());
  registerProvider(createRealPomodoroProvider()); // <-- new
  registerProvider(createRealSystemPerformanceProvider());
  registerProvider(createRealUpdateProvider());
}
```

The registry assigns a registration order; the resolver decides priority. You do not need to touch `providerRegistry.ts` directly — `registerProvider()` handles duplicate-id conflicts and warning logs.

## 9. Mock vs Real 模式 (Mock vs real)

| Use a **mock** provider when | Use a **real** provider when |
|------------------------------|------------------------------|
| You are building UI flow and need deterministic data. | You have a real source (Tauri command, file watcher, OS API). |
| You want a screenshot-friendly fixture for QA. | You are wiring the production data path. |
| The real source is not yet implemented (preflight). | You are replacing a mock once the real source lands. |

Both go through `createProviderShell`. The only differences are:

- `metadata.mock` is `true` for mocks, `false` for real.
- `capabilities[].origin` is `"mock"` for mocks, `"real"` (or `"native"`) for real.
- Real providers usually call into `src/runtime/*` (Tauri IPC) from inside `start()`.

The [`PROVIDER_REGISTRY.md`](./PROVIDER_REGISTRY.md) doc covers diagnostic capability support and how the registry reports preflight vs available rows.

## 10. Check list before opening a PR

- [ ] `metadata.id` is unique and stable.
- [ ] Every `capabilities` row has matching `id` and `kind`.
- [ ] `stop()` clears timers and resets closure state.
- [ ] `start()` is guarded against double-allocation.
- [ ] Event ids derive from provider id + timestamp.
- [ ] Tests cover happy path, stop-after-start, and listener cleanup.
- [ ] Provider is registered in `providerManager.ts`.
- [ ] No `console.log` left in production paths (use `runtimeGuards` for diagnostics).
- [ ] No private data crosses the IPC boundary (see `PROVIDER_SDK.md` privacy section).

## See also

- [`PROVIDER_SDK.md`](./PROVIDER_SDK.md) — Full SDK contract and event flow diagram.
- [`PROVIDER_MODEL.md`](./PROVIDER_MODEL.md) — Domain model, event envelopes, and capability matrix.
- [`PROVIDER_LIFECYCLE.md`](./PROVIDER_LIFECYCLE.md) — Lifecycle states, health model, idempotency rules.
- [`PROVIDER_RUNTIME.md`](./PROVIDER_RUNTIME.md) — How providers connect to the event bus and store.
- [`PROVIDER_REGISTRY.md`](./PROVIDER_REGISTRY.md) — Registration, lookup, and capability diagnostics.
- [`src/providers/providerShell.ts`](../../src/providers/providerShell.ts) — The factory every provider uses.
- [`src/providers/types.ts`](../../src/providers/types.ts) — `HubProvider`, `HubProviderMetadata`, `HubProviderCapability`.
- [`src/providers/realFocusProvider.ts`](../../src/providers/realFocusProvider.ts) — Canonical real-provider example.
- [`src/providers/mockProviders.ts`](../../src/providers/mockProviders.ts) — Canonical mock-provider examples.
- [`src/providers/providerManager.ts`](../../src/providers/providerManager.ts) — Where new providers are registered.
