# Plan 005: Stop reading every component's source tree to answer questions that never look at source

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm
> the expected result before moving to the next step. If anything in the "STOP conditions" section
> occurs, stop and report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ee39414..HEAD -- apps/web/src/lib/content/content-fs.ts apps/web/src/lib/content-data.ts "apps/web/src/app/(main)/(content)/_components/aside.tsx"`
> On a mismatch with the "Current state" excerpts, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: Plan 002 (both rewrite the same functions — do 002 first)
- **Category**: perf
- **Planned at**: commit `ee39414`, 2026-07-12

## Why this matters

Three independent wastes on the data path:

1. **`readContentIndex()` reads all 29 packages' full source trees — 570 KB across 169 files — even
   when the caller only wants `meta.json`.** The feed, filters, search index, and
   `generateStaticParams` all call it and immediately _throw the sources away_. Worse,
   `readContentBySlug()` is `readContentIndex().find(...)` — so fetching **one** component's source
   reads **all** of them.
2. **The feed prefetches every component's entire source tree as you scroll past it** — ~570 KB of
   JSON the user usually never opens the drawer to see.
3. A needless sequential `await` on the `/ui/[slug]` server component.

Next's `"use cache"` absorbs the repeat cost in production, but every cold cache key — and _every_
dev-server request, where the cache is cold by design — pays an O(all-content) disk walk where an O(1)
read would do. Build time and cold-start p99 scale with total gallery size rather than with the
request. With 38 more capsules queued, that constant is about to more than double.

## Current state

`apps/web/src/lib/content/content-fs.ts` — the disk layer:

```ts
const buildComponent = async (slug: string, meta: RawMeta): Promise<ContentComponent | null> => {
  // ... base fields from meta ...
  const sourceFiles = await readSourceFiles(slug); // <-- reads the whole package
  if (!sourceFiles.some((f) => f.path === "/preview.tsx")) return null;
  return { ...base, type: "local", sourceFiles } satisfies LocalContentComponent;
};

export const readContentIndex = cache(async (): Promise<ContentComponent[]> => {
  const entries = await readdir(contentRoot, { withFileTypes: true }).catch(() => []);
  const slugs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();
  const built = await Promise.all(
    slugs.map(async (slug) => {
      const meta = await readJson<RawMeta>(join(contentRoot, slug, "meta.json"));
      if (!meta) return null;
      return buildComponent(slug, meta); // <-- ALL packages, ALL sources
    }),
  );
  return built.filter((c): c is ContentComponent => c !== null);
});

export const readContentBySlug = cache(async (slug: string): Promise<ContentComponent | null> => {
  const all = await readContentIndex(); // <-- reads all 29 to get 1
  return all.find((component) => component.slug === slug) ?? null;
});
```

`apps/web/src/lib/content-data.ts` — the `"use cache"` layer:

```ts
const toSummary = (component: ContentComponent): ContentComponentSummary => {
  /* drops sourceFiles */
};

export const getFeedList = async () => {
  "use cache";
  cacheLife("max");
  return (await readContentIndex()).map(toSummary); // sources read, then discarded
};
// getContentList (:29) and getSearchEntries (:50) do the same.

