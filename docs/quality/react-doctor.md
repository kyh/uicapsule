# React Doctor triage

React Doctor 0.7.6. Baseline: 263 findings (43 errors, 220 warnings). Final: 203 findings (13 errors, 190 warnings). Net: 60 findings removed.

The remaining 13 scanner errors are triaged: 10 isolated content packages cannot see the app-level reduced-motion provider, one cleanup report is a false positive, and two Socket reports are accepted supply-chain heuristics with no known vulnerability.

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- React Doctor full and changed-scope scans
- Browser QA on desktop and mobile for every changed preview
- Reduced-motion media emulation
- Console and page-error checks

## Status meanings

- **fixed**: code changed; targeted scan and acceptance surface passed.
- **runtime fixed**: real runtime boundary fixed; package-isolation heuristic remains.
- **accepted**: false positive or reviewed risk with explicit rationale.
- **follow-up**: plausible issue; needs product/interaction-specific verification.
- **deferred**: heuristic cleanup or optimization without evidence.

## Baseline issue ledger

### @repo/web

- 001 · warning · `unused-dependency` · `package.json:0` · **fixed** — unused manifest entry and lock edge removed
- 002 · warning · `nextjs-missing-metadata` · `src/app/(frame)/preview-frame/[slug]/page.tsx:1` · **accepted** — preview-frame is iframe infrastructure, not an indexable product page
- 003 · warning · `js-combine-iterations` · `src/app/(frame)/preview-frame/[slug]/page.tsx:16` · **deferred** — measure bundle/runtime impact before changing
- 004 · warning · `js-combine-iterations` · `src/app/(main)/(app)/_components/filter-combo-box.tsx:227` · **deferred** — measure bundle/runtime impact before changing
- 005 · warning · `use-lazy-motion` · `src/app/(main)/(app)/_components/signature.tsx:4` · **deferred** — measure bundle/runtime impact before changing
- 006 · warning · `use-lazy-motion` · `src/app/(main)/(content)/_components/aside.tsx:29` · **deferred** — measure bundle/runtime impact before changing
- 007 · warning · `anchor-has-content` · `src/app/(main)/(content)/_components/aside.tsx:235` · **accepted** — render-prop link receives visible Button children at runtime
- 008 · warning · `no-static-element-interactions` · `src/app/(main)/(content)/_components/code-preview.tsx:243` · **follow-up** — needs destination, keyboard model, or iframe trust contract
- 009 · warning · `js-index-maps` · `src/app/(main)/(content)/_components/content-feed.tsx:71` · **deferred** — measure bundle/runtime impact before changing
- 010 · warning · `unsafe-json-in-html` · `src/app/(main)/(content)/_components/content-feed.tsx:173` · **fixed** — verified in changed-scope scan
- 011 · warning · `unsafe-json-in-html` · `src/app/(main)/(content)/_components/content-feed.tsx:174` · **fixed** — verified in changed-scope scan
- 012 · warning · `server-sequential-independent-await` · `src/app/(main)/(content)/ui/[slug]/page.tsx:31` · **follow-up** — plausible defect; verify affected behavior before edit
- 013 · warning · `use-lazy-motion` · `src/components/layout.tsx:47` · **deferred** — measure bundle/runtime impact before changing
- 014 · warning · `no-multi-comp` · `src/components/layout.tsx:115` · **deferred** — separate public-API or component-boundary refactor
- 015 · warning · `no-giant-component` · `src/components/layout.tsx:139` · **deferred** — separate public-API or component-boundary refactor
- 016 · warning · `no-multi-comp` · `src/components/layout.tsx:139` · **deferred** — separate public-API or component-boundary refactor
- 017 · warning · `no-chain-state-updates` · `src/components/layout.tsx:172` · **accepted** — React 19 batches these state updates; no measured extra render
- 018 · warning · `no-chain-state-updates` · `src/components/layout.tsx:174` · **accepted** — React 19 batches these state updates; no measured extra render
- 019 · warning · `js-combine-iterations` · `src/components/layout.tsx:180` · **deferred** — measure bundle/runtime impact before changing
- 020 · warning · `js-combine-iterations` · `src/components/layout.tsx:197` · **deferred** — measure bundle/runtime impact before changing
- 021 · warning · `prefer-module-scope-static-value` · `src/components/layout.tsx:368` · **deferred** — low-risk maintainability suggestion; separate cleanup
- 022 · warning · `unused-export` · `src/components/layout.tsx:501` · **deferred** — separate public-API or component-boundary refactor
- 023 · warning · `no-multi-comp` · `src/components/layout.tsx:501` · **deferred** — separate public-API or component-boundary refactor
- 024 · warning · `control-has-associated-label` · `src/components/layout.tsx:724` · **accepted** — render-prop wrapper; rendered control receives visible content
- 025 · warning · `no-multi-comp` · `src/components/layout.tsx:790` · **deferred** — separate public-API or component-boundary refactor
- 026 · warning · `no-multi-comp` · `src/components/layout.tsx:825` · **deferred** — separate public-API or component-boundary refactor
- 027 · warning · `no-multi-comp` · `src/components/layout.tsx:842` · **deferred** — separate public-API or component-boundary refactor
- 028 · warning · `use-lazy-motion` · `src/components/media-reveal.tsx:5` · **deferred** — measure bundle/runtime impact before changing
- 029 · warning · `iframe-missing-sandbox` · `src/components/media-reveal.tsx:142` · **follow-up** — needs destination, keyboard model, or iframe trust contract
- 030 · warning · `js-flatmap-filter` · `src/lib/content-data.ts:36` · **deferred** — measure bundle/runtime impact before changing
- 031 · warning · `js-set-map-lookups` · `src/lib/content-data.ts:39` · **deferred** — measure bundle/runtime impact before changing
- 032 · warning · `js-combine-iterations` · `src/lib/content/content-fs.ts:107` · **deferred** — measure bundle/runtime impact before changing
- 033 · warning · `js-set-map-lookups` · `src/lib/content/content-fs.ts:146` · **deferred** — measure bundle/runtime impact before changing
- 034 · warning · `unused-export` · `src/trpc/react.tsx:24` · **deferred** — separate public-API or component-boundary refactor
- 035 · warning · `unused-export` · `src/trpc/react.tsx:24` · **deferred** — separate public-API or component-boundary refactor
- 036 · warning · `unused-export` · `src/trpc/react.tsx:24` · **deferred** — separate public-API or component-boundary refactor

