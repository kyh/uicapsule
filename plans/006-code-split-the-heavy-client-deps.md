# Plan 006: Stop shipping the syntax highlighter and the zip library to everyone

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm
> the expected result before moving to the next step. If anything in the "STOP conditions" section
> occurs, stop and report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ee39414..HEAD -- "apps/web/src/app/(main)/(content)/_components/" packages/ui/src/components/code-block.tsx`
> On a mismatch with the "Current state" excerpts, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `ee39414`, 2026-07-12

## Why this matters

**There is not a single `next/dynamic` or `React.lazy` in the entire app** (verified:
`grep -rn "next/dynamic\|React.lazy" apps/web/src packages/ui/src` → 0 hits). Everything is statically
imported, so the `/ui/[slug]` route — the flagship page — ships:

- **shiki** (full bundle: core + oniguruma WASM engine + the bundled-language loader map)
- **~80 named icons** from `@icons-pack/react-simple-icons`
- **jszip**
- `@headless-tree/core` + `@headless-tree/react`
- `@remixicon/react`

…to every visitor on page load. All of it is reachable **only** behind two interactions the median
visitor never performs: clicking "View Source", and clicking download. This is dead-on-arrival
JavaScript — downloaded, parsed, and compiled before the user has clicked anything.

## Current state

`apps/web/src/app/(main)/(content)/_components/aside.tsx` is a `"use client"` module rendered
unconditionally by the feed (`content-feed.tsx:179`). It statically imports both heavy paths:

```tsx
// aside.tsx:20
import JSZip from "jszip";
// aside.tsx:32
import { CodePreview } from "./code-preview";
```

`code-preview.tsx:6-27` pulls in `@headless-tree/core`, `@headless-tree/react`, `@remixicon/react`, and
`@repo/ui/components/code-block`.

`packages/ui/src/components/code-block.tsx` is the heavyweight: a `"use client"` module importing
`codeToHtml` from the **full** `shiki` bundle, the `@shikijs/transformers` set, and ~80 icons from
`@icons-pack/react-simple-icons`.

Where they are actually used in `aside.tsx`:

- `JSZip` — only inside `handleDownloadClick` (`aside.tsx:97-136`), i.e. on a click. That handler is
  already `async`, and it already shows a `toast.loading(...)` while it works.
- `CodePreview` — only inside `<DrawerContent>` (`aside.tsx:169-181`), which already renders behind a
  `<Suspense>` with a `"Loading source files…"` fallback. **The drawer is closed by default.**

The languages actually used are enumerated in `code-preview.tsx:42-59` (`extensionToLanguageMap` — ~15:
tsx, typescript, jsx, javascript, json, css, scss, html, markdown, mdx, xml, yaml, bash).

**Conventions**: `"use client"` components live beside their route in `_components/`; kebab-case
filenames; no `any`/`as`/`!`.

## Commands you will need

| Purpose    | Command          | Expected on success                   |
| ---------- | ---------------- | ------------------------------------- |
| Typecheck  | `pnpm typecheck` | exit 0                                |
| Lint       | `pnpm lint`      | exit 0                                |
| Build      | `pnpm build`     | exit 0, prints per-route bundle sizes |
| Dev server | `pnpm dev:web`   | http://localhost:3000                 |

## Scope

**In scope**:

- `apps/web/src/app/(main)/(content)/_components/aside.tsx`
- `apps/web/src/app/(main)/(content)/_components/code-preview.tsx` (only if needed for the boundary)
- `packages/ui/src/components/code-block.tsx` (only for the optional shiki-core change in step 4)

**Out of scope**:

- The source-drawer UX (drawer, tree, copy button) — behavior identical; only _when_ the code loads
  changes.
- `content-feed.tsx` — do not restructure the feed.
- Replacing `@remixicon/react` with lucide (that is Plan 010 hygiene).

## Git workflow

- Branch: `kyh/006-code-splitting`
- Conventional commits, e.g. `perf: load the source drawer on demand`

## Steps

### Step 1: Record the baseline

Run `pnpm build` and **record** the First Load JS for `/ui/[slug]` and for `/`. You will compare
against these at the end; put both in the PR description.

**Verify**: build exits 0 and you have written the numbers down.

### Step 2: Lazy-load `JSZip` at the point of use

Delete the top-level `import JSZip from "jszip"` and load it inside the click handler:

```ts
const { default: JSZip } = await import("jszip");
```

**Verify**: `grep -n "^import JSZip" apps/web/src/app/\(main\)/\(content\)/_components/aside.tsx` → no
match. Click download in the browser → a zip still downloads with the correct files.

### Step 3: Lazy-load the source drawer

Replace the static `import { CodePreview } from "./code-preview"` with:

```ts
const CodePreview = dynamic(() => import("./code-preview").then((m) => m.CodePreview), {
  ssr: false,
});
```

(`code-preview.tsx` exports `CodePreview` as a **named** export — `next/dynamic` needs the `.then()`
mapping.) The drawer content is already wrapped in `<Suspense fallback={...}>`, so the loading state is
handled.

**Verify**: `pnpm build` → `/ui/[slug]` First Load JS drops materially versus the step-1 baseline
(expect a large drop — shiki + the icon set are the bulk). In the browser, "View Source" opens, the
tree renders, and code is highlighted.

### Step 4 (optional — only if step 3's win is insufficient): trim shiki itself

If the drawer chunk is still very large, switch `code-block.tsx` from the full `shiki` bundle to
`shiki/core` + `createHighlighterCore`, registering only the ~15 languages in `extensionToLanguageMap`
and the themes actually used.

Bigger change, more room to break highlighting. **Only do it if needed, and verify every language in
the map.**

**Verify**: open the drawer on a component with multiple file types (`content/filter-bar` has `.tsx`,
`.ts`, `.json`) and confirm each highlights.

## Test plan

No unit tests — this is a bundling change with behavioral equivalence. Gates:

1. **Bundle size** — `/ui/[slug]` First Load JS materially smaller than baseline (record before/after).
2. **Drawer works** — opens, tree renders, files highlight, copy button copies.
3. **Download works** — the zip contains the same files as before.
4. **No SSR breakage** — `pnpm build` succeeds (the `ssr: false` boundary must not break the
   `/ui/[slug]` prerender).

## Done criteria

ALL must hold:

- [ ] `grep -rn "^import JSZip" apps/web/src` → no match
- [ ] `grep -rn "next/dynamic" apps/web/src` → at least one match
- [ ] `pnpm build` exits 0 and `/ui/[slug]` First Load JS is **lower** than the step-1 baseline
- [ ] `pnpm typecheck`, `pnpm lint` exit 0
- [ ] Source drawer opens, tree renders, syntax highlighting works, copy works
- [ ] Zip download produces the same file set as before
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- `ssr: false` breaks the `/ui/[slug]` prerender or causes a hydration error.
- The route's First Load JS **doesn't drop** — the split didn't take; something else is importing
  `code-block` eagerly. Find it before proceeding.
- Syntax highlighting regresses for any language in `extensionToLanguageMap`.

## Maintenance notes

- The rule this establishes: **anything reachable only behind an interaction should be dynamically
  imported.** This is the repo's first instance; future heavy features (a diff viewer, a playground)
  should follow it.
- `@repo/ui/components/code-block` is a `"use client"` module with one consumer. If a second appears,
  re-check that it doesn't drag shiki back into a hot path.
- Reviewer should scrutinize the **build output diff**, not just the code diff — the point of this plan
  is a number.
