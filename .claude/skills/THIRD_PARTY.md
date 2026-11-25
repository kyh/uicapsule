# Third-party skills

Vendored from upstream at the commits below, then run through `oxfmt` (except `lock` rows, below). `build-content`,
`build-requests` and `cover-video` are first-party and not listed.

| Skill                          | Source                                                                            | Commit    | License    |
| ------------------------------ | --------------------------------------------------------------------------------- | --------- | ---------- |
| `accessibility`                | [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) | `afa8da9` | MIT        |
| `adapt`                        | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) `reference/adapt.md`  | `e0881d2` | Apache-2.0 |
| `animate`                      | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `animation-performance`        | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `animation-vocabulary`         | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `apple-design`                 | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `ask-sonner`                   | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `beautiful-shadows`            | [MengTo/Skills](https://github.com/MengTo/Skills)                                 | `5f47e38` | MIT        |
| `better-accessibility`         | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | lock      | MIT        |
| `better-colors`                | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | lock      | MIT        |
| `better-interface`             | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | lock      | MIT        |
| `better-layout`                | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | lock      | MIT        |
| `better-motion`                | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | lock      | MIT        |
| `better-typography`            | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | lock      | MIT        |
| `better-ui`                    | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | lock      | MIT        |
| `better-writing`               | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | lock      | MIT        |
| `break`                        | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | lock      | MIT        |
| `break-ui`                     | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `build-design`                 | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | lock      | MIT        |
| `choreograph`                  | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `emil-design-eng`              | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `explain-interface`            | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | lock      | MIT        |
| `find-animation-opportunities` | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `frontend-design`              | [anthropics/skills](https://github.com/anthropics/skills)                         | `34040c9` | Apache-2.0 |
| `gestures`                     | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `improve-animations`           | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `interaction-design`           | [wshobson/agents](https://github.com/wshobson/agents) `plugins/ui-design`         | `4236bb9` | MIT        |
| `interface-review`             | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | lock      | MIT        |
| `mobile-native`                | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `pick-ui-library`              | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `prototype`                    | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `remove-animations`            | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `review-animations`            | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | lock      | MIT        |
| `shadcn`                       | [shadcn-ui/ui](https://github.com/shadcn-ui/ui)                                   | `98a1fe6` | MIT        |
| `state-machine`                | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | lock      | MIT        |
| `variant`                      | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | lock      | MIT        |

Rows whose commit reads `lock` are managed by the [`skills` CLI](https://github.com/vercel-labs/skills)
and pinned, with a content hash, in the root `skills-lock.json`. They are byte-identical to
upstream (no `oxfmt`: `.oxfmtrc.json` ignores them so the hash still matches), and `/mcp` serves
them from this directory (`REPO_SKILLS` in `apps/web/src/lib/agent/mcp-skills.ts`), so there is
no second copy.

- `pnpm skills:update` moves them to upstream HEAD and rewrites the lock. Review the diff
  before committing: these ship to every MCP client.
- `pnpm skills:sync` restores exactly what the lock pins (after a bad local edit, or to check
  for drift: it should leave `git status` clean).
- To add one: `pnpm exec skills add <owner>/<repo> -s <name> -a claude-code --copy -y`, add its
  folder to `.oxfmtrc.json` `ignorePatterns`, a row here, and its name to `REPO_SKILLS` if
  `/mcp` should serve it. Tests fail until the lock, the ignore list and `REPO_SKILLS` agree.

Local deviations:

- `adapt` is the web half of impeccable's `adapt` subcommand, given its own frontmatter.
  Upstream folded it into the 2MB `impeccable` bundle; the native variant was dropped.
- `better-*` siblings are included because `better-interface` only orchestrates them.
- Upstream `agents/`, `evals/` and `demo/` folders were omitted, except in `lock` rows, which
  keep upstream's tree as is.
- Not vendored from `emilkowalski/skills`: `write-swift` and `animate-expo` (not web),
  `ask-emil` (a router over the whole upstream set) and `learn-taste` (writes to the project's
  own rules). Not vendored from `jakubkrehel/skills`: `afk` and `upskill`, which mine the
  consumer's past agent sessions and run unattended.

Rejected: `Superfuture/design-review`. It instructs a silent telemetry `curl` on every run
and a paid mode that posts code to a third-party worker, and the repo carries no license.
