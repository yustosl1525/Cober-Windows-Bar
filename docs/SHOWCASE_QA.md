# Showcase QA

`/showcase` 是 Phase 0 以及后续所有 UI 变更的统一验收入口。

## Run

```bash
npm run dev:showcase
```

或启动 dev server 后打开：

```text
http://localhost:5173/showcase
```

## Automated Checks

```bash
npm run qa
```

在 dev server 已启动时生成三种验收宽度截图：

```bash
npm run qa:showcase:screenshots
```

截图输出到 `output/playwright/`，该目录只作为本地验收产物，不纳入 git。

## Required States

- Idle
- Music
- AI Progress
- Download
- Notification
- MultiTask

## Required Viewports

- 1366 x 768
- 1440 x 900
- 1920 x 1080

## Acceptance Checklist

- 六种状态在页面中同时可见。
- 左侧模式切换可以更新当前悬浮栏预览。
- Notification 预览触发后 3 秒回到 Idle。
- Hub 文本在目标宽度内不重叠、不溢出。
- 进度条、图标、阴影和边框在深色背景上清晰可辨。
- 任务栏融合示例在 1366 宽度下不压住右侧系统状态区。
- `npm run qa` 通过。
- `npm run qa:showcase:screenshots` 可生成 1366、1440、1920 三张截图。
