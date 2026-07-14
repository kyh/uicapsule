# Plan 010: Repo hygiene — license, README, env, dead deps, and a guardrail on the prod DB push

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If anything
> in the "STOP conditions" section occurs, stop and report — do not improvise. When
> done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ee39414..HEAD -- README.md .env.example turbo.json .github/workflows/db-sync.yml packages/ui/package.json packages/db/package.json apps/web/package.json pnpm-workspace.yaml`
> On a mismatch with the "Current state" excerpts, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S–M
- **Risk**: LOW (except the `db-sync` change — see step 5)
- **Depends on**: none. Step 5's `needs:` wiring is easier once Plan 003's `ci.yml` exists.
- **Category**: dx / docs
- **Planned at**: commit `ee39414`, 2026-07-12

## Why this matters

A cluster of small, independent items that each cost the maintainer real time or block real users.
Grouped because none justifies its own plan and all are mechanical.

1. **No LICENSE.** The About page says _"This is that collection as open source, copy paste-able
   code."_ Unlicensed code is "all rights reserved" by default — which legally blocks the exact
   audience this project is built for (engineers at companies with a legal review, running
   `npx shadcn add`). This is the cheapest unblock in the repo: one file.
2. **A two-line README** on a repo that wants outside contributions, where all the actual guidance
   (setup, architecture, and the _curation bar_ that determines whether a PR gets merged) lives in
   `CLAUDE.md` — a file addressed to agents, which humans don't open.
3. **`.env.example` is missing `NEXT_PUBLIC_SUPABASE_URL`**, which `next.config.js:6,26-30` reads to
   build the `next/image` remote-pattern allowlist. A fresh clone renders a gallery with **broken
   covers** and no hint why. It is also missing from `turbo.json`'s `globalEnv`, so Turbo won't bust
   its build cache when it changes.
4. **Dead manifest entries**, including a `zod` **peerDependency** on `@repo/ui` that the package
   never imports — a peer dep is a hard install requirement for a library it doesn't use.
5. **`db-sync.yml` pushes DB schema to production Turso on every commit to `main`** — unconditionally,
   with no path filter, no review, no migration files, and no gate. `drizzle-kit push` diffs and
   _applies directly_; a destructive diff is resolved by dropping. This is the only automation
   pointed at production, and ~95% of commits to `main` are content changes that don't touch the
   schema at all.

## Current state

**README.md** (the complete file):

```markdown
# UICapsule

A curated collection of components that spark joy
```

**`.env.example`** documents 3 vars: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`.
Code actually reads a 4th: `NEXT_PUBLIC_SUPABASE_URL` (`apps/web/next.config.js:6`). Verified list of
env vars referenced in source: `NEXT_PUBLIC_SUPABASE_URL`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
`NODE_ENV`, `PORT`, `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL`.

**`turbo.json`** `globalEnv`: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `PORT`,
`VERCEL_PROJECT_PRODUCTION_URL` — no `NEXT_PUBLIC_SUPABASE_URL`.

**`.github/workflows/db-sync.yml`**: `on: push: branches: [main]`, no `paths:` filter, no
`concurrency:`, no environment protection. Runs `pnpm db:push-remote` → `drizzle-kit push` against
the production Turso credentials. `packages/db/drizzle.config.ts` declares `out: "./drizzle"` — i.e.
a migrations directory is configured but **never used** (no `packages/db/drizzle/` exists).

**Dead deps** (each verified by grepping the owning package's own source):

- `packages/ui/package.json` — `zod` in **peerDependencies** (never imported); `date-fns` in
  dependencies (never imported; `react-day-picker` v10 no longer needs it)
- `packages/db/package.json` — declares `next` and `react`; imports neither
- `apps/web/package.json` — declares `@repo/db`; never imports it (it reaches the DB via `@repo/api`)
- `content/filter-bar/package.json`, `content/spreadsheet/package.json` — both declare `zod`; neither
  imports it (**and the registry publishes those deps to consumers**, so this ships phantom install
  instructions to real users)

**Do NOT remove**: `shadcn` from `packages/ui` dependencies — it is a **runtime** dep because
`packages/ui/src/styles/globals.css:3` does `@import "shadcn/tailwind.css"`, resolved at build time.
Removing it breaks the CSS build. Also leave `content/wireframe-orb`'s `postprocessing` (a required
peer of `@react-three/postprocessing`).

