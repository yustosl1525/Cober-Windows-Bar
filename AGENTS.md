# AGENTS.md

@C:\Users\jay\browser-harness\SKILL.md

## Skill Routing

### Auto-trigger /parallel-dev-workflow when:
- Task involves 3+ independent modules or files
- User describes a feature with multiple components
- Task has clear module boundaries (auth, api, ui, etc.)
- User says: "快速", "并行", "同时处理", "多模块", "快速开发"

### Detection signals:
- "实现一个XXX功能，包括..." -> multiple components
- "添加认证、支付、用户管理" -> 3+ modules
- "重构这个模块，涉及这几个文件" -> 3+ files
- Plan identifies 3+ independent workstreams

### When NOT to auto-trigger:
- Single file changes
- Simple bug fixes
- Tightly coupled changes
- User explicitly says "不需要并行"

## Desktop Launch

- Prefer the local npm/Tauri entrypoint instead of a global `tauri` command. A global `tauri` binary may not be installed on this machine.
- From the repository root, launch desktop dev mode with:

```powershell
npm run tauri -- dev
```

- The Tauri config starts Vite via `beforeDevCommand`, so the desktop route should become available at:

```text
http://localhost:5173/desktop
```

- `npm run desktop:mock` currently calls `tauri dev` directly from `scripts/desktop-mock.ps1`; if global `tauri` is missing, use `npm run tauri -- dev` instead.
- Keep `.dev.log` and `.dev.err.log` untracked when capturing launch output.
