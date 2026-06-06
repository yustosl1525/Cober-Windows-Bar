# Tauri Strategy

## Purpose

v0.4 is an architecture planning milestone only. It should make the runtime boundary, desktop-shell assumptions, and future Tauri spike requirements explicit without introducing Rust code, IPC code, Windows APIs, packaging scripts, or real providers.

The near-term goal is to keep the React status hub moving through a stable mock runtime while planning the path to a native Windows desktop runtime.

## Version Placement

- **v0.4 Architecture Planning**: document runtime boundaries, shell needs, IPC shape, packaging expectations, and provider sequencing. No implementation.
- **v0.5 Mock Provider SDK**: keep provider contracts and validation mock-only inside the web/runtime boundary.
- **v0.6 Tauri Spike**: prove the smallest useful Tauri desktop shell and IPC bridge with mocked data.
- **v0.7 First Real Provider**: add the first real Windows-facing provider after the runtime boundary and IPC model are proven.
- **v0.8 Developer Hub**: expand provider surfaces for developer workflows.
- **v1.0 AI Agent Hub**: make long-running AI agent activity a first-class status surface.

## Runtime Boundary

The product should evolve through three runtime layers:

```text
Mock Runtime -> Tauri Runtime -> Windows Runtime
```

### Mock Runtime

The current runtime remains the source of truth through v0.5. It includes mocked events, fake providers, resolver behavior, showcase controls, and docs that describe the future system without depending on native capabilities.

Responsibilities:

- Emit deterministic mock `HubEvent` data.
- Validate provider contracts without operating-system access.
- Keep resolver behavior testable in the web app.
- Preserve a fast iteration loop for UI, state, and architecture docs.

### Tauri Runtime

The v0.6 spike should prove that the web UI can run inside a native desktop shell and communicate across a minimal IPC boundary. It should still be allowed to use mocked provider data.

Architecture needs:

- A transparent or acrylic-feeling window suitable for a compact status hub.
- Docking rules for the lower-right desktop area above the Windows taskbar.
- Always-on-top and focus behavior appropriate for a passive status surface.
- Startup behavior and lifecycle hooks.
- A narrow IPC contract that can carry normalized hub events and runtime commands.
- Failure behavior when the native layer is unavailable or returns malformed data.

Non-goals for the spike:

- Real Windows providers.
- Broad Rust module design.
- Deep system API integration.
- Production packaging polish.
- Background services beyond what is needed to test shell viability.

### Windows Runtime

The Windows runtime comes after the Tauri spike. It should own real system integration and convert native signals into the same normalized event contract already exercised by mock providers.

Future responsibilities:

- Windows Media Session or equivalent music status.
- Downloads folder/file-change status.
- Notification status without reading private message content unless a future privacy design explicitly allows it.
- System information such as CPU, RAM, battery, network, or active workload.
- Developer workflow providers when Stage 5 begins.
- AI agent session providers when Stage 6 begins.

## IPC Planning

IPC should be treated as an architecture boundary, not a v0.4 implementation task.

Planned shape:

```text
Windows Provider -> Windows Runtime -> Tauri IPC -> Runtime Adapter -> publishHubEvent() -> store -> resolver -> Hub UI
```

Requirements to capture before implementation:

- Event payloads must stay normalized around the existing `HubEvent` model.
- IPC messages should be small, serializable, versionable, and easy to inspect during debugging.
- The UI should not know whether an event came from a mock provider, Tauri IPC, or a Windows API.
- Native errors should become explicit runtime status events or diagnostics, not silent UI failures.
- Privacy-sensitive providers must define what is collected, what is ignored, and what never crosses IPC.

## Window And Shell Requirements

These are architecture needs for v0.4 and spike candidates for v0.6:

- Compact floating status surface.
- Transparent/acrylic-feeling visual treatment where supported.
- Lower-right docking above the Windows taskbar.
- Always-on-top behavior that does not interrupt active work.
- Click-through or focus behavior decision, if needed, after user testing.
- Multi-monitor positioning rules.
- Startup behavior, tray presence, and exit/restart behavior.
- DPI and scaling behavior for common Windows 11 display settings.

## Packaging Requirements

Packaging should be planned in v0.4 and tested only as part of the v0.6 spike or later.

Architecture needs:

- Development builds should remain fast for React/UI iteration.
- Desktop builds should be reproducible and documented.
- App identity, icon, signing, updater, installer, and autostart decisions should be separated from provider implementation.
- Packaging should not be allowed to pull real Windows providers into v0.6 unless the spike explicitly calls for them.

## Provider Sequencing

Real Windows providers should wait until the runtime boundary is proven.

Recommended order:

1. **v0.5 Mock Provider SDK**: finish the fake provider contract and adapter path.
2. **v0.6 Tauri Spike**: prove shell and IPC using mock or fixture events.
3. **v0.7 First Real Provider**: choose one low-risk Windows provider and keep its event output compatible with the mock provider contract.
4. **v0.8 Developer Hub**: add developer workflow providers once runtime diagnostics and provider lifecycle handling are stable.
5. **v1.0 AI Agent Hub**: add AI agent sessions as a top-level product surface.

## v0.4 Non-Goals

- No Tauri setup.
- No Rust code.
- No IPC implementation.
- No tray, always-on-top, startup, or packaging implementation.
- No Windows APIs.
- No media session, notification center, file watcher, or system information integration.
- No real providers.
- No changes to `src/`, `package.json`, `scripts/`, or binary assets.
