# AGENTS.md

**uicapsule** is a curated collection of UI components built together by a designer and AI, shown in a public gallery — a pnpm/Turborepo monorepo with one
Next.js 16 app (`apps/web`) that renders 40 self-contained component packages under
`content/`. This is the tool-agnostic guide for coding agents; it is meant to be _run_, not
just read. Claude also reads `CLAUDE.md` (conventions, curation philosophy, decisions that
are settled) — this file is the runnable half.

## Quickstart (headless)

There is no bootstrap script. Four steps, in order:

```sh
pnpm install
cp .env.example .env              # then fill BETTER_AUTH_SECRET (any random string)
pnpm -F db db                     # shell 1: turso dev on http://127.0.0.1:8080 (leave running)
pnpm db:push                      # shell 2: apply the Drizzle schema to that local db
pnpm dev:web                      # shell 2: http://localhost:3000
```

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
it (`packages/api` ships one procedure, `user.me`, with zero callers — see CLAUDE.md
"Decisions"). Create one the first time you need it:

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
configured in `packages/api/src/auth/auth.ts` (only `rateLimit.customRules` could beat it).
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
- Lint warnings fail the gate. Explicit `any`, non-null assertions, and type casts fail too.
  Next.js-only rules apply to the app; content stays portable.
- Tests cover auth schema/cookies/reset, RPC transport, content filesystem/registry behavior,
  and the standalone-content guard. Changed visual behavior still needs a browser check.

`pnpm build` runs `//#check:content` first. It validates metadata, local preview files,
package manifests, and imports. Private workspace imports and paths escaping the component
fail the build. Do not remove this guard.

Runtime — drive the real UI with [agent-browser](https://github.com/vercel-labs/agent-browser)
(installed globally: `npm i -g agent-browser && agent-browser install`; ≥ 0.37 for `record --fps 60`):

```sh
agent-browser open http://localhost:3000/
agent-browser snapshot                                        # accessibility tree with @eN refs
agent-browser open http://localhost:3000/ui/<slug>            # detail page + source drawer
agent-browser open http://localhost:3000/preview-frame/<slug> # bare preview, no chrome
agent-browser get text body                                   # `get text` needs a selector
agent-browser screenshot /tmp/after.png
```

Authenticated flows (only `/auth/*` has any), against the login created above:

```sh
agent-browser open http://localhost:3000/auth/login
agent-browser snapshot                        # → email @e6, password @e7, Login @e4
agent-browser fill @e6 dev@uicapsule.local
agent-browser fill @e7 password
agent-browser click @e4                       # redirects to /
agent-browser network requests --filter sign-in   # expect 200; a 403 means the Origin does not match BETTER_AUTH_URL
```

The routes worth checking, and what each proves:

| Route                   | Proves                                                |
| ----------------------- | ----------------------------------------------------- |
| `/`                     | gallery grid, filters, search (`⌘K`)                  |
| `/ui/<slug>`            | detail page, live preview iframe, source-code drawer  |
| `/preview-frame/<slug>` | the bare preview — what the cover-video skill records |
| `/r/<slug>.json`        | shadcn registry item (external CLI contract)          |
| `/r/registry.json`      | the full registry index                               |
| `/api/content/<slug>`   | source payload behind the drawer + zip download       |
| `/about`, `/request`    | static page; request form → GitHub issue              |

**Before reporting a visual bug in a brand-new component, clear the Turbopack cache.** Its
persistent cache freezes the Tailwind `@source` glob, so classes that exist only in a newly
created `content/<slug>` generate no CSS — the markup is right and the page looks broken.
`rm -rf apps/web/.next && pnpm dev:web`. This is the single most common false positive here.

## Content workflow

`content/*` is the product. Each slug is a workspace package that the web app reads off the
filesystem and **never imports by name** — that indirection is load-bearing (see CLAUDE.md).

```sh
pnpm new:content <slug>   # scaffold content/<slug>/{meta.json,package.json,preview.tsx,<slug>.tsx}
pnpm check:content        # fail if any content/<slug> is not loadable
```

Two committed skills own the full lifecycles and both shell out to `agent-browser`:

- `.claude/skills/build-content` — idea → scaffold → build → record → PR
- `.claude/skills/cover-video` — record, verify, upload to Supabase, wire into `meta.json`
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

| Platform      | Dev command    | Agent-verifiable at runtime?         |
| ------------- | -------------- | ------------------------------------ |
| Web (Next.js) | `pnpm dev:web` | **Yes** — headless via agent-browser |

Web is the only surface. There is no mobile, desktop, or extension target.

## Rules that matter

- **No `any`, no non-null `!`, no `as` casts.** Kebab-case filenames. Make illegal states
  unrepresentable.
- **Vercel builds every push, deliberately** — do not add `turbo-ignore` or an Ignored
  Build Step, and do not remove `globalDependencies: ["content/**"]` from `turbo.json`.
  Both exist because `apps/web` never depends on `content/*` by name; each has already
  broken real deploys. CLAUDE.md → "Decisions" has the full story.
- **`pnpm db:push-remote` writes production Turso.** Never run it locally. `pnpm db:push`
  is the local one.
- Env vars read at build time must be listed in `turbo.json` `globalEnv`, or turbo's strict
  env mode strips them from the task with no error. `NEXT_PUBLIC_SUPABASE_URL` was missing
  from it until recently: `next.config.js` reads it to build `images.remotePatterns`, so
  without it that list is empty and `next/image` rejects every Supabase-hosted cover. Not
  yet load-bearing — every cover in the repo today is `coverType: "video"` (28 of 40 slugs;
  the other 12 have no cover), and video bypasses `next/image` — but it bites the first time
  a `meta.json` uses `coverType: "image"`.

## Map

- `apps/web` — the Next.js app. `src/lib/content/content-fs.ts` indexes metadata and reads
  source on demand; `src/lib/content-data.ts` adds `"use cache"`. `content-schema.ts` owns
  metadata validation for the loader and build guard. Header, search, profile, and footer
  live in separate files under `src/components/`.
- `packages/ui` — Base UI + shadcn-derived components · `packages/db` — Drizzle + Turso ·
  `packages/api` — oRPC + better-auth
- `content/<slug>/` — one workspace package per component
- `CLAUDE.md` — conventions, settled decisions, curation philosophy
- `plans/component-roadmap.md` — the component backlog
- `scripts/{new-content,check-content}.ts` — the two content tools
