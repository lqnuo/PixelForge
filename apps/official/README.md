# PixelForge Official Site (Nuxt 4 + Nuxt UI 4)

Marketing + auth site for the Electron app. Built with Nuxt 4 and Nuxt UI 4.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Auth（邮件验证码，better-auth + Supabase）

- 安装依赖（站点工作区）：
  - `pnpm -C apps/official add better-auth drizzle-orm pg @nuxt/ui@alpha`
- 配置环境变量（见 `.env.example`）：
  - `DATABASE_URL`（Supabase Postgres）、`BETTER_AUTH_SECRET`、`SITE_URL`
  - `SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM`（邮件发送）
- Better Auth 初始化位于 `server/plugins/better-auth.ts`，通用处理在 `server/api/auth/[...].ts`。
- 邮件验证码：
  - 发送：`POST /api/auth/otp.send`，body `{ email, redirect_uri? }`
  - 校验：`POST /api/auth/otp.verify`，body `{ email, code, redirect_uri? }`
  - 若提供 `redirect_uri`，校验成功将 302 到 `redirect_uri?token=...`
- 登录页 `/login` 只支持邮件验证码流程。

Quick dev flow (no real auth): the “开发模式登录（占位）” button generates a dummy token and redirects back.

## Electron Deep Link

- Electron registers custom protocol `pixelforge://` and listens for `pixelforge://auth/callback?token=...`.
- Set `OFFICIAL_SITE_URL` in the desktop app env or call `window.api.auth.openLogin(siteUrl)` to open the site’s `/login` with the redirect back to the app.
- Subscribe to the callback in renderer: `window.api.events.onAuthCallback(({ token }) => { /* store token */ })`.

## Deploy (Vercel)

- Deploy this app to Vercel; set `SITE_URL` and Supabase/better-auth env vars in Vercel.
- Point the Electron app to that URL via `OFFICIAL_SITE_URL`.

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [Nuxt 4 docs](https://nuxt.com/docs/4.x/getting-started/introduction) and [Nuxt UI 4 docs](https://ui4.nuxt.com/docs/getting-started).
