# Agent Instructions

## Project Overview

**uicapsule** - pnpm monorepo with Turborepo

### Structure

```
apps/
  web/           # Next.js 16 app (main frontend)
packages/
  api/           # oRPC + better-auth
  db/            # Drizzle ORM + Turso (libSQL)
  ui/            # shadcn-derived components on Base UI
content/         # Gallery components — one workspace package per slug
```

### Content architecture

Content is filesystem-driven; the web app never depends on content packages by name:

- `apps/web/src/lib/content/content-fs.ts` indexes `content/*/meta.json` and reads source
  only for downloads/registry requests. `content-schema.ts` supplies the shared metadata
  parser and inferred types for the loader and build guard;
  `content-data.ts` wraps it in `"use cache"` server functions (gallery cards, search
  index, shadcn registry). The `"use cache"` + `cacheLife("max")` pairing is intentional,
  not an oversight — content only ever changes on deploy.
- The home gallery ships every card in the static shell and filters in the browser
  (`content/gallery.ts`, pure). Only a leaf reading `useSearchParams` suspends; don't wrap
  the grid in that Suspense boundary or hydration remounts every card.
- `preview-frame/[slug]` renders previews via a relative dynamic import of
  `content/<slug>/preview.tsx`.
- `/r/<slug>.json` serves the shadcn registry item. The source drawer and zip download
  use `/api/content/<slug>`; the viewer and zip library load on demand.
- Content packages exist as workspace packages only so pnpm installs their deps in
  isolation and the registry can report per-component dependencies.
- `meta.json` carries provenance: `addedAt` (required, stamped by `new:content`, drives
  gallery order newest-first), `inspiredBy` (where the idea came from), `requestedBy`
  (who asked for it). Keep them honest — they render on the detail page.

### Component requests

`/request` → oRPC `request.create` → GitHub issue labelled `request` (needs
`GITHUB_ISSUES_TOKEN`). Attachments go through `/api/request/attachments` to GitHub's own
`uploads.github.com/user-attachments/assets` store (the endpoint `gh --attach` uses; fine-grained
PATs allowed, repo write access required), capped at 4MB by Vercel's request-body limit.
Visitor text has `@` neutralized so it can't trigger the `@claude` workflow.
Triage is manual: apply `ready` to accept, close as not-planned to decline. The
`build-requests` skill drains `ready` issues into PRs (run locally, on a schedule).

### Agent-readable surfaces

`apps/web/src/lib/agent/` is the machine-readable layer, and it is deliberately pure — no
Next imports, no filesystem — so it can be unit-tested without a runtime. The routes and
`src/proxy.ts` only feed it data.

- **One source per page.** `site-pages.ts` holds the prose for `/about`, `/contact` and
  `/privacy`; the JSX page and the Markdown representation both render from it. Never edit
  the copy in only one of the two.
- **Markdown content negotiation** (acceptmarkdown.com): `src/proxy.ts` parses `Accept` and
  rewrites Markdown-preferring requests to `/api/markdown/*`. `/<path>.md` (and `/index.md`
  for the home page) serves the same thing without an `Accept` header. `406` is reserved
  for a client that accepts neither representation — a missing or wildcard `Accept` means
  "no constraint" and gets HTML.
- **`Vary: Accept` does not reach prerendered app pages.** Next replays a prerender's
  stored headers on send and `vary` is one of them, so neither the proxy nor
  `next.config.ts` `headers()` can add to it. The config entry is still there and does
  apply to every route handler. Retest on a Next upgrade before deleting the comment.
- **The homepage's text layer** (`_components/gallery-outline.tsx`) is `sr-only` and
  outside any `<Suspense>` on purpose: the grid is covers and hover states, which reads as
  an empty page without JavaScript, and only unsuspended cached data lands in the static
  shell. Anything added to it costs roughly 2.5× its size in HTML, because a server
  component's markup is duplicated in the RSC flight payload.
- Runtime gate: `pnpm check:agent-endpoints` against a running server. `pnpm verify`
  cannot see status codes or headers.

### Tech Stack

