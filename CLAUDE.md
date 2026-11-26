# Agent Instructions

## Project Overview

**uicapsule** - pnpm monorepo with Turborepo

### Structure

```
apps/
  web/           # Next.js 16 app (main frontend)
  extension/     # Chrome MV3 extension (WXT): capture part of any page as a component request
packages/
  contract/      # oRPC contract: zod inputs, outputs, client-safe request schemas
  service/       # oRPC implementation of the contract + better-auth
  db/            # Drizzle ORM + Turso (libSQL)
  ui/            # shadcn-derived components on Base UI
content/         # Gallery components — one workspace package per slug
```

### Contract-first API

`@repo/contract` is the single source of truth, and client-safe: a feature's zod inputs and the
constants clients share live in `<f>-schema.ts` (`request/` adds `attachment-schema.ts`, the
upload limits the form and `/api/request/attachments` both read), its procedures in
`<f>-contract.ts` on `publicBase` / `protectedBase` from `base.ts`, registered in
`src/index.ts`. Both bases are plain `oc`, since no procedure declares errors or meta. An output
with no zod schema is `.output(type<T>())`, `T` written in the contract: compile-time only.
`@repo/service` implements it with `os = implement(contract)` — protected:
`const authed = os.<f>.use(requireSession); export const <f>Router = { <proc>: authed.<proc>.handler(...) }`
(see `user-router.ts`); public procedures implement `os.<f>.<proc>` directly (see
`request-router.ts`). Mount in `root-router.ts`; `os.router` fails to compile if a procedure is
missing or mistyped. Implementer-level `.use` runs before input validation (anonymous →
UNAUTHORIZED); procedure-level `.use` runs after. Feature routers stay plain objects —
`os.<f>.router()` re-applies implementer middleware, so it would run twice. `requireSession`
looks the session up itself, so `createORPCContext` carries only headers and public procedures
never touch the database. Clients type against `ContractClient` / `RouterInputs` /
`RouterOutputs` and import schemas from `@repo/contract`; only server code (the route handlers
under `apps/web/src/app/api`) imports `@repo/service`. Layout follows oRPC's Hybrid monorepo
recipe.

### Content architecture

Content is filesystem-driven; the web app never depends on content packages by name:

- `apps/web/src/lib/content/content-fs.ts` indexes `content/*/meta.json` and reads source
  only for downloads/registry requests. `content-schema.ts` supplies the shared metadata
  parser and inferred types for the loader and build guard;
  `content-data.ts` wraps it in `"use cache"` server functions (gallery cards, search
  index, shadcn registry). The `"use cache"` + `cacheLife("max")` pairing is intentional,
  not an oversight — content only ever changes on deploy.
- `apps/web/src/lib` is layered: the root (`site-config`, `assets`, `auth-client`) imports
  nothing above it, `lib/content/` builds on the root, and `lib/agent/` builds on both. Nothing
  imports upward, so a new module goes in the lowest layer whose imports it needs.
- The home gallery ships every card in the static shell and filters in the browser
  (`content/gallery.ts`, pure). Only a leaf reading `useSearchParams` suspends; don't wrap
  the grid in that Suspense boundary or hydration remounts every card.
- `partialPrefetching` is on: a default `<Link>` prefetches only its route's shared App
  Shell. Gallery cards are `PrefetchLink` (`components/prefetch-link.tsx`), upgrading to
  `prefetch={true}` on hover/focus/touch; viewport `prefetch={true}` would cost one request
  per visible card.
