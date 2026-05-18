# SilkRoute OS

> AI-powered sourcing & import/export operating system — the Linear of import/export.

## Prerequisites

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) 9+
- PostgreSQL (or a [Neon](https://neon.tech) / [Supabase](https://supabase.com) connection URL)

## Setup

```bash
# 1. Clone
git clone <repo-url> silkroute-os
cd silkroute-os

# 2. Install dependencies (also initialises Husky hooks)
pnpm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and fill in every placeholder

# 4. Generate Prisma client
pnpm db:generate

# 5. Run database migrations
pnpm db:migrate

# 6. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — you should land on `/fr` by default.

## Scripts

| Command            | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `pnpm dev`         | Next.js development server with HMR                       |
| `pnpm build`       | Production build                                          |
| `pnpm start`       | Start the production server                               |
| `pnpm typecheck`   | TypeScript strict type checking                           |
| `pnpm lint`        | ESLint (next/core-web-vitals + @typescript-eslint/strict) |
| `pnpm format`      | Prettier formatting                                       |
| `pnpm test`        | Vitest unit & component tests                             |
| `pnpm test:e2e`    | Playwright end-to-end tests                               |
| `pnpm db:generate` | Generate Prisma client from schema                        |
| `pnpm db:migrate`  | Apply pending migrations                                  |
| `pnpm db:studio`   | Open Prisma Studio                                        |

## Locale

The app defaults to French (`/fr`). English is available at `/en`.  
All user-facing strings live in `src/messages/{en,fr}.json` via `next-intl`.

## Tech stack

Next.js 14 · TypeScript strict · Tailwind CSS · shadcn/ui · Prisma · Clerk · next-intl (FR/EN) · Anthropic Claude · TanStack Query · Framer Motion · Sentry · Vitest · Playwright