### @repo/db

- 037 · warning · `unused-dependency` · `package.json:0` · **fixed** — unused manifest entry and lock edge removed

### @repo/ui

- 038 · warning · `unused-dependency` · `package.json:0` · **fixed** — unused manifest entry and lock edge removed
- 039 · warning · `unused-dependency` · `package.json:0` · **fixed** — unused manifest entry and lock edge removed
- 040 · error · `low-supply-chain-score` · `package.json:22` · **accepted** — reviewed: no known vulnerability, install hooks, runtime deps, or unlocked artifact
- 041 · warning · `only-export-components` · `src/components/alert-dialog.tsx:195` · **deferred** — separate public-API or component-boundary refactor
- 042 · warning · `prefer-module-scope-pure-function` · `src/components/alert-dialog.tsx:215` · **deferred** — low-risk maintainability suggestion; separate cleanup
- 043 · warning · `only-export-components` · `src/components/badge.tsx:50` · **deferred** — separate public-API or component-boundary refactor
- 044 · warning · `only-export-components` · `src/components/button.tsx:94` · **deferred** — separate public-API or component-boundary refactor
- 045 · warning · `no-locale-format-in-render` · `src/components/calendar.tsx:159` · **follow-up** — plausible defect; verify affected behavior before edit
- 046 · warning · `jsx-no-constructed-context-values` · `src/components/code-block.tsx:299` · **deferred** — needs profiling or bundle evidence
- 047 · warning · `no-array-index-as-key` · `src/components/code-block.tsx:418` · **deferred** — mostly static decorative lists; change only with stable domain key
- 048 · warning · `dangerous-html-sink` · `src/components/code-block.tsx:495` · **accepted** — Shiki output is escaped trusted renderer output
- 049 · warning · `no-array-index-as-key` · `src/components/field.tsx:192` · **deferred** — mostly static decorative lists; change only with stable domain key
- 050 · warning · `rendering-svg-precision` · `src/components/logo.tsx:14` · **deferred** — measure bundle/runtime impact before changing
- 051 · warning · `use-lazy-motion` · `src/components/toast.tsx:5` · **deferred** — measure bundle/runtime impact before changing
- 052 · warning · `jsx-no-constructed-context-values` · `src/components/tree.tsx:44` · **deferred** — needs profiling or bundle evidence
- 053 · warning · `control-has-associated-label` · `src/components/tree.tsx:81` · **accepted** — render-prop wrapper; rendered control receives visible content
- 054 · warning · `jsx-no-constructed-context-values` · `src/components/tree.tsx:104` · **deferred** — needs profiling or bundle evidence
- 055 · error · `no-ref-current-in-render` · `src/hooks/use-controllable-state.ts:21` · **fixed** — verified in changed-scope scan
- 056 · error · `no-ref-current-in-render` · `src/hooks/use-controllable-state.ts:23` · **fixed** — verified in changed-scope scan
- 057 · error · `no-ref-current-in-render` · `src/hooks/use-controllable-state.ts:25` · **fixed** — verified in changed-scope scan

### @uicapsule/background-pixel-stars

