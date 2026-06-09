# Provider SDK

The Provider SDK is the Stage 2 boundary for future integrations. In v0.3.2 it is still a showcase demo path only: mock providers emit fake `HubEvent` objects through the existing event path so the resolver and Hub UI can be tested without desktop or system integration.

## Contract

Providers expose a small lifecycle and listener contract:

```ts
interface Provider {
  start(): void;
  stop(): void;
  subscribe(listener: (events: HubEvent[]) => void): () => void;
}
```

The contract keeps provider ownership separate from hub rendering:

- Providers create `HubEvent` objects.
- The provider adapter forwards those events into the existing event bus.
- The store and resolver decide the current hub mode.
- The existing Hub UI renders the resolved mode.

## Event Flow

```text
Mock Provider
  -> provider adapter
  -> publishHubEvent()
  -> store
  -> resolver
  -> existing Hub UI
```

Validation target:

```text
Mock MusicProvider event -> adapter -> event bus -> resolver -> Music mode
Mock DownloadProvider event -> adapter -> event bus -> resolver -> Download mode
Mock AITaskProvider event -> adapter -> event bus -> resolver -> AI Progress mode
Mock NotificationProvider event -> adapter -> event bus -> resolver -> Notification mode
```

## v0.3.2 Showcase Demo Scope

- Clarify provider lifecycle and event ownership.
- Keep mock providers deterministic for tests and demo capture.
- Demonstrate the provider path: provider adapter -> event bus -> store/resolver -> existing Hub UI.
- Preserve the existing `/showcase` visual design.

## Current Limitations

v0.3.2 does not add:

- Tauri, IPC, tray, always-on-top, or desktop-shell behavior.
- Windows/system APIs.
- Real music, download, notification, system, or AI-task providers.
- Media-session readers, file watchers, notification-center readers, or external service integrations.
- Showcase visual redesign or new product surfaces.

Real providers belong to Stage 4 after the Provider SDK and desktop-shell layers are stable.
