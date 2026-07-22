# AGENTS.md

**uicapsule** is a curated gallery of UI components — a pnpm/Turborepo monorepo with one
Next.js 16 app (`apps/web`) that renders 36 self-contained component packages under
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
- **The dev server must be on port 3000.** `packages/api/src/auth/auth.ts` pins `baseUrl`
  and `trustedOrigins` to `http://localhost:3000` outside Vercel. If Next falls back to
  3001 because 3000 is taken, every browser sign-in returns 403 with no visible error —
  the form just sits there. Free the port before blaming the code.
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
`/change-password*` or `/change-email*` path, and it *overrides* the `window: 60, max: 10`
configured in `packages/api/src/auth/auth.ts` (only `rateLimit.customRules` could beat it).
The configured 10/60 governs the other `/api/auth/*` routes. So a sign-up → sign-in → form
login sequence already spends the whole budget — one retry inside 10s gets a 429. Always
print the status line, or a 422/429 looks like "auth is broken".

## Verify a change end-to-end

Static gate:

```sh
pnpm verify           # typecheck · lint · format · build
```

`verify` needs `.env` (it runs `build`, which is `dotenv -e ../../.env -- next build`). It
does _not_ need the database. Two things it deliberately does not cover:

- **There are zero tests in this repo.** Nothing has your back but the gate and your own
  runtime check.
- **`content/*` is not typechecked.** `apps/web/tsconfig.json` excludes `../../content/**`,
  no content package has a `typecheck` script, and `next.config.js` sets
  `typescript.ignoreBuildErrors`. `pnpm lint` (oxlint) is the only static tool that reads
  content, and it reports warnings without failing. Content correctness is proven at
  runtime, not by the gate.

`pnpm build` runs `//#check:content` first — it fails the build if any `content/<slug>` is
missing its `meta.json` + `preview.tsx` pair, because the gallery loader would otherwise
drop it silently. Do not remove that guard.

Runtime — drive the real UI with [agent-browser](https://github.com/vercel-labs/agent-browser)
(installed globally: `npm i -g agent-browser && agent-browser install`):

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
agent-browser network requests --filter sign-in   # expect 200; a 403 means you're not on :3000
```

The routes worth checking, and what each proves:

| Route                    | Proves                                                |
| ------------------------ | ----------------------------------------------------- |
| `/`                      | gallery grid, filters, search (`⌘K`)                  |
| `/ui/<slug>`             | detail page, live preview iframe, source-code drawer  |
| `/preview-frame/<slug>`  | the bare preview — what the cover-video skill records |
| `/r/<slug>.json`         | shadcn registry item (external CLI contract)          |
| `/r/registry.json`       | the full registry index                               |
| `/api/content/<slug>`    | source payload behind the drawer + zip download       |
| `/about`, `/inspiration` | static pages                                          |

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

Content packages **must not** import from `apps/web` or `packages/*`. The registry serves
their source verbatim — `content-fs.ts` does no import rewriting and hardcodes
`registryDependencies: []` — so any `@repo/*` import ships an unresolvable registry item to
an external `shadcn add` consumer. Three legacy packages violate this
(`emerald-template`, `filter-bar`, `spreadsheet`, all depending on `@repo/ui`); they render
fine inside the gallery but are broken outside it. Do not copy them, and don't factor a
shared helper out of a content package.

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
  yet load-bearing — every cover in the repo today is `coverType: "video"` (28 of 36 slugs;
  the other 8 have no cover), and video bypasses `next/image` — but it bites the first time
  a `meta.json` uses `coverType: "image"`.

## Map

- `apps/web` — the Next.js app. `src/lib/content/content-fs.ts` reads `content/`;
  `src/lib/content-data.ts` wraps it in `"use cache"` server functions.
- `packages/ui` — Base UI + shadcn-derived components · `packages/db` — Drizzle + Turso ·
  `packages/api` — tRPC + better-auth
- `content/<slug>/` — one workspace package per component
- `CLAUDE.md` — conventions, settled decisions, curation philosophy
- `plans/component-roadmap.md` — the component backlog
- `scripts/{new-content,check-content}.ts` — the two content tools
