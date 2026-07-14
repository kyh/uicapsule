# Agent Instructions

## Project Overview

**uicapsule** - pnpm monorepo with Turborepo

### Structure

```
apps/
  web/           # Next.js 16 app (main frontend)
packages/
  api/           # tRPC (auth/organization) + better-auth
  db/            # Drizzle ORM + Turso (libSQL)
  ui/            # shadcn/ui components (radix-ui)
content/         # Gallery components — one workspace package per slug
```

### Content architecture

Content is filesystem-driven; the web app never depends on content packages by name:

- `apps/web/src/lib/content/content-fs.ts` reads `content/*/meta.json` + source files;
  `content-data.ts` wraps it in `"use cache"` server functions (feed, filters, search
  index, shadcn registry). The `"use cache"` + `cacheLife("max")` pairing is intentional,
  not an oversight — content only ever changes on deploy.
- `preview-frame/[slug]` renders previews via a relative dynamic import of
  `content/<slug>/preview.tsx`.
- `/r/<slug>.json` serves the shadcn registry item; the source-code drawer and zip
  download on the client reuse it.
- Content packages exist as workspace packages only so pnpm installs their deps in
  isolation and the registry can report per-component dependencies.

### Tech Stack

- **Runtime**: pnpm 10, Node, TypeScript 5.9
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **API**: tRPC, better-auth
- **Database**: Turso (libSQL), Drizzle ORM
- **UI**: radix-ui, shadcn, lucide-react, motion

## Common Commands

```bash
pnpm dev              # Start all (db, studio, dev)
pnpm dev:web          # Just Next.js app
pnpm build            # Build all
pnpm typecheck        # Type check all
pnpm lint             # Lint all
pnpm lint:fix         # Lint + fix
pnpm format           # Check formatting
pnpm format:fix       # Fix formatting
pnpm db:push          # Push local db schema
pnpm db:push-remote   # Push to production Turso
pnpm new:content <slug>  # Scaffold a new content component in content/
```

## Verification Contract

Every change must leave all four green: `pnpm typecheck`, `pnpm lint` (oxlint),
`pnpm format` (oxfmt), `pnpm build`. There are **zero tests in the repo today** — don't
assume a suite has your back.

## Decisions (do not re-litigate)

- **auth + tRPC are kept.** One procedure, zero callers, deliberately retained for a future
  feature. Make them correct; don't propose deleting them.
- **Supabase stays.** It hosts every cover video.
- Settled audit findings that should not be re-raised live in the pinned issue #84.

## Content Curation Philosophy

Applies to anything touching `content/` — new components, PR reviews, cover
choreography, gallery copy. In priority order:

1. **Import from outside the web.** The best entries translate interactions the web
   doesn't have: hardware (fingerprint ripple, shutter), OS motion (dynamic-island,
   predictive-back), TV/console focus models, instruments, physical mechanisms
   (dials, latches, pull-cords), spatial/AR gestures. "A nicer dropdown" doesn't cut it.
2. **Intersection, not category.** One interaction × one unexpected domain beats a
   straight port — "scrubbing × latent space", "pinch zoom × abstraction level".
   Collisions that don't exist anywhere yet.
3. **State readable from motion alone.** Every component must sell itself in a
   ~12-second silent recording. If its appeal needs explanation, it fails.

## Gotchas

- Turbopack's persistent cache freezes the Tailwind `@source` glob: arbitrary classes that
  exist only in a NEWLY created `content/<slug>` package silently don't generate (styles in
  DOM but no CSS). Fix: `rm -rf apps/web/.next` and restart `pnpm dev:web`.
