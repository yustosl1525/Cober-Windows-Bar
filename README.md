# Cober-Windows-Bar

Windows 11-style status hub showcase for proving glanceable desktop state flows before native integration work begins.

Current release track: **v0.3.4 README & Demo Asset Polish**.

## Current Status

Cober-Windows-Bar is currently a mock-only `/showcase` experience. It demonstrates the product direction for a lightweight Windows 11 status surface, but it is not a native desktop app yet.

What exists today:

- Win11/Mica/Acrylic showcase UI for core hub states.
- Event Playground controls for publishing mock hub events.
- Auto Demo flow for recording state transitions.
- Resolver visualization for active events, resolver output, and current mode.
- Mock Provider SDK demo that feeds provider-style events into the same resolver path.

What does not exist yet:

- No Tauri shell, tray, always-on-top windowing, IPC, or native desktop packaging.
- No Windows/system APIs, media-session readers, notification readers, file watchers, or OS hooks.
- No real providers or external integrations.

## What It Proves

The current showcase proves the front-end interaction model and provider boundary before the project commits to Windows-native implementation details.

- The hub can present distinct, glanceable modes: Idle, Music, AI Progress, Download, Notification, and MultiTask.
- Manual playground events and mock provider events travel through one shared flow.
- Resolver behavior is visible enough to review, debug, and demo.
- The Win11 visual direction is stable enough for screenshots and demo capture.

Event flow:

```text
Mock Provider / Event Playground
  -> publishHubEvent()
  -> store
  -> resolver
  -> showcased Hub UI
```

## Try It

Install dependencies and run the local app:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173/showcase
```

Or start the showcase directly:

```bash
npm run dev:showcase
```

Use the Event Playground controls to trigger hub states, clear back to Idle, or run the Auto Demo sequence.

## QA Commands

Build and run the main QA checks:

```bash
npm run build
npm run qa
```

Run the repeatable Provider Demo interaction check:

```bash
npm run qa:showcase:interactions
```

Generate showcase screenshots after the dev server is running:

```bash
npm run qa:showcase:screenshots
```

Screenshots are written to `output/playwright/` as local QA artifacts and are not committed by default.

## Roadmap

- **Stage 0: UI prototype** - Win11/Mica showcase with the core hub states.
- **Stage 1: Event Playground** - mock event controls, resolver visualization, and Auto Demo.
- **Stage 2: Provider SDK** - mock providers and adapter validation, still without real system integration.
- **v0.3.x: Showcase polish** - keep `/showcase`, demo capture, and mock Provider SDK reviewable.
- **Stage 3: Tauri shell** - add desktop shell behavior, native windowing, tray, IPC, and packaging.
- **Stage 4: Real providers** - connect system, music, download, notification, and AI task sources.
- **Stage 5+: Developer and agent hub** - add Git, Docker, WSL, build tool, and long-running AI work status surfaces.

## Documentation

- [PRD](docs/PRD.md)
- [UI Spec](docs/UI_SPEC.md)
- [Showcase QA](docs/SHOWCASE_QA.md)
- [Provider SDK](docs/PROVIDER_SDK.md)
- [Roadmap](docs/ROADMAP.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)

## License

MIT
