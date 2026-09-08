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

Run this from a clean `main` with `pnpm dev:web` reachable on :3000 and the Supabase
CLI authenticated (cover-video uploads). It is designed to be scheduled locally, e.g.
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
ships with `coverUrl`/`coverType` already wired. A request build is only done when it
would render correctly on the gallery grid the moment it merges.

## 5. Hand off

Success: `gh issue comment <n> --body "Built in <pr url>"` and leave `building` on —
the PR merge closes the issue.

Failure (can't reproduce the reference, verify fails, recording dead after 2 tries):

```bash
gh issue edit <n> --remove-label building
gh issue comment <n> --body "Build attempt failed: <one paragraph — what broke, what's needed>. Re-apply \`ready\` to retry."
```

Never leave `ready` on a failed issue — the next scheduled run would loop on it.

## 6. Report

One line per issue: number, outcome, PR URL or the failure reason. Then your take on
which built components are strong and which need a human pass before merge.
