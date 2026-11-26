# AGENTS.md

**uicapsule** is a curated gallery of UI components — a pnpm/Turborepo monorepo with one
Next.js 16 app (`apps/web`) that renders 40 self-contained component packages under
`content/`. This is the tool-agnostic guide for coding agents; it is meant to be _run_, not
just read. Claude also reads `CLAUDE.md` (conventions, curation philosophy, decisions that
are settled) — this file is the runnable half.

## Quickstart (headless)

```sh
pnpm install && pnpm bootstrap --yes   # .env, local Turso on :8080 if none answers, schema
pnpm dev:web                           # http://localhost:3000
```

Bootstrap is idempotent and never prompts with `--yes` (or without a TTY). It copies
`.env.example` to `.env` only when `.env` is missing, starts `turso dev` detached only when
nothing answers at `TURSO_DATABASE_URL` (log in `packages/db/turso-dev.log`, PID printed), then
runs `pnpm db:push`. It refuses a `TURSO_DATABASE_URL` that isn't local, and needs the `turso`
CLI on `PATH`. `pnpm bootstrap --dry-run` prints the steps; by hand they are
`cp .env.example .env`, `pnpm -F db db` (its own shell, leave running), `pnpm db:push`.

- `.env` is **required**, not optional: `apps/web`'s `dev` and `build` both run through
  `dotenv -e ../../.env --`, so a clone without it fails outright.
- `TURSO_AUTH_TOKEN` stays empty locally — `turso dev` requires no auth.
- Auth defaults to `http://localhost:3000`. For another port, set `BETTER_AUTH_URL` to
  that origin and start Next on the matching port. Vercel uses its deployment origin.
- The gallery itself is entirely public. Only `/auth/*` needs the database at all, so
  `pnpm dev:web` alone is enough to work on content, the grid, or the detail page.

Liveness: `curl -s -o /dev/null -w '%{http_code}' localhost:3000/` → `200`.

## Login

**There is no seeded user.** Auth exists and works, but nothing in the gallery is gated by
it (`user.me` has zero callers — see CLAUDE.md "Decisions"). Create one the first time you need it:

```sh
curl -s -i -X POST localhost:3000/api/auth/sign-up/email \
  -H 'content-type: application/json' \
  -d '{"email":"dev@uicapsule.local","password":"password","name":"Dev"}' \
  | grep -iE 'HTTP/|set-cookie'
```

A `200` plus a `better-auth.session_token` cookie means the user was created — hand that
cookie to `curl` or agent-browser.

**Sign-up is not idempotent.** A second call for the same email returns
`422 USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` (better-auth throws; it does not return the
existing session). That is not a failure — it means the user is already there. Sign in
instead:

```sh
curl -s -i -X POST localhost:3000/api/auth/sign-in/email \
  -H 'content-type: application/json' \
  -d '{"email":"dev@uicapsule.local","password":"password"}' \
  | grep -iE 'HTTP/|set-cookie'
```

The same credentials work in the `/auth/login` form. Mind the rate limit: better-auth
applies a built-in rule of **3 requests / 10s per IP** to any `/sign-in*`, `/sign-up*`,
`/change-password*` or `/change-email*` path, and it _overrides_ the `window: 60, max: 10`
configured in `packages/service/src/auth/auth.ts` (only `rateLimit.customRules` could beat it).
The configured 10/60 governs the other `/api/auth/*` routes. So a sign-up → sign-in → form
login sequence already spends the whole budget — one retry inside 10s gets a 429. Always
print the status line, or a 422/429 looks like "auth is broken".

## Verify a change end-to-end

Static gate:

```sh
pnpm verify           # typecheck · lint · format · test · build
```

`verify` needs `.env` because it runs the production build. It does not need a database.
CI runs the same gate on every push and pull request using local test configuration.

- Typecheck covers the app, packages, scripts, and each of the 39 code-bearing content
  packages independently, including each preview's default export. Previews must render
  without required props. `pnpm typecheck:content <slug>` checks one component.
- Lint is a clean gate. `oxlint.config.ts` extends the ultracite presets (`ultracite/oxlint/core`, `react`, `next`, `anti-slop`, `landmines`); every rule is an error, including explicit `any`, non-null assertions, and type casts. Landmines bans prose comments (TSDoc on exports and single-line `// WARNING:` excepted) and annotated return types (pin a contract with `satisfies`, a typed variable or a generic argument), in `content/*` as well. No rule is turned off, and lint is type-aware (CLAUDE.md → Verification Contract). Prefer fixing code over `oxlint-disable` comments; when a rule is genuinely wrong for a line, disable that line with a `-- reason`.
  Next.js-only rules apply to the app; content stays portable.
