# Plan 012: Land the 38-capsule backlog — a rebase script and a merge train

> **Executor instructions**: This is a **spike + process plan**, not a mechanical code change. It
> requires maintainer sign-off before the first merge (see "Gate"). Follow the steps, run every
> verification, and STOP where instructed. Update `plans/README.md` when done.
>
> **Drift check (run first)**: `gh pr list --limit 60 --json number,title,mergeable`
> The PR set below was captured at commit `ee39414`. If the counts differ materially, re-derive them
> before proceeding.

## Status

- **Priority**: P1 (highest leverage in the repo — but **gated** on 001, 002, 003)
- **Effort**: L
- **Risk**: MED-HIGH (39 merges into a repo whose test suite is a typecheck)
- **Depends on**: `001` (registry), `002` (content validation), `003` (CI gate). **Do not start before all three land.**
- **Category**: direction
- **Planned at**: commit `ee39414`, 2026-07-12

## Why this matters

**The product is sitting in the merge queue.** As of `ee39414`:

- 41 open PRs. **38 are finished capsules** (`feat: add jiggle-mode`, `drum-picker`, `predictive-back`,
  `epg-grid`, `semantic-zoom`, `ghost-text`, …), plus PR #66 (a shared interaction kit) and a couple of fixes.
- **39 of 41 are `CONFLICTING`.**
- The gallery currently ships **28** components. The queue holds **38 more**. Landing them would more
  than double the gallery.

And the conflict is **mechanical, not intellectual**. Every capsule branch was cut before the
filesystem-driven content refactor, so every one of them adds a line to `apps/web/package.json`:

```diff
+    "@uicapsule/jiggle-mode": "workspace:*",
```

…to a file that **no longer lists content packages at all** (`grep -c "@uicapsule/" apps/web/package.json`
→ 0 on `main`; `next.config.js` now derives `transpilePackages` from the filesystem). So each PR
conflicts on that dep list plus `pnpm-lock.yaml`, and on nothing else:

```bash
$ git diff --name-only main...origin/kyh/jiggle-mode
apps/web/package.json          # <-- the conflict, and it should simply be dropped
content/jiggle-mode/jiggle-mode.tsx
content/jiggle-mode/meta.json
content/jiggle-mode/package.json
content/jiggle-mode/preview.tsx
pnpm-lock.yaml                 # <-- regenerate
```

There is also a strategic payoff. The shipped gallery (`sidebar`, `spreadsheet`, `filter-bar`, `feed`,
`tooltip-grid`) is generic web UI — which `CLAUDE.md`'s own curation philosophy explicitly rejects
("_'A nicer dropdown' doesn't cut it_"). The queue is where the actual thesis lives: OS-grade
interactions imported from outside the web. **The positioning that makes this project distinctive is
entirely trapped in these PRs.**

## Gate — read before doing anything

Three plans must land first, in this order, and for concrete reasons:

1. **001 (registry)** — PR #66 adds shared helpers to `packages/ui`. The moment capsules start
   importing `@repo/ui`, the registry ships uncompilable code for them (it strips `@repo/*` deps).
   Today that bug affects 4 components; merge the backlog first and it affects most of them.
2. **002 (content validation)** — the content pipeline currently drops a malformed component
   **silently** (proven: `content/timeline`). At 1 merge a week that's a curiosity. At 5 merges a
   batch it is the default failure mode.
3. **003 (CI gate)** — there is no PR check today, and content packages aren't even typechecked. You
   are about to merge 38 PRs of code that nothing has verified.

**If any of the three is not DONE in `plans/README.md`, STOP.**

## Current state

Capture the live list first — it will have moved:

```bash
gh pr list --limit 60 --json number,title,mergeable,headRefName \
  --jq '.[] | "\(.mergeable) #\(.number) \(.headRefName) — \(.title)"' | sort
```

At planning time: 39 `CONFLICTING`, 2 `MERGEABLE`. Branches follow `kyh/<slug>`.

