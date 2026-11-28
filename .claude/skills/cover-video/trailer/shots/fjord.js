// Fjord's light canvas, so the stage past an iframe's edge reads as more page.
const FOG = "#e4f0f6";
const PAGE = { theme: "light", focusHue: 244, radiusScale: 1 };
const SCALE = 1.4;
// Centres the 1120px product window with 16px of fog either side.
const OX = -359;

// Chrome rounds a frame's on-stage offset to whole pixels, so every view is written as the
// offset of the iframe's top-left corner (whole px) plus a scale. A move between two such views
// starts and lands without a one-pixel snap.
const view = (oy) => ({ x: (800 - OX) / SCALE, y: (450 - oy) / SCALE, scale: SCALE });

// The recording prepares every frame over CDP before trailerStart (prep.mjs, spin-sync.mjs,
// freeze-arcs.mjs and take-run.mjs, kept beside the take in the cover-video scratch, not in the
// repo): it hides each screen's heading and intro prose (.fj-screen-intro), the page's breadcrumb
// bar and the section lede above the first window, so the camera falls from window to window and
// never reads as a docs page; it stops every frame's 1Hz clocks on the same tick and holds the
// "Running" spinners still at one phase, so the two frames match at the seam; and it gives the
// tall frame keyboard focus, so a scripted focus() draws the :focus-visible ring. Stills need the same prep.
// The coordinates are for that prepared page: windows at 64 (repo), 1024 (trace), 1800 (swap).

// focusHue paints exactly one thing: the 2px ring on whatever holds the keyboard. So the re-skin
// rides on a Tab walk down the page that take-run.mjs plays inside the tall frame while the camera
// falls: Assign, Sort, Replay, every waterfall row down to the selected merge row, Keep it open,
// Merge, the JSON toggle, Start over, All tasks, the checkbox (ticked, which enables Sign and swap),
// Decline, Sign and swap, Add 10 minutes. The hop times live in walk.mjs beside take-run.mjs;
// keep them inside the windows the camera shows below. The hops stay glacier blue through the
// first fall, the waterfall walk steps the hue 244 up through magenta to 360 and on to 40, and in
// drift 2 the swap window tweens it to 150 while the controls' radii (radiusScale's inner and
// control steps) double. The window and panel radii stay: each step of those re-rasters every
// shadowed panel, and the morph dropped a dozen frames.
// There are no props cues: walk.mjs paints those tokens itself, scoped to the focused element's
// screen (radii to the swap screen). A prop post re-renders all ~23,000px of the page and remounts
// the colour foundation, which is keyed on the hue; every post froze the screencast one to three
// frames, at each hop and at 8Hz through the morph. A screen-scoped token costs a subtree recalc.

// One frame holds Repo overview, Run trace and Model swap, stacked as the page stacks them. Never
// zoom it: a scale step re-rasters all of it and drops one frame in three. It runs 15px into the
// next window so that its foot is still 30px on the stage when the drop ends, under the incoming
// frame: the moment an out-of-process frame leaves the viewport, Chrome throttles it and the
// screencast froze for 15 frames mid-drop. The incoming frame always covers that sliver.
const fjord = { anchor: "screen-repo", height: 2560, clamp: false, props: PAGE };

// The repo window's top 16px below the stage's: its header and the live agent slots. Poster.
const TOP = view(-74);
// The trace window's top 16px below the stage's, as the waterfall's first row comes into reach.
const TRACE_IN = view(-1418);
// The trace window's foot 76px above the stage's: the merge row, the footer, the JSON.
const TRACE_OUT = view(-1595);
// Model swap's breadcrumb bar just in: shadow comparison, Signatures.
const SWAP_IN = view(-2474);
// Model swap's foot 92px above the stage's: one window gap (72px at 1.4) less the next window's
// 16px, so the drop into the repo window below meets it at the page's own spacing.
const SWAP_OUT = view(-2654);
// The drop carries both frames up one stage height with their cameras, not a slide: a slide parks
// the incoming frame wholly below the stage on its first frame, where Chrome throttles it, and
// every slide take dropped a frame on the way up. Moved by camera,
// the repo frame waits with its top 74px on the stage (fog over the swap frame's own fog, with
// the breadcrumb bar and lede hidden), so it is never out of view.
const DROP_SPAN = 900;
const SWAP_GONE = view(-2654 - DROP_SPAN);
const TOP_LOW = view(-74 + DROP_SPAN);

// The camera never rests between OPEN and the end hold: fast falls through the gaps, slow drifts
// while the ring walks a window. The drifts run at exactly 60px/s, one whole pixel a frame, so a
// repeated frame in them is a real drop and not the pixel grid. Each fall's ease is a cubic whose
// end slopes match the drifts (slope = speed * dur / distance), so the joins carry one velocity.
const OPEN = 0.45;
const FALL_1 = { at: OPEN, dur: 3, to: TRACE_IN, ease: [0.42, 0, 0.67, 0.9558] };
const DRIFT_1 = { at: 3.45, dur: 2.95, to: TRACE_OUT, ease: "linear" };
const FALL_2 = { at: 6.4, dur: 1.9, to: SWAP_IN, ease: [0.33, 0.0428, 0.67, 0.9572] };
const DRIFT_2 = { at: 8.3, dur: 3, to: SWAP_OUT, ease: "linear" };
// The drop into the next window leaves at the drift's 60px/s and settles on the poster frame.
const DROP = { at: 11.3, dur: 1.3, ease: [0.33, 0.0286, 0.25, 1] };
// The repo frame turns opaque at once (this curve overshoots 1 and opacity clamps) a quarter second
// before the drop, once the swap window's foot has cleared the strip it covers, so its first draw
// is not on the drop's first frames; the fade's length keeps the swap frame drawn beneath to the end.
const AT_ONCE = [0, 5, 0.1, 1];
const SHOW_HOME = 11.05;

window.trailer = {
  slug: "fjord",
  duration: 13.5,
  background: FOG,
  // The run trace plays from 3s to its gate (about 4s) and only then holds still at the same
  // height; the anchors also scroll smoothly. Start after both, or the first and last frames differ.
  settle: 6,
  shots: {
    fjord: { ...fjord, view: TOP },
    // The loop's landing: only the top of the page is ever shown, so only the repo window is drawn.
    home: { ...fjord, height: 1052, view: TOP },
  },
  cues: [
    // Start marker: drawn only before trailerStart, so the trim finds t=0 to the frame.
    {
      at: -1,
      until: 0.005,
      html: true,
      text: '<div style="width:1600px;height:900px;background:#000"></div>',
      x: 0,
      y: 0,
      align: "left",
      valign: "top",
      size: 0,
      leading: 0,
      reveal: "fade",
      in: 0.01,
      out: 0.001,
    },

    { at: 0, show: "fjord" },
    ...[FALL_1, DRIFT_1, FALL_2, DRIFT_2].map((move) => ({ camera: "fjord", ...move })),

    // Both cameras move as one, so it reads as one more drop down the same page.
    { at: 10, camera: "home", to: TOP_LOW },
    {
      at: SHOW_HOME,
      show: "home",
      transition: "fade",
      dur: DROP.at + DROP.dur - SHOW_HOME,
      ease: AT_ONCE,
    },
    { at: DROP.at, camera: "fjord", to: SWAP_GONE, dur: DROP.dur, ease: DROP.ease },
    { at: DROP.at, camera: "home", to: TOP, dur: DROP.dur, ease: DROP.ease },
  ],
};
