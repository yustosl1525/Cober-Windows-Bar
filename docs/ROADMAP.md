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

Status: done as v0.2.

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

## Stage 2: Architecture Planning

Goal: plan the runtime boundary before desktop work begins.

Status: current v0.4 planning work.

Scope:

- Document the runtime sequence: Mock Runtime -> Tauri Runtime -> Windows Runtime
- Define Tauri shell needs as architecture requirements only
- Capture IPC, windowing, packaging, and provider sequencing decisions
- Keep all data mocked and all desktop/native work out of scope

Out of scope for v0.4:

- Tauri, Rust, IPC, tray, always-on-top, or desktop-shell implementation
- Windows/system APIs
- Real provider implementations
- Source code or package/script changes

## Stage 3: Mock Provider SDK

Goal: prove future integrations can be added cleanly without native dependencies.

Target: v0.5.

Scope:

- Define provider interfaces and lifecycle contracts
- Add fake providers only
- Keep all data mocked
- Validate the provider adapter path into the existing event bus, store, resolver, and Hub UI
- Document the contract and current limitations

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

Event flow:

```text
Fake Provider -> provider adapter -> publishHubEvent() -> store -> resolver -> existing Hub UI
```

Out of scope for v0.5:

- Tauri, IPC, tray, always-on-top, or desktop-shell behavior
- Windows/system APIs
- Real provider implementations
- Showcase visual redesign

## Stage 4: Tauri Spike

Goal: turn the web prototype into a desktop application.

Target: v0.6.

Scope:

- Tauri v2 shell
- Transparent or acrylic-feeling window
- Right-bottom docking above the taskbar
- Startup behavior
- Always-on-top behavior
- Minimal IPC bridge using mock or fixture events

Real providers remain out of scope unless a later spike explicitly changes that boundary.

## Stage 5: First Real Provider

Goal: connect real system data for the first time.

Target: v0.7.

Priority:

1. System information and music status
2. System notifications without reading private message content
3. Downloads folder/file-change status

Candidate sources:

- CPU, RAM, network
- Windows Media Session-compatible apps
- Windows notification center
- Downloads directory watcher

## Stage 6: Developer Hub

Goal: become a daily developer status center.

Target: v0.8.

Candidate surfaces:

- Git working tree status
- Docker builds and containers
- WSL status
- Maven and Gradle builds
- npm, pnpm, and Cargo tasks

This stage is one of the strongest differentiation points because developer workflows create persistent, glanceable status.

## Stage 7: AI Agent Hub

Goal: summarize long-running AI work and multi-agent activity.

Target: v1.0.

Candidate surfaces:

- Codex
- Claude
- GPT/OpenCode/Gemini-style agent sessions
- Running, waiting, analyzing, generating, and reviewing states
- Multi-agent progress summaries

This stage turns the product from a notification surface into a unified status layer for modern AI-assisted work.

## Product Principle

Prefer clear status flow over early real-data breadth. A beautiful, understandable event-driven playground proves the architecture better than a half-integrated provider stack with confusing state transitions.