- 058 · warning · `no-giant-component` · `background-pixel-stars.tsx:65` · **deferred** — separate public-API or component-boundary refactor
- 059 · warning · `js-combine-iterations` · `background-pixel-stars.tsx:229` · **deferred** — measure bundle/runtime impact before changing
- 060 · warning · `js-combine-iterations` · `background-pixel-stars.tsx:249` · **deferred** — measure bundle/runtime impact before changing
- 061 · error · `effect-needs-cleanup` · `background-pixel-stars.tsx:321` · **fixed** — timer cleanup added and route verified
- 062 · warning · `prefer-use-effect-event` · `background-pixel-stars.tsx:369` · **follow-up** — inspect callback semantics; avoid mechanical dependency edits

### @uicapsule/background-shapes

- 063 · warning · `unused-dependency` · `package.json:0` · **fixed** — unused manifest entry and lock edge removed
- 064 · error · `require-reduced-motion` · `package.json:0` · **fixed** — unused motion dependency removed
- 065 · warning · `rendering-conditional-render` · `preview.tsx:19` · **follow-up** — plausible defect; verify affected behavior before edit

### @uicapsule/card-stack

- 066 · warning · `control-has-associated-label` · `card-stack.tsx:147` · **fixed** — control now has accessible name
- 067 · error · `alt-text` · `card-stack.tsx:153` · **fixed** — verified in changed-scope scan
- 068 · warning · `nextjs-no-img-element` · `card-stack.tsx:153` · **accepted** — portable content package; Next-only primitive would break copyability

### @uicapsule/carousel-3d

- 069 · warning · `no-giant-component` · `carousel-3d.tsx:83` · **deferred** — separate public-API or component-boundary refactor
- 070 · warning · `exhaustive-deps` · `carousel-3d.tsx:201` · **follow-up** — inspect callback semantics; avoid mechanical dependency edits
- 071 · warning · `no-nested-component-definition` · `carousel-3d.tsx:333` · **follow-up** — plausible defect; verify affected behavior before edit
- 072 · warning · `no-unstable-nested-components` · `carousel-3d.tsx:333` · **deferred** — needs profiling or bundle evidence
- 073 · warning · `no-array-index-as-key` · `carousel-3d.tsx:447` · **deferred** — mostly static decorative lists; change only with stable domain key
- 074 · warning · `unused-dependency` · `package.json:0` · **fixed** — unused manifest entry and lock edge removed

### @uicapsule/dynamic-ai-composer

- 075 · warning · `use-lazy-motion` · `dynamic-ai-composer.tsx:5` · **deferred** — measure bundle/runtime impact before changing
- 076 · warning · `no-array-index-as-key` · `dynamic-ai-composer.tsx:280` · **deferred** — mostly static decorative lists; change only with stable domain key
- 077 · error · `require-reduced-motion` · `package.json:0` · **runtime fixed** — frame MotionProvider honors OS setting; isolated-package scan cannot see boundary

### @uicapsule/dynamic-island

- 078 · warning · `use-lazy-motion` · `dynamic-island.tsx:4` · **deferred** — measure bundle/runtime impact before changing
- 079 · warning · `use-lazy-motion` · `expanded-widgets.tsx:17` · **deferred** — measure bundle/runtime impact before changing
- 080 · warning · `only-export-components` · `expanded-widgets.tsx:26` · **deferred** — separate public-API or component-boundary refactor
- 081 · error · `require-reduced-motion` · `package.json:0` · **runtime fixed** — frame MotionProvider honors OS setting; isolated-package scan cannot see boundary
- 082 · warning · `use-lazy-motion` · `ring.tsx:2` · **deferred** — measure bundle/runtime impact before changing
- 083 · error · `no-layout-property-animation` · `ring.tsx:24` · **fixed** — verified in changed-scope scan
- 084 · error · `no-layout-property-animation` · `ring.tsx:30` · **fixed** — verified in changed-scope scan
- 085 · error · `no-layout-property-animation` · `ring.tsx:32` · **fixed** — verified in changed-scope scan
- 086 · error · `no-layout-property-animation` · `ring.tsx:36` · **fixed** — verified in changed-scope scan
- 087 · warning · `rendering-svg-precision` · `ring.tsx:59` · **deferred** — measure bundle/runtime impact before changing
- 088 · error · `no-layout-property-animation` · `ring.tsx:66` · **fixed** — verified in changed-scope scan
- 089 · warning · `use-lazy-motion` · `timer.tsx:1` · **deferred** — measure bundle/runtime impact before changing
- 090 · warning · `rendering-svg-precision` · `timer.tsx:28` · **deferred** — measure bundle/runtime impact before changing
- 091 · warning · `button-has-type` · `timer.tsx:47` · **fixed** — verified in changed-scope scan

### @uicapsule/emerald-template