- Tests cover auth schema/cookies/reset, RPC transport, content filesystem/registry behavior,
  the standalone-content guard, and the agent surfaces (`apps/web/src/lib/agent/*.test.ts` —
  Accept negotiation, the Markdown/llms.txt/sitemap renderers, the JSON-LD builders).
  Everything under `src/lib/agent` is pure, so it runs without a Next runtime. Changed
  visual behavior still needs a browser check, and status codes and headers need
  `pnpm check:agent-endpoints` against a running server.

`pnpm build` runs `//#check:content` first. It validates metadata, local preview files,
package manifests, and imports. Private workspace imports and paths escaping the component
fail the build. Do not remove this guard.

Agent surfaces — the response codes, `Content-Type`/`Vary` headers, JSON-LD and Markdown
negotiation that `verify` structurally cannot see — have their own runtime gate. It needs a
server already running:

```sh
pnpm check:agent-endpoints                  # defaults to http://localhost:3000
pnpm check:agent-endpoints https://www.uicapsule.com
```

Covers homepage `h1` + text-without-JavaScript + content efficiency + JSON-LD,
`Accept: text/markdown` on every page shape, the head `<link rel="alternate">`, `406`
on an unsatisfiable markdown Accept, that a non-markdown Accept skips the proxy, q-value
handling, the Markdown and HTML 404 bodies, `/sitemap.xml`, `/llms.txt`, `/robots.txt`, and
the four trust-anchor pages (including that every `#anchor` on the legal pages lands on a
heading id). Run it after touching anything in `apps/web/src/lib/agent`,
`src/proxy.ts`, or page metadata.