Each capsule PR is ~280 additions across ~6 files, all inside `content/<slug>/` except the two
conflict files.

## Commands you will need

| Purpose       | Command                                                           | Expected on success            |
| ------------- | ----------------------------------------------------------------- | ------------------------------ |
| List PRs      | `gh pr list --limit 60 --json number,title,mergeable,headRefName` | JSON                           |
| Typecheck     | `pnpm typecheck`                                                  | exit 0                         |
| Lint          | `pnpm lint`                                                       | exit 0                         |
| Content check | `pnpm check:content`                                              | exit 0 (exists after Plan 002) |
| Build         | `pnpm build`                                                      | exit 0                         |
| Dev server    | `pnpm dev:web`                                                    | http://localhost:3000          |

## Scope

**In scope**:

- A rebase/conflict-resolution script (put it at `scripts/rebase-capsule-prs.ts`, matching the
  existing `scripts/new-content.ts` conventions)
- Rebasing capsule branches and pushing them (**only with explicit maintainer authorization** —
  pushing to 38 branches is not reversible-by-accident)
- `plans/component-roadmap.md` — correct its status markers (see step 5)

**Out of scope**:

- **Rewriting or "improving" the capsule components themselves.** They were authored deliberately.
  If one fails QA, report it and leave the PR open — do not fix it in the merge train.
- Merging PR #66 (the shared interaction kit) as part of the batch — it changes `packages/ui` and
  must be reviewed on its own, _after_ Plan 001, because it is what makes the registry bug systemic.
- Cover videos for the new capsules (content-ops; see step 4).

## Git workflow

- Work on a scratch branch per capsule; do not push to `main` directly.
- **Do NOT merge anything until the maintainer approves the first batch** (see step 3's gate).

## Steps

### Step 1: Confirm the conflict is what this plan claims

Pick three capsule branches at random and verify the diff against `main` touches **only**
`content/<slug>/**`, `apps/web/package.json`, and `pnpm-lock.yaml`:

```bash
for b in kyh/jiggle-mode kyh/drum-picker kyh/epg-grid; do
  echo "== $b"; git diff --name-only main...origin/$b
done
```

**Verify**: no capsule branch touches `apps/web/src/**`, `packages/**`, or another capsule's directory.

**If any branch touches shared code, STOP** — this plan's core assumption (that the conflicts are
mechanical) is false for that branch, and it needs individual review.

### Step 2: Write the rebase script

`scripts/rebase-capsule-prs.ts` — for a given branch:

1. `git checkout <branch>` and rebase onto `main`
2. On a conflict in `apps/web/package.json`: **take `main`'s version** (drop the `@uicapsule/<slug>`
   line entirely — content packages are discovered from the filesystem now and must not be listed)
3. On a conflict in `pnpm-lock.yaml`: take `main`'s, then run `pnpm install` to regenerate
4. Verify: `pnpm check:content && pnpm typecheck && pnpm lint && pnpm build`
5. Report per-branch: rebased cleanly / needed manual help / failed verification

Make it **dry-run by default**, with an explicit `--push` flag. It must never force-push without that
flag.

**Verify**: run it in dry-run mode against one branch; it reports a clean rebase and green checks
without pushing anything.

### Step 3: Land a pilot batch of THREE — then stop

Rebase, verify, and open for review **three** capsules (suggest: one iOS, one Android, one AI-era, to
sample the range). For each:

- `pnpm check:content` passes (it has a `meta.json`, `package.json`, `preview.tsx`)
- `pnpm typecheck` passes **including the content package** (this only works after Plan 003)
- the preview renders at `/ui/<slug>` and holds up to the curation bar: **"state readable from motion
  alone in a ~12-second silent recording"** (`CLAUDE.md`)
