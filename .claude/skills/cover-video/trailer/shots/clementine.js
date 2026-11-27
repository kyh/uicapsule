const CLEMENTINE = "#ff8c2b";
const LIME = "#a6d63a";
const BLUEBERRY = "#4d7cff";
const RASPBERRY = "#ff4f7b";

// Chrome rounds a frame's on-stage offset to whole pixels, so the view is written as the offset
// of the iframe's top-left corner (whole px) plus a scale.
const view = (ox, oy, scale) => ({ x: (800 - ox) / scale, y: (450 - oy) / scale, scale });
const OX = -360;
const OY = -229;
const SCALE = 1.45;
// The Send card 22px in on top and sides, its history bleeding off the bottom: a sent row grows
// the card 66px, and any framing that holds the grown card whole also shows the page prose above
// or the next section's heading below.
// Locked off: the glow's box-shadow rasters differently on every scale step, so a push made
// every glowing button flicker.
const SEND = view(OX, OY, SCALE);

// Chrome starts the compositor ~0.2s after trailerStart, so the first tap waits out a still.
const OPEN = 0.45;
const WIPE = 0.7;
const LIME_AT = 2.95;
const BLUE_AT = 5.8;
const RASPBERRY_AT = 8.05;
const HOME_AT = 10.15;
const DURATION = 12;

// The harness has no clicks: the recording batch replays these as real pointer input on the
// active frame. Every shot is first pre-rolled to the state the outgoing shot reaches at its
// wipe (seek so it is on top, tap its prefix of the flow), so a wipe changes only the accent.
// Points are in the frame's own CSS px at its anchor scroll.
const POINTS = {
  teodor: [600, 383],
  one: [1013, 409],
  eight: [1123, 537],
  point: [1013, 601],
  five: [1123, 473],
  del: [1232, 601],
  next: [1123, 675],
  today: [1123, 562],
  send: [1076, 641],
  undo: [1004, 450],
  done: [1123, 450],
};
const TAPS = [
  { at: OPEN + 0.05, on: "one" },
  { at: 0.78, on: "eight" },
  { at: 1.06, on: "five" },
  { at: 1.5, on: "del" },
  { at: 1.85, on: "point" },
  { at: 2.13, on: "five" },
  { at: 4, on: "next" },
  { at: 5, on: "today" },
  { at: 6.85, on: "send" },
  { at: 9.1, on: "undo" },
  { at: 11.2, on: "done" },
];
const onStage = (on) => {
  const [x, y] = POINTS[on];
  return { on, x: x * SCALE + OX, y: y * SCALE + OY };
};
// Tapping the selected payee clears the amount, so every shot starts from $0.00.
const preroll = (until) => [
  onStage("teodor"),
  ...TAPS.filter((tap) => tap.at < until).map((tap) => onStage(tap.on)),
];

const send = (accent) => ({
  anchor: "screen-send",
  height: 1100,
  props: { theme: "light", accent },
  view: SEND,
});

const wipe = (at, show, accent) => ({
  at,
  show,
  transition: "wipe",
  dir: "right",
  dur: WIPE,
  ease: "house",
  edge: accent,
  edgeWidth: 3,
  feather: 72,
  featherColor: `${accent}2e`,
});

window.trailer = {
  slug: "clementine",
  duration: DURATION,
  background: "#ffffff",
  shots: {
    clementine: send(CLEMENTINE),
    lime: send(LIME),
    blueberry: send(BLUEBERRY),
    raspberry: send(RASPBERRY),
    home: send(CLEMENTINE),
  },
  input: {
    // Page margin left of the card: the pointer parks here so no hover rides across a wipe.
    rest: { x: 6, y: 450 },
    preroll: {
      clementine: { seek: 0, taps: preroll(0) },
      lime: { seek: LIME_AT + WIPE + 0.1, taps: preroll(LIME_AT) },
      blueberry: { seek: BLUE_AT + WIPE + 0.1, taps: preroll(BLUE_AT) },
      raspberry: { seek: RASPBERRY_AT + WIPE + 0.1, taps: preroll(RASPBERRY_AT) },
      home: { seek: HOME_AT + WIPE + 0.1, taps: preroll(HOME_AT) },
    },
    taps: TAPS.map((tap) => ({ at: tap.at, ...onStage(tap.on) })),
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

    { at: 0, show: "clementine" },
    wipe(LIME_AT, "lime", LIME),
    wipe(BLUE_AT, "blueberry", BLUEBERRY),
    wipe(RASPBERRY_AT, "raspberry", RASPBERRY),
    wipe(HOME_AT, "home", CLEMENTINE),
  ],
};
