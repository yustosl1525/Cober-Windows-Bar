# Cober-Windows-Bar Roadmap

Cober-Windows-Bar is a Windows 11 Unified Status Hub. The roadmap proves the product in layers: visual quality first, then state flow, then extension contracts, then desktop shell, then real data.

## Stage 0: UI Prototype

Goal: prove the hub looks credible.

Status: done and pushed as v0.1.

Delivered:

- Win11/Mica/Acrylic `/showcase` review page
- Six visible states: Idle, Music, AI Progress, Download, Notification, MultiTask
- Fluent-style components, animation, and responsive desktop layouts
- QA commands for build, state tests, and showcase screenshots

## Stage 1: Event Playground

Goal: prove the status flow is reasonable and the hub can move.

Status: current v0.2 work.

Scope:

- Mock events only
- Event Controls: Music, AI, Download, Notification, MultiTask, Clear / Idle
- Auto Demo: Idle -> Music -> AI -> Notification -> Download -> MultiTask -> Idle
- Resolver Visualization: Active Events -> Resolver -> Current Mode
- Event path: mock event -> event bus -> store -> resolver -> Hub UI

Out of scope:

- Provider SDK
- Tauri
- IPC
- Real system APIs
- Tray or always-on-top behavior

## Stage 2: Provider SDK

Goal: prove future integrations can be added cleanly.

Scope:

- Define provider interfaces and lifecycle contracts
- Add fake providers only
- Keep all data mocked

Example contract:

```ts
interface Provider {
  start(): void;
  stop(): void;
  subscribe(listener: (events: HubEvent[]) => void): () => void;
}
```

Candidate fake providers:

- MusicProvider
- DownloadProvider
- NotificationProvider
- AITaskProvider

## Stage 3: Tauri Shell

Goal: turn the web prototype into a desktop application.

Scope:

- Tauri v2 shell
- Transparent or acrylic-feeling window
- Right-bottom docking above the taskbar
- Startup behavior
- Always-on-top behavior

Real providers are still optional at this stage.

## Stage 4: Real Providers

Goal: connect real system data for the first time.

Priority:

1. System information and music status
2. System notifications without reading private message content
3. Downloads folder/file-change status

Candidate sources:

- CPU, RAM, network
- Windows Media Session-compatible apps
- Windows notification center
- Downloads directory watcher

## Stage 5: Developer Hub

Goal: become a daily developer status center.

Candidate surfaces:

- Git working tree status
- Docker builds and containers
- WSL status
- Maven and Gradle builds
- npm, pnpm, and Cargo tasks

This stage is one of the strongest differentiation points because developer workflows create persistent, glanceable status.

## Stage 6: AI Agent Hub

Goal: summarize long-running AI work and multi-agent activity.

Candidate surfaces:

- Codex
- Claude
- GPT/OpenCode/Gemini-style agent sessions
- Running, waiting, analyzing, generating, and reviewing states
- Multi-agent progress summaries

This stage turns the product from a notification surface into a unified status layer for modern AI-assisted work.

## Product Principle

Prefer clear status flow over early real-data breadth. A beautiful, understandable event-driven playground proves the architecture better than a half-integrated provider stack with confusing state transitions.
