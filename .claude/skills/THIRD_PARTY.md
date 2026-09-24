# Third-party skills

Vendored from upstream at the commits below, then run through `oxfmt`. `build-content`,
`build-requests` and `cover-video` are first-party and not listed.

| Skill                  | Source                                                                            | Commit    | License    |
| ---------------------- | --------------------------------------------------------------------------------- | --------- | ---------- |
| `accessibility`        | [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) | `afa8da9` | MIT        |
| `adapt`                | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) `reference/adapt.md`  | `e0881d2` | Apache-2.0 |
| `apple-design`         | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `85e8e23` | MIT        |
| `beautiful-shadows`    | [MengTo/Skills](https://github.com/MengTo/Skills)                                 | `5f47e38` | MIT        |
| `better-accessibility` | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `267330e` | MIT        |
| `better-colors`        | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `267330e` | MIT        |
| `better-interface`     | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `267330e` | MIT        |
| `better-layout`        | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `267330e` | MIT        |
| `better-typography`    | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `267330e` | MIT        |
| `better-ui`            | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `267330e` | MIT        |
| `better-writing`       | [jakubkrehel/skills](https://github.com/jakubkrehel/skills)                       | `267330e` | MIT        |
| `emil-design-eng`      | [emilkowalski/skills](https://github.com/emilkowalski/skills)                     | `85e8e23` | MIT        |
| `frontend-design`      | [anthropics/skills](https://github.com/anthropics/skills)                         | `34040c9` | Apache-2.0 |
| `interaction-design`   | [wshobson/agents](https://github.com/wshobson/agents) `plugins/ui-design`         | `4236bb9` | MIT        |
| `shadcn`               | [shadcn-ui/ui](https://github.com/shadcn-ui/ui)                                   | `98a1fe6` | MIT        |

Local deviations:

- `adapt` is the web half of impeccable's `adapt` subcommand, given its own frontmatter.
  Upstream folded it into the 2MB `impeccable` bundle; the native variant was dropped.
- `better-*` siblings are included because `better-interface` only orchestrates them.
- Upstream `agents/`, `evals/` and `demo/` folders were omitted.

Rejected: `Superfuture/design-review`. It instructs a silent telemetry `curl` on every run
and a paid mode that posts code to a third-party worker, and the repo carries no license.