- 092 · warning · `jsx-no-constructed-context-values` · `_components/chain-of-thought.tsx:53` · **deferred** — needs profiling or bundle evidence
- 093 · warning · `prefer-module-scope-static-value` · `_components/chain-of-thought.tsx:102` · **deferred** — low-risk maintainability suggestion; separate cleanup
- 094 · warning · `no-array-index-as-key` · `_components/features-section.tsx:93` · **deferred** — mostly static decorative lists; change only with stable domain key
- 095 · warning · `nextjs-no-a-element` · `_components/footer.tsx:17` · **accepted** — portable content package; Next-only primitive would break copyability
- 096 · warning · `nextjs-no-a-element` · `_components/footer.tsx:20` · **accepted** — portable content package; Next-only primitive would break copyability
- 097 · warning · `nextjs-no-a-element` · `_components/footer.tsx:26` · **accepted** — portable content package; Next-only primitive would break copyability
- 098 · warning · `nextjs-no-a-element` · `_components/footer.tsx:29` · **accepted** — portable content package; Next-only primitive would break copyability
- 099 · warning · `nextjs-no-a-element` · `_components/footer.tsx:32` · **accepted** — portable content package; Next-only primitive would break copyability
- 100 · warning · `nextjs-no-a-element` · `_components/footer.tsx:38` · **accepted** — portable content package; Next-only primitive would break copyability
- 101 · warning · `nextjs-no-a-element` · `_components/footer.tsx:41` · **accepted** — portable content package; Next-only primitive would break copyability
- 102 · warning · `unused-export` · `_components/footer.tsx:97` · **deferred** — separate public-API or component-boundary refactor
- 103 · error · `effect-needs-cleanup` · `_components/header.tsx:17` · **accepted** — false positive; effect returns Motion unsubscribe
- 104 · warning · `nextjs-no-a-element` · `_components/header.tsx:32` · **accepted** — portable content package; Next-only primitive would break copyability
- 105 · warning · `nextjs-no-a-element` · `_components/header.tsx:39` · **accepted** — portable content package; Next-only primitive would break copyability
- 106 · warning · `nextjs-no-a-element` · `_components/header.tsx:42` · **accepted** — portable content package; Next-only primitive would break copyability
- 107 · warning · `nextjs-no-a-element` · `_components/header.tsx:47` · **accepted** — portable content package; Next-only primitive would break copyability
- 108 · warning · `use-lazy-motion` · `_components/hero-example.tsx:16` · **deferred** — measure bundle/runtime impact before changing
- 109 · warning · `unused-export` · `_components/hero-example.tsx:275` · **deferred** — separate public-API or component-boundary refactor
- 110 · warning · `prefer-useReducer` · `_components/hero-example.tsx:275` · **deferred** — separate public-API or component-boundary refactor
- 111 · warning · `rerender-state-only-in-handlers` · `_components/hero-example.tsx:285` · **deferred** — needs profiling or bundle evidence
- 112 · warning · `async-await-in-loop` · `_components/hero-example.tsx:329` · **accepted** — intentional sequential demo animation
- 113 · warning · `no-array-index-as-key` · `_components/hero-example.tsx:377` · **deferred** — mostly static decorative lists; change only with stable domain key
- 114 · error · `effect-needs-cleanup` · `_components/hero-example.tsx:471` · **fixed** — timer cleanup added and route verified
- 115 · warning · `dangerous-html-sink` · `_components/hero-example.tsx:480` · **fixed** — typewriter now writes textContent
- 116 · warning · `dangerous-html-sink` · `_components/hero-example.tsx:495` · **fixed** — typewriter now writes textContent
- 117 · warning · `prefer-use-effect-event` · `_components/hero-example.tsx:514` · **follow-up** — inspect callback semantics; avoid mechanical dependency edits
- 118 · warning · `prefer-use-effect-event` · `_components/hero-example.tsx:514` · **follow-up** — inspect callback semantics; avoid mechanical dependency edits
- 119 · warning · `anchor-is-valid` · `_components/hero-section.tsx:40` · **follow-up** — needs destination, keyboard model, or iframe trust contract
- 120 · warning · `use-lazy-motion` · `_components/highlight-card.tsx:5` · **deferred** — measure bundle/runtime impact before changing
- 121 · warning · `no-array-index-as-key` · `_components/integrations-section.tsx:54` · **deferred** — mostly static decorative lists; change only with stable domain key
- 122 · warning · `rendering-svg-precision` · `_components/logo.tsx:14` · **deferred** — measure bundle/runtime impact before changing
- 123 · warning · `use-lazy-motion` · `_components/workflow-section.tsx:13` · **deferred** — measure bundle/runtime impact before changing
- 124 · warning · `unused-dependency` · `package.json:0` · **fixed** — unused manifest entry and lock edge removed
- 125 · error · `require-reduced-motion` · `package.json:0` · **runtime fixed** — frame MotionProvider honors OS setting; isolated-package scan cannot see boundary
- 126 · error · `low-supply-chain-score` · `package.json:13` · **accepted** — reviewed: no known vulnerability, install hooks, runtime deps, or unlocked artifact

### @uicapsule/expanding-header-menu