- the registry item is installable: `/r/<slug>.json` reports no `@repo/*` imports and accurate deps
  (this is Plan 001's guarantee — spot-check it here)

**GATE: STOP after the pilot batch and report to the maintainer.** Do not proceed to the remaining 35
without explicit approval. The pilot is what tells you whether the process works; a bad process
applied 38 times is a bad day.

### Step 4: Run the train in batches of five

After approval, proceed 5 at a time. Between batches: `pnpm build` on `main` and a click through the
home grid and the feed.

Two things will need the maintainer per capsule and cannot be automated here:

- **Cover video** — new capsules ship without one, and 3 existing components already lack a
  `coverUrl`. `check:content` warns; the cover-recording workflow (`.claude/skills/cover-video/`) is
  a separate, human-in-the-loop job. **Decide up front**: land capsules without covers (a card with
  no cover renders the shimmer skeleton forever — confirm what it actually looks like, and fix or
  accept), or record covers as part of the merge. Do not discover this at capsule 20.
- **Curation judgment** — the maintainer decides whether each capsule clears the bar. Do not merge a
  capsule you're unsure about; queue it for their review.

### Step 5: Fix the roadmap's status markers

`plans/component-roadmap.md` marks ~42 entries `[x]`, but most of those components are **not on
`main`** — they are in these PRs. The doc conflates "built" with "shipped," which is exactly how this
backlog stayed invisible.

Add a legend and split the states: landed on `main` / open PR / not started.

**Verify**: every `[x]` in the roadmap corresponds to a directory that actually exists in `content/`
on `main`.

## Test plan

Per capsule (this **is** the test suite for this plan):

1. `pnpm check:content` — structure is valid
2. `pnpm typecheck` — the content package compiles (post-Plan-003)
3. `pnpm lint`, `pnpm build` — green
4. `/ui/<slug>` renders; the interaction works; console is clean
5. `/r/<slug>.json` — installable (no `@repo/*`, deps accurate)
6. Reduced-motion: the preview respects `prefers-reduced-motion`

Per batch:

7. The home grid renders every component; no card is stuck shimmering
8. The feed scrolls through all of them without console errors

## Done criteria

- [ ] Plans 001, 002, 003 are DONE
- [ ] `scripts/rebase-capsule-prs.ts` exists, is dry-run by default, and resolves the two known
      conflict files correctly
- [ ] The pilot batch of 3 is merged and the maintainer has approved continuing
- [ ] Each merged capsule passes all six per-capsule checks above
- [ ] `pnpm build` on `main` is green after every batch
- [ ] `plans/component-roadmap.md` distinguishes landed / in-PR / not-started
- [ ] Every `[x]` in the roadmap maps to a real directory in `content/` on `main`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- **Any of Plans 001/002/003 is not DONE.** The whole point of the gate is that merging 38 unverified
  capsules into an unverified repo is how you get a gallery full of silently-broken components.
- A capsule branch touches shared code (`apps/web/src/**`, `packages/**`) — it needs individual review.
- The pilot batch surfaces a systemic problem (e.g. every capsule fails typecheck once content is
  actually checked — plausible! nothing has ever typechecked them). Report the failure pattern; a
  systemic fix beats 38 individual ones.
- A capsule fails the curation bar in your judgment. That call is the maintainer's, not yours.
- The cover-video question isn't answered before batch 2.

## Maintenance notes

- The root cause of 39 simultaneous conflicts: long-lived branches across a structural refactor
  (`9c1dea4 refactor: inline content into fs-backed server functions` removed the per-content deps
  from `apps/web/package.json`). The lesson for next time is to land capsules continuously rather than
  batching them behind a refactor — after this train, keep the queue short.
- Once the gallery is ~66 components, two things in the audit change priority: the cover-video payload
  (Plan 004) gets ~2.3× worse, and a "saved/favorites" feature (the one thing auth could actually
  serve) starts to make sense at that catalog size.
- The strategic question this plan surfaces but does not answer: with 38 OS-grade capsules landed, the
  generic web-UI components (`sidebar`, `spreadsheet`, `filter-bar`) will look off-thesis on the front
  page — while also being the only ones a working engineer would actually install. Tiering
  ("Capsules" vs "Components", which `content-categories.ts` already supports) is the likely answer,
  but it is a positioning decision for the maintainer, not a refactor.
