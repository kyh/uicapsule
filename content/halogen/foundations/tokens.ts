export interface ColorToken {
  token: string;
  use: string;
  light: string;
  dark: string;
  against?: { name: string; light: string; dark: string; min: number };
}

const PAGE = { dark: "#131210", light: "#fdfcf9", min: 4.5, name: "page" };
const PAGE_UI = { ...PAGE, min: 3 };

export const COLOR_GROUPS: { name: string; tokens: ColorToken[] }[] = [
  {
    name: "Grounds",
    tokens: [
      {
        dark: "#131210",
        light: "#fdfcf9",
        token: "--hx-page",
        use: "The sheet itself: bare paper, so hairlines and the lamp carry every screen",
      },
      {
        dark: "#1a1916",
        light: "#f7f6f1",
        token: "--hx-panel",
        use: "Head rows and floating overlays, one shade off the sheet",
      },
      {
        dark: "#211f1b",
        light: "#f2f0ea",
        token: "--hx-well",
        use: "Recessed surfaces: code, logs, a meter rail, a control that is off",
      },
      {
        dark: "#3b2a06",
        light: "#fff0c2",
        token: "--hx-wash",
        use: "You are here: the picked row, the active strip cell, a search hit",
      },
      {
        dark: "#4b3608",
        light: "#ffe594",
        token: "--hx-wash-strong",
        use: "The pointer over a picked row, and selected text",
      },
    ],
  },
  {
    name: "Ink",
    tokens: [
      {
        against: PAGE,
        dark: "#f2ede4",
        light: "#1a1814",
        token: "--hx-ink-1",
        use: "Anything you act on or read first",
      },
      {
        against: PAGE,
        dark: "#c3bdb2",
        light: "#57524a",
        token: "--hx-ink-2",
        use: "Supporting sentences and second-rank cells",
      },
      {
        against: PAGE,
        dark: "#9f998d",
        light: "#6d685e",
        token: "--hx-ink-3",
        use: "Axis ticks, column heads, placeholder text, timestamps",
      },
      {
        dark: "#5f5a51",
        light: "#aba69b",
        token: "--hx-ink-off",
        use: "Switched-off labels. Exempt from contrast, so never load-bearing",
      },
    ],
  },
  {
    name: "Lamp",
    tokens: [
      {
        dark: "#ffbe2e",
        light: "#ffbe2e",
        token: "--hx-lamp",
        use: "Fills only: the lit button, a ticked box, the lead series. Never letters on paper",
      },
      {
        against: PAGE,
        dark: "#ffbe2e",
        light: "#7a5000",
        token: "--hx-lamp-text",
        use: "Amber you can read: quoted strings, the current page number",
      },
      {
        dark: "#ffbe2e",
        light: "#d99a0f",
        token: "--hx-lamp-edge",
        use: "The rim around a lit fill or a step that is working",
      },
      {
        against: { dark: "#3b2a06", light: "#ffbe2e", min: 4.5, name: "slab" },
        dark: "#ffbe2e",
        light: "#1a1814",
        token: "--hx-slab-ink",
        use: "Letters on the lit button. In dark the fill sinks to a tint and the letters glow",
      },
    ],
  },
  {
    name: "Outcomes",
    tokens: [
      {
        against: PAGE,
        dark: "#86c495",
        light: "#2e6a3d",
        token: "--hx-ok-text",
        use: "Done, passed, recovered",
      },
      {
        against: PAGE,
        dark: "#ff9858",
        light: "#a3430a",
        token: "--hx-warn-text",
        use: "Drifting, nearly full. Orange, so it never reads as the lamp",
      },
      {
        against: PAGE,
        dark: "#ff6f5e",
        light: "#b3281f",
        token: "--hx-fail-text",
        use: "Broken runs, bad input, anything that cannot be undone",
      },
      {
        dark: "#16261a",
        light: "#e9f2eb",
        token: "--hx-ok-tint",
        use: "Behind a recovered band or a passing tag",
      },
      {
        dark: "#33200f",
        light: "#fdeee2",
        token: "--hx-warn-tint",
        use: "Behind a caution band or tag",
      },
      {
        dark: "#3a1915",
        light: "#fdecea",
        token: "--hx-fail-tint",
        use: "Behind a broken row or the line that failed",
      },
    ],
  },
  {
    name: "Lines",
    tokens: [
      {
        dark: "#211f1b",
        light: "#eeebe3",
        token: "--hx-rule-faint",
        use: "Row separators inside one region",
      },
      {
        dark: "#2d2b26",
        light: "#e1ddd2",
        token: "--hx-rule",
        use: "The outer edge of a region and the rules between its columns",
      },
      {
        against: PAGE_UI,
        dark: "#77715f",
        light: "#8a8477",
        token: "--hx-rule-control",
        use: "Edges that have to hold up: check boxes, switch tracks, meter rails",
      },
      {
        against: PAGE_UI,
        dark: "#f2ede4",
        light: "#1a1814",
        token: "--hx-focus",
        use: "The keyboard ring. 2px, the one line allowed past a hairline",
      },
    ],
  },
];

