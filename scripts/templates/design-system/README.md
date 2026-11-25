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

Edits here only reach design systems scaffolded afterwards.
