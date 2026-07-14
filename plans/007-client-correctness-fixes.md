# Plan 007: Fix three client bugs — wrong source code, double-fired callbacks, broken avatars

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm
> the expected result before moving to the next step. If anything in the "STOP conditions" section
> occurs, stop and report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ee39414..HEAD -- packages/ui/src/components/code-block.tsx packages/ui/src/hooks/use-controllable-state.ts "apps/web/src/app/(main)/(content)/_components/aside.tsx"`
> On a mismatch with the "Current state" excerpts, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `ee39414`, 2026-07-12

## Why this matters

Three independent, individually-small bugs, all confirmed by reading the code. The first is
user-visible on the site's core feature (the source drawer), which is why this is P2 and not P3.

1. **The source drawer can show the wrong file's code.** The shiki highlight effect has no
   cancellation and never clears stale HTML, so clicking file A then file B renders A's code under B's
   name until B resolves — and if A (a big file) resolves _after_ B, A's HTML latches permanently while
   B is selected.
2. **`useControllableState` calls `onChange` from inside a `setState` updater**, which React treats as
   pure and may invoke more than once (StrictMode double-invoke, concurrent re-render). Any consumer
   firing analytics/mutations from `onChange` double-fires. Note: `docs/quality/react-doctor.md` records
   this file as "fixed" — the fix for the _previous_ bug introduced this one, so the ledger is stale.
3. **Author avatars render the profile URL as the image `src`**, not the avatar URL. The schema has an
   `avatarUrl` field the app never reads. Latent today (no `meta.json` populates `authors`), but it
   fires the first time a contributor is credited — which is exactly what the project wants to start
   doing with 38 capsule PRs queued.

## Current state

### Bug 1 — `packages/ui/src/components/code-block.tsx:479-491`

```tsx
const [html, setHtml] = useState<string | null>(null);
useEffect(() => {
  if (!syntaxHighlighting) {
    return;
  }
  highlight(children as string, language, themes)
    .then(setHtml) // <-- no cancellation, no reset
    .catch(console.error); // <-- swallows failures
}, [children, themes, syntaxHighlighting, language]);
if (!(syntaxHighlighting && html)) {
  return <CodeBlockFallback>{children}</CodeBlockFallback>; // <-- only when html is null
}
```

The consumer keeps one instance alive across file switches:
`apps/web/src/app/(main)/(content)/_components/code-preview.tsx:266-274` keys `CodeBlockItem` by
`item.language`, so selecting two different `.tsx` files reuses the same `CodeBlockContent` and only
`children` changes.

### Bug 2 — `packages/ui/src/hooks/use-controllable-state.ts:26-38`

```ts
const setValue = useCallback((next: T) => {
  const current = currentRef.current;
  if (current.prop !== undefined) {
    if (next !== current.prop) current.onChange?.(next);
    return;
  }

  setUncontrolled((previous) => {
    if (next !== previous) current.onChange?.(next); // <-- side effect inside a pure updater
    return next;
  });
}, []);
```

### Bug 3 — `apps/web/src/app/(main)/(content)/_components/aside.tsx:276-286`

```tsx
{
  contentComponent.authors.map((author) => (
    <a href={author.url} key={author.name} target="_blank">
      <Avatar>
        <AvatarImage src={author.url} /> {/* <-- profile link, not an image */}
        <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
      </Avatar>
    </a>
  ));
}
```

The schema (`apps/web/src/lib/content/content-schema.ts:13-14`) defines
`authors?: { name: string; url: string; avatarUrl: string }[]` and the same shape for `asSeenOn`.
`avatarUrl` is never read anywhere (`grep -rn "avatarUrl" apps/web/src` → schema only).

**Conventions**: no `any`/`as`/`!`; hooks in `packages/ui/src/hooks/`; components are thin Base UI
wrappers.

## Commands you will need

| Purpose    | Command          | Expected on success   |
| ---------- | ---------------- | --------------------- |
| Typecheck  | `pnpm typecheck` | exit 0                |
| Lint       | `pnpm lint`      | exit 0                |
| Dev server | `pnpm dev:web`   | http://localhost:3000 |

## Scope

**In scope**:

- `packages/ui/src/components/code-block.tsx` (the highlight effect only)
- `packages/ui/src/hooks/use-controllable-state.ts`
- `apps/web/src/app/(main)/(content)/_components/aside.tsx` (the authors/asSeenOn rendering only)
- `docs/quality/react-doctor.md` (correct the stale "fixed" entry)

**Out of scope**:

- The rest of `code-block.tsx` (499 lines) — big but cohesive; do not refactor it.
- The `as string` on `children` at `code-block.tsx:483` — pre-existing and tangled with the component's
  public API. Note it; don't fix it here.
- The source-drawer UX, file tree, copy button.

## Git workflow

- Branch: `kyh/007-client-correctness`
- **One commit per bug** — they are independent and should be revertable separately.

## Steps

### Step 1: Make the highlight effect cancellable and non-stale

Rewrite the effect so it resets `html` on every input change (so the fallback — plain unhighlighted
code — shows immediately rather than the _previous file's_ HTML) and ignores resolutions from
superseded runs:

```tsx
useEffect(() => {
  if (!syntaxHighlighting) return;
  let cancelled = false;
  setHtml(null);
  highlight(children as string, language, themes)
    .then((result) => {
      if (!cancelled) setHtml(result);
    })
    .catch((error) => {
      if (!cancelled) console.error(error);
    });
  return () => {
    cancelled = true;
  };
}, [children, themes, syntaxHighlighting, language]);
```

**Verify**: `pnpm dev:web` → `/ui/filter-bar` → "View Source". Click rapidly between a large file and a
small one. **Expected**: the pane never shows one file's content under another file's name; worst case
it briefly shows unhighlighted plain text.

### Step 2: Move the side effect out of the state updater

In `use-controllable-state.ts`, compute the previous value **outside** the updater, call `onChange`
there, then call `setUncontrolled(next)` plainly. The current value is already derivable in the hook's
scope (the returned `value` is `prop ?? uncontrolled`).

Keep the `currentRef` pattern for holding the latest `onChange` — that part is correct and was the
point of the earlier fix.

**Verify**: `pnpm typecheck` → 0. The copy button in the source drawer (`code-block.tsx:293-297` is a
consumer) still toggles correctly.

### Step 3: Render the avatar from `avatarUrl`

Change `<AvatarImage src={author.url} />` → `<AvatarImage src={author.avatarUrl} />`. Do the same for
`asSeenOn` if it renders avatars (it currently renders text links only — prefer rendering the avatar
for consistency).

To verify a currently-latent path: temporarily add an `authors` entry to one `content/*/meta.json`
locally, confirm the avatar image loads, then **revert that meta change** (it is out of scope to commit).

**Verify**: with the temporary entry, the avatar renders the image (not a broken image / initial-letter
fallback). Then `git checkout content/<slug>/meta.json`.

### Step 4: Correct the stale triage note

`docs/quality/react-doctor.md` records items 055–057 on `use-controllable-state.ts` as **fixed**. After
step 2 that is true again — add a one-line note that the original fix introduced an impure-updater
regression, corrected here. A quality ledger that claims "fixed" about code that later regressed is
worse than one that says nothing.

**Verify**: the doc mentions the regression and its resolution.

## Test plan

No test harness exists in `packages/ui` (its `"test"` script is dead — Plan 003 removes it). **Do not
stand up vitest in `packages/ui` for this plan.**

Manual verification, specific:

1. **Bug 1** — rapid file-switching in the drawer never shows mismatched code.
2. **Bug 2** — the copy button still works; no double-toggle.
3. **Bug 3** — an author with an `avatarUrl` renders their avatar image.

If Plan 001/002 already introduced vitest into `apps/web`, a unit test for `useControllableState`'s
single-`onChange`-per-change behavior would be welcome but is not required.

## Done criteria

ALL must hold:

- [ ] `code-block.tsx`'s highlight effect has a cleanup that cancels superseded runs and resets `html`
- [ ] `use-controllable-state.ts` calls `onChange` **outside** `setUncontrolled`'s updater
- [ ] `grep -n "AvatarImage src={author.url}" apps/web/src` → no match
- [ ] `pnpm typecheck`, `pnpm lint` exit 0 (no new warnings)
- [ ] Rapid file-switching in the source drawer shows no mismatched code
- [ ] `docs/quality/react-doctor.md` no longer claims a clean bill for the regressed hook
- [ ] No files outside the in-scope list are modified (`git status` — in particular, **no `content/*/meta.json` left changed**)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Resetting `html` to `null` causes a visible flash that looks worse than the bug (it shouldn't — the
  fallback is the same monospaced code, unhighlighted — but if it does, report rather than reverting to
  the stale-HTML behavior).
- `useControllableState`'s consumers regress in **controlled** mode — the hook serves both controlled
  and uncontrolled callers, and the fix must not break either.
- You cannot verify bug 3 without committing a `meta.json` change.

## Maintenance notes

- Bug 1's root cause is a general pattern: any `useEffect` that kicks off an async fetch and setStates
  the result needs a cancellation flag. There is no other instance in the repo today — keep it that way.
- Bug 3 becomes user-visible the moment the project credits contributors (it wants to: the schema has
  multi-author support and `asSeenOn`, and 38 capsule PRs are queued). Landing this before the merge
  train means credits work the first time.
- Reviewer should scrutinize: that `use-controllable-state` still behaves in **controlled** mode (the
  `prop !== undefined` branch) — the easy thing to break while fixing the uncontrolled path.