- 127 · warning · `use-lazy-motion` · `expanding-header-menu.tsx:18` · **deferred** — measure bundle/runtime impact before changing
- 128 · warning · `click-events-have-key-events` · `expanding-header-menu.tsx:30` · **fixed** — verified in changed-scope scan
- 129 · warning · `nextjs-no-img-element` · `expanding-header-menu.tsx:54` · **accepted** — portable content package; Next-only primitive would break copyability
- 130 · warning · `control-has-associated-label` · `expanding-header-menu.tsx:72` · **fixed** — control now has accessible name
- 131 · warning · `button-has-type` · `expanding-header-menu.tsx:72` · **fixed** — verified in changed-scope scan
- 132 · warning · `nextjs-no-img-element` · `expanding-header-menu.tsx:99` · **accepted** — portable content package; Next-only primitive would break copyability
- 133 · warning · `control-has-associated-label` · `expanding-header-menu.tsx:123` · **fixed** — control now has accessible name
- 134 · warning · `button-has-type` · `expanding-header-menu.tsx:123` · **fixed** — verified in changed-scope scan
- 135 · warning · `button-has-type` · `expanding-header-menu.tsx:136` · **fixed** — verified in changed-scope scan
- 136 · warning · `button-has-type` · `expanding-header-menu.tsx:140` · **fixed** — verified in changed-scope scan
- 137 · warning · `button-has-type` · `expanding-header-menu.tsx:144` · **fixed** — verified in changed-scope scan
- 138 · warning · `button-has-type` · `expanding-header-menu.tsx:150` · **fixed** — verified in changed-scope scan
- 139 · warning · `button-has-type` · `expanding-header-menu.tsx:156` · **fixed** — verified in changed-scope scan
- 140 · warning · `button-has-type` · `expanding-header-menu.tsx:162` · **fixed** — verified in changed-scope scan
- 141 · warning · `button-has-type` · `expanding-header-menu.tsx:173` · **fixed** — verified in changed-scope scan
- 142 · warning · `button-has-type` · `expanding-header-menu.tsx:180` · **fixed** — verified in changed-scope scan
- 143 · warning · `nextjs-no-img-element` · `preview.tsx:17` · **accepted** — portable content package; Next-only primitive would break copyability

### @uicapsule/feed

- 144 · warning · `nextjs-no-img-element` · `preview.tsx:80` · **accepted** — portable content package; Next-only primitive would break copyability
- 145 · warning · `img-redundant-alt` · `preview.tsx:83` · **fixed** — verified in changed-scope scan

### @uicapsule/filter-bar