- **Runtime**: pnpm 12, Node 24, TypeScript 7 (versions in package.json / pnpm-workspace.yaml)
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **API**: oRPC, better-auth
- **Database**: Turso (libSQL), Drizzle ORM
- **UI**: Base UI, shadcn, lucide-react, motion

## Agent-driven development

`AGENTS.md` is the runnable guide — read it before touching anything. The essentials:

- **Provision**: no bootstrap script. `pnpm install` → `cp .env.example .env` (fill it) →
  `pnpm -F db db` in one shell → `pnpm db:push` → `pnpm dev:web`.
- **Port 3000 is mandatory.** `packages/api/src/auth/auth.ts` pins `baseUrl`/`trustedOrigins`
  to `http://localhost:3000` outside Vercel, so a fallback to 3001 makes every browser
  sign-in 403 silently.
- **No seeded login.** Nothing in the gallery is authed. `POST /api/auth/sign-up/email`
  creates one on demand (see `AGENTS.md` → Login).
- **Verify**: `pnpm verify` for the static gate, `pnpm check:agent-endpoints` for the
  machine-readable surfaces (needs a running server), then drive the running app with
  `agent-browser` — `/`, `/ui/<slug>`, `/preview-frame/<slug>`, `/r/<slug>.json`. Web is
  the only surface; there is nothing that isn't headlessly verifiable.

## Common Commands

```bash
pnpm dev:web          # Next.js app on :3000 (the one you want)
pnpm -F db db         # Local Turso (turso dev) on :8080 — its own shell; `pnpm dev` does NOT start it
pnpm verify           # typecheck + lint + format + test + build (the full gate)
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
pnpm test             # node:test — auth + RPC transport guards + the agent-surface tests
pnpm check:agent-endpoints  # Runtime check of the agent surfaces (needs a running server)
```

## Verification Contract

`pnpm verify` runs typecheck, lint, formatting, tests, and build. Every step must pass.
CI runs it on every push and pull request.

Lint is a clean gate: `oxlint.config.ts` extends the ultracite presets (core, react, next,
anti-slop) and every rule is an error. Fix the code, don't add config overrides; a
`// oxlint-disable-next-line rule -- why` needs a stated reason.

Typecheck covers the app, shared packages, scripts, and every code-bearing content package
independently. Content remains excluded from the app's TypeScript project because independent
checks preserve its distribution boundary. Use `pnpm typecheck:content <slug>` for one package.

Tests cover the auth schema/cookies/reset, the RPC Origin guards, the content
filesystem/registry contracts, standalone-content validation, and the agent surfaces in
`apps/web/src/lib/agent/*.test.ts`. They pin things typecheck cannot see, notably
`/api/orpc`'s cross-origin defense: `SameSite=Lax` keys on _site_, so it stops a cross-SITE
POST only, and the route's own Origin check covers the same-site cross-origin case (a sibling
subdomain, another localhost port). Keep tests that pin observable behavior; check visual
changes in the browser. Status codes and response headers are outside the static gate
entirely — that is what `pnpm check:agent-endpoints` is for. `verify` reads `.env` because
`build` does, but it needs no running database.

The build's `check:content` guard validates metadata, preview files, manifests, and imports.
It rejects private workspace dependencies and paths escaping a component directory. Do not
remove it. Scaffold with `pnpm new:content`; finish a component or remove its directory.

Password reset uses Resend. Configure `RESEND_API_KEY` and `AUTH_EMAIL_FROM` with a verified
sender to enable it. Without both, Better Auth returns `RESET_PASSWORD_DISABLED`. Configured
requests keep account existence private; provider failures are logged. Request acceptance
does not prove delivery. Reset tokens expire after one hour and revoke existing sessions.

## Decisions (do not re-litigate)

- **auth + oRPC are kept.** One procedure, zero callers, deliberately retained for a future
  feature. Make them correct; don't propose deleting them.
- **Assets live in the `uicapsule-assets` Vercel Blob store.** Covers, illustrations and other
  content media resolve against `NEXT_PUBLIC_ASSETS_URL`; `meta.json` stores bucket keys,
  never URLs.
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