**All 5 high `pnpm audit` advisories** come from an unreachable subtree: `better-auth > prisma > …`
(the app uses the Drizzle adapter; Prisma is never imported). They are noise that trains everyone to
ignore the audit.

## Commands you will need

| Purpose   | Command                         | Expected on success                 |
| --------- | ------------------------------- | ----------------------------------- |
| Install   | `pnpm install`                  | exit 0                              |
| Typecheck | `pnpm typecheck`                | exit 0                              |
| Lint      | `pnpm lint`                     | exit 0                              |
| Build     | `pnpm build`                    | exit 0                              |
| Audit     | `pnpm audit --audit-level=high` | after step 4: **0 high advisories** |

## Scope

**In scope**:

- `LICENSE` (create)
- `README.md`
- `.env.example`
- `turbo.json` (`globalEnv` only)
- `packages/ui/package.json`, `packages/db/package.json`, `apps/web/package.json`,
  `content/filter-bar/package.json`, `content/spreadsheet/package.json` (dep removals only)
- `pnpm-workspace.yaml` (the `ignoredOptionalDependencies` block in step 4)
- `.github/workflows/db-sync.yml`
- `scripts/new-content.ts` (add `"license": "MIT"` to the scaffolded manifest)

**Out of scope**:

- `CLAUDE.md` — it is good; the README should _point at_ and lift from it, not replace it.
- Any source-code change. This plan touches manifests, docs, config, and one workflow.
- Migrating from `drizzle-kit push` to generated migrations — noted as follow-up in step 5; it is a
  bigger change with a schema-history decision behind it.

## Git workflow

- Branch: `kyh/010-hygiene`
- Conventional commits; one per step.

## Steps

### Step 1: Add a LICENSE

Add an MIT `LICENSE` at the repo root (copyright: Kaiyu Hsu, 2026). Add `"license": "MIT"` to the
content-package template in `scripts/new-content.ts` so registry consumers inherit it.

**Confirm with the maintainer if MIT is not the intended license** — this is a one-way door for code
already published, and it is their call. If unsure, STOP and ask.

**Verify**: `LICENSE` exists at root.

### Step 2: Write a real README

Target audience: a human who wants to install a component, or contribute one. Cover, in order:

- What this is (one paragraph)
- **Install a component**: the `npx shadcn@latest add @uicapsule/<slug>` command **plus** the
  `components.json` `registries` entry the consumer needs (`"@uicapsule": "https://uicapsule.com/r/{name}.json"`)
  — without that entry the copy button's command fails on first use for every new user. Verify the
  exact required config against the shadcn docs before writing it.
- Prerequisites (Node >= 24, pnpm 10 — both pinned in root `package.json`)
- Local setup: `pnpm install`, `cp .env.example .env`, `pnpm dev:web`
- **How to add a component**: `pnpm new:content <slug>` → build → `preview.tsx` → `meta.json` → cover
- **The curation bar** — lift the three rules from `CLAUDE.md`'s "Content Curation Philosophy"
  verbatim. That section is the most valuable prose in the repo and it currently lives only in a file
  humans never open. Published, it is the cheapest possible PR filter.
- The `rm -rf apps/web/.next` Tailwind/Turbopack gotcha (from `CLAUDE.md` "Gotchas"), until it's fixed

**Verify**: a reader who has never seen the repo can install a component and scaffold one from the
README alone.

### Step 3: Fix the env documentation

- Add `NEXT_PUBLIC_SUPABASE_URL` to `.env.example` with a one-line comment (it is the storage host for
  cover images/videos; without it `next/image` has an empty allowlist and covers break). **Name only
  — never a value.**
- Add `NEXT_PUBLIC_SUPABASE_URL` to `turbo.json`'s `globalEnv`.
- Add a short comment to each var in `.env.example` saying where to obtain it.

**Verify**: `grep -c "" .env.example` shows the new var; `grep NEXT_PUBLIC_SUPABASE_URL turbo.json`
matches.

### Step 4: Remove dead dependencies and silence the unreachable advisories

Remove the entries listed in "Current state" (`zod` peer + `date-fns` from `packages/ui`; `next` +
`react` from `packages/db`; `@repo/db` from `apps/web`; `zod` from `content/filter-bar` and
`content/spreadsheet`). **Do not remove `shadcn` from `packages/ui`.**