export const getSourceFiles = async (slug: string): Promise<SourceFile[] | null> => {
  "use cache";
  cacheLife("max");
  const component = await readContentBySlug(slug); // reads all 29 packages to serve 1
  if (!component || !isLocalContentComponent(component)) return null;
  return component.sourceFiles;
};
```

The scroll-time prefetch, `apps/web/src/app/(main)/(content)/_components/aside.tsx:64-67`:

```tsx
useEffect(() => {
  if (!isLocalContentComponent(contentComponent)) return;
  void queryClient.prefetchQuery(sourceFilesQuery(contentComponent.slug)); // fires per feed item
}, [contentComponent, queryClient]);
```

`sourceFilesQuery` (`aside.tsx:37-45`) fetches `/api/content/<slug>`, which returns the whole source
tree. Some are large: `content/filter-bar` ≈174 KB, `content/emerald-template` ≈68 KB.

The sequential await, `apps/web/src/app/(main)/(content)/ui/[slug]/page.tsx:29-31`:

```tsx
const { slug } = await params;
const feed = await getFeedList(); // does not depend on slug — needlessly serialized
```

**The `"use cache"` + `cacheLife("max")` design is deliberate and documented** (content only changes on
deploy; the cache is build-ID-keyed). **Keep it.** This plan changes _what gets read_, not _how it is
cached_.

## Commands you will need

| Purpose    | Command          | Expected on success   |
| ---------- | ---------------- | --------------------- |
| Typecheck  | `pnpm typecheck` | exit 0                |
| Lint       | `pnpm lint`      | exit 0                |
| Build      | `pnpm build`     | exit 0                |
| Dev server | `pnpm dev:web`   | http://localhost:3000 |

## Scope

**In scope**:

- `apps/web/src/lib/content/content-fs.ts`
- `apps/web/src/lib/content-data.ts`
- `apps/web/src/app/(main)/(content)/_components/aside.tsx` (the prefetch trigger only)
- `apps/web/src/app/(main)/(content)/ui/[slug]/page.tsx` (the sequential await only)

**Out of scope**:

- The `"use cache"` / `cacheLife` strategy.
- `apps/web/src/app/r/[slug]/route.ts` and `apps/web/src/app/api/content/[slug]/route.ts` — their
  contracts must not change. This is a pure internal refactor; the JSON they serve stays byte-identical.
- The registry builder's dependency logic (Plan 001).

## Git workflow

- Branch: `kyh/005-content-read-efficiency`
- Conventional commits, e.g. `perf: read content sources only when asked for them`

## Steps

### Step 1: Split the disk layer

In `content-fs.ts`, introduce:

- `readMetaIndex()` — walks `content/*`, parses each `meta.json`, returns `ContentComponentSummary[]`
  (no `sourceFiles`). **No source reads at all.**
- `readContentBySlug(slug)` — reads **only that package's** `meta.json` + sources. Do not route it
  through the full index.

Keep `readContentIndex()` for the one legitimate whole-set caller: `getShadcnRegistry()`.

Preserve the local/remote discrimination and the "local component must have `/preview.tsx`" rule (after
Plan 002 that rule _throws_ — keep whichever semantics are live).

**Verify**: `pnpm typecheck` → 0.

### Step 2: Point the source-less consumers at `readMetaIndex()`

In `content-data.ts`: `getFeedList`, `getContentList`, `getSearchEntries`, `getFilters` → `readMetaIndex()`.
`getSourceFiles` and `getShadcnRegistryItem` → the per-slug reader. `getShadcnRegistry` keeps the full
index. Remove `toSummary` if it becomes redundant.

**Verify — this is the load-bearing gate.** Capture hashes on `main` **before** your change, then
compare after:

```bash
curl -s localhost:3000/r/registry.json | shasum
curl -s localhost:3000/api/content/card-stack | shasum
```

They must be **identical**. A changed hash means you altered a public contract — **STOP**.

### Step 3: Prefetch source files on intent, not on scroll

Delete the mount-time `useEffect` prefetch in `aside.tsx`. Trigger
`queryClient.prefetchQuery(sourceFilesQuery(slug))` from the **drawer trigger's** `onPointerEnter` /
`onFocus` (the "View Source" `DrawerTrigger` at `aside.tsx:148-156`), and/or on first open.

The drawer content already renders inside `<Suspense>` with a "Loading source files…" fallback
(`aside.tsx:174-180`), so the worst case is a brief fallback — the correct trade against downloading
570 KB nobody asked for.

**Verify**: with DevTools → Network, scroll several feed items → **no** `/api/content/*` requests.
Hover "View Source" → exactly one. Open the drawer → source renders.

### Step 4: Parallelize the independent awaits

In `apps/web/src/app/(main)/(content)/ui/[slug]/page.tsx`:

```tsx
const [{ slug }, feed] = await Promise.all([params, getFeedList()]);
```

Check the home route too — but note its `getFilters(...)` → `getContentList(...)` pair **is** genuinely
dependent. Do not "parallelize" that one.

**Verify**: `pnpm build` → 0; `/ui/card-stack` renders.

## Test plan

If Plan 001/002 established vitest in `apps/web`, add to `content-fs.test.ts`:

1. `readMetaIndex()` returns one summary per content directory and **none carry `sourceFiles`**.
2. `readContentBySlug("card-stack")` returns that component **with** its sources.
3. The registry item for a given slug is unchanged by this refactor (snapshot).

If no harness exists, the shasum comparison in Step 2 **is** the gate — record the hashes in the PR.

## Done criteria

ALL must hold:

- [ ] `readContentBySlug` no longer calls `readContentIndex`
- [ ] `/r/registry.json` and `/api/content/<slug>` shasums are **identical** before and after
- [ ] Scrolling the feed fires zero `/api/content/*` requests; hovering "View Source" fires one
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build` all exit 0
- [ ] `/`, `/ui/<slug>`, `/r/<slug>.json`, `/api/content/<slug>` all still work
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- **Any served JSON changes** (shasum mismatch). `/r/*.json` is consumed by other people's shadcn CLIs.
- Splitting the index breaks the `"use cache"` boundary (non-serializable return, cache key collision).
- The local/remote handling gets tangled — remote components have no sources and the meta-only path
  must still produce them correctly.

## Maintenance notes

- After this, adding a capsule costs one `meta.json` read on the feed path instead of a full package
  walk. That matters: 38 more capsules are queued.
- Prefetch-on-hover is a deliberate latency/bandwidth trade. If the drawer ever feels slow to open,
  widen the trigger (prefetch on feed-item focus) — do **not** restore the scroll-time prefetch.
- Reviewer should scrutinize: that `getShadcnRegistry()` still reads every package — it is the one
  legitimate O(all-content) caller.
