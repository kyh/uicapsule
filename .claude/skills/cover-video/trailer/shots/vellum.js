const INK = "rgb(21 18 14 / 0.8)";
const INK_60 = "rgb(21 18 14 / 0.62)";
const NIGHT_INK = "#f3f0ea";
const PAGE = "#f7f5f0";
const NIGHT_PAGE = "#0d0c0a";
const SANS = "'Vellum Sans', Geist, Inter, -apple-system, sans-serif";
const MARK = `<svg viewBox="0 0 22 22" style="width:0.62em;height:0.62em;margin-right:0.2em;vertical-align:-0.02em"><rect fill="#efece5" height="22" rx="7" width="22"/><rect fill="#fffefb" height="16" rx="4.5" stroke="rgb(21 18 14 / 0.06)" width="16" x="3" y="3"/><rect fill="rgb(21 18 14 / 0.8)" height="1.5" rx="0.75" width="10" x="6" y="8"/><rect fill="rgb(21 18 14 / 0.45)" height="1.5" rx="0.75" width="7" x="6" y="11.5"/></svg>`;

// Captions sit on a strip of the screen's own ground, drawn inside each shot so the dark wipe
// carries its strip with it.
const BAND = 210;

// 816px is the widest frame that keeps the In-use screens in one column (two from 820).
const page = (anchor, theme, view, ground) => ({
  anchor,
  width: 816,
  height: 1000,
  props: { theme, reducedMotion: true },
  view,
  clamp: false,
  band: { height: BAND, color: ground },
});

// The screens sit in a 16px gutter of document paper, so no framing goes below 2.04x, where the
// screen's own ground fills the stage edge to edge.
const ROUTING = { x: 408, y: 312, scale: 2.04 };
const ROUTING_IN = { x: 408, y: 300, scale: 2.2 };
const TRIAGE_TOP = { x: 408, y: 283, scale: 2.25 };
const TRIAGE = { x: 408, y: 406, scale: 2.24 };

const TITLE = { html: true, kind: "title", reveal: "mask", y: 420, size: 132, tracking: -0.035 };
const LINE = {
  kind: "caption",
  reveal: "mask",
  scrim: false,
  align: "center",
  valign: "top",
  x: 800,
  y: 520,
  size: 34,
  weight: 400,
  color: INK_60,
};

// A paper sheet as one masked line. A mask exit also fades, so it lifts off translucent, the way
// vellum does, and lays back down opaque.
const SHEET = {
  html: true,
  kind: "caption",
  reveal: "mask",
  scrim: false,
  text: `<div style="width:1600px;height:900px;background:${PAGE};box-shadow:0 18px 40px -12px rgb(21 18 14 / 0.28)"></div>`,
  x: 0,
  y: 0,
  align: "left",
  valign: "top",
  size: 0,
  leading: 0,
};

// A caption that starts on a cut, or on a still frame, records frozen half-masked for up to
// ~0.27s and then pops, so each one starts a beat after something is already moving.
const caption = (at, until, text, night = false) => ({
  kind: "caption",
  at,
  until,
  text,
  reveal: "mask",
  align: "center",
  valign: "middle",
  x: 800,
  y: BAND / 2 + 4,
  size: 80,
  weight: 500,
  tracking: -0.03,
  color: night ? NIGHT_INK : INK,
  in: 0.75,
  out: 0.35,
  inEase: "arrive",
  outEase: [0.6, 0, 0.9, 0.5],
});

// The take opens on a still title: Chrome starts the compositor animations ~0.2s late, so
// any motion in the first moments is lost to the recording.
const OPEN = 0.45;
const CUT = 3.6;
const WIPE = 6.4;
const CLOSE = 9.5;

window.trailer = {
  slug: "vellum",
  duration: 12.5,
  background: PAGE,
  fonts: [
    {
      family: "Vellum Sans",
      src: "file:///Users/kyh/Library/Fonts/GeistVF.ttf",
      weight: "100 900",
    },
  ],
  type: {
    base: { family: SANS, color: INK, weight: 500 },
  },
  shots: {
    routing: page("s-routing", "light", ROUTING, PAGE),
    triage: page("s-triage", "light", TRIAGE_TOP, PAGE),
    triageDark: page("s-triage", "dark", TRIAGE, NIGHT_PAGE),
  },
  cues: [
    { at: -1, until: OPEN + 0.95, ...SHEET, in: 0.01, out: 0.6, outEase: [0.6, 0, 0.4, 1] },
    {
      at: -1,
      until: OPEN + 0.35,
      text: `${MARK}Vellum`,
      ...TITLE,
      in: 0.01,
      out: 0.35,
      outEase: "house",
    },
    {
      at: -1,
      until: OPEN + 0.3,
      text: "Iron-gall ink for AI products",
      ...LINE,
      in: 0.01,
      out: 0.3,
      outEase: "house",
    },

    { at: 0, show: "routing" },
    { at: OPEN + 0.8, camera: "routing", to: ROUTING_IN, dur: 1.8, ease: "house" },
    caption(OPEN + 1.1, CUT, "Colour only for verdicts"),

    { at: CUT, show: "triage" },
    caption(CUT + 0.4, WIPE + 0.05, "One glossy button: the next step"),
    { at: CUT + 0.3, camera: "triage", to: TRIAGE, dur: 2, ease: "house" },

    {
      at: WIPE,
      show: "triageDark",
      transition: "wipe",
      dir: "down",
      dur: 0.7,
      ease: [0.7, 0, 0.25, 1],
      feather: 56,
      featherColor: "rgb(13 12 10 / 0.2)",
    },
    caption(WIPE + 0.35, CLOSE, "Same ink, dark paper", true),

    { at: CLOSE, ...SHEET, in: 0.45, inEase: [0.3, 0, 0.2, 1] },
    { at: CLOSE + 0.55, text: `${MARK}Vellum`, ...TITLE, in: 0.85, inEase: [0.3, 0.5, 0.2, 1] },
    {
      at: CLOSE + 0.8,
      text: "Iron-gall ink for AI products",
      ...LINE,
      in: 0.75,
      inEase: [0.3, 0.5, 0.2, 1],
    },
    { at: CLOSE + 0.5, camera: "routing", to: ROUTING },
    { at: CLOSE + 0.5, camera: "triage", to: TRIAGE_TOP },
  ],
};
