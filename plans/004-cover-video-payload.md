# Plan 004: Stop the home page from downloading 146 MB of autoplaying video

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm
> the expected result before moving to the next step. If anything in the "STOP conditions" section
> occurs, stop and report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ee39414..HEAD -- apps/web/src/components/media-reveal.tsx "apps/web/src/app/(main)/(app)/_components/content-preview.tsx"`
> On a mismatch with the "Current state" excerpts, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S–M
- **Risk**: MED (visible behavior change — covers stop auto-playing on load)
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `ee39414`, 2026-07-12

## Why this matters

The home page renders ~28 cards. **26 of them are `<video autoPlay loop>` with no `preload` hint, no
`poster`, and no pause-when-offscreen.** These are full-quality MP4s on Supabase.

Measured with a HEAD request against every cover URL in `content/*/meta.json`:

```
video covers: 26
total bytes:  152,914,992   (145.8 MB)
mean:         5.6 MB each
```

With `autoplay + loop` and default `preload`, the browser fetches essentially the whole file for every
card and keeps ~26 decode loops alive — offscreen video is **not** paused by the browser (only
throttled in background _tabs_). This is by a wide margin the largest number on the site: tens of MB
before the user clicks anything, plus 26 concurrent decode pipelines. On mobile data it is brutal.

The covers themselves are also oversized (5.6 MB for a ~12-second silent loop is ~10× more than
needed), but re-encoding 26 videos is content-ops. **This plan fixes delivery**, which is where the
leverage is and which is entirely in code.

## Current state

- `apps/web/src/components/media-reveal.tsx` — the single component rendering every cover (image,
  video, or iframe) behind a shimmer skeleton. Used by the home grid, the feed, and the preview frame.
- `apps/web/src/app/(main)/(app)/_components/content-preview.tsx` — the home-grid card; passes
  `video={coverUrl}` when `coverType === "video"`.
- `apps/web/src/app/(main)/(app)/page.tsx:20` — grid is `md:grid-cols-10`; cards are `col-span-2`
  (≈20vw), the hero is `col-span-4` (≈40vw).

The video branch, `apps/web/src/components/media-reveal.tsx:128-140`:

```tsx
{
  video && inView && (
    <video
      className="absolute inset-0 h-full w-full object-cover"
      autoPlay
      loop
      muted
      playsInline
      onLoadedData={() => setRevealed(true)}
      onCanPlay={() => setRevealed(true)}
    >
      <source src={video} type="video/mp4" />
    </video>
  );
}
```

The `inView` latch (`media-reveal.tsx:10-31`) is an `IntersectionObserver` with `rootMargin: "200px"`
that **latches true once and disconnects** — so nearly every card flips to `inView` during the initial
scroll and never flips back. It gates _mounting_, not _playing_.

The image branch (`media-reveal.tsx:118-127`) hardcodes `sizes="(max-width: 640px) 100vw, 50vw"` for
every consumer (over-requesting ~2.5× for 20vw grid cards), and nothing sets `priority` on the
above-the-fold hero cover.

`media-reveal.tsx:54` already calls `useReducedMotion()` — reuse it.

**Conventions**: `motion` (not framer-motion); Tailwind classes; no `any`/`as`/`!`.

## Commands you will need

| Purpose         | Command                                           | Expected on success   |
| --------------- | ------------------------------------------------- | --------------------- |
| Typecheck       | `pnpm typecheck`                                  | exit 0                |
| Lint            | `pnpm lint`                                       | exit 0                |
| Dev server      | `pnpm dev:web`                                    | http://localhost:3000 |
| Measure a cover | `curl -sI "<coverUrl>" \| grep -i content-length` | byte size             |

## Scope

**In scope**:

- `apps/web/src/components/media-reveal.tsx`
- `apps/web/src/app/(main)/(app)/_components/content-preview.tsx`
- `apps/web/src/app/(main)/(app)/page.tsx` (only to pass `priority`/`sizes` for the hero)

**Out of scope**:

- Re-encoding/re-uploading the cover videos, and `.claude/skills/cover-video/` — content-ops.
- `content/*/meta.json` — do not change `coverUrl` / `coverType` values.
- The iframe branch of `MediaReveal` (the feed's windowing) — different concern.
- The shimmer/wipe animation logic (`media-reveal.tsx:56-103`) — recently tuned; leave it.

## Git workflow

- Branch: `kyh/004-cover-video-payload`
- Conventional commits, e.g. `perf: play cover videos only while visible`

## Steps

### Step 1: Stop eagerly downloading video

On the `<video>` element:

- set `preload="none"` (nothing is fetched until `play()` is called)
- **remove `autoPlay`** — playback becomes explicit (step 2)
- move `src` from the child `<source>` onto the `<video>` element itself (changing a `<source>`
  child's `src` on a retained element does not reload the media — this also fixes a latent staleness
  bug when the `video` prop changes)

**Verify**: `pnpm typecheck` → 0. Load `/` with DevTools → Network → Media: on first paint, **no** MP4
requests fire for below-the-fold cards.

### Step 2: Play only what is visible; pause what isn't

The existing `useInView` latches once and disconnects. Add a **second, non-latching** observer (or
generalize the hook with an option) tracking _current_ visibility for the video, `threshold: 0.25`, no
`rootMargin` padding:

- entering view → `videoRef.current?.play()` — guard the promise (`.catch(() => {})`); autoplay can be
  rejected and an unhandled rejection is noisy
- leaving view → `videoRef.current?.pause()`

Keep `muted` and `playsInline` — both are required for programmatic autoplay on iOS/Safari.

Honor reduced motion: when `useReducedMotion()` is true, **do not auto-play**; leave the video paused
on its first frame.

**Verify**: scroll the home page. MP4s load only as their card approaches. Then in the console:

```js
[...document.querySelectorAll("video")].map((v) => ({ src: v.src.slice(-30), paused: v.paused }));
```

Offscreen cards report `paused: true`.

### Step 3: Cap concurrent playback

Even "visible" can mean 6–8 cards on a large monitor. Add a small module-level coordinator in
`media-reveal.tsx` (a `Set` of currently-playing elements, max ~4): when a video becomes visible and
the set is full, leave it paused; release the slot when one leaves view. Keep it local — no context
provider.

**Verify**: on a maximized window, at most 4 videos report `paused === false`.

### Step 4: Make sure a never-played video doesn't shimmer forever

`revealed` is currently driven by `onLoadedData` / `onCanPlay`, which may not fire with
`preload="none"` until `play()` is called. Confirm what a paused, never-played card looks like — if it
shimmers indefinitely, switch the reveal trigger to `onLoadedMetadata`, or supply a `poster`.

If Supabase already stores a thumbnail per cover, wire `poster`. **Do not generate posters in this
plan** — note it as follow-up.

**Verify**: a card whose video is paused (offscreen, or over the concurrency cap) never shows an
infinite shimmer.

### Step 5: Fix `next/image` sizing for image covers

Make `sizes` and `priority` **props** of `MediaReveal` (defaulting to today's behavior) and pass
accurate values from `content-preview.tsx`:

- grid card (≈20vw): `sizes="(max-width: 768px) 100vw, 20vw"`
- hero card (≈40vw): `sizes="(max-width: 768px) 100vw, 40vw"`
- the first card gets `priority` and bypasses the `inView` gate, so the LCP image isn't blocked behind
  hydration + an IntersectionObserver tick

**Verify**: `pnpm typecheck` → 0; DevTools shows smaller image variants for grid cards.

## Test plan

No unit tests (browser-behavior work; no browser harness in the repo). Verify empirically and record
the numbers in the PR description:

1. **Bytes on first load** — DevTools → Network → Media → hard reload `/`. Before: tens of MB. After:
   ~0 until scroll, then only visible covers.
2. **Concurrent playback** — the `paused` snippet: at most 4 playing.
3. **Reduced motion** — emulate `prefers-reduced-motion: reduce` → nothing auto-plays.
4. **Regression** — `/ui/<slug>` still renders iframes correctly (shared component).

## Done criteria

ALL must hold:

- [ ] `grep -n "autoPlay" apps/web/src/components/media-reveal.tsx` → no match
- [ ] `grep -n 'preload="none"' apps/web/src/components/media-reveal.tsx` → matches
- [ ] `pnpm typecheck`, `pnpm lint` exit 0 (no new warnings)
- [ ] On first paint of `/`, no MP4 is fetched for below-the-fold cards
- [ ] At most 4 videos report `paused === false` on a maximized window
- [ ] Under `prefers-reduced-motion: reduce`, no video auto-plays
- [ ] No card is left shimmering forever when its video never plays
- [ ] `/ui/<slug>` feed still renders (iframe path unbroken)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Removing `autoPlay` breaks the reveal logic such that the skeleton never retires and you cannot
  resolve it cleanly with `onLoadedMetadata`.
- The gallery's visual character changes in a way that reads as broken rather than loading (a grid of
  static first frames). That is a design call for the maintainer — report with a screenshot.
- iOS Safari refuses programmatic `play()` even with `muted` + `playsInline`.

## Maintenance notes

- **The real fix is upstream**: 5.6 MB average for a ~12s silent loop is ~10× too big. Re-encoding
  (H.264/VP9, capped bitrate, ~720p, no audio track) would cut payload by an order of magnitude _on
  top of_ this plan and make posters cheap. Track against `.claude/skills/cover-video/`.
- Every new capsule adds another ~5 MB cover. This plan keeps page weight from being linear in gallery
  size, but a full scroll still grows with it — revisit past ~60 components (38 are queued in PRs).
- Reviewer should scrutinize: observer cleanup on unmount, and that the concurrency `Set` can't leak
  entries when a component unmounts mid-play.