- **Previews never compile into the Next app.** `scripts/build-previews.ts` (turbo
  `//#build:previews`, which web's build depends on) bundles every `content/<slug>/preview.tsx`
  with Vite 8 (Rolldown, ~3s for every preview; one build, shared chunks, `lib/content/preview-runtime.ts` as the boot wrapper)
  into gitignored `apps/web/public/previews/<slug>/` (`index.js` + one `index.css`). Each slug's
  entry imports a virtual Tailwind stylesheet compiled from `@repo/ui/theme.css`, scanning only
  that slug, and a `generateBundle` step merges every stylesheet a preview's chunks import into
  its `index.css`. Turbopack can't be driven outside `next dev`/`next build`, hence Vite. In
  dev, `pnpm dev:web` runs `//#dev:previews` beside `next dev` (turbo `with`): a Vite dev server
  on `PREVIEW_DEV_ORIGIN` (`:5174`), and the frame route in development serves a shell that loads
  `/@preview/<slug>.js` from it with React Refresh, so edits (and new Tailwind classes, recompiled
  per slug on change) hot-swap inside the sandboxed frame. A `preview.tsx` that exports
  `controls` would break React Refresh's boundary (a non-component export), so in dev the plugin
  appends `previewHotFooter`: the runtime's `hotPreviewModule` keeps `controls` out of the check
  (`window.__getReactRefreshIgnoredExports`) and, through the module's own accept, applies a changed
  export live (current values re-merged, `uicapsule:ready` re-announced). Its root is `apps/web` only so plugin-react
  resolves React; its watcher ignores everything there but `src/lib`, so it never watches what
  `next dev` watches. `@repo/ui/globals.css` no longer scans
  `content/**`, so the site's CSS carries no component classes.
- **`/preview-frame/<slug>` is a sandboxed document.** A static route handler
  returns the shell (`lib/content/preview-shell.ts`) with
  `Content-Security-Policy: sandbox <PREVIEW_SANDBOX>` and no `allow-same-origin`, and the
  embedding iframe carries the same `sandbox`: a preview runs on an opaque origin with no
  cookies and no storage, even when its URL is opened top-level (so `/previews/*` answers
  CORS with `*`, since module scripts from an opaque origin are CORS fetches). The site talks
  to a frame only through `postMessage` (`lib/preview-protocol.ts`: theme, inspect and control
  values in; ready with its controls and inspect boxes out; all zod-parsed), never `contentDocument`. `NEXT_PUBLIC_PREVIEW_URL` (e.g.
  `https://preview.uicapsule.com`, a domain alias of this same Vercel project) moves frames to
  their own host, and `next.config.ts` redirects every other path on that host to www.
- **Preview controls.** A `preview.tsx` may export `controls` beside its default `Preview`: an
  `as const` literal mapping prop name → descriptor (`number` with `min`/`max`/`step?`,
  `boolean`, `select` with `options` of strings or `{ value, label }`, `color` as hex, `text`
  with `placeholder?`; every one has `default`, `label?` and `group?`). A preview with more
  than eight controls sorts them into a few named groups (the panel renders a collapsible header
  per group); groups are all-or-none and each is declared as one contiguous run. `Preview` then receives one prop
  per key, typed by hand since content can't import `@repo/*` or the app. Each prop is optional
  and defaults to `controls.<key>.default` (`({ hue = controls.hue.default }: Partial<PreviewProps>)`),
  because `preview.tsx` ships in the registry item and zip where nothing injects values.
  `typecheck:content` holds it to `ControlValues<typeof controls>` and to rendering with no
  props, each select default to its options and each color default to `#…`
  (`lib/preview-controls.ts`); `build:previews` loads every `controls` export through Vite's SSR
  runner and fails on any `previewControlsSchema` rejects (strict objects, so a misspelled
  field fails too; `key`, `ref` and `Object.prototype` names are not control names), or on a
  preview that can't load in Node, naming the slug: browser globals at module scope would crash
  a registry install's server render too. Every component exposes its knobs
  and any demo harness (variant, mode or preset pickers, sample-data toggles, speeds) as controls,
  never as in-frame UI; the frame keeps only the component's own interaction (a toggle's on/off
  when the toggle is the component, a timer's running state). Design systems expose their
  settings (mode, accent, density…) the same way. The generated entry passes
  the module namespace to `startPreview`, which parses `controls` (throws on an invalid one),
  renders `Preview` from an external store so a value change never remounts it, announces the
  controls in `uicapsule:ready`, and folds each `uicapsule:props` in with `mergeControlValues`
  (clamped, option-checked, hex-checked; unknown keys dropped). Without `controls` a preview
  stays zero-prop.
- `/r/<slug>.json` serves the shadcn registry item. The docked code panel uses
  `/api/content/<slug>`; its viewer loads on demand.
- `/ui/<slug>` is a docked workspace (`_components/component-workspace.tsx`): component list,
  preview + toolbar, code panel, info panel. Switching components is client state +
  `history.pushState`, so the iframe swaps without a route remount. Every panel starts collapsed; sizes and open state live in
  `localStorage` (`panel-layout.ts`, a `useSyncExternalStore` store); an inline script applies
  them to CSS vars before first paint, so the server HTML stays default and hydration never
  mismatches. Drag a panel past half its minimum to collapse it. Open/close animates the grid
  track (300ms, `cubic-bezier(0.23,1,0.32,1)`) while content keeps its `--*-size` width, and
  `data-dragging` turns transitions off so a drag tracks the pointer 1:1. Copy buttons are
  `@repo/ui` `CopyButton` (which `CodeBlockCopyButton` wraps), so the icon swap stays the same everywhere.
- Content packages exist as workspace packages only so pnpm installs their deps in
  isolation and the registry can report per-component dependencies.
- **Design systems** (element tag `design-systems`) are the one templated kind:
  `pnpm new:content <slug> --design-system` copies `scripts/templates/design-system/` (a
  starter showcase + component set, scoped to `.ds-<slug>`). Each entry then owns its whole
  page, modeled on design.how/systems: header, "In use" demo product screens, foundations
  shown the system's own way (tokens with contrast, type, radius, elevation, live motion,
  anti-slop rules), and components grouped by category with domain-specific ones. Keep that
  section order so entries compare side by side; everything else, chrome included, is the
  system's. Template edits reach only systems scaffolded afterwards. Like `pages`, the gallery card shows a badge
  (`elementBadge` in `content-categories.ts`) instead of an index number. Its cover is a 12–15s trailer
  of the real page, not a scroll: `cover-video` skill, `trailer/shots/<slug>.js`.
