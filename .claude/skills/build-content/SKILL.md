---
name: build-content
description: >
  Full lifecycle for a new uicapsule content component: take an idea (or pitch ideas
  if none given), scaffold it, build the component, record a screen capture of it
  running locally, and open a PR with the recording embedded in the description. Use
  whenever the user pitches a component idea, says "build X and PR it", "add a
  <thing> component", describes a UI interaction/effect they want added to the
  gallery, or invokes /build-content with no arguments at all. Not for editing
  existing content components (unless re-recording their PR preview) and not for
  gallery covers (use cover-video).
---

# Build Content

Idea → branch → scaffold → build → verify → record → PR with embedded recording.
Use the session scratchpad for all intermediate files (webm, gif, frames, batch json).

## 0. No idea given? Pitch, then ask

If invoked without a component idea, don't ask an open-ended "what do you want?" —
come up with strong candidates and let the user pick (AskUserQuestion, with an Other
escape hatch).

Judge every candidate against the **Content Curation Philosophy** in the repo
CLAUDE.md — outside-the-web imports, intersection-not-category, state readable from
motion alone.

Process: survey what already exists (`git ls-files content/ | cut -d/ -f2 | sort -u`
plus open PR titles via `gh pr list`) so pitches don't collide with shipped or
in-flight work; generate 6–8 collisions across DIFFERENT source domains; keep the
3–4 with the strongest motion story; present each as "name — one-line hook" with a
sentence on the interaction. After the pick, confirm the beats you'd record (step 2's
flattering loop) in one sentence and proceed.

## 1. Branch + scaffold

Preflight: `git status --short`. The PR must commit `apps/web/package.json` and
`pnpm-lock.yaml` — if either already has uncommitted changes, stop and surface it
to the user rather than sweeping their WIP into the PR. Also check
`git rev-list --count origin/main..main` — unpushed main commits will show up in
the PR diff until main is pushed; mention it in the wrap-up if nonzero.

```bash
git checkout -b kyh/<slug> main
pnpm new:content <slug> --description "<one-liner>"
```

Slug is kebab-case (`SLUG_RE` in `scripts/new-content.ts` enforces it). The scaffold
creates `content/<slug>/{<slug>.tsx, preview.tsx, meta.json, package.json}`, registers
the workspace dep in `apps/web/package.json`, and runs `pnpm install`.

## 2. Build the component

- `content/<slug>/<slug>.tsx` — the component. `preview.tsx` — stages it fullscreen.
- Read 2–3 committed siblings first (`git ls-files content/ | cut -d/ -f2 | sort -u`
  — a `content/<x>/` dir holding only `node_modules` is leftover from another branch,
  not a real sibling) to absorb conventions: `"use client"`, Tailwind arbitrary
  classes, `motion` for animation (add to the package's own `package.json` deps,
  `pnpm install` after).
- Stage on a dark radial-gradient `<main class="flex h-dvh items-center justify-center">`
  like sibling previews — gallery cards and recordings assume it.
- The component must demo itself: either it auto-animates, or the preview wires up an
  auto-tour + visible controls. A recording of a static component is worthless, so
  design the "flattering loop" now, not at recording time.
- `meta.json`: scaffold already filled `name` + `description`; add `tags`, reusing
  the existing vocabulary:
  `python3 -c "import json,glob,collections; print(collections.Counter(t for f in glob.glob('content/*/meta.json') for t in json.load(open(f)).get('tags',[])).most_common(30))"`

## 3. Verify locally

```bash
pnpm typecheck && pnpm lint
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/preview-frame/<slug>
```

Dev server not running → start `pnpm dev:web` in the background.

**Turbopack gotcha (bites every new content package):** the persistent cache freezes
the Tailwind `@source` glob, so arbitrary classes that exist only in the NEW package
silently generate no CSS — markup renders unstyled. If the preview looks unstyled:
`rm -rf apps/web/.next`, restart `pnpm dev:web`.

Screenshot `/preview-frame/<slug>` and actually look at it before recording.

## 4. Record

The staging recipe and its two gotchas (`record start` opens a NEW tab; capture size
locks when recording begins) plus the occlusion check live in
`../cover-video/SKILL.md` §2–3 — follow that recipe, with these differences:

- Viewport **1280×800** (PR gif, not gallery cover) — so the eval check must print
  `visible 1280x800`, not the `1600x900` the cover-video recipe shows.
- Record `http://localhost:3000/preview-frame/<slug>`.
- `record restart <file>` prints "Recording saved to <file>" immediately, before
  anything is captured — it's re-arming, not saving. Ignore that line.
- 10–15s choreography as ONE `agent-browser batch` call: ~3s settle, then the beats
  you designed in step 2 (drags need intermediate `mouse move` steps with 80–120ms
  waits), then ~3s settle so the loop reads cleanly.
- The OS cursor is not captured — favor beats with visible feedback.

After `record stop`, verify the webm: non-zero size AND duration ≥ 8s
(`ffprobe -v error -show_entries format=duration -of csv=p=0 <file>`). A 0-byte or
sub-second file is a known intermittent agent-browser failure — re-record, waiting
2s after `record stop` before checking.

## 5. Convert, frame-check, publish the GIF

```bash
.claude/skills/build-content/scripts/publish-recording.sh <slug> <scratch>/<slug>.webm
```

Converts to an 800px 12fps GIF, uploads it to the `kyh/pr-preview-assets` orphan
branch via a temp worktree, verifies the raw URL serves `image/gif`, and prints the
embed URL. Before trusting it, verify **beat coverage, not just motion**: list the
beats you designed in step 2, extract a frame at each beat's expected timestamp
(`ffmpeg -ss <t> -i <slug>.gif -frames:v 1 f.png`), and Read them. Every beat —
especially the climax state (success morph, final reveal, whatever the component
builds to) — must have a frame proving it happened. "Frames differ" is not enough:
a hold released at 95% produces a lively gif that's missing the entire point. If a
beat is absent, fix the choreography (hold/wait durations need ~20% margin over the
component's nominal timings — batch step overhead eats into them) and re-record.
All-identical frames = frozen rAF (occlusion) or missed coords.

Why an orphan branch: GitHub has no API for comment/description file attachments, so
GIFs live on `kyh/pr-preview-assets` (no shared history with main — zero repo bloat)
and embed via `raw.githubusercontent.com`. Deleting that branch 404s every PR
recording, so don't prune it.

## 6. Commit, push, PR

```bash
git add content/<slug> apps/web/package.json pnpm-lock.yaml
git commit -m "feat: add <slug> — <tagline>"
git push -u origin kyh/<slug>
```

PR title matches the commit. Body template:

```markdown
<2–4 sentences: what the component is, the motion/interaction story, notable
construction details — written like the sibling PRs, dense and concrete.>

## Preview recording

![<slug>](https://raw.githubusercontent.com/kyh/uicapsule/kyh/pr-preview-assets/<slug>.gif)

_Recorded locally from [`/preview-frame/<slug>`](https://uicapsule-git-kyh-<slug>-kyh-io.vercel.app/preview-frame/<slug>)._

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

(The vercel link is the predictable preview URL — it goes live once the deploy
finishes; the gif renders immediately.)

## 7. Wrap up

- Delete scratch webm/gif/frames/batch files.
- Report the PR URL and your take on the component.
- Offer, don't do: gallery cover via the `cover-video` skill (separate 1600×900 mp4
  pipeline + Supabase), typically after the PR merges.
