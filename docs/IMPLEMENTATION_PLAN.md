# Cober-Windows-Bar Implementation Plan

## 1. Product Narrative

Cober-Windows-Bar is a **Windows 11 Unified Status Hub**. It starts as a visual and interaction prototype, then gradually grows into a native-feeling desktop surface for status, developer work, and AI agent activity.

The current planning scope is **v0.5.1 Mock Provider SDK Implementation Plan**. It defines the first provider runtime implementation slice as documentation only. It does not implement provider code, tests, Tauri, Rust, IPC, real providers, Windows/system APIs, system tray behavior, always-on-top windowing, or a `/showcase` visual redesign.

## 2. Stage Route

- **Stage 0: UI Prototype** - done and pushed as v0.1. Delivered the Win11-style `/showcase` UI review page and six static hub states.
- **Stage 1: Event Playground** - done as v0.2. Proved state transitions with mock Event Controls, Auto Demo playback, and Resolver Visualization.
- **Stage 2: Architecture Planning** - current v0.4. Document runtime boundaries and future Tauri/Windows architecture needs only.
- **Stage 3: Mock Provider SDK Planning** - v0.5. Define provider lifecycle, registry, runtime, test strategy, and implementation scope as docs only.
- **Stage 4: Mock Provider SDK Implementation** - v0.6. Implement the first mock provider runtime slice; no Windows/system integration.
- **Stage 5: First Real Provider** - v0.7. First real system integration after the runtime boundary is proven.
- **Stage 6: Developer Hub** - v0.8. Add Git, Docker, WSL, Maven, Gradle, npm/pnpm, Cargo, and developer workflow surfaces.
- **Stage 7: AI Agent Hub** - v1.0. Add Codex, Claude, GPT/OpenCode/Gemini-style agent status, queue state, progress, and multi-agent visibility.

The long-term product ceiling is a Windows 11 **Unified Status Hub**, not only a Dynamic Island clone. Stages 5 and 6 are the strongest differentiation bets, but they must wait until Stage 1-4 prove the interaction model and desktop shell.

## 3. Current Technical Stack

- React
- TypeScript
- Vite
- TailwindCSS
- Framer Motion
- lucide-react
- Playwright CLI for showcase screenshots

## 4. Current Source Shape

```text
src/
|-- App.tsx
|-- main.tsx
|-- styles/
|   `-- globals.css
|-- components/
|   |-- hub/
|   |-- showcase/
|   `-- ui/
|-- data/
|   `-- mockHubData.ts
|-- pages/
|   `-- ShowcasePage.tsx
|-- state/
|   |-- hubScenarios.ts
|   |-- hubState.ts
|   `-- hubState.test.ts
`-- types/
    `-- hub.ts
