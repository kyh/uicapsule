# Trailer harness

Design-system covers are short trailers: the real `/preview-frame/<slug>` page, framed in
iframes and directed by a shot list. `trailer.html?slug=<slug>` loads `shots/<slug>.js`, which
assigns `window.trailer`. Plain HTML and JS opened over `file://` in agent-browser; no build
step. `shots/example.js` (Vellum) exercises every feature.

Story first: read `.claude/skills/stageshow/references/motion.md` (Story, Loops, Pace) and
`review.md` before writing cues. Three to five beats and a payoff, a camera that pushes in on
the detail that matters and pulls back, every move with a cause, overlapping beats, about two
seconds of reading time per caption, and a last frame identical to the first.

## Config

```js
window.trailer = {
  slug: "vellum", // default slug for every shot
  duration: 14, // seconds, required; covers want 12–15
  background: "#0d0c0a", // stage colour, shown under zoom-outs and transitions
  width: 1600, height: 900, // stage size (default)
  origin: "http://localhost:3000", // where /preview-frame lives (default)
  propRate: 30, // Hz cap for numeric prop tweens (default 30)
  themeProp: "theme", // prop mirrored to the frame shell's light/dark class (default)
  settle: 1, // seconds to wait after every frame is ready (default 1)
  fonts: [{ family: "Trailer Serif", src: "file:///…/Georgia.ttf", weight: 400, style: "normal" }],
  type: { base: {…}, title: {…}, caption: {…}, card: {…} }, // overlay defaults per kind
  shots: { <id>: Shot },
  cues: [Cue, …],
};
```

### Shot

One iframe, preloaded and kept alive for the whole take. Keep it to about six: each is a full
page. Inactive shots sit at opacity 0.

| field                            | meaning                                                                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slug`                           | page to load; defaults to `trailer.slug`                                                                                                                                                  |
| `url`                            | full URL instead of `origin/preview-frame/<slug>`                                                                                                                                         |
| `anchor`                         | section id to scroll to once the page has rendered (`"f-color"`, `"in-use"`)                                                                                                              |
| `width`, `height`                | iframe size, default 1600×900; make it taller (`height: 2400`) for a vertical pan                                                                                                         |
| `props`                          | initial control values, posted as soon as the frame is ready. Declare every prop you tween here, or the tween has no start value and jumps                                                |
| `theme`                          | force the shell's `light`/`dark` class; otherwise mirrors `props[themeProp]`                                                                                                              |
| `view`                           | initial camera (see Camera)                                                                                                                                                               |
| `clamp`                          | default `true`: the camera never shows past the iframe's edges while it fills the stage                                                                                                   |
| `radius`, `shadow`, `background` | style the framed page, for zoom-outs where it floats on `background`                                                                                                                      |
| `dimColor`                       | colour of the `dim` layer (default black)                                                                                                                                                 |
| `band`                           | `{ height, color, side? }`: a solid strip across the stage's `top` (default) or `bottom` edge, drawn inside the shot over the frame, so transitions carry it. A clean ground for captions |

### Camera (`view`, and `to` in camera cues)

`{ x, y, scale, dim, blur }`: `(x, y)` is the point of the iframe, in its own CSS px, that sits
at the stage centre; `scale` zooms about it. The default `{ x: 800, y: 450, scale: 1 }` shows
the iframe's top-left 1600×900. `rect: [x, y, w, h]` instead fits that box to the stage
(centre and scale worked out for you). `dim` (0–1) darkens the shot for type over it. `blur` is
in px and expensive (see Gotchas). Coordinates are the frame's viewport after its anchor scroll:
find them on a `trailerSeek` still.

### Cues

Absolute times in seconds; order doesn't matter. Each keeps only the keys it names, so a later
cue on `dim` leaves an earlier `scale` move running.

| cue                                                | effect                                                                                                                                                                                                                                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{ at, show: id, transition?, dur?, ease?, dir? }` | make `id` the active shot. `transition`: `"cut"` (default), `"fade"` (crossfade), `"push"` (push-through: outgoing scales into the lens, incoming settles from 0.94), `"slide"` (`dir`: `left` default, `right`, `up`, `down`), `"wipe"` (see below). `dur` default 0.8 |
| `{ at, camera: id, to: View, dur?, ease? }`        | camera move on shot `id` from wherever it is at `at`. No `dur` = instant (use it to reset a hidden shot for the loop)                                                                                                                                                   |
| `{ at, props: id, set: {…} }`                      | post control values at `at`                                                                                                                                                                                                                                             |
| `{ at, props: id, tween: {…}, dur?, ease? }`       | interpolate numbers (and `#rrggbb` colours) from their current value, posted at ≤ `propRate`; any other value switches halfway                                                                                                                                          |
| `{ at, text, until?, kind?, …Type }`               | type overlay from `at` to `until` (default: the end)                                                                                                                                                                                                                    |

