# Design system template

`pnpm new:content <slug> --design-system` copies this directory into `content/<slug>`,
rewrites the `ds-template` scope class to `ds-<slug>`, and writes `system.ts` and `meta.json`.

This is a starting point, not a shared showcase. A finished entry owns its whole page, the way
each system on design.how/systems does, in this order so entries still compare side by side:

1. **Header**: name, tagline, counts.
2. **In use**: full-width demo product screens in the system's domain, built from its
   components. This is what sells the system.
3. **Foundations**, shown the system's own way: color tokens with values and contrast, the
   type scale, radius by role, elevation, live motion demos, and its anti-slop rules.
4. **Components**, grouped by category, including the domain-specific ones.

Start from `tokens.css`, then replace `design-system.tsx`, `foundations.tsx` and
`components/*` as the system needs. Everything stays scoped to `.ds-<slug>`.

## Settings are controls

The system's settings are props, never an in-page switcher. `preview.tsx` exports `controls`
(the `/ui/<slug>` props panel renders them) and passes each to `DesignSystem`, which drives
`tokens.css` from the `.ds-<slug>` root and nothing else:

| Control         | Root                         | Token                                                 |
| --------------- | ---------------------------- | ----------------------------------------------------- |
| `theme`         | `data-theme`                 | the `[data-theme="dark"]` block                       |
| `accent`        | inline `--accent`            | `--accent`; `--ring` and `--accent-foreground` follow |
| `density`       | `data-density`               | Tailwind's `--spacing`, so every gap and height       |
| `radiusScale`   | inline `--ds-radius-scale`   | `--radius`                                            |
| `durationScale` | inline `--ds-duration-scale` | `--ds-duration` (0 turns motion off)                  |

Defaults reproduce the tokens exactly: scales default to 1, and `accent`'s default is the hex of
`--accent`, so retune both together. Rewrite the dark block for the system, or drop `theme` if it
has one mode only. Add a control for every other setting the system genuinely has (a type scale,
a second brand color, which "In use" screen is featured) the same way: a token or data attribute
on the root, never a remount. The demo screens' own interactions stay in the page.

Edits here only reach design systems scaffolded afterwards.