```

## 5. v0.2 Interactive Event Playground Scope

### Event Controls

Controls should publish mock events through the existing event path:

```text
Event Controls -> publishHubEvent() -> store -> resolver -> resolved UI mode
```

Required controls:

- Music
- AI
- Download
- Notification
- MultiTask
- Start Demo
- Clear / Idle

### Auto Demo

`Start Demo` should automatically play:

```text
Idle -> Music -> AI -> Notification -> Download -> MultiTask -> Idle
```

The demo should be stable enough for README, GitHub, or Bilibili GIF capture.

Implementation notes:

- Keep the sequence deterministic for QA and repeatable screenshots.
- Keep manual controls usable after the sequence completes.
- Prefer a small scenario helper in `src/state/hubScenarios.ts` over provider-like abstractions.

### Resolver Visualization

The showcase should display:

- Active Events
- Current Mode
- Events -> Resolver -> Resolved Mode

The visualization should make notification priority and MultiTask resolution easy to verify.

### Current Integration Files

- `src/state/hubScenarios.ts` defines deterministic mock scenarios and the auto-demo sequence.
- `src/state/hubState.ts` remains the event bus/store/resolver boundary.
- `src/state/hubState.test.ts` protects scenario resolution, expiry, clear-to-idle, and playback order.
- `src/components/showcase/EventPlaygroundPanel.tsx` is the showcase control and visualization surface.
- `src/pages/ShowcasePage.tsx` integrates the panel while preserving the Stage 0 Win11/Mica shell.

## 6. v0.4 Runtime/Tauri Architecture Planning Scope

v0.4 is docs-only. It should describe how the app moves from a mock runtime to a Tauri runtime and eventually to a Windows runtime without introducing native implementation work.

Runtime sequence:

```text
Mock Runtime -> Tauri Runtime -> Windows Runtime
```

Planning scope:

- `docs/TAURI_STRATEGY.md` documents v0.4 as planning only.
- The Tauri shell is described through architecture requirements: windowing, IPC, packaging, startup, always-on-top, and docking behavior.
- The v0.6 spike should prove a Tauri shell and minimal IPC with mock or fixture data.
- Real Windows providers are deferred until v0.7 or later.
- Provider sequencing remains mock-first: Mock Provider SDK in v0.5, Tauri Spike in v0.6, First Real Provider in v0.7.

Do not implement these in v0.4:

- Tauri setup, Rust code, IPC, tray, always-on-top, startup, or packaging behavior
- Windows APIs, media sessions, file watchers, notification readers, or system information providers
- Real provider implementations
- Source code, package, script, or binary asset changes

## 7. v0.5 Mock Provider SDK Planning Scope

Stage 3 adds a minimal Provider SDK boundary without connecting to the operating system. v0.5 should clarify the contract, runtime execution, event flow, tests, and docs expectations while keeping all provider data mocked.

Current v0.5 sequence:

- **v0.5.0 Mock Provider SDK Planning** - provider lifecycle, registry, and mock strategy docs.
- **v0.5.1 Implementation Plan docs-only** - provider runtime and test strategy docs. Code changes: **0**.
- **v0.5.2 Review & Freeze** - review the provider docs and freeze the first implementation slice.
- **v0.6 Mock Provider SDK Implementation** - implement the first mock provider runtime slice after the planning freeze.

Provider output must follow the existing path:

```text
Mock Provider -> provider adapter -> publishHubEvent() -> store -> resolver -> existing Hub UI
```

Current scope:

- `src/providers/types.ts` defines the provider lifecycle and listener contract.
- `src/providers/mockProviders.ts` emits mock Music, Download, AI Task, and Notification events.
- `src/providers/providerAdapter.ts` forwards provider events into the existing event bus.
- `src/providers/provider.test.ts` verifies provider output resolves to the expected hub modes.
- `docs/PROVIDER_RUNTIME.md` documents the v0.5.1 runtime plan.
- `docs/TEST_STRATEGY.md` documents the v0.5.1 test plan.
- `docs/PROVIDER_SDK.md` documents the contract, event flow, and v0.5 limitations.

Do not implement these in v0.5.1:

- Windows APIs, media sessions, file watchers, or system notification readers
- Tauri, IPC, tray, or always-on-top behavior
- Real provider implementations
- `/showcase` visual redesigns
- Provider runtime code, mock provider code, registry code, adapter code, or tests

## 8. Boundaries

Do not implement these in the current stage:

- Tauri, IPC, tray, or always-on-top behavior
- Windows/system APIs
- Real MusicProvider, DownloadProvider, NotificationProvider, SystemProvider, or AITaskProvider implementations
- Media sessions, file watchers, notification-center readers, or external service integrations
- Showcase visual redesigns or new product surfaces

Stage 3-7 items may be described as future direction only.

## 9. QA Plan

### Build

```bash
npm run build
```

### Full QA

```bash
npm run qa
```

`npm run qa` runs state tests, provider tests, and the production build.

### Showcase Screenshots

Run after the dev server is available:

```bash
npm run qa:showcase:screenshots
```

Required visual widths:

- 1366 x 768
- 1440 x 900
- 1920 x 1080

### Manual Acceptance

- `/showcase` keeps the Windows 11/Mica/Acrylic style from v0.1.
- Event Controls update the active events and current resolved mode.
- Auto Demo plays the full Stage 1 sequence and returns to Idle.
- Resolver Visualization explains why the current mode is selected.
- Provider SDK validation remains mock-only and does not require Tauri, Windows/system APIs, or real providers.
- v0.4 docs clearly state that architecture planning does not include Tauri implementation, Rust, IPC, Windows/system API integration, real providers, package/script changes, or showcase visual redesign.
