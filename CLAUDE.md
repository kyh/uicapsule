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
pnpm check:content    # Fail if any content/<slug> is not a loadable component
```

## Verification Contract

Every change must leave all four green: `pnpm typecheck`, `pnpm lint` (oxlint),
`pnpm format` (oxfmt), `pnpm build`. There are **zero tests in the repo today** — don't
assume a suite has your back.

`pnpm build` runs `check:content` first (turbo task `//#check:content`): the gallery loader
in `content-fs.ts` silently drops a `content/<slug>` that lacks its `meta.json` + `preview.tsx`
pair (or, for a remote component, `iframeUrl`/`sourceUrl`), so a half-scaffolded stub used to
vanish with no error and pile up. The guard turns that silence into a failed build — do not
remove it. Finish the component or delete the directory; scaffold with `pnpm new:content`.

## Decisions (do not re-litigate)

- **auth + tRPC are kept.** One procedure, zero callers, deliberately retained for a future
  feature. Make them correct; don't propose deleting them.
- **Supabase stays.** It hosts every cover video.
- **Vercel builds on every push — deliberately. Do not add build-skipping.** Both Vercel's
  "Skip unaffected projects" and an Ignored Build Step / `turbo-ignore` are disabled on the
  project. Every skip mechanism decides "affected" from the _workspace dependency graph_, and
  `apps/web` intentionally never depends on `content/*` by name (see Content architecture), so
  they classify every content-only commit as unaffected and silently cancel the deploy. That
  ate four real deploys before it was caught. The optimization also isn't worth it: builds run
  ~44s and 39 of the last 40 commits genuinely needed one. If this repo ever gains a second
  Vercel project, revisit — until then, always build.
- **`turbo.json` declares `globalDependencies: ["content/**"]` — do not remove it.** Same
  root cause as the Vercel note above: `apps/web` reads `content/*` from the filesystem and
  never imports it, so it is absent from turbo's build-input graph. Without this line a
  content-only commit is a `FULL TURBO` cache hit that serves the _previous_ build — which
  both hides content edits and, when a content source file was deleted/renamed, fails the
  Vercel deploy with `ENOENT` on the stale file in the cached Next.js trace (killed the
  merge of #86 once). The line makes any content change invalidate the web build.
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
