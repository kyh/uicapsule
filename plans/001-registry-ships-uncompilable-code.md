# Plan 001: Make every registry item install into a stranger's project and compile

> **Executor instructions**: Follow this plan step by step. Run every verification command and
> confirm the expected result before moving to the next step. If anything in the "STOP conditions"
> section occurs, stop and report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ee39414..HEAD -- apps/web/src/lib/content/content-fs.ts content/dynamic-island content/spinner-pixel-grid content/spreadsheet content/filter-bar content/emerald-template`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts
> against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `ee39414`, 2026-07-12

## Why this matters

The entire point of this project is that anyone can run `npx shadcn@latest add @uicapsule/<slug>` and
get working code. Right now, for 4 of the 28 live components, that command installs source that
**cannot compile** — the files import `@repo/ui`, a private workspace package the consumer will never
have, and the registry builder deliberately strips `@repo/*` out of the published dependency list, so
nothing even tells them what's missing.

Verified live against the dev server:

```
$ curl -s localhost:3000/r/spinner-pixel-grid.json
dependencies: []
registryDependencies: []
shipped file content: import { cn } from "@repo/ui/lib/utils";
```

This gets dramatically worse soon: open PR #66 ("shared interaction kit") adds `use-sound` and
`gesture` helpers to `packages/ui`, and the component roadmap calls those "the fidelity moat" —
meaning most future capsules will import `@repo/ui`. Today this breaks 4 components; after that PR
merges it breaks nearly all of them. **Fix the registry before landing the capsule backlog.**

Separately, `content/dynamic-island` declares BOTH `framer-motion` and `motion` (the same library,
different eras), so its registry item tells consumers to install two copies of an animation library
whose singletons don't share state.

## Current state

Files and their roles:

- `apps/web/src/lib/content/content-fs.ts` — builds the shadcn registry item served at
  `/r/<slug>.json`. The dependency-stripping is at lines 141–168.
- `apps/web/src/app/r/[slug]/route.ts` — the public route. Do not change its contract.
- 4 content packages import `@repo/ui`: `spinner-pixel-grid`, `spreadsheet`, `filter-bar`,
  `emerald-template` (all 4 declare `"@repo/ui": "workspace:^"`).
- `content/dynamic-island/package.json` + `content/dynamic-island/ring.tsx` — the duplicate library.

The registry builder as it exists today, `apps/web/src/lib/content/content-fs.ts:141-168`:

```ts
export const buildShadcnRegistryItem = async (component: LocalContentComponent) => {
  const pkg = await readContentPackageJson(component.slug);
  const dependencyKeys = Object.keys(pkg.dependencies ?? {});
  const devDependencyKeys = Object.keys(pkg.devDependencies ?? {});

  const repoScoped = dependencyKeys.filter((dep) => dep.startsWith("@repo"));
  const dependencies = dependencyKeys.filter(
    (dep) => !["react", "react-dom", ...repoScoped].includes(dep), // <-- @repo/* silently dropped
  );
  // ...
  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    homepage: `https://uicapsule.com/ui/${component.slug}`,
    name: component.slug,
    type: "registry:block" as const,
    author: "Kaiyu Hsu <uicapsule@kyh.io>",
    dependencies,
    devDependencies,
    registryDependencies: [], // <-- always empty
    files: component.sourceFiles.map(({ path, code }) => ({
      type: "registry:file" as const,
      path,
      content: code, // <-- ships the @repo/ui import verbatim
      target: `uicapsule/${component.slug}${path}`,
    })),
  };
};
```

The 4 offending packages import exactly two kinds of thing from `@repo/ui`:

- `@repo/ui/lib/utils` → the `cn` helper (a small clsx + tailwind-merge wrapper). Used by all 4.
- `@repo/ui/components/<x>` → standard shadcn components (button, input, popover, checkbox, calendar,
  command, slider, switch, tabs, badge, dropdown-menu). Used by `spreadsheet`, `filter-bar`,
  `emerald-template`.

Confirm the exact import sites before editing:

```bash
grep -rn "@repo/ui" content/spinner-pixel-grid content/spreadsheet content/filter-bar content/emerald-template
```

**Repo conventions that apply here** (from `CLAUDE.md`, non-negotiable):

- kebab-case filenames for all TS/TSX.
- **No `any`, no non-null assertion `!`, no `as` type assertions.** (The existing `as` at
  `content-fs.ts:35` is itself a known defect — Plan 002 fixes it. Do not add more.)
- Content packages are standalone by design: _"Content packages exist as workspace packages only so
  pnpm installs their deps in isolation and the registry can report per-component dependencies."_ A
  content package reaching into `@repo/ui` violates that contract — which is precisely this bug.
- The registry must keep reporting per-component dependencies from each package's own `package.json`.
  Do not centralize this.

## Commands you will need

| Purpose                 | Command                                | Expected on success                                       |
| ----------------------- | -------------------------------------- | --------------------------------------------------------- |
| Install                 | `pnpm install`                         | exit 0                                                    |
| Typecheck               | `pnpm typecheck`                       | exit 0                                                    |
| Lint                    | `pnpm lint`                            | exit 0 (pre-existing `content/` warnings OK; no new ones) |
| Format                  | `pnpm format:fix`                      | exit 0                                                    |
| Build                   | `pnpm build`                           | exit 0                                                    |
| Dev server              | `pnpm dev:web`                         | serves http://localhost:3000                              |
| Inspect a registry item | `curl -s localhost:3000/r/<slug>.json` | JSON, HTTP 200                                            |

## Scope

**In scope**:

- `apps/web/src/lib/content/content-fs.ts` (registry builder only)
- `content/spinner-pixel-grid/**`, `content/spreadsheet/**`, `content/filter-bar/**`,
  `content/emerald-template/**` (their imports + `package.json`)
- `content/dynamic-island/package.json`, `content/dynamic-island/ring.tsx`
- `apps/web/src/lib/content/content-fs.test.ts` (create — see Test plan)

**Out of scope** (do NOT touch):

- `apps/web/src/app/r/[slug]/route.ts` — the route needs no edit (its _response_ changes; the route
  does not).
- `packages/ui/**` — do not add, remove, or re-export anything there to make this easier. The fix
  belongs in the content packages and the builder.
- `apps/web/src/app/api/content/[slug]/route.ts` — the internal source-drawer seam, deliberately
  separate from the registry. Leave it.
- The other 24 content packages — already correct.

## Git workflow

- Branch: `kyh/001-registry-fix` (repo convention: branches are prefixed `kyh/`)
- Conventional commits, e.g. `fix: ship installable registry items`
- Do NOT push or open a PR unless the operator instructs it.

## Steps

### Step 1: Inline `cn` into the 4 packages

All 4 import `cn` from `@repo/ui/lib/utils`. The other 24 components don't need it, and
`content/feed/feed.tsx:2` already demonstrates the house solution: a local `cn`.

For **each** of the 4 packages: read `packages/ui/src/lib/utils.ts`, copy its `cn` implementation into
`content/<slug>/lib/utils.ts`, and rewrite the imports to the relative path. Add `clsx` and
`tailwind-merge` to that package's `package.json` dependencies (the registry will now correctly
report them to consumers).

**Verify**: `grep -rn "@repo/ui/lib/utils" content/` → no matches.

### Step 2: Replace `@repo/ui/components/*` with shadcn registry dependencies

`spreadsheet`, `filter-bar`, and `emerald-template` import standard shadcn components. The consumer's
project almost certainly already has them, and shadcn's mechanism for expressing that is
`registryDependencies`.

For each of those 3 packages:

1. Rewrite `import { Button } from "@repo/ui/components/button"` →
   `import { Button } from "@/components/ui/button"` (shadcn's default install path in a consumer project).
2. Record which shadcn components the package needs, and add them to its `package.json` under a
   `"registryDependencies": ["button", "input", ...]` key.

**Verify**: `grep -rn "@repo/ui" content/` → no matches at all.

### Step 3: Teach the builder to emit `registryDependencies`, and guard the regression

In `content-fs.ts`:

- extend the `ContentPackageJson` type (~line 131) with `registryDependencies?: string[]`
- emit that array instead of the hardcoded `[]`
- **delete the `@repo`-stripping filter** — after steps 1–2 nothing depends on `@repo/*`, so the
  filter has nothing left to hide
- add a guard: if any dependency key starts with `@repo`, **throw**, naming the slug and the dep. This
  function runs at build/`"use cache"` time, so a crash is the correct blast radius — a silently
  broken registry item is exactly what this plan exists to eliminate.

**Verify**: `pnpm typecheck` → exit 0.

### Step 4: De-duplicate the animation library in `dynamic-island`

`content/dynamic-island/ring.tsx:2` is the only `framer-motion` import in the repo's source (all other
hits are `.next/` build artifacts). Change it to `import { motion, AnimatePresence } from "motion/react"`
and remove `"framer-motion"` from that package's `package.json`. `motion/react` is a drop-in for these
two exports.

**Verify**: `grep -rn 'from "framer-motion"' content/ apps/web/src packages/` → no matches.

### Step 5: Prove the output is installable

With `pnpm dev:web` running, for each of the 5 touched slugs:

```bash
curl -s localhost:3000/r/<slug>.json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);const bad=j.files.filter(f=>f.content.includes('@repo/'));console.log(j.name,'| deps:',JSON.stringify(j.dependencies),'| registryDeps:',JSON.stringify(j.registryDependencies),'| files importing @repo:',bad.length);});"
```

**Expected for every one**: `files importing @repo: 0`, and a `dependencies` array that actually
reflects what the source imports (e.g. `spinner-pixel-grid` → `["clsx","tailwind-merge"]`).

### Step 6: Visually verify the 5 previews still render

The previews render from the source you just rewrote, so a broken import shows up immediately. Load
each and confirm it renders and animates with a clean console:

- `/ui/spinner-pixel-grid`, `/ui/spreadsheet`, `/ui/filter-bar`, `/ui/emerald-template`, `/ui/dynamic-island`

**Verify**: all 5 render; no module-resolution or React errors in the console.

## Test plan

There is **no test infrastructure in this repo** (zero test files; `packages/ui`'s `"test": "vitest run"`
script is dead — Plan 003 removes it). This plan introduces the first real test, because the registry
is a public contract consumed by other people's CLIs and nothing verifies it.

Create `apps/web/src/lib/content/content-fs.test.ts` with **vitest** (add `vitest` to `apps/web`
devDependencies and a `"test": "vitest run"` script to `apps/web/package.json`):

1. **No `@repo/*` escapes into the registry** — for every local component, build its registry item and
   assert no `files[].content` contains `"@repo/"`. _This is the regression test; it must fail against
   the pre-fix code._
2. **Declared deps cover the imports** — every bare-module import in `files[].content` is in
   `dependencies`, in `registryDependencies`, or is `react`/`react-dom`.
3. **Shape** — `files[].target` starts with `uicapsule/<slug>/`, `files[].path` starts with `/`,
   `content` non-empty.

Verification: `pnpm -F @repo/web test` → all pass.

## Done criteria

ALL must hold:

- [ ] `grep -rn "@repo/" content/` → no matches
- [ ] `grep -rn 'from "framer-motion"' content/ apps/web/src packages/` → no matches
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm lint` exits 0 with no _new_ warnings
- [ ] `pnpm build` exits 0
- [ ] `pnpm -F @repo/web test` passes, including the "no `@repo/*` in registry output" test
- [ ] For all 5 touched slugs, `/r/<slug>.json` reports `files importing @repo: 0` and an accurate,
      non-empty `dependencies` array
- [ ] All 5 previews render in the browser
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at `content-fs.ts:141-168` doesn't match the "Current state" excerpt.
- A content package imports something from `@repo/ui` that is **neither** a shadcn component **nor**
  `cn` (e.g. a bespoke hook). Inlining that is a judgment call about the standalone contract — report
  what it is and stop.
- Rewriting an import breaks a preview visually and you can't resolve it in one attempt.
- You find yourself wanting to modify `packages/ui` to make this work. Out of scope, and a sign the
  approach needs a human decision.
- `registryDependencies` as a custom key in a content `package.json` collides with something pnpm or
  shadcn already treats as meaningful.

## Maintenance notes

- **This plan is a prerequisite for landing the 38-capsule PR backlog (Plan 012).** Merging PR #66
  (shared interaction kit in `packages/ui`) before this lands would multiply the bug across the whole
  backlog. Sequence: 001 → 002 → 003 → merge train.
- The new build-time `throw` is the guardrail: any future capsule reaching into the workspace UI
  package now fails the build instead of silently shipping broken code. If a capsule genuinely needs a
  shared primitive, publish that primitive as its own registry item (`/r/gesture.json`) and reference
  it via `registryDependencies` — do not weaken the guard.
- Reviewer should scrutinize: that the inlined `cn` is behaviorally identical to
  `packages/ui/src/lib/utils.ts`, and that no preview regressed visually.
