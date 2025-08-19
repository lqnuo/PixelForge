# Repository Guidelines

## Project Structure & Module Organization
- `src/main`: Electron main process (DB, IPC, jobs). Key files: `index.ts`, `ipc.ts`, `db/`, `jobs/`, `styles/`.
- `src/preload`: Safe bridge exposed via `contextBridge` (`window.api.*`). Do not import `electron` in the renderer.
- `src/renderer`: Vue 3 + TypeScript UI with UnoCSS (`src/renderer/src/**`). Entry: `index.html`, `src/main.ts`, `src/App.vue`.
- Config: `electron.vite.config.ts` (Vite + UnoCSS), `electron-builder.yml`, `eslint.config.mjs`, `postcss.config.js`, `tsconfig*.json`.
- Assets: `resources/` (icons), `build/` (packaging resources), `docs/` (product specs, TODOs).

## Build, Test, and Development Commands
- Install deps: `pnpm install`
- Dev (hot reload): `pnpm dev`
- Preview built app: `pnpm start`
- Type check: `pnpm typecheck` (runs Node + Web tsconfigs)
- Lint: `pnpm lint`
- Format: `pnpm format`
- Build cross‑platform: `pnpm build`
- Platform packages: `pnpm build:mac` | `build:win` | `build:linux`

## Coding Style & Naming Conventions
- Formatting: Prettier enforced (singleQuote, no semi, width 100). Run `pnpm format`.
- Linting: ESLint (Electron Toolkit + React, Hooks, Refresh). Fix issues before PRs.
- TypeScript: prefer explicit types at module boundaries. `.ts` for main/preload, `.tsx` for React.
- Naming: PascalCase React components, camelCase variables/functions, kebab-case file/dir names.
- CSS: UnoCSS in renderer (presetWind + transformers); keep custom utilities in `globals.css` and component‑scoped classes in components.

## Renderer UI Structure
- 左侧侧边栏导航：`素材（Uploads）`、`任务（Jobs）`。
- 右侧内容区：对应页面内容，均带顶栏工具区，主体可滚动。
- `素材`：网格列表 + 分页 + 复选 + 批量操作（删除、风格/尺寸后批量生成）。
- `任务`：列表 + 状态筛选 + 分页 + 批量重试；可下载首个生成结果。
- 无路由库：用本地状态切换，降低复杂度。

## IPC Additions
- `job.bulkCreate({ imageIds, styleId?, aspectRatio })`：为多张素材批量创建任务（入队）。
- `job.list({ page?, pageSize?, status? }) -> { items, total, page, pageSize }`：分页列出任务，支持状态筛选。

## Testing Guidelines
- No unit test runner yet. Use `pnpm typecheck` and `pnpm lint` as gates.
- Manual QA: upload → select style → generate → preview → download on your OS; verify DB file at `Electron app userData/app.db`.
- If adding tests, follow `src/**/__tests__` with Vitest (to be introduced) and keep UI tests minimal.

## Commit & Pull Request Guidelines
- Commit style: Conventional Commits (e.g., `feat: add IPC for downloads`, `fix: handle duplicate image hash`, `perf: 优化`). Keep subject ≤72 chars, imperative mood.
- PRs must include: clear summary, linked issues, screenshots/GIFs for UI changes, steps to reproduce/test, and platform(s) tested.
- Breaking changes: call out DB schema or IPC contract updates and update `docs/` accordingly.

## Security & Configuration Tips
- Renderer must call `window.api` only; never import `electron` or use Node APIs directly.
- Keep `preload` surface minimal; validate IPC inputs in `src/main/ipc.ts`.
- Large binaries are stored in SQLite BLOBs; avoid oversized test assets in VCS.
- Mirrors: `.npmrc` pins Electron/electron-builder mirrors; keep for reproducible installs.