- 146 · warning · `no-barrel-import` · `_components/active-filters.tsx:14` · **deferred** — measure bundle/runtime impact before changing
- 147 · warning · `unused-export` · `_components/active-filters.tsx:82` · **deferred** — separate public-API or component-boundary refactor
- 148 · warning · `no-barrel-import` · `_components/filter-operator.tsx:20` · **deferred** — measure bundle/runtime impact before changing
- 149 · warning · `unused-export` · `_components/filter-operator.tsx:99` · **deferred** — separate public-API or component-boundary refactor
- 150 · warning · `unused-export` · `_components/filter-operator.tsx:121` · **deferred** — separate public-API or component-boundary refactor
- 151 · warning · `unused-export` · `_components/filter-operator.tsx:277` · **deferred** — separate public-API or component-boundary refactor
- 152 · warning · `no-barrel-import` · `_components/filter-selector.tsx:37` · **deferred** — measure bundle/runtime impact before changing
- 153 · warning · `no-chain-state-updates` · `_components/filter-selector.tsx:77` · **accepted** — React 19 batches these state updates; no measured extra render
- 154 · error · `effect-needs-cleanup` · `_components/filter-selector.tsx:81` · **fixed** — timer cleanup added and route verified
- 155 · warning · `no-event-handler` · `_components/filter-selector.tsx:81` · **fixed** — verified in changed-scope scan
- 156 · warning · `unused-export` · `_components/filter-selector.tsx:212` · **deferred** — separate public-API or component-boundary refactor
- 157 · warning · `unused-export` · `_components/filter-selector.tsx:325` · **deferred** — separate public-API or component-boundary refactor
- 158 · error · `rules-of-hooks` · `_components/filter-selector.tsx:337` · **fixed** — verified in changed-scope scan
- 159 · warning · `js-set-map-lookups` · `_components/filter-selector.tsx:356` · **deferred** — measure bundle/runtime impact before changing
- 160 · warning · `no-barrel-import` · `_components/filter-value.tsx:49` · **deferred** — measure bundle/runtime impact before changing
- 161 · error · `no-ref-current-in-render` · `_components/filter-value.tsx:115` · **fixed** — verified in changed-scope scan
- 162 · warning · `unused-export` · `_components/filter-value.tsx:252` · **deferred** — separate public-API or component-boundary refactor
- 163 · warning · `exhaustive-deps` · `_components/filter-value.tsx:271` · **follow-up** — inspect callback semantics; avoid mechanical dependency edits
- 164 · warning · `unused-export` · `_components/filter-value.tsx:350` · **deferred** — separate public-API or component-boundary refactor
- 165 · warning · `unused-export` · `_components/filter-value.tsx:411` · **deferred** — separate public-API or component-boundary refactor
- 166 · warning · `js-set-map-lookups` · `_components/filter-value.tsx:417` · **deferred** — measure bundle/runtime impact before changing
- 167 · warning · `unused-export` · `_components/filter-value.tsx:456` · **deferred** — separate public-API or component-boundary refactor
- 168 · warning · `js-set-map-lookups` · `_components/filter-value.tsx:462` · **deferred** — measure bundle/runtime impact before changing
- 169 · warning · `unused-export` · `_components/filter-value.tsx:514` · **deferred** — separate public-API or component-boundary refactor
- 170 · warning · `unused-export` · `_components/filter-value.tsx:537` · **deferred** — separate public-API or component-boundary refactor
- 171 · warning · `unused-export` · `_components/filter-value.tsx:551` · **deferred** — separate public-API or component-boundary refactor
- 172 · warning · `unused-export` · `_components/filter-value.tsx:573` · **deferred** — separate public-API or component-boundary refactor
- 173 · warning · `unused-export` · `_components/filter-value.tsx:683` · **deferred** — separate public-API or component-boundary refactor
- 174 · warning · `exhaustive-deps` · `_components/filter-value.tsx:689` · **follow-up** — inspect callback semantics; avoid mechanical dependency edits
- 175 · warning · `js-set-map-lookups` · `_components/filter-value.tsx:695` · **deferred** — measure bundle/runtime impact before changing
- 176 · warning · `unused-export` · `_components/filter-value.tsx:742` · **deferred** — separate public-API or component-boundary refactor
- 177 · warning · `exhaustive-deps` · `_components/filter-value.tsx:748` · **follow-up** — inspect callback semantics; avoid mechanical dependency edits
- 178 · warning · `js-set-map-lookups` · `_components/filter-value.tsx:754` · **deferred** — measure bundle/runtime impact before changing
- 179 · warning · `unused-export` · `_components/filter-value.tsx:801` · **deferred** — separate public-API or component-boundary refactor
- 180 · warning · `unused-export` · `_components/filter-value.tsx:843` · **deferred** — separate public-API or component-boundary refactor
- 181 · warning · `unused-export` · `_components/filter-value.tsx:870` · **deferred** — separate public-API or component-boundary refactor
- 182 · warning · `exhaustive-deps` · `_components/filter-value.tsx:943` · **follow-up** — inspect callback semantics; avoid mechanical dependency edits
- 183 · warning · `unused-export` · `_components/filter-value.tsx:1022` · **deferred** — separate public-API or component-boundary refactor
- 184 · warning · `js-combine-iterations` · `filter-package/core/columns/column-data-service.ts:51` · **deferred** — measure bundle/runtime impact before changing
- 185 · warning · `js-combine-iterations` · `filter-package/core/columns/column-data-service.ts:120` · **deferred** — measure bundle/runtime impact before changing
- 186 · warning · `js-combine-iterations` · `filter-package/core/columns/column-data-service.ts:216` · **deferred** — measure bundle/runtime impact before changing
- 187 · warning · `no-barrel-import` · `filter-package/hooks/use-data-table-filters.ts:22` · **deferred** — measure bundle/runtime impact before changing
- 188 · warning · `exhaustive-deps` · `filter-package/hooks/use-data-table-filters.ts:89` · **follow-up** — inspect callback semantics; avoid mechanical dependency edits
- 189 · warning · `unused-file` · `filter-package/integrations/tanstack-table/filter-fns.ts:0` · **deferred** — separate public-API or component-boundary refactor
- 190 · warning · `unused-file` · `filter-package/integrations/tanstack-table/index.ts:0` · **deferred** — separate public-API or component-boundary refactor
- 191 · warning · `js-index-maps` · `filter-package/integrations/tanstack-table/index.ts:17` · **deferred** — measure bundle/runtime impact before changing
- 192 · warning · `js-set-map-lookups` · `filter-package/lib/array.ts:4` · **deferred** — measure bundle/runtime impact before changing
- 193 · warning · `unused-export` · `filter-package/lib/array.ts:129` · **deferred** — separate public-API or component-boundary refactor
- 194 · warning · `js-set-map-lookups` · `filter-package/lib/array.ts:138` · **deferred** — measure bundle/runtime impact before changing
- 195 · warning · `unused-export` · `filter-package/lib/array.ts:175` · **deferred** — separate public-API or component-boundary refactor
- 196 · warning · `unused-export` · `filter-package/lib/array.ts:246` · **deferred** — separate public-API or component-boundary refactor
- 197 · warning · `unused-export` · `filter-package/lib/filter-fns.ts:217` · **deferred** — separate public-API or component-boundary refactor
- 198 · warning · `unused-export` · `filter-package/lib/helpers.ts:183` · **deferred** — separate public-API or component-boundary refactor
- 199 · warning · `unused-export` · `filter-package/lib/order-fns.ts:206` · **deferred** — separate public-API or component-boundary refactor
- 200 · warning · `no-barrel-import` · `filters.tsx:12` · **deferred** — measure bundle/runtime impact before changing
- 201 · warning · `no-barrel-import` · `preview.tsx:7` · **deferred** — measure bundle/runtime impact before changing