- `meta.json` carries provenance: `addedAt` (required, stamped by `new:content`, drives
  gallery order newest-first), `inspiredBy` (where the idea came from), `requestedBy`
  (who asked for it). Keep `inspiredBy` and `requestedBy` honest — they render on the detail page.

### Component requests

`/request` → oRPC `request.create` → GitHub issue labelled `request` (needs
`GITHUB_ISSUES_TOKEN`). Attachments go through `/api/request/attachments` to GitHub's own
`uploads.github.com/user-attachments/assets` store (the endpoint `gh --attach` uses; fine-grained
PATs allowed, repo write access required), capped at 4MB by Vercel's request-body limit.
Visitor text has `@` neutralized so it can't trigger the `@claude` workflow.

**Browser extension** (`apps/extension`, WXT, scaffolded from kyh/init's) works like Pond's
(raphaelsalaja/pond): the toolbar icon opens a popup of commands (Capture region, Capture visible
area, Shortcuts, Settings), mirrored by keyboard commands (⌥⇧R, ⌥⇧V) and the right-click menu,
which adds "Request from this image/video". Each runs `entrypoints/overlay.ts` in the tab
(`lib/overlay/`, vanilla DOM in a closed shadow root so no page CSS or framework leaks either way):
the region picker highlights the element under the pointer, a click snaps to it, a drag draws a
box, and handles move or resize it before Save/Enter; then a request dialog over the page, then a
toast. The background crops `captureVisibleTab` to the box; files cross to it as base64
(`lib/encoding.ts`) and it files through the same `/api/request/attachments` + `request.create` as
the form, adding `capture` (page URL, element selector, scrubbed HTML) that the issue body renders
under "Captured from". Selector and HTML exist only for a snapped, unadjusted box. Settings
(service URL, attach video, include HTML, the optional `<all_urls>` grant video downloads need)
live on the options page. A picked `<video>` (or the only video inside the picked
element) is attached as its file when it is ≤4MB and an allowed type; otherwise the page records a
6s clip via `captureStream` + `MediaRecorder`; if that is refused (cross-origin without CORS, DRM)
the video URL goes under references. Both routes' Origin guard (`lib/request-origin.ts`) admits
only the extension origins in `EXTENSION_ORIGINS`. The dev build pins its ID
(`gndnanbepebpjjifhogmdlabbpddfgml`) with the public `key` in `wxt.config.ts`; `pnpm -F
@repo/extension zip` (`--mode store`) drops it, so the Web Store ID must be added to
`EXTENSION_ORIGINS` too.

Triage is manual: apply `ready` to accept, close as not-planned to decline. The
`build-requests` skill drains `ready` issues into PRs (run locally, on a schedule).

### Agent-readable surfaces

`apps/web/src/lib/agent/` is the machine-readable layer, and it is deliberately pure — no
Next imports, no filesystem — so it can be unit-tested without a runtime. The routes and
`src/proxy.ts` only feed it data.

- **One source per page.** `site-pages.ts` holds the prose for `/about`, `/install`, `/install/mcp`,
  `/install/extension`, `/contact`, `/privacy` and `/terms`; the JSX page and the Markdown
  representation both render from it. The `/install/*` pages are `InstallGuide`s
  (`mcpGuide`, `extensionGuide`): `install/_components/install-guide.tsx` lays the fields out by
  hand and `installPage` derives the Markdown blocks from the same fields.
  Never edit the copy in only one of the two. Copy carries `**bold**`, `` `code` `` and
  `[label](href)` inline markup, read by the one tokenizer in `inline-markup.ts`.
- **The Privacy Policy and Terms of Use follow General Legal's templates**, adapted so every
  sentence is true of this code. A change to what the site collects, stores, logs, or sends
  to a third party (a new analytics event, processor, cookie or form field) changes
  `privacyPage` in the same commit.
- **Markdown content negotiation** (acceptmarkdown.com): `src/proxy.ts` parses `Accept` and
  rewrites Markdown-preferring requests to `/api/markdown/*`. `/<path>.md` (and `/index.md`
  for the home page) serves the same thing without an `Accept` header. The proxy's matcher
  (`has` on `Accept`) only invokes it for `.md` URLs or an `Accept` naming markdown, so
  plain HTML views never pay for it. Pages advertise their `.md` sibling with a head
  `<link rel="alternate" type="text/markdown">` (`canonicalAlternates`), not a `Link`
  header. `406` is reserved for an `Accept` that mentions markdown yet accepts neither
  representation (`text/markdown;q=0`); one naming neither type never reaches the proxy
  and gets HTML, as RFC 9110 permits.
- **`Vary: Accept` comes only from the proxy**, on the responses it negotiates (Markdown
  rewrites, `.md`, 406). It cannot reach prerendered HTML pages: Next replays a
  prerender's stored headers on send and `vary` is one of them. Harmless, because the
  proxy rewrites Markdown to a different route before any cache lookup. Retest on a Next
  upgrade.
- **The homepage's text layer** (`_components/gallery-outline.tsx`) is `sr-only` and
  outside any `<Suspense>` on purpose: the grid is covers and hover states, which reads as
  an empty page without JavaScript, and only unsuspended cached data lands in the static
  shell. Anything added to it costs roughly 2.5× its size in HTML, because a server
  component's markup is duplicated in the RSC flight payload.
- **`/mcp` has two jobs**, and copy that describes it (server instructions, `server.json`,
  README, install prompt, `/install/mcp`, `/llms.txt`, about page) names both: **skills** help an agent build
  better UI in any project, and **tools** serve this gallery's components as templates. A new
  skill belongs only if it serves the first job; a new tool only if it serves the second.
  It is a stateless Streamable HTTP MCP server with two read-only tools,
  `search_components` and `get_component`: oRPC procedures in the route, registered by
  `@orpc/mcp`'s `McpRegistrar` on a fresh `McpServer` per request (`createMcpHandler` from
  `@modelcontextprotocol/server`). They stay out of `@repo/contract`: no client calls them
  over RPC. A tool's name is its router key, its title and hints are `mcp.tool` meta, a
  thrown `ORPCError` is a tool error. Ranking and payload shapes live in
  `lib/agent/mcp-catalog.ts`; the route only wires them to `content-data`. It also serves skills over MCP's skills extension
  (`io.modelcontextprotocol/skills`, SEP-2640): `skills/list`/`skills/get` and a `skill://`
  resource per file. They are the vendored `emilkowalski/skills` and `jakubkrehel/skills`
  entries named in `REPO_SKILLS` (`lib/agent/mcp-skills.ts`), read at runtime from
  `.claude/skills/` by `lib/content/skills-fs.ts`, so dev agents and MCP clients load the same
  single copy; the rest of `.claude/skills` (first-party workflow skills, other third-party) is
  never served. How to use uicapsule itself lives in the server instructions
  (`serverInstructions`), not a skill. The served skills are pinned in `skills-lock.json` by Vercel's `skills` CLI and kept byte-identical to
  upstream (oxfmt ignores them); provenance and the update recipe are in
  `.claude/skills/THIRD_PARTY.md`. It ships with each
  deploy, so there is no npm package to publish or version. `server.json` is its MCP Registry
  entry (`com.uicapsule/components`, DNS-verified); republish with `mcp-publisher publish` only
  when that metadata changes — the signing key is not in the repo.
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

