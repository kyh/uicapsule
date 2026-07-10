# Agent Instructions

## Project Overview

**uicapsule** - pnpm monorepo with Turborepo

### Structure

```
apps/
  web/           # Next.js 16 app (main frontend)
packages/
  api/           # tRPC API + better-auth
  db/            # Drizzle ORM + Turso (libSQL)
  ui/            # shadcn/ui components (radix-ui)
  builder/       # Content builder (watches /content)
```

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
pnpm new:content <slug>  # Scaffold a new content component (content/ + web app dep)
```

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