### @uicapsule/geometric-orb

- 202 · warning · `rerender-lazy-ref-init` · `geometric-orb.tsx:72` · **deferred** — needs profiling or bundle evidence

### @uicapsule/gradient-orb

- 203 · warning · `unused-dependency` · `package.json:0` · **fixed** — unused manifest entry and lock edge removed

### @uicapsule/infinite-grid

- 204 · warning · `no-static-element-interactions` · `infinite-grid.tsx:456` · **follow-up** — needs destination, keyboard model, or iframe trust contract
- 205 · warning · `no-permanent-will-change` · `infinite-grid.tsx:479` · **deferred** — measure bundle/runtime impact before changing
- 206 · warning · `no-permanent-will-change` · `infinite-grid.tsx:500` · **deferred** — measure bundle/runtime impact before changing
- 207 · error · `require-reduced-motion` · `package.json:0` · **runtime fixed** — frame MotionProvider honors OS setting; isolated-package scan cannot see boundary
- 208 · warning · `use-lazy-motion` · `preview.tsx:3` · **deferred** — measure bundle/runtime impact before changing
- 209 · warning · `no-scale-from-zero` · `preview.tsx:10` · **deferred** — visual style choice; needs product-motion review
- 210 · error · `alt-text` · `preview.tsx:17` · **fixed** — verified in changed-scope scan

### @uicapsule/ios-volume-slider

- 211 · warning · `use-lazy-motion` · `ios-volume-slider.tsx:3` · **deferred** — measure bundle/runtime impact before changing
- 212 · error · `require-reduced-motion` · `package.json:0` · **runtime fixed** — frame MotionProvider honors OS setting; isolated-package scan cannot see boundary

### @uicapsule/light-dark-toggle

- 213 · warning · `use-lazy-motion` · `light-dark-toggle.tsx:1` · **deferred** — measure bundle/runtime impact before changing
- 214 · error · `require-reduced-motion` · `package.json:0` · **runtime fixed** — frame MotionProvider honors OS setting; isolated-package scan cannot see boundary
- 215 · warning · `button-has-type` · `preview.tsx:14` · **fixed** — verified in changed-scope scan

### @uicapsule/like-button

- 216 · warning · `use-lazy-motion` · `like-button.tsx:5` · **deferred** — measure bundle/runtime impact before changing
- 217 · warning · `no-scale-from-zero` · `like-button.tsx:24` · **deferred** — visual style choice; needs product-motion review
- 218 · warning · `prefer-module-scope-static-value` · `like-button.tsx:45` · **deferred** — low-risk maintainability suggestion; separate cleanup
- 219 · warning · `no-array-index-as-key` · `like-button.tsx:66` · **deferred** — mostly static decorative lists; change only with stable domain key
- 220 · warning · `rerender-functional-setstate` · `like-button.tsx:163` · **deferred** — needs profiling or bundle evidence
- 221 · warning · `rerender-functional-setstate` · `like-button.tsx:166` · **deferred** — needs profiling or bundle evidence
- 222 · warning · `no-scale-from-zero` · `like-button.tsx:185` · **deferred** — visual style choice; needs product-motion review
- 223 · error · `require-reduced-motion` · `package.json:0` · **runtime fixed** — frame MotionProvider honors OS setting; isolated-package scan cannot see boundary

### @uicapsule/radial-slider

- 224 · error · `require-reduced-motion` · `package.json:0` · **runtime fixed** — frame MotionProvider honors OS setting; isolated-package scan cannot see boundary
- 225 · warning · `use-lazy-motion` · `radial-slider.tsx:3` · **deferred** — measure bundle/runtime impact before changing

### @uicapsule/sidebar

- 226 · warning · `unused-file` · `resizable-demo.tsx:0` · **deferred** — separate public-API or component-boundary refactor
- 227 · warning · `nextjs-no-img-element` · `sidebar.tsx:138` · **accepted** — portable content package; Next-only primitive would break copyability
- 228 · warning · `no-static-element-interactions` · `sidebar.tsx:239` · **follow-up** — needs destination, keyboard model, or iframe trust contract

### @uicapsule/snail-timer

- 229 · warning · `button-has-type` · `preview.tsx:15` · **fixed** — verified in changed-scope scan
- 230 · warning · `rendering-svg-precision` · `snail-timer.tsx:65` · **deferred** — measure bundle/runtime impact before changing

