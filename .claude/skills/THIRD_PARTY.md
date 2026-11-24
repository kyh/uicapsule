# Third-party skills

Vendored from upstream at the commits below, then run through `oxfmt`. `build-content`,
`build-requests` and `cover-video` are first-party and not listed.

| Skill                          | Source                                                                            | Commit    | License    |
| ------------------------------ | --------------------------------------------------------------------------------- | --------- | ---------- |
| `accessibility`                | [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) | `afa8da9` | MIT        |
| `adapt`                        | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) `reference/adapt.md`  | `e0881d2` | Apache-2.0 |
| `animate`                      | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `animation-performance`        | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `animation-vocabulary`         | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `apple-design`                 | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `ask-sonner`                   | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `beautiful-shadows`            | [MengTo/Skills](https://github.com/MengTo/Skills)                                 | `5f47e38` | MIT        |
| `better-accessibility`         | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `672ae44` | MIT        |
| `better-colors`                | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `672ae44` | MIT        |
| `better-interface`             | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `672ae44` | MIT        |
| `better-layout`                | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `672ae44` | MIT        |
| `better-motion`                | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `672ae44` | MIT        |
| `better-typography`            | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `672ae44` | MIT        |
| `better-ui`                    | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `672ae44` | MIT        |
| `better-writing`               | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `672ae44` | MIT        |
| `break`                        | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `672ae44` | MIT        |
| `break-ui`                     | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `build-design`                 | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `672ae44` | MIT        |
| `choreograph`                  | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `emil-design-eng`              | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `explain-interface`            | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `672ae44` | MIT        |
| `find-animation-opportunities` | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `frontend-design`              | [anthropics/skills](https://github.com/anthropics/skills)                         | `34040c9` | Apache-2.0 |
| `gestures`                     | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `improve-animations`           | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `interaction-design`           | [wshobson/agents](https://github.com/wshobson/agents) `plugins/ui-design`         | `4236bb9` | MIT        |
| `interface-review`             | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `672ae44` | MIT        |
| `mobile-native`                | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `pick-ui-library`              | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `prototype`                    | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `remove-animations`            | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `review-animations`            | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `64eb3de` | MIT        |
| `shadcn`                       | [shadcn-ui/ui](https://github.com/shadcn-ui/ui)                                   | `98a1fe6` | MIT        |
| `state-machine`                | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `672ae44` | MIT        |
| `variant`                      | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `672ae44` | MIT        |

Every `emilkowalski/skills` and `jakubkrehel/skills` entry is also served by `/mcp` (the list is
`REPO_SKILLS` in `apps/web/src/lib/agent/mcp-skills.ts`), read from this directory: there is no
second copy. To update one, re-copy the upstream folder over it, run `oxfmt`, and bump its commit
here.

Local deviations:

- `adapt` is the web half of impeccable's `adapt` subcommand, given its own frontmatter.
  Upstream folded it into the 2MB `impeccable` bundle; the native variant was dropped.
- `better-*` siblings are included because `better-interface` only orchestrates them.
- Upstream `agents/`, `evals/` and `demo/` folders were omitted.
- Not vendored from `emilkowalski/skills`: `write-swift` and `animate-expo` (not web),
  `ask-emil` (a router over the whole upstream set) and `learn-taste` (writes to the project's
  own rules). Not vendored from `jakubkrehel/skills`: `afk` and `upskill`, which mine the
  consumer's past agent sessions and run unattended.

Rejected: `Superfuture/design-review`. It instructs a silent telemetry `curl` on every run
and a paid mode that posts code to a third-party worker, and the repo carries no license.
