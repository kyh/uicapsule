const GROUND = "#f7f5f0";

const TIGHT = { density: "compact", radiusScale: 0.3 };

const screen = (anchor, settings, view, size = {}) => ({
  anchor,
  props: { theme: "light", reducedMotion: true, ...settings },
  view,
  clamp: false,
  ...size,
});

// Density is a discrete control, so a step reflows the whole layout in one frame. Each breathing
// shot loads the dev frame's own shell plus a listener that eases the tokens behind density and
// radius itself: `space` (0 compact, 0.5 default, 1 comfortable) interpolates the density
// tokens between the values the page's compact and comfortable blocks resolve to, and `radius`
// is --radius-scale. Posts carrying only those keys stop here, so React never re-renders.
// The override is scoped to the shot's own screen, redeclaring the tokens derived from
// --radius-scale there (custom properties inherit resolved): restyling and reflowing the whole
// page every frame halved the take's frame rate, and the screens above would push it down.
// Density only moves control and row heights; Action items is a padded stack, so its rows hold.
const BREATH_TOKENS = ["--control-sm", "--control", "--control-lg", "--row"];
function breathShell(scope, tokens) {
  const style = document.createElement("style");
  const live = {};
  let base = null;
  const resolve = (density) => {
    const probe = document.createElement("div");
    probe.className = "ds-vellum";
    probe.dataset.density = density;
    probe.style.cssText = "position:absolute;visibility:hidden";
    document.body.append(probe);
    const css = getComputedStyle(probe);
    const values = tokens.map((token) => Number.parseFloat(css.getPropertyValue(token)));
    probe.remove();
    return values;
  };
  const derived = (rules, out) => {
    for (const rule of rules) {
      if (rule.cssRules) derived(rule.cssRules, out);
      if (rule.selectorText !== ".ds-vellum") continue;
      for (const name of rule.style) {
        const value = rule.style.getPropertyValue(name);
        if (name.startsWith("--") && value.includes("var(--radius-scale")) {
          out.push(`${name}:${value}`);
        }
      }
    }
    return out;
  };
  addEventListener("message", (event) => {
    const values = event.data?.type === "uicapsule:props" ? event.data.values : null;
    if (!values || !("space" in values || "radius" in values)) return;
    Object.assign(live, values);
    base ??= {
      lo: resolve("compact"),
      hi: resolve("comfortable"),
      radii: [...document.styleSheets].flatMap((sheet) => derived(sheet.cssRules, [])),
    };
    const rules = tokens.map(
      (token, i) =>
        `${token}:${(base.lo[i] + (base.hi[i] - base.lo[i]) * live.space).toFixed(3)}px!important`,
    );
    rules.push(`--radius-scale:${live.radius.toFixed(4)}!important`, ...base.radii);
    style.textContent = `#${scope}{${rules.join(";")}}`;
    if (!style.isConnected) document.head.append(style);
    if (Object.keys(values).every((key) => key === "space" || key === "radius")) {
      event.stopImmediatePropagation();
    }
  });
}
const DEV = "http://localhost:5174";
const breathingShell = (slug, scope) =>
  `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html>
<html lang="en" class="h-full">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>document.documentElement.classList.add(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");(${breathShell})(${JSON.stringify(scope)},${JSON.stringify(BREATH_TOKENS)})</script>
<script type="module">import RefreshRuntime from "${DEV}/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$ = () => {};window.$RefreshSig$ = () => (type) => type;window.__vite_plugin_react_preamble_installed__ = true;</script>
<script type="module" src="${DEV}/@vite/client"></script>
<script type="module" src="${DEV}/@preview/${slug}.js"></script>
</head>
<body class="bg-background text-foreground font-sans antialiased h-full">
<div id="root" style="display:contents"></div>
</body>
</html>`)}`;

// 816px keeps the In-use screens in one column (two from 820), so a screen's own ground fills
// the stage edge to edge from 2.04x.
const NARROW = { width: 816, height: 1000 };

// Chrome rounds a frame's on-stage offset to whole pixels, so every view is the point at the
// stage centre and a scale, with the iframe's top-left corner rounded to a whole pixel. A move
// between two such views starts and lands without a one-pixel snap.
const at = (cx, cy, scale) => {
  const ox = Math.round(800 - cx * scale);
  const oy = Math.round(450 - cy * scale);
  return { x: (800 - ox) / scale, y: (450 - oy) / scale, scale };
};

// Each breathing shot scopes its tokens to its own section, so nothing above it reflows and the
// anchor scroll holds. Every window's top and bottom edge sits in a gap between rows, measured
// on trailerSeek stills in the state the shot is in when the camera gets there. Each shot keeps
// one scale and its camera only translates: every zoom step re-rasters the framed page, and over
// a reflow that dropped frames (Notes at 2.45 to 2.3, Triage at 2.04 to 2.43, twice).
const DOCS_HOME = at(408, 530.5, 2.2);
const DOCS_SOFT = at(408, 364.5, 2.2);
const NOTES_IN = at(408, 345.65, 2.3);
const NOTES_DOWN = at(408, 469.7, 2.3);
const TRIAGE_WIDE = at(408, 415, 2.43);
const TRIAGE_IN = at(408, 490, 2.43);

// Chrome starts the compositor animations ~0.2s after trailerStart, so the take opens on a
// still or the trim lands mid-move.
const OPEN = 0.45;
// The push crossfades for 40% of its length; any longer and the overlap reads as a dissolve.
const PUSH = 0.55;
const TO_NOTES = 0.5;
const TO_TRIAGE = 3.8;
const TO_DOCS = 7.4;
const EXHALE = 9.6;

const TIGHT_BREATH = { space: 0, radius: TIGHT.radiusScale };
const HALF_BREATH = { space: 0.5, radius: 1.15 };
const SOFT_BREATH = { space: 1, radius: 2 };
// One inhale split across the Notes→Triage push: the first half leaves at speed and the second
// arrives at it, so the reflow never pauses on the cut.
const INHALE_OUT = [0.42, 0, 0.82, 0.62];
const INHALE_IN = [0.18, 0.38, 0.58, 1];

const breathing = (anchor, breath, view) => ({
  ...screen(anchor, { ...TIGHT, ...breath }, view, NARROW),
  url: breathingShell("vellum", anchor),
});

window.trailer = {
  slug: "vellum",
  duration: 13,
  background: GROUND,
  // Each post restyles and re-rasters the breathing screen; at 60Hz that load dropped frames.
  // A step is a fraction of a pixel either way, so 30Hz reads the same.
  propRate: 30,
  shots: {
    docs: breathing("s-docs", TIGHT_BREATH, DOCS_HOME),
    notes: breathing("s-notes", TIGHT_BREATH, NOTES_IN),
    triage: breathing("s-triage", HALF_BREATH, TRIAGE_WIDE),
    // The return to Docs is its own frame, loaded soft: posting the soft state to the hidden
    // opening shot mid-take re-rendered it and dropped a frame of the Notes drift.
    docsBack: breathing("s-docs", SOFT_BREATH, DOCS_SOFT),
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

    { at: 0, show: "docs" },

    { at: TO_NOTES, show: "notes", transition: "push", dur: PUSH },
    { at: TO_NOTES + 0.15, camera: "notes", to: NOTES_DOWN, dur: 3.0, ease: "house" },
    { at: 1.0, props: "notes", tween: HALF_BREATH, dur: TO_TRIAGE - 1.0, ease: INHALE_OUT },

    { at: TO_TRIAGE, show: "triage", transition: "push", dur: PUSH },
    { at: TO_TRIAGE, props: "triage", tween: SOFT_BREATH, dur: 2.4, ease: INHALE_IN },
    { at: TO_TRIAGE + 0.15, camera: "triage", to: TRIAGE_IN, dur: 3.0, ease: "house" },

    { at: TO_DOCS, show: "docsBack", transition: "push", dur: PUSH },
    { at: EXHALE, props: "docsBack", tween: TIGHT_BREATH, dur: 1.5, ease: "house" },
    { at: EXHALE - 0.1, camera: "docsBack", to: DOCS_HOME, dur: 2.3, ease: "house" },
  ],
};