### @uicapsule/spinner-pixel-grid

- 231 · warning · `no-match-media-in-state-initializer` · `spinner-pixel-grid.tsx:222` · **follow-up** — plausible defect; verify affected behavior before edit
- 232 · warning · `only-export-components` · `spinner-pixel-grid.tsx:305` · **deferred** — separate public-API or component-boundary refactor
- 233 · warning · `only-export-components` · `spinner-pixel-grid.tsx:305` · **deferred** — separate public-API or component-boundary refactor

### @uicapsule/spreadsheet

- 234 · warning · `no-static-element-interactions` · `components/memoized-table-body.tsx:60` · **follow-up** — needs destination, keyboard model, or iframe trust contract
- 235 · warning · `no-static-element-interactions` · `components/memoized-table-body.tsx:77` · **follow-up** — needs destination, keyboard model, or iframe trust contract
- 236 · warning · `no-static-element-interactions` · `components/resize-handle.tsx:88` · **follow-up** — needs destination, keyboard model, or iframe trust contract
- 237 · warning · `no-static-element-interactions` · `components/spreadsheet.tsx:132` · **follow-up** — needs destination, keyboard model, or iframe trust contract
- 238 · warning · `no-static-element-interactions` · `components/spreadsheet.tsx:155` · **follow-up** — needs destination, keyboard model, or iframe trust contract
- 239 · warning · `exhaustive-deps` · `lib/use-spreadsheet-handlers.ts:280` · **follow-up** — inspect callback semantics; avoid mechanical dependency edits

### @uicapsule/tooltip-grid

- 240 · error · `require-reduced-motion` · `package.json:0` · **runtime fixed** — frame MotionProvider honors OS setting; isolated-package scan cannot see boundary
- 241 · warning · `use-lazy-motion` · `tooltip.tsx:35` · **deferred** — measure bundle/runtime impact before changing
- 242 · warning · `no-chain-state-updates` · `tooltip.tsx:172` · **accepted** — React 19 batches these state updates; no measured extra render
- 243 · warning · `exhaustive-deps` · `tooltip.tsx:174` · **follow-up** — inspect callback semantics; avoid mechanical dependency edits
- 244 · warning · `exhaustive-deps` · `tooltip.tsx:184` · **follow-up** — inspect callback semantics; avoid mechanical dependency edits
- 245 · error · `no-layout-property-animation` · `tooltip.tsx:320` · **fixed** — verified in changed-scope scan
- 246 · error · `no-layout-property-animation` · `tooltip.tsx:321` · **fixed** — verified in changed-scope scan
- 247 · error · `no-layout-property-animation` · `tooltip.tsx:322` · **fixed** — verified in changed-scope scan
- 248 · error · `no-layout-property-animation` · `tooltip.tsx:330` · **fixed** — verified in changed-scope scan
- 249 · error · `no-layout-property-animation` · `tooltip.tsx:331` · **fixed** — verified in changed-scope scan
- 250 · error · `no-layout-property-animation` · `tooltip.tsx:332` · **fixed** — verified in changed-scope scan
- 251 · error · `no-unguarded-browser-global-in-render-or-hook-init` · `tooltip.tsx:340` · **fixed** — verified in changed-scope scan
- 252 · error · `no-layout-property-animation` · `tooltip.tsx:341` · **fixed** — verified in changed-scope scan
- 253 · error · `no-layout-property-animation` · `tooltip.tsx:342` · **fixed** — verified in changed-scope scan
- 254 · error · `no-layout-property-animation` · `tooltip.tsx:343` · **fixed** — verified in changed-scope scan
- 255 · error · `no-unguarded-browser-global-in-render-or-hook-init` · `tooltip.tsx:351` · **fixed** — verified in changed-scope scan
- 256 · error · `no-layout-property-animation` · `tooltip.tsx:352` · **fixed** — verified in changed-scope scan
- 257 · error · `no-layout-property-animation` · `tooltip.tsx:353` · **fixed** — verified in changed-scope scan
- 258 · error · `no-layout-property-animation` · `tooltip.tsx:354` · **fixed** — verified in changed-scope scan

### @uicapsule/voice-dictator

- 259 · error · `require-reduced-motion` · `package.json:0` · **runtime fixed** — frame MotionProvider honors OS setting; isolated-package scan cannot see boundary
- 260 · warning · `use-lazy-motion` · `voice-dictator.tsx:4` · **deferred** — measure bundle/runtime impact before changing
- 261 · warning · `no-giant-component` · `voice-dictator.tsx:47` · **deferred** — separate public-API or component-boundary refactor
- 262 · warning · `prefer-use-effect-event` · `voice-dictator.tsx:353` · **follow-up** — inspect callback semantics; avoid mechanical dependency edits

### @uicapsule/wireframe-orb

- 263 · warning · `unused-dependency` · `package.json:0` · **accepted** — required peer of @react-three/postprocessing


