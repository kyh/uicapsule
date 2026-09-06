# Codebase cleanup — 2026-09-05

Reviewed the app, API, database, shared UI, scripts/configuration, and all 40 content packages.
The architecture remains: filesystem metadata → cached server reads → isolated previews.
Source downloads and registry output have their own boundary. Auth/oRPC and Supabase stay.

| Area                 | Result                                                                                                                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content loading      | One metadata schema and inferred types. Index reads avoid source bodies. Source/ZIP code loads on demand.                                                                                                                              |
| App composition      | Replaced the 856-line layout with header navigation, search, profile, and footer components. Removed descriptor/cloning indirection.                                                                                                   |
| Shared UI            | Narrow context APIs, preserve controlled callbacks, cancel stale highlighting, stabilize calendar overrides, and remove duplicated hooks.                                                                                              |
| Filter package       | Explicit column/filter variants replace the fluent builder and erased generic types. Remove unused row filtering, duplicate caches, and controller wrappers. Preserve option counts, operators, controlled updates, and pending edits. |
| Spreadsheet          | Instance-scoped stores replace the singleton. Remove ineffective memoization and fake import/export buttons. Preserve edits and existing values during enrichment.                                                                     |
| Registry portability | Filter Bar, Spreadsheet, and Emerald use public dependencies, local primitives, and scoped CSS. No private imports or gallery-theme requirements.                                                                                      |
| Rendering/lifecycle  | Correct Three/TSL types and resource cleanup. Fix camera cancellation/retry, tooltip refs, reduced motion, and stale effects. Pause offscreen videos; mount frames after hydration so cached loads cannot leave their cover stuck.     |
| Auth                 | Handle returned/network errors, pass reset tokens, reject reused tokens, revoke old sessions, link password recovery, and replace placeholder copy. Resend delivery is configured through server environment variables.                |
| Verification         | Strict checks cover all code-bearing content packages independently, including preview export contracts. Lint warnings fail. Next builds no longer ignore type errors. CI runs the full gate on every push and PR.                     |

Kept cache wrappers, UI primitives, and cohesive highlighting code: they encapsulate behavior.
Removed copied utility features and unused abstractions. Comments explain constraints and
invariants; repeated implementation narration was trimmed. Narrow lint exceptions cover
verified native-API/ref false positives and fixed positional rendering, with local reasons.

Validation:

- `pnpm verify`: strict typecheck, zero-warning lint, formatting, 22 tests, production build.
- AST scan: no explicit `any`, non-null assertions, or type casts. Literal `as const` remains.
- 39 code-bearing content packages pass independent checks; the remaining entry is remote.
- The content guard validates all 40 entries and rejects private imports, relative escapes,
  and workspace-only dependencies. Tests use real filesystem fixtures.
- Filter Bar, Spreadsheet, and Emerald registry responses were installed, typechecked,
  built, and exercised in a clean Vite/React/Tailwind consumer outside the monorepo.
- Two spreadsheet instances retain independent state. Filter edits/operators, spreadsheet
  edit/add/delete/enrichment, and Emerald interactions were checked in a browser.
- Browser checks cover gallery search/filter/theme/source/ZIP flows, frame loading, paused
  offscreen/reduced-motion covers, and changed animation interactions.
- Password reset was exercised against a temporary local database; the new password signs
  in. Memory-adapter integration tests verify callback, token consumption, session revocation,
  and missing configuration. Provider boundary tests cover HTTP/network failures.

Operational setup remains: production has no `RESEND_API_KEY` or `AUTH_EMAIL_FROM`. Set both
with a verified Resend sender to enable reset email. Without them, reset requests fail
explicitly. Configured requests keep account existence private; delivery failures are logged,
and request acceptance does not prove delivery. No real email was sent during verification.

Camera permission-denied/retry paths were checked; live pose tracking requires camera access.
This review is not exhaustive animation or accessibility certification.

My take: preserve the filesystem/preview/distribution boundaries. Keep new component APIs
small and local. The main source of complexity was general-purpose machinery copied into
examples; a small typed domain model is easier to extend and review.
