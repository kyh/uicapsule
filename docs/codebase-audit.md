# Codebase cleanup — 2026-09-05

Surveyed the web app, API, database, shared UI, scripts/configuration, and all 40 content
packages. Inspected dependencies and callers before removing code. Runtime checks target
changed interactions; this is not exhaustive animation or accessibility certification.

The core architecture is sound: filesystem metadata feeds cached server reads; previews stay
isolated; source downloads have their own contract. Keep those seams. The waste was mostly
copied utility features, indirect UI configuration, repeated schemas, and dead package surfaces.

| Area              | Change                                                                                                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content loading   | One metadata parser with inferred local/remote types. Indexing no longer reads source bodies. The build guard uses the same parser.                                                                |
| Header            | Split the 856-line layout into header navigation, search, profile, and footer. Replaced menu descriptors and element cloning with JSX composition.                                                 |
| Source drawer     | Normalize paths once. Reset file selection per component. Load viewer and ZIP code on demand. Fix author avatar source.                                                                            |
| Shared UI         | Narrow tree context capabilities; remove `any`. Consolidate responsive hooks. Move controlled-state notifications outside React updaters. Stabilize calendar overrides. Cancel stale highlighting. |
| Content utilities | Remove unused debounce modes, tuple overloads, array helpers, unused memo options, and explanatory noise. Fix pending-edit handling and nested icon remounts.                                      |
| API/database      | Remove unused context data, inference exports, procedure aliases, SQL barrel, empty schema, and five unused dependencies. Retain auth and RPC.                                                     |
| Tests/docs        | Consolidate schema checks without losing field/nullability assertions. Keep cookie and transport guards. Add real filesystem/registry regressions. Update agent maps and remove stale guidance.    |

The cache wrappers, shared UI primitives, and cohesive syntax-highlighting module remain.
They encapsulate actual policy or behavior. Content packages remain independent units;
extracting shared helpers from them would break the registry contract.

Verified:

- `pnpm verify`: typecheck, lint, formatting, 15 tests, production build.
- Metadata guard: 40 valid entries; registry index: 39 local entries.
- Desktop/mobile search, theme menu, filters, feed navigation, source selection, ZIP download.
- Source/registry success and missing-slug responses. Downloaded ZIP matches source bytes.
- Browser checks used port 3001 because another project owns port 3000. Auth sign-in was not
  exercised there. Session lookup used an isolated temporary local database.

Remaining work, ranked:

1. **Check content packages independently in the normal gate.** They remain excluded from
   `pnpm typecheck`. Independent strict checks pass 31/39 TypeScript packages; the remaining
   package is remote-only. Four packages have substantive failures: `chibi-plants` (101 TSL
   vector diagnostics), `filter-bar` (18 TanStack type diagnostics), `carousel-3d` (8 Three.js
   augmentation diagnostics), and `spreadsheet` (7 column/cell variance diagnostics). Four
   others only lack CSS side-effect declarations: `emerald-template`, `snail-timer`,
   `spinner-pixel-grid`, `tooltip-grid`. These are 138 diagnostics, not 138 separate bugs.
   Fix the contracts and CSS declarations before adding the gate.
2. **Repair three external registry packages.** `emerald-template`, `filter-bar`, and
   `spreadsheet` still import private `@repo/ui` modules. Their gallery previews work; clean
   consumers cannot resolve those imports. Choose minimal package-local implementations
   rather than copying the entire shared UI package.
3. **Finish password reset.** The form can show success on a returned API error; the update
   form never supplies the URL token; the server has no reset-email delivery callback.
   This requires completing the feature, including choosing/configuring email delivery.
4. **Automate the existing gate.** `.github/workflows` runs the Claude integration only;
   no PR workflow runs `pnpm verify`. Preserve Vercel's every-push build and Turbo's content
   dependency declaration.

The gate reports 114 advisory lint warnings, down from 133; errors fell from 6 to 0. This cleanup removes actual errors and unnecessary code.
Warning suppression or deleting valuable contract tests would give a misleading clean result.

The lazy import changes follow [Next.js guidance](https://nextjs.org/docs/app/guides/lazy-loading).
Schema inference follows [Zod's schema API](https://zod.dev/api).
Previously settled tradeoffs were checked against [the pinned audit](https://github.com/kyh/uicapsule/issues/84).