export const TYPE_ROLES = [
  {
    cls: "hx-display",
    sample: "Halogen",
    spec: "60/60 · -0.045em",
    use: "Cover word, once per site",
  },
  { cls: "hx-title", sample: "Spend", spec: "30/33 · -0.035em", use: "The page name, once" },
  {
    cls: "hx-heading",
    sample: "Drift on crm.contacts",
    spec: "22/26 · -0.025em",
    use: "A region or dialog heading",
  },
  {
    cls: "hx-heading-sm",
    sample: "Nothing waiting on you",
    spec: "17/22 · -0.02em",
    use: "A subsection, an empty result",
  },
  {
    cls: "hx-figure",
    sample: "18.4K",
    spec: "40/40 · -0.035em",
    use: "The single figure a chart hangs off",
  },
  {
    cls: "hx-body",
    sample: "Attempt 3 dropped two duplicate keys and committed all 24 partitions.",
    spec: "15/24 · 0",
    use: "Paragraphs",
  },
  {
    cls: "hx-body-sm",
    sample: "Waits ten minutes, tries again, then pages.",
    spec: "14/20 · 0",
    use: "Hints and tight descriptions",
  },
  {
    cls: "hx-caption",
    sample: "Queued by Tomas Weber at 09:41 UTC",
    spec: "13/18 · 0",
    use: "Meta under a row",
  },
  {
    cls: "hx-label-lg",
    sample: "Apply mapping",
    spec: "14/20 · +0.04em · caps",
    use: "The page's main control",
  },
  {
    cls: "hx-label",
    sample: "Rerun",
    spec: "13/16 · +0.05em · caps",
    use: "Buttons, tabs, table heads",
  },
  {
    cls: "hx-label-sm",
    sample: "Spilled",
    spec: "12/16 · +0.06em · caps",
    use: "Tags, compact controls, strip labels",
  },
  {
    cls: "hx-micro",
    sample: "Queue depth",
    spec: "11/14 · +0.07em · caps",
    use: "Axis ticks and lane names",
  },
  {
    cls: "hx-code",
    sample: "crm.contacts_v7",
    spec: "13/20 · mono",
    use: "Values, identifiers, log lines, a frame's name",
  },
  {
    cls: "hx-code-sm",
    sample: "drift_4ac1 · 06:20 UTC",
    spec: "12/16 · mono",
    use: "Meta in a head or foot row",
  },
] as const;

export const MOTION_TOKENS = [
  {
    curve: "--hx-ease-out",
    dur: "--hx-dur-press",
    ms: "80ms",
    use: "Pressing down: the fill darkens a step; nothing grows or shrinks",
  },
  {
    curve: "--hx-ease-out",
    dur: "--hx-dur-state",
    ms: "120ms",
    use: "Hover and toggles. A run changing state cuts, it never fades",
  },
  {
    curve: "--hx-ease-out",
    dur: "--hx-dur-overlay",
    ms: "160ms",
    use: "A menu dropping 4px out of the control that opened it",
  },
  {
    curve: "--hx-ease-linear",
    dur: "--hx-dur-wipe",
    ms: "240ms",
    use: "Fills that travel along a rail: meters, blocks, a new log line",
  },
  {
    curve: "--hx-ease-lamp",
    dur: "--hx-dur-lamp",
    ms: "260ms",
    use: "The lamp warming under the pointer",
  },
  {
    curve: "--hx-ease-out",
    dur: "--hx-dur-draw",
    ms: "320ms",
    use: "Connector lines reaching from one step to the next",
  },
  {
    curve: "--hx-ease-linear",
    dur: "--hx-dur-scramble",
    ms: "420ms",
    use: "An identifier settling into place after it changes",
  },
] as const;

export const CURVES = [
  {
    name: "--hx-ease-out",
    points: [0.2, 0.8, 0.2, 1],
    use: "Moves. Gets there quickly and stops dead, no bounce",
  },
  {
    name: "--hx-ease-lamp",
    points: [0.25, 0.8, 0.25, 1],
    use: "Light only: the lit button, and the plain one warming",
  },
  { name: "--hx-ease-in", points: [0.4, 0, 1, 1], use: "Overlays on their way out" },
  {
    name: "--hx-ease-linear",
    points: [0, 0, 1, 1],
    use: "Rail wipes, typing, and the four-square pending mark",
  },
] as const;
