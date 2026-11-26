const SANS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const INK = "#17130f";
const PAPER = "#fdfbf8";
const CREAM = "#f6f1ea";
const CLEMENTINE = "#ff8c2b";
const LIME = "#a6d63a";

const WORDMARK = { weight: 600, tracking: -0.035 };

// Every camera is locked off: the glow's box-shadow rasters differently on every scale step,
// so a push made every glowing button flicker and its landing shimmered on the pixel grid.
// Typing on Send is real input from the recording batch (a pre-roll tap on Teodor's row clears
// the amount while the paper card hides it), not a cue: the harness has no clicks.
// Send's card spans y 173–820 and Payday's 173–834 at their anchors, both x 264–1336.
const SEND = { x: 800, y: 497, scale: 1.34 };
const PLAN = { x: 800, y: 503.5, scale: 1.31 };

// The title card is a shot under a full paper veil: Lime's at the start, Send's at the end, so
// neither the typed-in Send nor a theme ever shows behind it and the seam is paper on paper.
// Paper reaches each screen by a wipe: a full-frame veil fade made the encoder's fade prediction
// step the whole frame's brightness twice on the way.
const paper = (view) => ({ ...view, dim: 1 });
const TITLE_OUT = 1.6;
const OPEN = 1.85;
const PLAN_AT = 5.6;
const NIGHT = 7.0;
const ZEST = 8.6;
const HOME = 11.2;
const WIPE = 0.7;
const ZEST_WIPE = 0.6;
// The outgoing shot leaves on the frame a wipe lands, with a short hitch: type arrives after it.
const LANDED = 0.1;
const DURATION = 13.2;

const MARK =
  '<span style="display:inline-block;width:0.3em;height:0.3em;margin:0 0.3em 0.1em 0;border-radius:999px;background:#ff8c2b;box-shadow:0 0 0 0.09em #ffe1c2;vertical-align:middle"></span>';

// The card fades rather than rises, on whole pixels: a rise left the closing card's layer a
// fraction of a pixel off the opening one, and the loop seam shimmered on the glyph edges.
const titleCard = (at, until) => [
  {
    at,
    until,
    kind: "title",
    html: true,
    text: `${MARK}Clementine`,
    size: 120,
    ...WORDMARK,
    color: INK,
    x: 480,
    y: 428,
    align: "left",
    valign: "bottom",
    reveal: "fade",
  },
  {
    at: at + 0.12,
    until,
    kind: "title",
    text: "Only the next step gets the zest.",
    size: 40,
    weight: 400,
    tracking: -0.015,
    color: "#4f4840",
    x: 538,
    y: 466,
    align: "left",
    valign: "top",
    reveal: "fade",
  },
];

// The payoff super sits in Payday's empty left column, under the ring's note, on the dark shots
// only: it arrives once the night wipe has passed it and leaves before the paper wipe reaches it.
const SUPER = { size: 64, ...WORDMARK, leading: 1.04, color: CREAM, x: 141, align: "left" };

window.trailer = {
  slug: "clementine",
  duration: DURATION,
  background: PAPER,
  type: { base: { family: SANS, color: INK } },
  shots: {
    send: {
      anchor: "screen-send",
      height: 1100,
      clamp: false,
      props: { theme: "light" },
      view: SEND,
      dimColor: PAPER,
    },
    plan: {
      anchor: "screen-payday",
      height: 1100,
      clamp: false,
      props: { theme: "light", accent: CLEMENTINE },
      view: PLAN,
    },
    planDark: {
      anchor: "screen-payday",
      height: 1100,
      clamp: false,
      props: { theme: "dark", accent: CLEMENTINE },
      view: PLAN,
    },
    planLime: {
      anchor: "screen-payday",
      height: 1100,
      clamp: false,
      props: { theme: "dark", accent: LIME },
      view: paper(PLAN),
      dimColor: PAPER,
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

    { at: 0, show: "planLime" },
    ...titleCard(-1, TITLE_OUT + 0.45),
    { at: OPEN, show: "send", transition: "wipe", dir: "up", dur: WIPE, ease: "house" },
    { at: OPEN + WIPE + 0.5, camera: "planLime", to: { ...PLAN, dim: 0 } },

    { at: PLAN_AT, show: "plan" },
    { at: PLAN_AT + 0.5, camera: "send", to: paper(SEND) },

    {
      at: NIGHT,
      show: "planDark",
      transition: "wipe",
      dir: "down",
      dur: WIPE,
      ease: "house",
      feather: 56,
      featherColor: "rgb(23 19 15 / 0.22)",
    },
    {
      at: NIGHT + WIPE + LANDED,
      until: HOME,
      text: "Any theme,",
      ...SUPER,
      y: 774,
      valign: "bottom",
    },
    {
      at: ZEST,
      show: "planLime",
      transition: "wipe",
      dir: "right",
      dur: ZEST_WIPE,
      ease: "house",
      edge: LIME,
      edgeWidth: 3,
    },
    {
      at: ZEST + ZEST_WIPE + LANDED,
      until: HOME,
      text: "any zest.",
      ...SUPER,
      y: 774,
      valign: "top",
    },

    { at: HOME, show: "send", transition: "wipe", dir: "up", dur: WIPE, ease: "house" },
    ...titleCard(HOME + 0.5),
  ],
};