Then add a `pnpm.ignoredOptionalDependencies` block to `pnpm-workspace.yaml` excluding the DB drivers
better-auth pulls in but this app never uses: `prisma`, `@prisma/client`, `mongodb`, `mysql2`,
`postgres`, `kysely`, `@electric-sql/pglite`. (The app uses the **Drizzle** adapter — verified at
`packages/api/src/auth/auth.ts:5`.)

Re-lock and verify nothing broke.

**Verify**:

- `pnpm install` → exit 0
- `pnpm typecheck && pnpm lint && pnpm build` → all exit 0
- `pnpm audit --audit-level=high` → **0 high advisories**
- **Sign in through the UI still works** (this is the real risk of pruning better-auth's optional
  peers — if better-auth bare-imports one of them at module load, this breaks auth). If sign-in
  breaks, revert the `ignoredOptionalDependencies` block and report.

### Step 5: Put a guardrail on the production schema push

`.github/workflows/db-sync.yml` currently applies schema changes to the **production** database on
every push to `main`, including the ~95% of commits that only touch content.

Minimum viable guardrail (all three):

- add a `paths:` filter so it only runs when `packages/db/src/**` or `packages/db/drizzle.config.ts`
  changes
- add `concurrency: { group: db-sync, cancel-in-progress: false }` so two pushes can't race the same
  database
- add a GitHub `environment: production` with a **required reviewer**, so applying a schema change to
  prod is an explicit human act

Also fix the step's stale label — it says "Push database schema **and sync content**", but
`db:push-remote` only pushes schema; there is no content sync.

**Verify**: the workflow file parses; a content-only commit no longer triggers it (confirm by reading
the `paths:` filter — do not test by pushing to `main`).

## Test plan

No unit tests. The gates are the commands in step 4 plus a manual auth check:

1. `pnpm install && pnpm typecheck && pnpm lint && pnpm build` — all green after the dep removals.
2. `pnpm audit --audit-level=high` — 0 high.
3. **Sign in / sign out still work** (guards against the `ignoredOptionalDependencies` risk).
4. The site renders covers correctly with `NEXT_PUBLIC_SUPABASE_URL` set, and degrades predictably
   without it.

## Done criteria

ALL must hold:

- [ ] `LICENSE` exists at repo root
- [ ] README documents: install (incl. the `components.json` registry entry), setup, how to add a
      component, and the curation bar
- [ ] `grep NEXT_PUBLIC_SUPABASE_URL .env.example turbo.json` → matches in both
- [ ] `grep -n '"zod"' packages/ui/package.json content/filter-bar/package.json content/spreadsheet/package.json` → no matches
- [ ] `grep -n '"shadcn"' packages/ui/package.json` → **still matches** (must NOT be removed)
- [ ] `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm build` all exit 0
- [ ] `pnpm audit --audit-level=high` reports **0 high** advisories
- [ ] Sign-in still works after the dependency pruning
- [ ] `db-sync.yml` has a `paths:` filter, a `concurrency:` group, and an `environment:` gate
- [ ] No secret **values** in any file
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- **The license choice is not obviously MIT.** It is the maintainer's call and it is effectively
  irreversible for already-published code.
- Pruning better-auth's optional DB-driver peers breaks the build or breaks sign-in — revert that
  block and report; the advisories are noise, not worth breaking auth over.
- Removing a "dead" dep breaks typecheck or build. It wasn't dead. Report which one and why.
- Adding the `environment: production` gate to `db-sync.yml` requires repo settings you cannot change
  (creating a GitHub environment with reviewers is a repo-admin action) — do the `paths:` +
  `concurrency:` parts and report the rest as needing the maintainer.

## Maintenance notes

- **Follow-up worth doing**: switch `drizzle-kit push` → `drizzle-kit generate` + `migrate`, so schema
  changes arrive as reviewable SQL in the PR (which _is_ the review) with a rollback artifact. The
  config already declares `out: "./drizzle"` — the migration workflow is configured and unused.
- The README's curation bar is the highest-leverage sentence in this plan: it turns "maintainer
  explains why this PR is a no" into "the contributor already knew."
- Reviewer should scrutinize: that no _live_ dependency was pruned (typecheck+build+auth all pass),
  and that the README's install instructions actually work end-to-end against the deployed registry.