- **Provision**: `pnpm install && pnpm bootstrap --yes` (`.env` from `.env.example`, local
  Turso via `turso dev`, `pnpm db:push`; idempotent, local URLs only) → `pnpm dev:web`.
- **Auth's origin must match the port.** Outside Vercel, `packages/service/src/auth/auth.ts`
  takes its `baseURL` from `BETTER_AUTH_URL`, else `http://localhost:3000`, so a fallback to
  3001 makes every browser sign-in 403 silently. For another port, set `BETTER_AUTH_URL` to it.
- **No seeded login, and no passwords.** Nothing in the gallery is authed. Sign-in is an
  emailed code (better-auth `emailOTP`) that signs a new address up too; `pnpm sign-in-code`
  mints one without an inbox (see `AGENTS.md` → Login).
- **Verify**: `pnpm verify` for the static gate, `pnpm smoke` (pages, a code's sign-in,
  `user.me`) and `pnpm check:agent-endpoints` for the machine-readable surfaces (both need a
  running server; CI's `smoke` job runs both on `next start`), then drive the running app with
  `agent-browser` — `/`, `/ui/<slug>`, `/preview-frame/<slug>`, `/r/<slug>.json`. The
  extension is driven through Playwright's `--load-extension` (`AGENTS.md` → Platform matrix).

## Common Commands

```bash
pnpm bootstrap --yes  # First run: .env, local Turso (detached), schema — idempotent
pnpm dev:web          # Next.js app on :3000 (the one you want)
pnpm dev:extension    # WXT dev build of the extension (load-unpacked: apps/extension/.output/chrome-mv3)
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
pnpm new:content <slug>  # Scaffold a new content component in content/ (--design-system for the template)
pnpm check:content    # Fail if any content/<slug> is not a loadable component
pnpm build:previews   # Bundle every content preview into apps/web/public/previews with Vite (build runs it)
pnpm dev:previews     # Vite dev server for previews on :5174 with hot reload (dev:web runs it)
pnpm test             # node:test — auth + RPC transport guards + the agent-surface tests
pnpm smoke            # Drive a running server: pages, a code's sign-in, user.me, sign-out (CI runs it)
pnpm check:agent-endpoints  # Runtime check of the agent surfaces (needs a running server)
pnpm skills:update    # Bump the skills-lock.json skills (emilkowalski, jakubkrehel) to upstream HEAD; review the diff
pnpm skills:sync      # Restore .claude/skills to exactly what skills-lock.json pins
pnpm og:video         # By hand, never in verify: home loop (scripts/og-video/scene.html → Blob og/og.<date>.mp4 + poster, keys in home-media.json) + cover-media.json and Blob stills (<cover key>.jpg) for /ui/<slug>; prints a per-slug `vercel blob del` for recorded covers it superseded
```

## Verification Contract

`pnpm verify` runs typecheck, lint, formatting, tests, and build. Every step must pass.
CI runs it on every push and pull request.

Lint is a clean gate: `oxlint.config.ts` extends the ultracite presets (core, react, next,
anti-slop, landmines) and every rule is an error. Fix the code, don't add config overrides; a
`// oxlint-disable-next-line rule -- why` needs a stated reason. Landmines applies to `content/*`
too, so shipped component source carries none of it either:

- **No prose comments.** Allowed are directives, TSDoc on exported API, and a single-line
  `// WARNING:` for a dangerous recurring footgun. Rationale goes in this file, `AGENTS.md` or
  the PR, never beside the code.
- **No annotated return types** on functions with a body. Pin a contract with `satisfies`, a
  typed variable, or a generic argument (`.map<T>(…)`, `useMemo<T>(…)`); a mutable object with
  `null` fields needs the typed variable, since `satisfies` keeps the literal `null`.
- **Tests** are `*.test.ts` beside their subject, with no module mocks, stubbed globals, fixed
  sleeps or retries.
- No rule is turned off, and lint is type-aware (`options.typeAware`, run by the
  `oxlint-tsgolint` devDependency); the config only scopes `next` to `apps/web` and lets
  `node:test`'s `describe`/`it` float. Sequential awaits are written without a loop await
  (`scripts/in-order.ts`, or a recursive async step), and a type assertion is replaced by a zod
  parse or a guard rather than justified in a `// SAFETY:` comment.
- Every file is typed: the root `tsconfig.json` covers `scripts/` and the lint config,
  `scripts/templates/tsconfig.json` the design-system template, and `content/tsconfig.json`
  gives each content file the content settings the linter reads.

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

Sign-in codes go out through Resend. Configure `RESEND_API_KEY` and `AUTH_EMAIL_FROM` with a
verified sender to enable them. Without both, outside production (`NODE_ENV !== "production"`)
the mail, code included, goes to the server log instead, so local dev can follow it; in
production nothing is sent or logged (a live code in the logs would hand the account to anyone
who reads them), boot warns once, and sending a code is refused with `EMAIL_DISABLED`
(`packages/service/src/auth/sign-in-code-email.ts`). Only `sign-in` codes are sent: the
plugin's other code types send nothing, so no password or verification flow is reachable.
Provider failures are logged. Codes expire after five minutes and allow three tries. A code's
sign-in checks the request's origin in the auth hook: better-auth checks it only when a code is
asked for, so a foreign page holding a code could sign its visitor in.

## Decisions (do not re-litigate)

- **auth + oRPC are kept.** oRPC serves two procedures: `request.create`, called by the
  `/request` form, and `user.me`, with zero callers, deliberately retained with auth for a
  future feature. Make them correct; don't propose deleting them.
- **Assets live in the `uicapsule-assets` Vercel Blob store.** Covers, illustrations, share
  stills and the home og video resolve against `NEXT_PUBLIC_ASSETS_URL`; `meta.json`,
  `cover-media.json` and `home-media.json` store bucket keys, never URLs. Nothing media goes in
  `apps/web/public`.
- **Vercel builds on every push — deliberately. Do not add build-skipping.** Both Vercel's
  "Skip unaffected projects" and an Ignored Build Step / `turbo-ignore` are disabled on the
  project. Every skip mechanism decides "affected" from the _workspace dependency graph_, and
  `apps/web` intentionally never depends on `content/*` by name (see Content architecture), so
  they classify every content-only commit as unaffected and silently cancel the deploy. That
  ate four real deploys before it was caught. The optimization also isn't worth it: builds run
  ~44s and 39 of the last 40 commits genuinely needed one. If this repo ever gains a second
  Vercel project, revisit — until then, always build.
- **`turbo.json` declares `globalDependencies: ["content/**", ".claude/skills/**"]` — do not
  remove either.** `/mcp` reads served skills from `.claude/skills` the same way, so the same
  stale-replay applies to a skills-only commit. Same
  root cause as the Vercel note above: `apps/web` reads `content/*` from the filesystem and
  never imports it, so it is absent from turbo's build-input graph. Without this line a
  content-only commit is a `FULL TURBO` cache hit that serves the _previous_ build — which
  both hides content edits and, when a content source file was deleted/renamed, fails the
  Vercel deploy with `ENOENT` on the stale file in the cached Next.js trace (killed the
  merge of #86 once). The line makes any content change invalidate the web build.
- **The root `build` task declares `"dependsOn": ["^build"]` — do not remove it.** Only
  `apps/web` has a build script, so the dependency builds it chains run nothing; the chain
  exists for the hash. Turbo hashes a task from its own files plus the hashes of the tasks it
  depends on, never from its workspace dependencies' files, and `@repo/db` reaches `apps/web`
  only through `@repo/service`. Web's own `^build` (`apps/web/turbo.json`) reaches one hop;
  the root one makes `@repo/service#build` depend on `@repo/db#build`, which is what puts
  `packages/db` in web's build hash. Without it a `packages/db`-only commit is the same stale
  `FULL TURBO` replay as a content-only one. Don't list `@repo/db` in `apps/web` to fix that
  instead: nothing there imports it.
- **`dev`/`dev:web` use `turbo run`, not `turbo watch` — keep it.** `next dev` and the Vite
  preview server watch their own files. Under `turbo watch`, `globalDependencies` (`content/**`)
  restarts both on every content edit, which kills preview hot-swaps and blanks frames mid-edit.
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

- A dev preview that renders blank means the preview dev server isn't running: `next dev` alone
  doesn't start it. Use `pnpm dev:web`, or run `pnpm dev:previews` beside it. A built preview
  that renders unstyled means `public/previews` is stale: run `pnpm build:previews`.
- The preview dev server imports `scripts/build-previews.ts` and `scripts/preview-bundle.ts`
  once at startup, so an edit to either (the generated entry and HMR footer included) reaches dev frames only
  after restarting `pnpm dev:web`. HMR covers `src/lib` and content, not those two.
