# Plan 003: Put the whole repo — including the 17k LOC of content — under a CI gate

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm
> the expected result before moving to the next step. If anything in the "STOP conditions" section
> occurs, stop and report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ee39414..HEAD -- .github/workflows apps/web/tsconfig.json apps/web/next.config.js packages/ui/package.json scripts/new-content.ts`
> On a mismatch with the "Current state" excerpts, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (turning typecheck on for `content/` will surface existing errors)
- **Depends on**: none. Ideally lands alongside 002, so `check:content` can join the gate.
- **Category**: dx
- **Planned at**: commit `ee39414`, 2026-07-12

## Why this matters

Three failures compound into one hole:

1. `apps/web/tsconfig.json:13` **excludes** `../../content/**`.
2. None of the 30 content packages has a `tsconfig.json` or a `typecheck` script, so
   `turbo run typecheck` lists them in scope and then runs **nothing** for them.
3. `apps/web/next.config.js:83` sets `typescript: { ignoreBuildErrors: true }` with the comment
   _"We already do linting and typechecking as separate tasks in CI"_ — **and there is no CI.**
   `.github/workflows/` contains only `claude.yml` (the @claude bot) and `db-sync.yml` (which pushes DB
   schema to production on every push to `main`). Neither has a `pull_request` trigger.

Net: ~17k LOC — 82% of the repo, and the _only_ code an outside contributor will ever write — is
typechecked by nothing and gated by no one. In a repo with zero tests, a green `tsc` **is** the test
suite, and it isn't running.

This is also what makes the 38-capsule PR backlog dangerous to merge: there is currently no automated
way to know whether an incoming capsule even compiles.

## Current state

`apps/web/tsconfig.json` (whole file):

```json
{
  "extends": "@kyh/tsconfig/base.json",
  "compilerOptions": {
    "lib": ["ES2023", "dom", "dom.iterable"],
    "jsx": "preserve",
    "paths": { "@/*": ["./src/*"] },
    "plugins": [{ "name": "next" }],
    "module": "esnext"
  },
  "include": [".", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "../../content/**"]
}
```

`apps/web/next.config.js:82-83`:

```js
  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: true },
```

Content packages have exactly one script (`clean`). `ls content/*/tsconfig.json` → none exist.

`packages/ui/package.json:15` declares `"test": "vitest run"`, but `vitest` isn't a dependency of that
package and no test file exists. The script is dead and will hard-fail any CI that runs
`turbo run test`.

Root scripts — the verification contract, all working today:

```json
"build": "turbo run build",
"typecheck": "turbo run typecheck",
"lint": "oxlint --report-unused-disable-directives",
"format": "oxfmt",
"format:fix": "oxfmt --write"
```

Runtime pins: Node `>=24` (`engines`), `packageManager: pnpm@10.33.0`.

`.github/workflows/db-sync.yml` already demonstrates the correct setup for this repo (checkout →
`pnpm/action-setup@v6` → `setup-node@v6` with node 24). **Read it and reuse that block** rather than
inventing one.

## Commands you will need

| Purpose       | Command                          | Expected on success                 |
| ------------- | -------------------------------- | ----------------------------------- |
| Install       | `pnpm install --frozen-lockfile` | exit 0                              |
| Typecheck     | `pnpm typecheck`                 | exit 0                              |
| Lint          | `pnpm lint`                      | exit 0                              |
| Format check  | `pnpm format`                    | exit 0                              |
| Build         | `pnpm build`                     | exit 0                              |
| Content check | `pnpm check:content`             | exit 0 (exists only after Plan 002) |

## Scope

**In scope**:

- `.github/workflows/ci.yml` (create)
- `content/tsconfig.base.json` (create)
- `content/*/tsconfig.json` (create — 29 files, scripted)
- `content/*/package.json` (add a `typecheck` script)
- `scripts/new-content.ts` (so new capsules get both by construction)
- `apps/web/next.config.js` (remove `ignoreBuildErrors`)
- `packages/ui/package.json` (remove the dead `test` script)
- Type-error fixes **inside `content/`** that the new typecheck surfaces

**Out of scope**:

- `.github/workflows/db-sync.yml` — its guardrails are Plan 010.
- `.github/workflows/claude.yml` — leave alone.
- Refactoring content components for style. **Fix type errors only**, minimally. If a component needs
  real restructuring to typecheck, STOP.
- `apps/web/tsconfig.json`'s `exclude` — content gets its _own_ tsconfigs; do not fold 17k LOC into
  the web app's program.

## Git workflow

- Branch: `kyh/003-ci-gate`
- Conventional commits: one for the harness, one per batch of content fixes, one for the workflow.

## Steps

### Step 1: Establish a green baseline

Run and **record** `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm build`. All four pass on `main`
today. If any already fails, **STOP and report** — you need a green baseline to attribute new failures.

**Verify**: all four exit 0.

### Step 2: Give content packages a tsconfig and a typecheck script

Create `content/tsconfig.base.json` extending `@kyh/tsconfig/base.json`, mirroring the React settings
from `apps/web/tsconfig.json` (excerpted above) — `"jsx": "preserve"`, `lib` including `dom`,
`module: esnext` — minus the Next plugin and the `@/*` paths (web-app-specific).

Then, for each of the 29 tracked content packages:

- `content/<slug>/tsconfig.json`: `{ "extends": "../tsconfig.base.json", "include": ["."], "exclude": ["node_modules"] }`
- a `"typecheck": "tsc --noEmit"` script in its `package.json`

**Script this** — do not hand-write 29 files.

**Verify**: `pnpm typecheck` now shows `@uicapsule/<slug>:typecheck` lines in Turbo's output. It will
very likely **fail** — that is expected and is the point. Record the full error list.

### Step 3: Fix the type errors that surface

Known offenders found during the audit (there will be more):

- `content/sidebar/sidebar.tsx:80,101,115` — `item: any`
- `content/spreadsheet/components/spreadsheet.tsx:72-73` — `column.columnDef as any`
- `content/tooltip-grid/tooltip.tsx:16-19` — four blanket `eslint-disable` lines for
  `no-unsafe-*` / `no-explicit-any`
- `content/wireframe-orb/wireframe-orb.tsx:268`
- `content/filter-bar/_components/filter-value.tsx:448,487,913-979` — non-null assertions on array indexing

The repo standard bans `any`, `!`, and `as`. Fix by **modeling the types properly**, not by widening.
Where a library genuinely returns `unknown`, narrow with a type guard.

Work package by package, committing per package, so regressions are bisectable.

**Verify**: `pnpm typecheck` exits 0 across all 32 packages.

### Step 4: Make the build honest

Delete `typescript: { ignoreBuildErrors: true }` (and its now-false comment) from
`apps/web/next.config.js`. With step 3 done and step 6 adding the CI it references, the claim becomes
true.

**Verify**: `pnpm build` exits 0.

### Step 5: Remove the dead test script

Delete `"test": "vitest run"` from `packages/ui/package.json`. (If Plan 001/002 landed, they added a
_real_ vitest setup to `apps/web` — leave that alone.)

**Verify**: `grep -n '"test"' packages/ui/package.json` → no match.

### Step 6: Add the CI workflow

Create `.github/workflows/ci.yml`:

- triggers: `pull_request` and `push` to `main`
- `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`
- steps: checkout → `pnpm/action-setup@v6` → `setup-node@v6` (node 24, `cache: pnpm`) →
  `pnpm install --frozen-lockfile` → `pnpm typecheck` → `pnpm lint` → `pnpm format` → `pnpm build`
- if Plan 002 landed, add `pnpm check:content` before `pnpm build`
- cache `.turbo` via `actions/cache` keyed on the lockfile

Reuse the checkout/pnpm/node block from `db-sync.yml` verbatim.

**Verify**: the YAML is valid and structurally matches `db-sync.yml`. Only push to observe a real run
if the operator authorized pushing.

### Step 7: Cover new capsules by construction

Update `scripts/new-content.ts` so a scaffolded package includes `tsconfig.json` and the `typecheck`
script — otherwise every new component re-opens this hole.

**Verify**: `pnpm new:content ci-smoke-test` → the generated package has both → `pnpm typecheck`
includes it → then **delete** the scaffolded directory and revert any lockfile change.

## Test plan

This plan adds no unit tests; its deliverable _is_ the verification infrastructure. The gate is the
test:

- `pnpm typecheck` must cover all 32 packages (previously 4).
- CI must run on `pull_request`.

If authorized, open a scratch PR with a deliberate type error in a content package and confirm CI goes
red. Revert it.

## Done criteria

ALL must hold:

- [ ] `ls content/*/tsconfig.json | wc -l` → 29
- [ ] `pnpm typecheck` exits 0 **and** its output shows typecheck running in `@uicapsule/*` packages
- [ ] `grep -rn "ignoreBuildErrors" apps/web/next.config.js` → no match
- [ ] `grep -rn '"test"' packages/ui/package.json` → no match
- [ ] `pnpm lint`, `pnpm format`, `pnpm build` all exit 0
- [ ] `.github/workflows/ci.yml` exists with a `pull_request` trigger
- [ ] `scripts/new-content.ts` emits a `tsconfig.json` + `typecheck` script
- [ ] `grep -rn ": any" content/` → no matches
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The step-1 baseline isn't green — something is already broken and this plan's premise is off.
- Typechecking content surfaces errors that need a component's **logic restructured** (not just its
  types tightened). Report the list; the maintainer may want to fix those by hand or land the harness
  with those packages temporarily excluded.
- **More than ~40 type errors** appear. That is a bigger cleanup than this plan budgeted — report the
  count and the top offenders and get direction before grinding through them.
- A content package fails because of a _third-party_ type bug (e.g. a `three` / `@react-three/fiber`
  version mismatch) rather than the repo's own code.

## Maintenance notes

- Sequence with the merge train: this gate is what makes batch-merging 38 capsule PRs survivable.
  Land 001 + 002 + this, then merge.
- Keep `apps/web/tsconfig.json`'s `exclude: ["../../content/**"]` — content is typechecked by its own
  tsconfigs. "Simplifying" by removing the exclude would pull 17k LOC into the app's compile.
- Reviewer should scrutinize: that no type error was silenced with `any`/`as`/`!` — that is exactly
  what an executor under time pressure reaches for, and exactly what the standard forbids.
- Deferred: making `db-sync.yml` depend on this gate (Plan 010).