Runtime — drive the real UI with [agent-browser](https://github.com/vercel-labs/agent-browser)
(installed globally: `npm i -g agent-browser && agent-browser install`; ≥ 0.37 for `record --fps 60`):

```sh
agent-browser open http://localhost:3000/
agent-browser snapshot                                        # accessibility tree with @eN refs
agent-browser open http://localhost:3000/ui/<slug>            # detail page workspace
agent-browser open http://localhost:3000/preview-frame/<slug> # bare preview, no chrome
agent-browser get text body                                   # `get text` needs a selector
agent-browser screenshot /tmp/after.png
```

Give each agent its own browser with `AGENT_BROWSER_SESSION=<repo>-<task>` (or `--session`): the default one is shared. Locate by `snapshot -i` refs or `find role … --name`, never `find text`, which can match a hidden duplicate label. A background tab gets no animation frames, so menus won't open: `agent-browser tab keep live` fixes it.

Authenticated flows (only `/auth/*` has any), against the login created above. Locate by the
form's `data-test` hooks or by role: a snapshot's `@eN` refs shift between runs and builds.

```sh
agent-browser open http://localhost:3000/auth/login
agent-browser fill '[data-test="email-input"]' dev@uicapsule.local
agent-browser fill '[data-test="password-input"]' password
agent-browser find role button click --name Login
agent-browser wait --url '**/'                # redirects to /
agent-browser network requests --filter sign-in   # expect 200; a 403 means the Origin does not match BETTER_AUTH_URL
```

The routes worth checking, and what each proves:

| Route                     | Proves                                                |
| ------------------------- | ----------------------------------------------------- |
| `/`                       | gallery grid, filters, search (`⌘K`)                  |
| `/ui/<slug>`              | detail page, live preview iframe, source-code drawer  |
| `/preview-frame/<slug>`   | the bare preview — what the cover-video skill records |
| `/r/<slug>.json`          | shadcn registry item (external CLI contract)          |
| `/r/registry.json`        | the full registry index                               |
| `/api/content/<slug>`     | source payload behind the drawer + zip download       |
| `/about`, `/request`      | static page; request form → GitHub issue              |
| `/contact`, `/privacy`    | prose pages (trust anchors)                           |
| `/terms`                  | prose page (trust anchor) — the Terms of Use          |
| `/llms.txt`               | llmstxt.org index — overview + full component catalog |
| `/sitemap.xml`            | every indexable URL, with `lastmod`                   |
| `/index.md`, `/<path>.md` | the Markdown representation of any page               |

**Previews are not compiled by Next.** `pnpm dev:web` runs `//:dev:previews`, a Vite dev
server on `:5174`, beside `next dev`; in development `/preview-frame/<slug>` loads the preview
from it and hot-reloads edits in place. If a dev preview is blank, that server isn't running
(`next dev` alone doesn't start it). Production frames load the bundles `pnpm build:previews`
writes to `apps/web/public/previews/`. Previews run sandboxed on an opaque origin, so
`localStorage` and `document.cookie` throw inside them by design.

## Content workflow

`content/*` is the product. Each slug is a workspace package that the web app reads off the
filesystem and **never imports by name** — that indirection is load-bearing (see CLAUDE.md).

```sh
pnpm new:content <slug>   # scaffold content/<slug>/{meta.json,package.json,preview.tsx,<slug>.tsx}
pnpm check:content        # fail if any content/<slug> is not loadable
```

Two committed skills own the full lifecycles and both shell out to `agent-browser`:

- `.claude/skills/build-content` — idea → scaffold → build → record → PR
- `.claude/skills/cover-video` — record, verify, upload to Blob, wire into `meta.json`
- `.claude/skills/build-requests` — drain `ready`-labelled request issues through both of
  the above, one PR per issue, `Closes #n`. Meant for a local daily schedule.

Requests arrive as GitHub issues labelled `request`, from `/request` (oRPC → GitHub API,
`GITHUB_ISSUES_TOKEN`) or the `component-request.yml` template. Apply `ready` to accept.

Content packages **must not** import from `apps/web` or `packages/*`. The registry serves
their source verbatim — `content-fs.ts` does no import rewriting and hardcodes
`registryDependencies: []` — so any `@repo/*` import ships an unresolvable registry item to
an external `shadcn add` consumer. All content packages now use public dependencies and
package-local helpers. Keep them self-contained, including styles: gallery theme variables
and base CSS are not present in a clean consumer.

## Platform matrix

| Platform        | Dev command          | Agent-verifiable at runtime?         |
| --------------- | -------------------- | ------------------------------------ |
| Web (Next.js)   | `pnpm dev:web`       | **Yes** — headless via agent-browser |
| Extension (WXT) | `pnpm dev:extension` | Partly — see below                   |

There is no mobile or desktop target. The extension (`apps/extension`) gets typecheck, tests and
`wxt build` in `verify`. To drive it, launch Playwright's Chromium with
`launchPersistentContext("", { channel: "chromium", args: ["--load-extension=<.output/chrome-mv3>"] })`.
The popup and right-click menu can't be clicked headlessly, so do what they do from the service
worker: `chrome.scripting.executeScript({ files: ["/overlay.js"], target })` then
`chrome.tabs.sendMessage(tabId, { type: "overlay:start", tool })` with `tool` `region`, `visible`, or
`media` plus `src` (the image or video URL a right-click would pass). The popup itself renders at
`chrome-extension://gndnanbepebpjjifhogmdlabbpddfgml/popup.html`. The overlay is a closed shadow
root, so drive it by coordinates and keyboard (hover + click snaps, drag draws, Enter saves, the
name field is focused in the dialog, Ctrl+Enter files); copy the build and move `<all_urls>` into
`host_permissions` so nothing prompts. Set `serviceUrl` in `chrome.storage.local` to `http://localhost:3000` with `EXTENSION_ORIGINS` set: without `GITHUB_ISSUES_TOKEN` a
submit ends at the attachments route's 503, which proves the Origin guard let it through.

## Rules that matter

- **No `any`, no non-null `!`, no `as` casts.** Kebab-case filenames. Make illegal states
  unrepresentable.
- **Vercel builds every push, deliberately** — do not add `turbo-ignore` or an Ignored
  Build Step, and do not remove `globalDependencies: ["content/**"]` from `turbo.json`.
  Both exist because `apps/web` never depends on `content/*` by name; each has already
  broken real deploys. Nor remove the root `build` task's `"dependsOn": ["^build"]`:
  `apps/web` reaches `@repo/db` only through `@repo/service`, and that chain is what puts
  `packages/db` in web's build hash. CLAUDE.md → "Decisions" has the full story.
- **`pnpm db:push-remote` writes production Turso.** Never run it locally. `pnpm db:push`
  is the local one.
- Env vars read at build time must be listed in `turbo.json` `globalEnv`, or turbo's strict
  env mode strips them from the task with no error. `NEXT_PUBLIC_ASSETS_URL` is the one that
  bites: `next.config.ts` reads it to build `images.remotePatterns`, every `meta.json`
  `cover` key and every content package that references bucket media resolves against it,
  and `apps/web/src/lib/assets.ts` throws at import when it is unset so the failure is loud
  rather than a page of broken media.

## Map

- `apps/web` — the Next.js app. `src/lib/content/content-fs.ts` indexes metadata and reads
  source on demand; `src/lib/content/content-data.ts` adds `"use cache"`. `content-schema.ts` owns
  metadata validation for the loader and build guard. Header, search, profile, and footer
  live in separate files under `src/components/`.
- `apps/web/src/lib/agent` — the machine-readable layer: Accept negotiation, Markdown
  rendering, `llms.txt`, sitemap entries, JSON-LD, and the prose-page definitions that
  `/about`, `/contact`, `/privacy` and `/terms` render from. Pure and unit-tested;
  `src/proxy.ts` and the routes only feed it data.
- `packages/ui` — Base UI + shadcn-derived components · `packages/db` — Drizzle + Turso ·
  `packages/contract` — the oRPC contract, client-safe · `packages/service` — its
  implementation + better-auth
- `content/<slug>/` — one workspace package per component
- `CLAUDE.md` — conventions, settled decisions, curation philosophy
- `plans/component-roadmap.md` — the component backlog
- `scripts/{new-content,check-content}.ts` — the two content tools
