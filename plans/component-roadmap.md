# Component Roadmap

OS-grade interactions, in the browser. Capsules organized by platform: iOS / Android / TV / Car / AI.
Each entry: the interaction + the detail that makes it feel real.

**Status markers** — `[x]` means built, which is not the same as shipped:

- **landed** — merged and live in `content/` on `main`
- **PR #n** — built and open for review; not on `main` yet
- no marker on an `[x]` — built but neither merged nor in an open PR (investigate)
- `[ ]` — not started

## Flagship

- [x] **dynamic-ai-composer** — bottom-center capsule input w/ dynamic-island physics: one
      continuous container morphing between states (radius continuity + blur crossfade). · **landed**
  - idle: compact pill, placeholder + mic
  - text: expands on focus, action row reveals
  - voice: mic press morphs into listening UI — waveform bars breathing w/ amplitude,
    ambient glow, cancel/confirm
  - thinking: contracts to pill, shimmer sweep around border
  - responding: grows into card, streams tokens w/ blur-in
  - error: shake, red pulse, springs back

## iOS

- [x] **jiggle-mode** — long-press grid → icons wobble (per-icon phase offset), minus badges, drag to reorder while others flow around · [PR #28](https://github.com/kyh/uicapsule/pull/28)
- [x] **context-menu-peek** — long-press: row lifts, page progressively blurs, menu springs from press point. Lift→blur→pop timing is the trick · [PR #29](https://github.com/kyh/uicapsule/pull/29)
- [x] **drum-picker** — time-picker wheel: 3D cylinder, momentum, detent snap, edge fade. Nobody's nailed it on web · [PR #30](https://github.com/kyh/uicapsule/pull/30)
- [x] **pinch-grid** — Photos pinch-zoom: column count reflows mid-gesture, cells interpolate between layouts · [PR #31](https://github.com/kyh/uicapsule/pull/31)
- [x] **swipe-actions** — Mail row: partial swipe reveals buttons, full swipe commits, hysteresis at threshold · [PR #32](https://github.com/kyh/uicapsule/pull/32)
- [x] **passcode-screen** — keypad ripple, dots fill, wrong code = shake, right code = unlock morph · [PR #33](https://github.com/kyh/uicapsule/pull/33)
- [x] **imessage-send** — bubble genie-morphs from composer into thread; tapback picker blooms on long-press · [PR #35](https://github.com/kyh/uicapsule/pull/35)
- [x] **pip-window** — draggable video: flick physics, corner snapping, tuck-to-edge w/ peek tab · [PR #36](https://github.com/kyh/uicapsule/pull/36)
- [x] **screenshot-capture** — flash, thumbnail flies to corner, lingers, swipe-away · [PR #37](https://github.com/kyh/uicapsule/pull/37)
- [x] **control-center-tile** — press small tile → expands in place into full panel, siblings stay put · [PR #38](https://github.com/kyh/uicapsule/pull/38)
- [x] **widget-stack** — Smart Stack vertical page-flip w/ card-roll rotation · [PR #39](https://github.com/kyh/uicapsule/pull/39)
- [x] **siri-edge-glow** — Apple Intelligence border: animated gradient bleeding from screen edges (composer's listening state, standalone) · [PR #34](https://github.com/kyh/uicapsule/pull/34)
- [x] **airdrop-radar** — nearby people ripple outward, tap to send w/ progress ring around avatar · [PR #40](https://github.com/kyh/uicapsule/pull/40)

## Android

- [x] **pattern-unlock** — 9-dot draw w/ glowing trail, error flashes red + shakes · [PR #41](https://github.com/kyh/uicapsule/pull/41)
- [x] **chat-heads** — floating bubble: edge-snap, flick physics, drag to bottom → magnetic X swallows it · [PR #42](https://github.com/kyh/uicapsule/pull/42)
- [x] **predictive-back** — edge-drag: screen shrinks + peels to reveal previous before commit · [PR #43](https://github.com/kyh/uicapsule/pull/43)
- [x] **material-you-theming** — drop in image → palette extracted live → whole demo UI re-themes · [PR #46](https://github.com/kyh/uicapsule/pull/46)
- [x] **overscroll-stretch** — Android 12 squish: content stretches at boundary, no glow · [PR #44](https://github.com/kyh/uicapsule/pull/44)
- [x] **fingerprint-unlock** — hold sensor spot → ripple expands across screen · [PR #45](https://github.com/kyh/uicapsule/pull/45)
- [x] **circle-to-search** — scribble circle over anything → lifts off page w/ shimmer, becomes query · [PR #47](https://github.com/kyh/uicapsule/pull/47)
- [x] **notification-shade** — two-stage pull: peek quick-settings → full expand, M3 Expressive springy tiles · [PR #48](https://github.com/kyh/uicapsule/pull/48)

## TV

- [x] **tv-focus-cards** — Apple TV poster: parallax tilt + specular sheen following focus, arrow-key focus engine, focus sound · [PR #49](https://github.com/kyh/uicapsule/pull/49)
- [x] **epg-grid** — channel guide: 2D focus nav, now-line creeping, focused cell expands · [PR #50](https://github.com/kyh/uicapsule/pull/50)
- [x] **seek-filmstrip** — scrubber w/ thumbnail filmstrip fanning under playhead, chapter snaps · [PR #51](https://github.com/kyh/uicapsule/pull/51)
- [x] **next-episode-card** — countdown ring card slides in, steals focus, ring depletes · [PR #52](https://github.com/kyh/uicapsule/pull/52)

## Tesla

- [x] **tesla-climate** — showpiece replica: temp arc drag + drag-the-airstream vent aiming, flow lines bending live · **landed**
- [ ] **car-status** — top-down car: tap door handles on viz → doors open, lights flash, trunk pops
- [ ] **autopilot-viz** — ambient lane ribbon, neighbor cars drifting as soft blobs, path re-rendering
- [ ] **hold-to-act** — Summon dead-man switch: runs only while held, progress ring, release = instant halt
- [ ] **backup-cam** — trajectory guide lines bending w/ steering slider
- [ ] **charge-screen** — battery fills w/ flowing energy pulse + charge-curve graph drawing itself

## AI interactions

- [x] **ghost-text** — Cursor-style inline completion: gray ghost ahead of caret, tab absorbs it word-by-word · [PR #53](https://github.com/kyh/uicapsule/pull/53)
- [x] **streaming-markdown** — token-by-token render, per-word blur-fade-in, breathing cursor · [PR #54](https://github.com/kyh/uicapsule/pull/54)
- [x] **transcript-settle** — live dictation: interim words wobble/shimmer until confirmed, then settle solid · [PR #55](https://github.com/kyh/uicapsule/pull/55)
- [x] **regen-scrubber** — drag a scrubber through N generated variations like scrubbing latent space · [PR #56](https://github.com/kyh/uicapsule/pull/56)
- [x] **semantic-zoom** — pinch text between abstraction levels: headline ↔ summary ↔ full doc, words morphing · [PR #57](https://github.com/kyh/uicapsule/pull/57)
- [x] **ai-cursor** — second cursor w/ its own trail edits the doc alongside you, multiplayer-style · [PR #58](https://github.com/kyh/uicapsule/pull/58)
- [x] **swipe-approvals** — agent tool calls as cards: swipe right approve, left reject, stack physics · [PR #59](https://github.com/kyh/uicapsule/pull/59)
- [x] **token-confidence** — generated text w/ per-token certainty as opacity/weight; hover a shaky word → alternatives fan out · [PR #60](https://github.com/kyh/uicapsule/pull/60)
- [x] **citation-beams** — hover a citation → beam draws to source panel, passage highlights · [PR #61](https://github.com/kyh/uicapsule/pull/61)
- [x] **diffusion-reveal** — image gen loading: noise → coarse blobs → sharp, real denoise feel · [PR #62](https://github.com/kyh/uicapsule/pull/62)
- [x] **assistant-orb** — orb-family entry: idle / listening / thinking / speaking states w/ distinct motion signatures · [PR #63](https://github.com/kyh/uicapsule/pull/63)
- [x] **vibe-dial** — temperature knob: turning it live-morphs sample output (type, color, copy get weirder) · [PR #64](https://github.com/kyh/uicapsule/pull/64)
- [x] **context-chips** — @-mention: file chips fly into composer, squish in as tokens, overflow stacks · [PR #65](https://github.com/kyh/uicapsule/pull/65)

## Spatial

- [x] **voxel-landing** — landing page as an isometric voxel diorama: scroll pans the camera diagonally through five sections, LED-marquee signs reshuffling glyph cells · [PR #68](https://github.com/kyh/uicapsule/pull/68)

## Shared infra (before scaling out)

- [x] `use-sound` util w/ global mute — half of these need clicks/dings · [PR #66](https://github.com/kyh/uicapsule/pull/66)
- [x] gesture helpers — velocity tracking, hysteresis, detents; the fidelity moat · [PR #66](https://github.com/kyh/uicapsule/pull/66)
