// Halogen's dark sheet, tokens.css --hx-page.
const SHEET = "#131210";

const STILL = { motion: false };

// Chrome rounds a frame's on-stage offset to whole pixels, so every view is written as the
// offset of the iframe's top-left corner (whole px) plus a scale.
const view = (ox, oy, scale) => ({ x: (800 - ox) / scale, y: (450 - oy) / scale, scale });

// Halogen's motion rule is "state changes cut": every camera is locked off, the beat is a cut
// every BEAT seconds, and a lamp change is a jump cut on the framing the last phrase ended on.
// Three framings rotated by one per lamp come back to the first after three lamps, so the
// blacklight phrase ends on the opening framing and its jump back to amber is the loop.
// The section captions sit 15px above each screen, so every framing starts inside its screen.
// Credit spend at 1000px wide: the strip down to the footer, the screen's sides 32px in.
const SPEND = view(0, -250, 1.6);
// Run board at 860px: filter bar to the tenth row's rule.
const RUNS = view(-13, -577, 1.89);
// Schema drift at 1000px: the code window, replay list and footer, cut at the diff table's rule.
const DRIFT = view(-800, -1552, 2.4);

const spend = (lamp) => ({
  anchor: "s-spend",
  width: 1000,
  height: 900,
  props: { theme: "dark", lamp, ...STILL },
  view: SPEND,
});
const runs = (lamp) => ({
  anchor: "s-runs",
  width: 860,
  height: 900,
  props: { theme: "dark", lamp, ...STILL },
  view: RUNS,
});
const drift = (lamp) => ({
  anchor: "s-drift",
  width: 1000,
  height: 1100,
  props: { theme: "dark", lamp, ...STILL },
  view: DRIFT,
});

const BEAT = 1.4;
// The take opens and closes on half a beat of the same amber spend, one whole beat across the seam.
const cut = (n) => BEAT / 2 + n * BEAT;

window.trailer = {
  slug: "halogen",
  duration: 12.6,
  background: SHEET,
  // A jump cut is two frames of one page under two lamps, so each framing has a second frame.
  // A frame shown again re-lights while hidden, mid-hold, so its re-render never lands on a cut.
  shots: {
    spendAmber: spend("amber"),
    spendLit: spend("xenon"),
    runsLit: runs("amber"),
    runsBlacklight: runs("blacklight"),
    driftLit: drift("amber"),
    driftXenon: drift("xenon"),
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

    { at: 0, show: "spendAmber" },
    { at: cut(0), show: "runsLit" },
    { at: cut(1), show: "driftLit" },

    { at: cut(2), show: "driftXenon" },
    { at: cut(2) + BEAT / 2, props: "runsLit", set: { lamp: "xenon" } },
    { at: cut(3), show: "spendLit" },
    { at: cut(3) + BEAT / 2, props: "driftLit", set: { lamp: "blacklight" } },
    { at: cut(4), show: "runsLit" },

    { at: cut(5), show: "runsBlacklight" },
    { at: cut(6), show: "driftLit" },
    { at: cut(6) + BEAT / 2, props: "spendLit", set: { lamp: "blacklight" } },
    { at: cut(7), show: "spendLit" },

    { at: cut(8), show: "spendAmber" },
  ],
};
