const MONO =
  "'Commit Mono', 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace";

const PAPER = "#fdfcf9";

// Halogen's own strip cell, per theme: tokens.css --hx-page/--hx-panel, --hx-rule, --hx-ink-3.
const CELL = {
  light: { ground: PAPER, rule: "#e1ddd2", label: "#6d685e" },
  dark: { ground: "#1a1916", rule: "#2d2b26", label: "#9f998d" },
};
const LAMP_TEXT = {
  light: { amber: "#7a5000" },
  dark: { amber: "#ffbe2e", xenon: "#8ec5ff", blacklight: "#c2a3ff" },
};
const LAMP_FILL = "#ffbe2e";

const LABEL = 26;
// Shorter than the 1e-6 s the harness samples either side of a cut, so an overlay that starts
// or ends with a hard reveal steps on the cut frame exactly.
const HARD = 1e-7;
const PAD = { top: 14, side: 26, bottom: 16 };

// Overlays are drawn on the stage, not in the camera, so every one of them is only on screen
// while its shot's camera holds still.

// Cells sit in the Credit spend board's empty left column, under the five team rows, at SPEND.
const CELL_AT = { x: 66, y: 752 };

const cellBox = ({ at, until, theme, in: inDur = HARD }) => ({
  at,
  until,
  html: true,
  text: `<div style="padding:${PAD.top}px ${PAD.side}px ${PAD.bottom}px;min-width:330px;background:${CELL[theme].ground};border:1px solid ${CELL[theme].rule}"><div>LAMP</div><div style="font-size:2em">&nbsp;</div></div>`,
  family: MONO,
  size: LABEL,
  weight: 400,
  tracking: 0.08,
  leading: 1.5,
  color: CELL[theme].label,
  x: CELL_AT.x,
  y: CELL_AT.y,
  align: "left",
  valign: "bottom",
  reveal: "fade",
  in: inDur,
  out: HARD,
});

const valueAt = { x: CELL_AT.x + 1 + PAD.side, y: CELL_AT.y - 1 - PAD.bottom };

// The value swaps in one frame, with the page: a roll stuttered on the page's re-render hitch.
const cellValue = ({ at, until, theme, lamp }) => ({
  at,
  until,
  text: lamp,
  family: MONO,
  size: LABEL * 2,
  weight: 400,
  tracking: -0.01,
  leading: 1.5,
  color: LAMP_TEXT[theme][lamp],
  ...valueAt,
  align: "left",
  valign: "bottom",
  reveal: "fade",
  in: HARD,
  out: HARD,
});

// A rise is 0.32em of the overlay's own size, so the value is set at 2em inside a LABEL-sized
// overlay: it rises about 8px with its fade instead of 17px through the cell's bottom edge.
const cellValueRise = ({ at, until, theme, lamp, in: inDur }) => ({
  at,
  until,
  html: true,
  text: `<span style="font-size:2em;letter-spacing:-0.01em">${lamp}</span>`,
  family: MONO,
  size: LABEL,
  weight: 400,
  tracking: 0,
  leading: 1.5,
  color: LAMP_TEXT[theme][lamp],
  ...valueAt,
  align: "left",
  valign: "bottom",
  reveal: "rise",
  in: inDur,
  out: HARD,
});

// The hero at 760px wide stacks the status strip into two rows, so the title plate fills 16:9.
// It never zooms: a shot rasters differently after a zoom, so a pull-back into the last frame
// leaves the loop seam shimmering against the never-zoomed first frame.
const HERO = { x: 380, y: 322, scale: 1.82 };

// The lamp over the tagline's "one amber filament" at HERO, multiplied so the ink shows.
const LAMP_WORDS = { x: 752.7, y: 231.6, w: 358.5, h: 48.2 };
const wordsLamp = ({ at, until }) => ({
  at,
  until,
  html: true,
  text: `<div style="width:${LAMP_WORDS.w}px;height:${LAMP_WORDS.h}px;background:${LAMP_FILL}"></div>`,
  x: LAMP_WORDS.x,
  y: LAMP_WORDS.y,
  align: "left",
  valign: "top",
  size: 0,
  leading: 0,
  reveal: "fade",
  in: HARD,
  out: HARD,
  style: { mixBlendMode: "multiply" },
});

// Halogen's motion rule is "state changes cut", so every camera is locked off and every
// change lands on a cut: a push on these pages read as drift and stuttered in the take.
const RUNS = { x: 500, y: 536.8, scale: 1.62 };
const SPEND = { x: 534, y: 402, scale: 1.5 };

const STILL = { motion: false };
const RUNS_AT = 2.3;
const SPEND_AT = 3.9;
const LIGHTS_OUT = 6.0;
const XENON = 7.1;
const BLACKLIGHT = 8.2;
const AMBER = 9.3;
const CLOSE = 10.6;
// A lamp change reaches the screen four or five frames after its post, so it is posted that
// early and lands with the cell's swap.
const RERENDER = 0.075;

window.trailer = {
  slug: "halogen",
  duration: 13,
  background: PAPER,
  shots: {
    hero: {
      width: 760,
      height: 560,
      clamp: false,
      props: { theme: "light", ...STILL },
      view: HERO,
    },
    runs: {
      anchor: "s-runs",
      width: 1000,
      height: 830,
      clamp: false,
      props: { theme: "light", ...STILL },
      view: RUNS,
    },
    spendLight: {
      anchor: "s-spend",
      width: 1068,
      height: 712,
      clamp: false,
      props: { theme: "light", lamp: "amber", ...STILL },
      view: SPEND,
    },
    spendDark: {
      anchor: "s-spend",
      width: 1068,
      height: 712,
      clamp: false,
      props: { theme: "dark", lamp: "amber", ...STILL },
      view: SPEND,
    },
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
    wordsLamp({ at: 0.4 - HARD, until: RUNS_AT }),

    { at: RUNS_AT, show: "runs" },

    { at: SPEND_AT, show: "spendLight" },
    cellBox({ at: SPEND_AT + 0.45, until: LIGHTS_OUT, theme: "light", in: 0.6 }),
    cellValueRise({
      at: SPEND_AT + 0.65,
      until: LIGHTS_OUT,
      theme: "light",
      lamp: "amber",
      in: 0.6,
    }),

    { at: LIGHTS_OUT, show: "spendDark" },
    cellBox({ at: LIGHTS_OUT - HARD, until: CLOSE, theme: "dark" }),
    cellValue({ at: LIGHTS_OUT - HARD, until: XENON, theme: "dark", lamp: "amber" }),
    { at: XENON - RERENDER, props: "spendDark", set: { lamp: "xenon" } },
    cellValue({ at: XENON - HARD, until: BLACKLIGHT, theme: "dark", lamp: "xenon" }),
    { at: BLACKLIGHT - RERENDER, props: "spendDark", set: { lamp: "blacklight" } },
    cellValue({ at: BLACKLIGHT - HARD, until: AMBER, theme: "dark", lamp: "blacklight" }),
    { at: AMBER - RERENDER, props: "spendDark", set: { lamp: "amber" } },
    cellValue({ at: AMBER - HARD, until: CLOSE, theme: "dark", lamp: "amber" }),

    { at: CLOSE, show: "hero" },
    wordsLamp({ at: CLOSE - HARD, until: CLOSE + 1.3 }),
  ],
};
