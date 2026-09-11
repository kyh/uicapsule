---
name: build-requests
description: >
  Drain the queue of accepted component requests: every open GitHub issue labelled
  `ready` becomes a built, recorded, covered component with a PR that closes the
  issue. Use when asked to "build the ready requests", "run the request queue",
  "process component requests", or when invoked as /build-requests on a schedule.
  Not for building an ad-hoc idea (use build-content) or a single cover (cover-video).
---

# Build Requests

Queue → claim → build-content → cover-video → PR that closes the issue.

Run this from a clean `main` with `pnpm dev:web` reachable on :3000 and the Vercel CLI
linked to the project (cover-video uploads via `vercel blob put`). It is designed to be scheduled locally, e.g.
`claude -p "/build-requests"` from cron or launchd once a day.

## 1. Queue

```bash
gh issue list --label ready --state open --json number,title,body,author,url \
  --jq 'sort_by(.number) | .[0:3]'
```

Oldest first, at most **3 per run** — quality over throughput. Nothing queued → say
so and stop. Skip any issue that already has an open PR referencing it
(`gh pr list --search "closes #<n>" --json number`).

Build the issues one at a time, in a fresh worktree or after `git checkout main &&
git pull` between them, so one failure never contaminates the next.

## 2. Claim

```bash
gh issue edit <n> --remove-label ready --add-label building
gh issue comment <n> --body "Building this now — PR incoming."
```

## 3. Build

Derive the idea from the issue: title minus the `Request:` prefix is the working
name, "What it does" is the brief, "References" are the source material. Read every
reference link that is readable (tweets, product pages, videos via their page text)
before designing beats — the request is describing something specific and the
component must match it, not a generic cousin.

Then follow `../build-content/SKILL.md` end to end (branch `kyh/<slug>`, scaffold,
build, verify, record, PR). Differences:

- `meta.json` gets the provenance fields — the whole point of the request flow:
  - `inspiredBy`: one `{ label, url }` per reference link in the issue. Always link
    the issue itself first (`{ label: "Request #<n>", url: <issue url> }`). Never
    link `github.com/user-attachments/…` blobs — they're issue-scoped; the issue
    link covers them.
  - `requestedBy`: `{ name, url }` from the issue's **Credit** section. Form-filed
    issues render it as a markdown link; template-filed ones are free text. If it
    says anonymous or is empty, omit the field. Do not fall back to the GitHub
    author — form-filed issues are all authored by the token owner.
- PR body: add `Closes #<n>` on its own line before the recording section, and a
  one-line "Requested in #<n>" at the top so the reviewer has the context.

## 4. Cover

Run `../cover-video/SKILL.md` on the same branch before opening the PR, so the PR
ships with `cover` already wired. Follow it exactly — dedicated
`--session covers`, native `.mp4` at `--fps 60`, 1600×900, frame-check, Blob
upload, gallery confirm. Every shortcut it warns about has already cost a take.

## 5. Done gate — every line must pass before `gh pr create`

Nothing here is optional. A request build that fails one of these is not done; fix it
or fail the issue (§6). Print each result in the run log.

```bash
# 1. static gate
pnpm verify

# 2. PR recording exists and is a real take
ffprobe -v error -show_entries format=duration -of csv=p=0 <scratch>/<slug>.raw.mp4   # ≥ 8
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" \
  https://raw.githubusercontent.com/kyh/uicapsule/kyh/pr-preview-assets/<slug>.gif      # 200 image/gif

# 3. cover is 60fps, 1600×900, h264, 8–15s
ffprobe -v error -show_entries stream=codec_name,width,height,avg_frame_rate:format=duration \
  -of default=nw=1 <scratch>/<slug>.mp4    # h264 / 1600 / 900 / 60/1 / 8–15

# 4. cover is live and typed correctly
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" \
  "$NEXT_PUBLIC_ASSETS_URL/<slug>/<slug>.mp4"   # 200 video/mp4

# 5. meta.json carries everything the gallery + detail page need
python3 -c "import json; m=json.load(open('content/<slug>/meta.json')); \
  assert m['cover']=='<slug>/<slug>.mp4'; \
  assert m['addedAt'] and m['tags'] and m['inspiredBy']; print('meta ok')"

# 6. the card actually plays on the grid
agent-browser --session covers open http://localhost:3000/ && \
agent-browser --session covers screenshot <scratch>/grid.png   # Read it: <slug>'s card shows video, not blank
```

Also Read the cover frame-check images (cover-video §5) one more time here: the frames
must differ and show the climax beat. A lively-but-pointless loop is a failed cover.

## 6. Hand off

Success: `gh issue comment <n> --body "Built in <pr url>"` and leave `building` on —
the PR merge closes the issue.

Failure (can't reproduce the reference, a done-gate line fails after 2 attempts):

```bash
gh issue edit <n> --remove-label building
gh issue comment <n> --body "Build attempt failed: <one paragraph — what broke, what's needed>. Re-apply \`ready\` to retry."
```

Never leave `ready` on a failed issue — the next scheduled run would loop on it.

## 7. Report

One line per issue: number, outcome, PR URL or the failure reason. Then your take on
which built components are strong and which need a human pass before merge.