### Wipe

`{ at, show: id, transition: "wipe", dir, dur?, ease?, edge?, edgeWidth?, feather?, featherColor? }`
reveals `id` behind a moving edge, for a re-skin: both shots stay fully opaque, so light to dark
never passes through grey. `dir` is the way the edge travels (`down` floods from the top). The
incoming shot holds still while its edge moves; give both shots the same view (and the same
camera cues, if the camera moves through the wipe). `edge` draws a line of that colour on the
edge (`edgeWidth` px, default 2); `feather` hangs a gradient of `featherColor` (default
`rgb(0 0 0 / 0.3)`) that many px long off the edge, over the outgoing shot, like a sheet's
shadow. Give each shot its own `band` so the caption ground changes with the wipe.

### Type overlays

`kind` picks the defaults: `title` (96px, centred), `caption` (34px, bottom-left at 96px in),
`card` (120px, centred over a full-stage `cardBackground` that fades in with it: the end card).
Merge order: built-in kind → `type.base` → `type[kind]` → the cue.

| option                                                                          | meaning                                                                                                                                                     |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`                                                                          | string; `\n` breaks lines, each revealed `stagger` s apart (default 0.08). `html: true` reads it as markup                                                  |
| `family`, `size`, `weight`, `color`, `tracking` (em), `leading`                 | type                                                                                                                                                        |
| `x`, `y`, `align` (`left`/`center`/`right`), `valign` (`top`/`middle`/`bottom`) | the anchor point and which edge of the block sits on it                                                                                                     |
| `maxWidth`                                                                      | wrap at this width                                                                                                                                          |
| `reveal`                                                                        | `"rise"` (fade + 0.32em rise, default), `"mask"` (line slides up out of its own clip), `"blur"` (defocus to sharp), `"fade"`                                |
| `in`, `out`                                                                     | reveal durations (0.7 / 0.45 s); `out` ends at `until`                                                                                                      |
| `inEase`, `outEase`                                                             | override the reveal curves (default `arrive`/`settle` in, `through` out)                                                                                    |
| `scrim`                                                                         | `true`/`"bottom"`, `"top"`, `"left"`, `"right"` or `"full"`: a gradient behind the text that fades with it; `scrimColor`, `scrimReach` (% of the stage, 55) |
| `shadow`                                                                        | `true` for a soft text shadow, or a CSS `text-shadow`                                                                                                       |
| `cardBackground`                                                                | the card kind's backdrop (default `background`)                                                                                                             |
| `style`                                                                         | raw CSS overrides for the text block                                                                                                                        |

### Easing

`ease` takes a name or a `[x1, y1, x2, y2]` cubic-bezier. Names, from stageshow's `kit/ease.ts`:
`house` (moves inside a shot, 1.4–2.7 s; the default), `through` (accelerates into a cut),
`settle` (arrives at speed after a cut), `camera` (the kit's push-in), `enter`, `trip`,
`arrive` (`0.25, 0.8, 0.25, 1`: something arriving from nowhere), `ui` (product-speed
feedback), `linear`.

## Runtime

- `window.trailerReady`: true once every frame posted `uicapsule:ready`, anchors scrolled,
  initial props posted, fonts loaded, each shot primed and `settle` elapsed.
- `window.trailerStart()`: plays from t=0. `window.trailerDone` turns true at `duration`.
- `await window.trailerSeek(t)`: renders t for a still (camera, active shot, overlays, and each
  shot's props as of t). Give a props change ~0.5 s to re-render before the screenshot.
- `window.trailerStatus()`: which frames are ready; `window.trailerError`: a shot-list error.
- `?t=5` opens seeked to 5 s. `?debug=1` adds a scrubber, play and loop; never record with it.

Everything the harness draws is a pure function of t, sampled into paused Web Animations, so a
take runs on the compositor and a seek is exact. The pages themselves keep their own live motion.

## Recording

Same as the cover-video skill, opening the harness instead of the frame:

```bash
S=trailer-<slug>; OUT=<scratch>/trailers
agent-browser --session $S close
agent-browser --session $S set viewport 1600 900          # before open
agent-browser --session $S open "file://$PWD/.claude/skills/cover-video/trailer/trailer.html?slug=<slug>"
until [ "$(agent-browser --session $S eval 'window.trailerReady')" = "true" ]; do sleep 1; done
agent-browser --session $S eval "document.visibilityState + ' ' + innerWidth + 'x' + innerHeight"  # visible 1600x900
agent-browser --session $S record start $OUT/<slug>.raw.mp4 --fps 60
agent-browser --session $S eval "trailerStart()"
sleep <duration + 0.5>
agent-browser --session $S eval "window.trailerDone"       # true
agent-browser --session $S record stop
```

The take holds the t=0 frame for a moment before `trailerStart` lands. Open on a still of about
0.45s (`OPEN` in `shots/vellum.js`): Chrome starts the compositor animations ~0.2s after
`trailerStart`, so motion at t=0 plays compressed and the trim lands mid-move. Trim from the first
changed frame minus that still (`LEAD`), and pad the tail, because the screencast stops emitting
frames once the end hold is still:

```bash
HEAD=$(ffmpeg -hide_banner -i $OUT/<slug>.raw.mp4 -vf "freezedetect=n=-60dB:d=0.01" -map 0:v -f null - 2>&1 \
  | awk '/freeze_start/ {s=$NF} /freeze_end/ {if (s+0 == 0) print $NF; exit}')
