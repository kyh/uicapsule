const FOG = "#e4f0f6";
const INK = "#102534";
// Fjord's dark-theme canvas.
const DEEP = "#091520";
// Fjord's dark-theme text-1.
const DARK_TEXT = "#e8f0f4";
const SANS = "'Fjord Inter', Inter, -apple-system, sans-serif";

const STILL = { reducedMotion: true };

// Chrome rounds a frame's on-stage offset to whole pixels, so every view is written as the
// offset of the iframe's top-left corner (whole px) plus a scale. A move between two such views
// starts and lands without a one-pixel snap.
const view = (ox, oy, scale) => ({ x: (800 - ox) / scale, y: (450 - oy) / scale, scale });

// Every camera is locked off and cuts carry the rhythm: slow pushes stepped the type on the pixel
// grid, and a big push or pull snaps the frame's offset to whole pixels, so its landing stalls a
// frame (and a push-in re-rasters as it grows, dropping to ~30fps under load).
// The hero iframe stops above the meta rule, so the page's fog runs on under the stage and the
// wordmark and tagline sit alone; the icon rail and the crumb bar's rule stay just off stage.
const HERO = view(-135, -122, 2.33);
// The whole product frame floating on the canvas, with the same 37px above and below it. The
// section's intro would show a sliver of its last line above the frame, so a band of canvas
// covers the top 28px.
const RUN = view(-170, -136, 1.171875);
const RUN_BAND = 28;
// The merge card whole on the left, its left edge inside the 16px gap that hides the run card;
// the window's right edge stands in frame, and the fog beyond it, out to the iframe's own edge,
// is the captions' ground. The bottom edge falls between two lines of the code block.
const DECISION = view(-2399, -635, 2.5);

const trace = (theme, at) => ({
  anchor: "screen-trace",
  width: 1600,
  height: 900,
  props: { theme, ...STILL },
  view: at,
});

const caption = ({ at, until, text, color }) => ({
  at,
  until,
  text,
  color,
  kind: "caption",
  x: 1136,
  y: 450,
  valign: "middle",
  in: 0.6,
  out: 0.3,
});

const WIDE_AT = 1.6;
const CLOSE_AT = 3.3;
const DEEP_AT = 5.75;
const WIPE = 0.7;
const DEEP_WIDE_AT = 8.5;
const HOME = 10.4;
const DURATION = 12.5;

window.trailer = {
  slug: "fjord",
  duration: DURATION,
  background: FOG,
  fonts: [
    {
      family: "Fjord Inter",
      src: "file:///Users/kyh/Library/Fonts/Inter-VariableFont_slnt%2Cwght.ttf",
      weight: "100 900",
    },
  ],
  type: {
    base: { family: SANS, color: INK, weight: 400 },
    caption: {
      size: 84,
      weight: 380,
      tracking: -0.03,
      leading: 1.05,
      scrim: false,
      reveal: "mask",
      stagger: 0.1,
    },
  },
  shots: {
    hero: {
      width: 1160,
      height: 330,
      clamp: false,
      props: { theme: "light", typeScale: 1.25, ...STILL },
      view: HERO,
      // The iframe ends at stage y 647; the band carries the fog to the bottom edge so the wipe
      // home reveals fog, not the dark shot underneath.
      band: { height: 264, color: FOG, side: "bottom" },
    },
    wide: { ...trace("light", RUN), band: { height: RUN_BAND, color: FOG } },
    close: trace("light", DECISION),
    deep: trace("dark", DECISION),
    deepWide: { ...trace("dark", RUN), band: { height: RUN_BAND, color: DEEP } },
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

    { at: 0, show: "hero" },

    { at: WIDE_AT, show: "wide" },

    { at: CLOSE_AT, show: "close" },
    caption({ at: CLOSE_AT + 0.25, until: DEEP_AT - 0.05, text: "Ink means\nyour call." }),

    // Deep water rises from the bottom: a re-skin, not a dissolve between two takes.
    {
      at: DEEP_AT,
      show: "deep",
      transition: "wipe",
      dir: "up",
      dur: WIPE,
      ease: "house",
      feather: 80,
      featherColor: "rgb(4 14 22 / 0.28)",
    },
    // After the wipe has landed: the outgoing shot leaves on that frame with a short hitch.
    caption({
      at: DEEP_AT + WIPE + 0.1,
      until: DEEP_WIDE_AT - 0.05,
      text: "Same call,\nafter dark.",
      color: DARK_TEXT,
    }),

    { at: DEEP_WIDE_AT, show: "deepWide" },

    // The fog rolls back in from the top onto the opening frame.
    {
      at: HOME,
      show: "hero",
      transition: "wipe",
      dir: "down",
      dur: WIPE,
      ease: "house",
      feather: 80,
      featherColor: "rgb(4 14 22 / 0.22)",
    },
  ],
};
