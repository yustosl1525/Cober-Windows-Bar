# Cober-Windows-Bar Implementation Plan

## 1. Product Narrative

Cober-Windows-Bar is a **Windows 11 Unified Status Hub**. It starts as a visual and interaction prototype, then gradually grows into a native-feeling desktop surface for status, developer work, and AI agent activity.

The current implementation scope is **v0.2 Interactive Event Playground**. It proves that the hub can move through meaningful states using mock events. It does not implement Provider SDKs, Tauri, real Providers, system tray behavior, or always-on-top windowing.

## 2. Stage Route

- **Stage 0: UI Prototype** - done and pushed as v0.1. Delivered the Win11-style `/showcase` UI review page and six static hub states.
- **Stage 1: Event Playground** - current v0.2. Prove state transitions with mock Event Controls, Auto Demo playback, and Resolver Visualization.
- **Stage 2: Provider SDK** - later. Define provider interfaces and fake providers only; no Windows/system integration.
- **Stage 3: Tauri Shell** - later. Turn the web UI into a native-feeling desktop shell after the playground is stable.
- **Stage 4: Real Providers** - later. First real system integration: system info/music, then notifications, then downloads.
- **Stage 5: Developer Hub** - later. Add Git, Docker, WSL, Maven, Gradle, npm/pnpm, Cargo, and developer workflow surfaces.
- **Stage 6: AI Agent Hub** - later. Add Codex, Claude, GPT/OpenCode/Gemini-style agent status, queue state, progress, and multi-agent visibility.

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

## 6. Boundaries

Do not implement these in v0.2:

- Provider SDK
- MusicProvider, DownloadProvider, NotificationProvider, or AITaskProvider
- Tauri, IPC, tray, or always-on-top behavior
- Real system, music, download, notification, or AI provider integration

Stage 2-6 items may be described as future direction only.

## 7. QA Plan

### Build

```bash
npm run build
```

### Full QA

```bash
npm run qa
```

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
- The page remains mock-only and does not require Provider SDK, Tauri, or real Providers.
