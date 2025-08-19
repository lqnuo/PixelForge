# Repository Guidelines

## Project Structure & Module Organization
- `src/main`: Electron main process (DB, IPC, jobs). Key files: `index.ts`, `ipc.ts`, `db/`, `jobs/`, `styles/`.
- `src/preload`: Safe bridge exposed via `contextBridge` (`window.api.*`). Do not import `electron` in the renderer.
- `src/renderer`: React + TypeScript UI with Tailwind (`src/renderer/src/**`). Entry: `index.html`, `src/main.tsx`, `src/App.tsx`.
- Config: `electron.vite.config.ts`, `electron-builder.yml`, `eslint.config.mjs`, `tailwind.config.js`, `postcss.config.js`, `tsconfig*.json`.
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
- CSS: Tailwind in renderer; keep utilities in `globals.css` and component‑scoped classes in components.

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
