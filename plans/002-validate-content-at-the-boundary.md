# Plan 002: Parse `meta.json` at the boundary so a bad component fails the build instead of vanishing

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm
> the expected result before moving to the next step. If anything in the "STOP conditions" section
> occurs, stop and report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ee39414..HEAD -- apps/web/src/lib/content/ content/timeline`
> On a mismatch with the "Current state" excerpts, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S–M
- **Risk**: LOW
- **Depends on**: none (but land before the capsule merge train — see Maintenance notes)
- **Category**: bug
- **Planned at**: commit `ee39414`, 2026-07-12

## Why this matters

Thirty hand-written `meta.json` files are the only source of truth for the gallery, and they enter the
type system through an **unchecked cast**. There is no validation anywhere. The failure mode is the
worst one available: a typo, a trailing comma, or a renamed file makes a component **silently
disappear** from the site, from `generateStaticParams`, and from the public shadcn registry — while
`pnpm build` stays green and nothing is logged.

This is not hypothetical. It has already happened: `content/timeline/meta.json` is committed, contains
only `{"name": "Timeline"}`, has no `preview.tsx` (the component was renamed to `feed` in commit
`036c44c` and the meta was left stranded), and is therefore silently dropped by `content-fs.ts:100`.
The gallery ships 28 components from 29 tracked directories and nothing anywhere says so.

The repo's own standard (`CLAUDE.md`) says: _"parse inputs at boundaries into typed structures"_ and
_"no `as` type assertions"_. This is the one place in `apps/web` that violates both — and it is the
boundary that matters most. `zod` is already a dependency of `apps/web`; it is simply unused here.

## Current state

- `apps/web/src/lib/content/content-fs.ts` — reads `content/*/meta.json` + source files from disk.
- `apps/web/src/lib/content/content-schema.ts` — **types only, 41 lines, zero runtime validation**,
  despite its name.
- `apps/web/src/lib/content-data.ts` — `"use cache"` wrappers around the above.
- `content/timeline/` — the stranded directory (only `meta.json`, no preview).

The unchecked cast, `apps/web/src/lib/content/content-fs.ts:33-39`:

```ts
const readJson = async <T>(path: string): Promise<T | null> => {
  try {
    return JSON.parse(await readFile(path, "utf-8")) as T; // <-- no validation, banned `as`
  } catch {
    return null; // <-- malformed == missing
  }
};
```

The silent drops, `apps/web/src/lib/content/content-fs.ts:95-120` (abridged):

```ts
const buildComponent = async (slug: string, meta: RawMeta): Promise<ContentComponent | null> => {
  // ... base fields copied from meta ...
  const sourceFiles = await readSourceFiles(slug);
  if (!sourceFiles.some((f) => f.path === "/preview.tsx")) return null; // <-- silent drop #1
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
      if (!meta) return null; // <-- silent drop #2
      return buildComponent(slug, meta);
    }),
  );
  return built.filter((c): c is ContentComponent => c !== null); // <-- drops disappear here
});
```

The existing types to mirror, `apps/web/src/lib/content/content-schema.ts:1-33`:

```ts
export type DefaultSize = "full" | "md" | "sm";

export type ContentComponentBase = {
  slug: string;
  type: "local" | "remote";
  name: string;
  description?: string;
  defaultSize?: DefaultSize;
  coverUrl?: string;
  coverType?: "image" | "video";
  category?: "marketing" | "application" | "mobile";
  tags?: string[];
  authors?: { name: string; url: string; avatarUrl: string }[];
  asSeenOn?: { name: string; url: string; avatarUrl: string }[];
};

export type LocalContentComponent = ContentComponentBase & {
  type: "local";
  sourceFiles: SourceFile[];
};
export type RemoteContentComponent = ContentComponentBase & {
  type: "remote";
  iframeUrl: string;
  sourceUrl: string;
};
export type ContentComponent = LocalContentComponent | RemoteContentComponent;
```

**Critical invariant to preserve**: `content/line-chart` is `"type": "remote"` and legitimately has
**no `preview.tsx`**. Remote components must keep validating without one. Only _local_ components
require a preview. (`type` defaults to `"local"` when absent — see `content-fs.ts:73`.)

**Conventions**: no `any`, no `!`, no `as`. `ContentComponent` is already a discriminated union on
`type` — keep it, and derive the TS types from the zod schema with `z.infer` so there is exactly one
definition.

## Commands you will need

| Purpose              | Command                                                                                                                                               | Expected on success   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Install              | `pnpm install`                                                                                                                                        | exit 0                |
| Typecheck            | `pnpm typecheck`                                                                                                                                      | exit 0                |
| Lint                 | `pnpm lint`                                                                                                                                           | exit 0                |
| Build                | `pnpm build`                                                                                                                                          | exit 0                |
| Dev server           | `pnpm dev:web`                                                                                                                                        | http://localhost:3000 |
| Count registry items | `curl -s localhost:3000/r/registry.json \| node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).items.length))"` | a number              |

## Scope

**In scope**:

- `apps/web/src/lib/content/content-schema.ts` (add the zod schema; derive types from it)
- `apps/web/src/lib/content/content-fs.ts` (parse instead of cast; fail loudly)
- `content/timeline/` (delete — step 4)
- `scripts/check-content.ts` (create)
- root `package.json` (add `check:content`)
- `apps/web/src/lib/content/content-fs.test.ts` (extend if Plan 001 created it; else create)

**Out of scope**:

- `apps/web/src/lib/content-data.ts` — the `"use cache"` layer is correct; do not move caching around.
- The registry builder's dependency logic — that is Plan 001. If both are queued, 001 lands first.
- The other 28 `meta.json` contents — **unless** the new validator rejects one, in which case fix it
  minimally to satisfy the schema (do not redesign it).

## Git workflow

- Branch: `kyh/002-content-validation`
- Conventional commits (`fix:`, `feat:`, `chore:`)

## Steps

### Step 1: Write the zod schema and derive the types from it

Add `contentMetaSchema` to `content-schema.ts` as a **discriminated union on `type`**, defaulting to
`"local"` when absent:

- common: `name` (non-empty string, **required**); optional `description`, `defaultSize`
  (`"full" | "md" | "sm"`), `coverUrl` (url), `coverType` (`"image" | "video"`), `category`, `tags`
  (string[]), `authors` / `asSeenOn` (arrays of `{ name, url, avatarUrl }`)
- `local`: nothing extra
- `remote`: `iframeUrl` and `sourceUrl`, both **required** urls

Then replace the hand-written types with `z.infer` equivalents. **Keep every exported name identical**
(`ContentComponentBase`, `LocalContentComponent`, `RemoteContentComponent`, `ContentComponent`,
`SourceFile`, and the two type guards) — lots of code imports them and this plan must not churn those
call sites.

**Verify**: `pnpm typecheck` → exit 0 (no consumer should break).

### Step 2: Parse at the boundary and fail loudly

Replace `readJson`'s `as T` with a `safeParse` against `contentMetaSchema`. On failure, **throw**,
naming the slug, the file path, and the zod issues.

Throwing is safe and correct here: `readContentIndex` runs at build time and inside `"use cache"`
server functions — never on user input (slugs come from directory enumeration, not the URL). A
malformed `meta.json` _should_ break the build loudly.

Fix the second silent drop too: when a **local** component has no `/preview.tsx` (`content-fs.ts:100`),
throw instead of returning `null`, naming the slug. Remote components skip that check.

Keep tolerance for a genuinely absent `package.json` (`readContentPackageJson` returning `{}` is
intentional).

**Verify**: `pnpm dev:web` now **fails** with an error naming `timeline`. That failure is the proof the
fix works; step 4 resolves it.

### Step 3: Add `scripts/check-content.ts` + a `check:content` script

A standalone script (run with `tsx`, already a root devDependency — see how `new:content` is wired in
root `package.json`) that walks `content/*` and asserts, per directory:

- `meta.json` exists and passes `contentMetaSchema`
- `package.json` exists
- if local (or `type` absent): `preview.tsx` exists
- `coverUrl` present (**warn**, don't fail — 3 components currently lack one)

It must **exit non-zero** with a per-slug list of problems. Add
`"check:content": "tsx scripts/check-content.ts"` to root `package.json`.

**Verify**: `pnpm check:content` exits non-zero and names `timeline` before step 4; exits 0 after.

### Step 4: Delete the stranded `content/timeline`

Dead since its component was renamed to `content/feed` (commit `036c44c`); only the meta stub remains,
and it has been invisible on the site ever since. `git rm -r content/timeline`.

Note: `content/voxel-landing/` may exist **on disk** but is NOT tracked by git (stale `node_modules`
only; the real component is in open PR #68). Do not `git rm` it; leave it alone.

**Verify**: `git status` shows only `content/timeline` deleted; `pnpm check:content` exits 0.

### Step 5: Confirm nothing else was lost

Record the registry item count on `main` **before** your change, then compare after.

**Verify**: the count does **not decrease** (other than `timeline`, which never appeared anyway), and
the home page renders the same number of cards as before.

## Test plan

Extend `apps/web/src/lib/content/content-fs.test.ts` (created in Plan 001; if 001 hasn't run, create it
and add `vitest` + a `"test": "vitest run"` script to `apps/web`):

1. **Every `content/*` directory produces a component** — `readContentIndex()` returns one entry per
   tracked content directory. _This is the test that would have caught `timeline`._
2. **Invalid meta is rejected** — a meta missing `name`, and one with `type: "remote"` but no
   `iframeUrl`, both fail `safeParse`.
3. **Remote components validate without a preview** — a `type: "remote"` meta passes.

Verification: `pnpm -F @repo/web test` → all pass.

## Done criteria

ALL must hold:

- [ ] `grep -n "as T" apps/web/src/lib/content/content-fs.ts` → no matches
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build` all exit 0
- [ ] `pnpm check:content` exits 0
- [ ] `pnpm -F @repo/web test` passes, including "every content dir produces a component"
- [ ] `content/timeline/` no longer exists
- [ ] The registry serves the same number of items as before (no component lost)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Validation rejects a `meta.json` other than `timeline`'s. Report which slug and field — that is a
  real content bug and the maintainer should see the list before you "fix" it.
- The number of components served **decreases** after your change (validation is too strict).
- Throwing at the `"use cache"` boundary breaks the Next.js build in a way that isn't a legitimate
  content error (e.g. it breaks `generateStaticParams` even with valid content).
- Deriving types from zod causes cascading type errors across more than ~10 call sites — the schema
  shape is wrong; stop rather than casting your way out.

## Maintenance notes

- **Land this before the capsule merge train (Plan 012).** 38 finished capsules are queued. Merging in
  batches without this validator makes "component silently absent from the gallery" the default
  failure mode exactly when throughput goes up.
- Wire `pnpm check:content` into the CI workflow that Plan 003 creates.
- Future change to watch: a new `meta.json` field must be added to `contentMetaSchema` or it will be
  rejected. That is the intended tradeoff — the schema is now the contract.
- Reviewer should scrutinize: the local/remote discrimination (remote has no preview and that must
  stay legal), and that no previously-live component got validated out of existence.
