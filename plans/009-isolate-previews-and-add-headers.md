# Plan 009: Sandbox the preview iframes and ship response-hardening headers

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm
> the expected result before moving to the next step. If anything in the "STOP conditions" section
> occurs, stop and report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ee39414..HEAD -- apps/web/next.config.js apps/web/src/components/media-reveal.tsx "apps/web/src/app/(main)/(content)/_components/content-feed.tsx"`
> On a mismatch with the "Current state" excerpts, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (a sandbox flag or strict CSP can break previews — roll out report-only first)
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `ee39414`, 2026-07-12

## Why this matters

The product renders code in an iframe. That is the whole model — and the isolation boundary is
currently **absent**:

- The preview iframe has **no `sandbox`**, no `referrerpolicy`, no `allow` attribute, and it is
  **same-origin** (`/preview-frame/<slug>`). Preview code therefore runs as first-party JavaScript on
  the site's origin: it can reach `window.parent`, read the DOM, read non-`HttpOnly` storage, and issue
  same-origin authenticated requests to `/api/trpc` and `/api/auth/**` with the user's session cookie
  attached.
- The app sends **no CSP at all** — `next.config.js` has no `headers()` function. No `frame-ancestors`
  (so the login and password-update pages can be framed by anyone → clickjacking), no `connect-src`, no
  `script-src`, no `nosniff`, no `Referrer-Policy`.
- One content component (`line-chart`) is `type: "remote"` and embeds an **arbitrary external origin**
  through that same unsandboxed iframe, with unrestricted top-level navigation.

**Honest severity today**: every local component is authored by the maintainer, so nobody hostile is
inside the frame — this is latent, not actively exploited. But it becomes acute the moment outside
contributions land, and **38 capsule PRs are queued**. The boundary should exist before the code you
didn't write does.

## Current state

The one iframe in the app, `apps/web/src/components/media-reveal.tsx:141-148`:

```tsx
{
  iframe && (
    <iframe
      className="bg-background absolute inset-0 h-full w-full"
      title={iframe.title}
      src={iframe.src}
      onLoad={() => setRevealed(true)}
    />
  );
}
```

(`pnpm lint` already flags this: `react(iframe-missing-sandbox)`.)

Its `src`, from `apps/web/src/app/(main)/(content)/_components/content-feed.tsx:208-210`:

```tsx
const src = isRemoteContentComponent(component)
  ? component.iframeUrl // <-- arbitrary external origin
  : `/preview-frame/${component.slug}`; // <-- SAME ORIGIN
```

`apps/web/next.config.js` — the config has `cacheComponents`, `experimental`, `pageExtensions`,
`transpilePackages`, `images`, `typescript`. **There is no `headers()` function.**

One complication for a strict CSP: `content-feed.tsx:172-178` injects an inline `<script>` via
`dangerouslySetInnerHTML` (it scrolls the deep-linked item into place before first paint). The script
body is a **static literal** and the slug is passed through a React-escaped `data-` attribute, so it is
**not** an injection sink — but it _will_ be blocked by a nonce-less `script-src`, so the CSP work must
account for it.

**Conventions**: Next config is plain JS with JSDoc types (`/** @type {import("next").NextConfig} */`).
`getRemotePatterns()` at `next.config.js:26` already reads the Supabase host from
`NEXT_PUBLIC_SUPABASE_URL` and guards for its absence — match that behavior.

## Commands you will need

| Purpose         | Command                                                                            | Expected on success                           |
| --------------- | ---------------------------------------------------------------------------------- | --------------------------------------------- |
| Typecheck       | `pnpm typecheck`                                                                   | exit 0                                        |
| Lint            | `pnpm lint`                                                                        | exit 0 — and `iframe-missing-sandbox` is gone |
| Build           | `pnpm build`                                                                       | exit 0                                        |
| Dev server      | `pnpm dev:web`                                                                     | http://localhost:3000                         |
| Inspect headers | `curl -sI localhost:3000/ \| grep -i "content-security\|x-content-type\|referrer"` | the new headers                               |

## Scope

**In scope**:

- `apps/web/next.config.js` (add `headers()`)
- `apps/web/src/components/media-reveal.tsx` (iframe attributes)
- `apps/web/src/lib/content/content-schema.ts` (allowlist validation for `iframeUrl` — step 3)

**Out of scope**:

- Moving `/preview-frame/*` to a **separate origin**. That is the structurally correct fix and it is a
  bigger change (separate Vercel domain/project, asset CORS, cross-origin messaging). Note as follow-up;
  do not attempt here.
- The `dangerouslySetInnerHTML` scroll script's logic — not a sink; only make it CSP-aware.
- `content/*` components themselves.

## Git workflow

- Branch: `kyh/009-preview-isolation`
- Conventional commits, e.g. `fix: sandbox preview iframes`

## Steps

### Step 1: Sandbox the iframe

Add to the `<iframe>`:

- `sandbox="allow-scripts allow-pointer-lock"` — **deliberately without `allow-same-origin`**, which
  gives the frame an opaque origin so it cannot reach the parent or use the session cookie. Also without
  `allow-top-navigation`, so a preview cannot frame-bust.
- `referrerPolicy="no-referrer"`
- `loading="lazy"` (free win — the feed mounts several)

**This is the step most likely to break something.** Previews relying on same-origin behavior
(localStorage, cookies, `postMessage` with the parent, credentialed asset fetches) will stop working
under an opaque origin.

**Verify**: walk the **entire** feed (all 28 components) from `/ui/ascii-renderer`, scrolling through
every item. Each preview must render and animate with a clean console. Pay special attention to
WebGL/canvas components (`ascii-renderer`, `background-pixel-stars`, the orbs), audio, and storage.

Record any component that breaks. **If one does, STOP and report** — do not add `allow-same-origin` back
to make it pass; that defeats the entire fix.

### Step 2: Add response-hardening headers, CSP report-only first

Add a `headers()` function to `next.config.js` returning, for all routes:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy-Report-Only: …` — **report-only to start.** At minimum: `default-src 'self'`,
  `frame-ancestors 'self'`, `img-src 'self' data: <supabase host>`, **`media-src 'self' <supabase host>`**
  (cover videos come from Supabase — derive the host from `NEXT_PUBLIC_SUPABASE_URL` exactly as
  `getRemotePatterns()` does), `connect-src 'self' <supabase host>`, `frame-src 'self' <remote iframe host(s)>`.

Leave it **report-only** in this plan. Enforcing requires resolving the inline script (step 4) and
watching violations across all 28 previews — that is the follow-up.

**Verify**: `curl -sI localhost:3000/ | grep -i "content-security-policy-report-only\|x-content-type-options\|referrer-policy"`
→ all three present. The site still works (report-only cannot break anything).

### Step 3: Constrain `iframeUrl` for remote components

A `type: "remote"` component embeds an arbitrary URL from a `meta.json` field. Require `https:` and an
explicit host allowlist (today: the host used by `content/line-chart`).

If Plan 002 has landed, put this in the zod schema (`contentMetaSchema`) so a bad `iframeUrl` fails the
build. If not, add a narrow runtime check in `content-fs.ts`'s remote branch (`content-fs.ts:85-93`) and
note that it should move into the schema later.

**Verify**: `/ui/line-chart` still renders. A remote meta pointing at an off-allowlist host fails (test
by temporarily editing `content/line-chart/meta.json`, then **revert it**).

### Step 4: Make the inline scroll script CSP-ready (preparation, not enforcement)

Add a comment at `content-feed.tsx:165-171` (where the script's rationale is already documented) noting
that this inline script is the one blocker to enforcing a nonce-less `script-src`, and that enforcement
requires either a nonce (Next middleware) or moving the logic to an external script.

**Do not rip the script out** — it exists for a good reason (it scrolls the deep-linked feed item into
place before first paint, avoiding a flash of item 0).

**Verify**: the comment exists and names the constraint.

## Test plan

No automated tests (no browser harness). The sweep must be exhaustive, because step 1 can break previews
individually:

1. **All 28 previews render under sandbox**; console clean.
2. **The home grid still renders** (same `MediaReveal`, video/image path — confirm no regression).
3. **Headers present** via `curl -sI`.
4. **`/ui/line-chart`** (the one remote component) still renders.
5. `pnpm lint` no longer emits `iframe-missing-sandbox`.

## Done criteria

ALL must hold:

- [ ] `grep -n "sandbox=" apps/web/src/components/media-reveal.tsx` → matches, and **does not** contain
      `allow-same-origin`
- [ ] `pnpm lint` exits 0 with no `iframe-missing-sandbox` warning
- [ ] `curl -sI localhost:3000/` returns `X-Content-Type-Options`, `Referrer-Policy`, and
      `Content-Security-Policy-Report-Only`
- [ ] All 28 previews render correctly with a clean console
- [ ] `/ui/line-chart` (remote) renders
- [ ] `pnpm typecheck`, `pnpm build` exit 0
- [ ] No files outside the in-scope list are modified (`git status`; **no `content/*/meta.json` left edited**)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- **Any preview breaks under the sandbox.** Report which component and what it needs. Do **NOT** add
  `allow-same-origin` to make it pass — that reinstates the exact hole this plan closes. The correct
  answer would be a separate preview origin (the deferred follow-up), which is a maintainer decision.
- The report-only CSP causes visible breakage (it should be impossible — if it does, something else is
  wrong).
- The Supabase host can't be resolved from `NEXT_PUBLIC_SUPABASE_URL` in some environment — match
  `getRemotePatterns()`'s existing guard; do not crash the build when it's unset.

## Maintenance notes

- **The real fix is a separate origin for `/preview-frame/*`.** Sandboxing without `allow-same-origin`
  gets most of the way, but a distinct origin makes same-origin access _structurally_ impossible rather
  than flag-dependent. Do that before accepting outside contributions at volume.
- **Enforcing the CSP** (dropping `-Report-Only`) is the follow-up: it needs a nonce for the inline
  scroll script and a violation watch across all previews.
- Landing this before the merge train means every incoming capsule is sandboxed on arrival, and any
  capsule that _needs_ same-origin privileges announces itself immediately by breaking.
- Reviewer should scrutinize: that `allow-same-origin` is absent, and that the CSP's `media-src`
  includes the Supabase host — otherwise, once enforced, every cover video dies.
