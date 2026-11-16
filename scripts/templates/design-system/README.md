# Design system template

`pnpm new:content <slug> --design-system` copies this directory into `content/<slug>`,
rewrites the `ds-template` scope class to `ds-<slug>`, and writes `system.ts` and `meta.json`.

Every design system shares this showcase (Foundations → Components → In context) and the
same component set, so entries compare side by side. What changes is the system itself:

1. `tokens.css` — color, shape, type and motion. Most of a system lives here.
2. `components/*` — reshape a primitive when tokens can't carry the idea (a knurled
   switch, a stamped badge). Keep each component's props, so the showcase still renders.

Edits here only reach design systems scaffolded afterwards.
