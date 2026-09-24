# Component Roadmap

OS-grade interactions, in the browser. Capsules organized by platform: iOS / Android / TV / Car / AI.
Each entry: the interaction + the detail that makes it feel real.

**Status markers** — `[x]` means built, which is not the same as shipped:

- **landed** — merged and live in `content/` on `main`
- **PR #n** — built and open for review; not on `main` yet
- no marker on an `[x]` — built but neither merged nor in an open PR (investigate)
- **dropped** — built, then closed as not planned
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

- [x] **jiggle-mode** — long-press grid → icons wobble (per-icon phase offset), minus badges, drag to reorder while others flow around · **landed**
- [x] **context-menu-peek** — long-press: row lifts, page progressively blurs, menu springs from press point. Lift→blur→pop timing is the trick · **landed**
- [x] **drum-picker** — time-picker wheel: 3D cylinder, momentum, detent snap, edge fade. Nobody's nailed it on web · **landed**
- [x] **pinch-grid** — Photos pinch-zoom: column count reflows mid-gesture, cells interpolate between layouts · **landed**
- [x] **swipe-actions** — Mail row: partial swipe reveals buttons, full swipe commits, hysteresis at threshold · **landed**
- [x] **passcode-screen** — keypad ripple, dots fill, wrong code = shake, right code = unlock morph · **landed**
- [x] **imessage-send** — bubble genie-morphs from composer into thread; tapback picker blooms on long-press · **landed**
- [x] **pip-window** — draggable video: flick physics, corner snapping, tuck-to-edge w/ peek tab · **landed**
- [x] **screenshot-capture** — flash, thumbnail flies to corner, lingers, swipe-away · **landed**
- [x] **control-center-tile** — press small tile → expands in place into full panel, siblings stay put · **landed**
- [x] **widget-stack** — Smart Stack vertical page-flip w/ card-roll rotation · **landed**
- [x] **siri-edge-glow** — Apple Intelligence border: animated gradient bleeding from screen edges (composer's listening state, standalone) · **landed**
- [x] **airdrop-radar** — nearby people ripple outward, tap to send w/ progress ring around avatar · **landed**

## Android

- [x] **pattern-unlock** — 9-dot draw w/ glowing trail, error flashes red + shakes · **landed**
- [x] **chat-heads** — floating bubble: edge-snap, flick physics, drag to bottom → magnetic X swallows it · **landed**
- [x] **predictive-back** — edge-drag: screen shrinks + peels to reveal previous before commit · **landed**
- [x] **material-you-theming** — drop in image → palette extracted live → whole demo UI re-themes · **landed**
- [x] **overscroll-stretch** — Android 12 squish: content stretches at boundary, no glow · **landed**
- [x] **fingerprint-unlock** — hold sensor spot → ripple expands across screen · **landed**
- [x] **circle-to-search** — scribble circle over anything → lifts off page w/ shimmer, becomes query · **landed**
- [x] **notification-shade** — two-stage pull: peek quick-settings → full expand, M3 Expressive springy tiles · **landed**

## TV

- [x] **tv-focus-cards** — Apple TV poster: parallax tilt + specular sheen following focus, arrow-key focus engine, focus sound · **landed**
- [x] **epg-grid** — channel guide: 2D focus nav, now-line creeping, focused cell expands · **landed**
- [x] **seek-filmstrip** — scrubber w/ thumbnail filmstrip fanning under playhead, chapter snaps · **landed**
- [x] **next-episode-card** — countdown ring card slides in, steals focus, ring depletes · **landed**

## Tesla

- [x] **tesla-climate** — showpiece replica: temp arc drag + drag-the-airstream vent aiming, flow lines bending live · **landed**
- [ ] **car-status** — top-down car: tap door handles on viz → doors open, lights flash, trunk pops
- [ ] **autopilot-viz** — ambient lane ribbon, neighbor cars drifting as soft blobs, path re-rendering
- [ ] **hold-to-act** — Summon dead-man switch: runs only while held, progress ring, release = instant halt
- [ ] **backup-cam** — trajectory guide lines bending w/ steering slider
- [ ] **charge-screen** — battery fills w/ flowing energy pulse + charge-curve graph drawing itself

## AI interactions

- [x] **ghost-text** — Cursor-style inline completion: gray ghost ahead of caret, tab absorbs it word-by-word · **landed**
- [x] **streaming-markdown** — token-by-token render, per-word blur-fade-in, breathing cursor · **landed**
- [x] **transcript-settle** — live dictation: interim words wobble/shimmer until confirmed, then settle solid · **landed**
- [x] **regen-scrubber** — drag a scrubber through N generated variations like scrubbing latent space · **landed**
- [x] **semantic-zoom** — pinch text between abstraction levels: headline ↔ summary ↔ full doc, words morphing · **landed**
- [x] **ai-cursor** — second cursor w/ its own trail edits the doc alongside you, multiplayer-style · **landed**
- [x] **swipe-approvals** — agent tool calls as cards: swipe right approve, left reject, stack physics · **landed**
- [x] **token-confidence** — generated text w/ per-token certainty as opacity/weight; hover a shaky word → alternatives fan out · **landed**
- [x] **citation-beams** — hover a citation → beam draws to source panel, passage highlights · **landed**
- [x] **diffusion-reveal** — image gen loading: noise → coarse blobs → sharp, real denoise feel · **landed**
- [x] **assistant-orb** — orb-family entry: idle / listening / thinking / speaking states w/ distinct motion signatures · **landed**
- [x] **vibe-dial** — temperature knob: turning it live-morphs sample output (type, color, copy get weirder) · **landed**
- [x] **context-chips** — @-mention: file chips fly into composer, squish in as tokens, overflow stacks · **landed**

## Spatial

- [x] **voxel-landing** — landing page as an isometric voxel diorama: scroll pans the camera diagonally through five sections, LED-marquee signs reshuffling glyph cells · **landed**

## Shared infra (before scaling out)

- [x] `use-sound` util w/ global mute — half of these need clicks/dings · **dropped** — capsules must stay standalone for the registry, so they can't import shared `@repo/ui` helpers (#66)
- [x] gesture helpers — velocity tracking, hysteresis, detents; the fidelity moat · **dropped** — capsules must stay standalone for the registry, so they can't import shared `@repo/ui` helpers (#66)