START=$(printf "%.4f" $(echo "${HEAD:-0} - <LEAD>" | bc))
ffmpeg -y -ss $START -i $OUT/<slug>.raw.mp4 -vf tpad=stop_mode=clone:stop_duration=0.5 \
  -t <duration> -c:v libx264 -crf 18 -preset slow \
  -pix_fmt yuv420p -color_range tv -an -movflags +faststart $OUT/<slug>.mp4
```

End on the same still as t=0, so a frame of error at the seam is invisible. Then frame-check as
the skill says.

## Gotchas

- **Zooms are primed.** Chrome re-rasters an out-of-process frame on every scale step until it
  has once been drawn at about 1.5×, halving the frame rate of a push-in. The harness holds each
  shot at 1.5× for a few frames before `trailerReady` (invisible: inactive shots are at opacity
  0, which keeps their raster; `visibility: hidden` would not). A prop change re-renders the page
  and can drop that priming: put zooms on a shot before its props change, or on another shot.
- **Blur is expensive.** An animated `blur` (camera or the `blur` reveal on a big line) redraws a
  full-page surface every frame and drops to ~30fps. Prefer `dim` and scale; if you blur, hold it.
- **Prop tweens run at the page's pace.** Each post re-renders the whole design-system page, so a
  `radiusScale` tween updates at ~30Hz while the camera stays at 60. Keep tweens short and let the
  camera carry the motion. A theme flip costs one ~50ms hitch: cut or cover it if it shows.
- **Anchors scroll after render.** The frame's own fragment scroll runs before React has drawn
  anything, so the harness re-applies the hash after `uicapsule:ready`.
- **Captions need contrast you choose.** A dark scrim over a light page reads as mud; use a light
  `scrimColor` and dark ink on light pages, and switch both on a dark shot.
- **Wipes are transforms, not `clip-path`.** The incoming shot's box slides with the edge while
  its contents slide back the same distance inside an `overflow: hidden` mask, so the picture
  holds still and only the edge moves. Both are transforms, so the wipe runs on the compositor
  and holds 60fps; an animated `clip-path` would repaint on the main thread every frame.
- **The screencast idles after a still.** A move that follows a hold of half a second or more
  recorded at ~15fps for its first ~0.3s in three takes of three. The harness keeps a 4px pulse,
  below one luma step, in the bottom-right corner, which holds it at 60. Don't remove it.
- **Holds stay under ~2s** and slow zooms over 2%: a hold past ~2.2s can stall the screencast
  ~270ms on the next change, and a sub-2% zoom steps text on the pixel grid.
- **Cuts are hard steps.** Samples interpolate linearly, so the harness adds the states either
  side of every cut, and of every overlay `in`/`out` shorter than a frame, at the same offset.
  For an overlay that swaps exactly on a cut, start it at `cut - 1e-7` with `in: 1e-7` (or end it
  at the cut with `out: 1e-7`); a one-frame-early start shows on the outgoing shot.
- **A prop change lands four or five frames after its post.** To land a re-skin with an overlay
  swap, post it ~0.075s early (`RERENDER` in `shots/halogen.js`); the re-render's hitch then falls
  on a still frame.
- **Start a super after motion is under way**, never on a cut or a still frame: the screencast
  freezes it half-revealed and then pops it. Mask a super in with `arrive`; `settle` starts so
  steep that its first frame already shows a third of the line.
- **The seam.** Reset any shot you return to with an instant camera cue while it is hidden, and
  end on the same shot, view and props as t=0.
