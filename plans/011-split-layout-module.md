# Plan 011: Split `layout.tsx` — 854 lines, four unrelated features, one dead export

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If anything
> in the "STOP conditions" section occurs, stop and report — do not improvise. When
> done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ee39414..HEAD -- apps/web/src/components/layout.tsx apps/web/src/components/header.tsx apps/web/src/app/\(main\)/\(app\)/layout.tsx`
> On a mismatch with the "Current state" excerpts, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW-MED (pure motion, but it touches the app shell — a mistake is visible everywhere)
- **Depends on**: none. Do this **after** the higher-priority plans; it is a refactor, not a fix.
- **Category**: tech-debt
- **Planned at**: commit `ee39414`, 2026-07-12

## Why this matters

`apps/web/src/components/layout.tsx` is 854 lines containing **four unrelated features** that change
for four different reasons — a search-ranking tweak, a theme-toggle change, and a footer-link edit all
land in the same client module:

- `AnimateHeight` (`:94`) — a generic motion primitive; nothing to do with layout
- `HeaderNav` (`:115`) — a 22-line 3-column shell
- `SearchButton` (`:139-499`) — **360 lines**: the ⌘K command palette, 8 `useMemo`s, and **three
  near-identical filter pipelines** (`categoryMatches` `:247`, `sectionMatches` `:260`,
  `styleMatches` `:274` — the same ~12-line function over three different arrays). All the
  suggestion-building logic is _pure_ and currently unreachable except through a rendered React tree.
- `ProfileButton` (`:501-788`) — **288 lines**: auth session, sign-out, theme switcher. Exported, but
  **nothing outside this file imports it** (its only use is at `:133`, in the same module). The
  `export` is noise.
- `Footer` / `FooterLink` / `FooterIcon` (`:790-855`) — inline SVGs and links; zero overlap with the header

Two modules import from it — `header.tsx` (wants `HeaderNav`) and `(main)/(app)/layout.tsx` (wants
`Footer`) — and each drags the whole thing (auth client, `next-themes`, `cmdk`, the motion trees) into
its client boundary.

This is the one file in the repo where a split clearly pays for itself. (For contrast: `code-block.tsx`
is 499 lines but is one cohesive concern with one consumer — leave it alone.)

## Current state

The module's exported surface and its real consumers:

```bash
grep -rn "from \"@/components/layout\"" apps/web/src
# apps/web/src/components/header.tsx:1        -> HeaderNav
# apps/web/src/app/(main)/(app)/layout.tsx:3  -> Footer
```

The three duplicated filter pipelines (`layout.tsx:247-289`, abridged) — same shape, three arrays:

```tsx
const categoryMatches = useMemo(() => {
  if (!hasQuery) return [];
  return categories.filter(
    (category) =>
      category.name.toLowerCase().includes(normalizedQuery) ||
      category.slug.includes(normalizedQuery),
  );
}, [categories, hasQuery, normalizedQuery]);
// sectionMatches (:260) and styleMatches (:274) are the same function over `sections` / `styles`
```

The fragile spot to leave alone — the mobile drawer clones the menu item's link element
(`layout.tsx:783`):

```tsx
cloneElement(item.link, {}, item.body);
```

`AnimateHeight` (`:94-107`) was recently converted to Motion's `layout` prop (FLIP) — do not rewrite
its animation while moving it.

**Conventions**: kebab-case filenames; `"use client"` at the top of client modules; components in
`apps/web/src/components/`; no `any`/`as`/`!`.

## Commands you will need

| Purpose    | Command          | Expected on success   |
| ---------- | ---------------- | --------------------- |
| Typecheck  | `pnpm typecheck` | exit 0                |
| Lint       | `pnpm lint`      | exit 0                |
| Build      | `pnpm build`     | exit 0                |
| Dev server | `pnpm dev:web`   | http://localhost:3000 |

## Scope

**In scope**:

- `apps/web/src/components/layout.tsx` (split it; the file may end up deleted)
- New: `apps/web/src/components/search-command.tsx`, `apps/web/src/components/profile-menu.tsx`,
  `apps/web/src/components/footer.tsx`, `apps/web/src/components/header-nav.tsx`,
  `apps/web/src/components/animate-height.tsx`
- New: `apps/web/src/lib/search-suggestions.ts` (the pure suggestion-building logic)
- `apps/web/src/components/header.tsx` and `apps/web/src/app/(main)/(app)/layout.tsx` (update imports)

**Out of scope**:

- **Any behavior change.** This is a pure move. Same rendering, same interactions, same animations.
- The `cloneElement` mobile-drawer mechanism (`layout.tsx:783`) — fragile; move it verbatim.
- `packages/ui` — do not relocate anything into the UI library.
- The search _ranking_ logic itself — consolidate the three duplicated filters into one helper, but
  do not change what they return.

## Git workflow

- Branch: `kyh/011-split-layout`
- One commit per extracted module, so each move is independently revertable and bisectable.

## Steps

### Step 1: Capture the "before" behavior

With `pnpm dev:web`, exercise and note: ⌘K opens search; typing filters components/categories/
sections/styles; results panel animates its height; profile menu opens (desktop dropdown **and**
mobile drawer); theme switcher works; sign-out works; footer links render and the active link is
highlighted.

You will re-run this exact list in step 6.

**Verify**: all of the above work on `main` before you touch anything.

### Step 2: Extract the leaf modules (no logic changes)

Move, verbatim:

- `AnimateHeight` → `animate-height.tsx`
- `Footer` + `FooterLink` + `FooterIcon` → `footer.tsx`
- `HeaderNav` → `header-nav.tsx`

Update the two importers (`header.tsx`, `(main)/(app)/layout.tsx`).

Note the smell in `FooterLink` (`:834`): it calls `usePathname()` inline inside a `className`
expression. Move it verbatim; you may hoist the hook call to the top of the component (that is a
correctness-neutral tidy), but do not change what it computes.

**Verify**: `pnpm typecheck` → 0; `pnpm build` → 0; footer and header still render.

### Step 3: Extract the profile menu and drop its dead export

Move `ProfileButton` → `profile-menu.tsx`. It is currently `export const ProfileButton` but is only
used inside `layout.tsx` — after the move it is imported by `header-nav.tsx`, so it stays exported,
but confirm nothing else was relying on the old path.

Move the `cloneElement` drawer mechanism **verbatim**.

**Verify**: profile dropdown (desktop) and drawer (mobile — resize the window) both open; theme
switch and sign-out work.

### Step 4: Extract the search palette and lift its pure logic

Move `SearchButton` → `search-command.tsx`.

Then extract the pure suggestion-building into `apps/web/src/lib/search-suggestions.ts`:

- collapse the three near-identical `*Matches` memos into **one** generic helper (e.g.
  `matchByNameOrSlug(items, query)`) used for categories, sections, and styles
- export a `buildSuggestions(...)` that takes the search entries + filter lists + query and returns
  `SearchSuggestion[]`

This is the one place the plan adds value beyond moving files: the ranking logic becomes reachable
without rendering a React tree (i.e. testable), and the duplication that would drift is gone.

**The returned suggestions must be identical to today's** — same items, same order, same limits
(`SEARCH_RESULT_LIMIT`, `TRENDING_LIMIT`).

**Verify**: type the same queries as in step 1 and confirm identical results and ordering. In
particular: an empty query shows trending; a query matching a component, a category, a section, and a
style shows all four kinds with the same grouping as before.

### Step 5: Delete the husk

If `layout.tsx` is now empty, delete it. If anything remains, it belongs in one of the new modules —
figure out which.

**Verify**: `grep -rn "components/layout" apps/web/src` → no matches.

### Step 6: Re-run the step-1 checklist

Every item must behave identically.

**Verify**: all pass; `pnpm build` → 0.

## Test plan

The extraction of `search-suggestions.ts` creates the first genuinely unit-testable logic in the app
shell. If a vitest harness exists in `apps/web` (Plans 001/002 add one), write:

1. `buildSuggestions` with an empty query → returns trending, capped at `TRENDING_LIMIT`.
2. A query matching a component name → that component appears, kind `component`.
3. A query matching a category slug → appears with kind `category`.
4. Result count never exceeds `SEARCH_RESULT_LIMIT`.

If no harness exists, do not stand one up for this plan — the step-1/step-6 manual checklist is the
gate.

## Done criteria

ALL must hold:

- [ ] `apps/web/src/components/layout.tsx` no longer exists (or is a thin re-export with a stated reason)
- [ ] `grep -rn "components/layout\"" apps/web/src` → no matches
- [ ] No new file exceeds ~350 lines
- [ ] Search returns **identical** results/ordering for the queries checked in step 1
- [ ] The three duplicated `*Matches` memos are consolidated into one helper
- [ ] Profile dropdown, mobile drawer, theme switch, sign-out, footer links all work
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build` all exit 0
- [ ] No behavior or styling changed (this is a move, not a redesign)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Search results differ in **content or order** after the consolidation. The three filters look
  identical but one may have a subtle difference — if so, keep them separate rather than forcing a
  false abstraction, and say so.
- The mobile drawer's `cloneElement` breaks after the move. Do not rewrite it to "fix" it — report.
- Splitting the module changes the client-bundle boundary in a way that _increases_ First Load JS
  (check `pnpm build` output before/after; the split should reduce or hold it, since `header.tsx` no
  longer drags in the profile/auth tree).
- You find yourself changing styling or markup "while you're in there." That is out of scope.

## Maintenance notes

- The reason this file is worth splitting and `code-block.tsx` (499 lines) is not: cohesion. This one
  had four reasons to change; that one has one.
- After the split, `header.tsx` should no longer pull the auth client and `cmdk` into its boundary
  unless it actually renders them — worth a glance at the build output.
- `search-suggestions.ts` is now the natural home for any future search improvement (fuzzy matching,
  weighting, recency). That was the point.
- Reviewer should scrutinize: search result parity (the easiest thing to silently break), and that
  no styling drifted during the move.
