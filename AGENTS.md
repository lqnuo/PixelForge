# Repository Guidelines

## Project Structure & Module Organization
- `src/main`: Electron main process (DB, IPC, jobs). Key files: `index.ts`, `ipc.ts`, `db/`, `jobs/`, `styles/`.
- `src/preload`: Safe bridge exposed via `contextBridge` (`window.api.*`). Do not import `electron` in the renderer.
- `src/renderer`: Vue 3 + TypeScript UI (`src/renderer/src/**`). Entry: `index.html`, `src/main.ts`, `src/App.vue`.
- Config: `electron.vite.config.ts` (Vite + Tailwind CSS v4), `electron-builder.yml`, `eslint.config.mjs`, `postcss.config.js`, `tsconfig*.json`.
- Assets: `resources/` (icons), `build/` (packaging resources), `docs/` (product specs, TODOs).

## 技术选型（Tech Stack）
- 前端框架: Vue 3 + TypeScript
- 语法风格: `<script setup lang="ts">`
- 样式体系: Tailwind CSS v4（`@tailwindcss/vite` 集成）
- UI 组件: shadcn-vue（基于 Reka UI），图标 `lucide-vue-next`
- 组件位置: `src/renderer/src/components/ui/**`，使用别名 `@` 导入（例如 `@/components/ui/popover`）

参考: shadcn-vue Popover 文档 https://www.shadcn-vue.com/docs/components/popover.html

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
- Linting: ESLint (Electron Toolkit + TS). Fix issues before PRs.
- TypeScript: prefer explicit types at module boundaries. `.ts` for main/preload，renderer 使用 `.vue` + `<script setup lang="ts">`。
- Naming: PascalCase 组件名，camelCase 变量/函数，kebab-case 文件/目录。
- CSS: Tailwind CSS v4；通用样式放在 `globals.css`，组件样式优先使用类名组合。

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
