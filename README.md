# Cober-Windows-Bar

Windows 11 Fluent Design 风格的智能状态悬浮栏 UI 原型。

当前阶段：`UI Prototype`

## Overview

Cober-Windows-Bar 目标是做一个看起来像 Windows 11 官方系统功能的 Smart Status Hub。它常驻屏幕右下角任务栏上方，用紧凑、低打扰的方式展示音乐、AI 生成、下载进度和重要通知。

首版只做前端 UI 原型，不接真实系统数据，也不包含 Tauri/Rust 桌面壳。

## Features

- Idle 收缩状态
- Music 播放状态
- AI Progress 任务进度
- Download 下载进度
- Notification 消息通知
- Multi Task 多任务堆叠
- Windows 11 Fluent / Acrylic / Mica 视觉风格
- Mock 数据驱动的展示页面

## Local Development

```bash
npm install
npm run dev
```

Showcase 验收入口：

```text
http://localhost:5173/showcase
```

也可以直接启动并打开：

```bash
npm run dev:showcase
```

Build:

```bash
npm run build
```

Phase 0 QA:

```bash
npm run qa
```

## Screenshots

Phase 0 的截图统一从 `/showcase` 页面生成。验收宽度：

- 1366 x 768
- 1440 x 900
- 1920 x 1080

页面必须同时展示 Idle、Music、AI Progress、Download、Notification、MultiTask 六种状态。

## Roadmap

- Phase 0: UI showcase prototype
- Phase 1: Mock event bus and state resolver
- Phase 2: Tauri 2 floating desktop shell
- Phase 3: Real providers for system, music, downloads, and AI states
- Phase 4: Ecosystem providers for Git, Docker, WSL, Maven, Gradle, and notifications

## Documentation

- [PRD](docs/PRD.md)
- [UI Spec](docs/UI_SPEC.md)
- [Showcase QA](docs/SHOWCASE_QA.md)
- [Roadmap](docs/ROADMAP.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)

## License

MIT
