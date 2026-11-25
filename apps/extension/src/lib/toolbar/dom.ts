const SVG_NS = "http://www.w3.org/2000/svg";

type Attributes = Record<string, string | undefined>;

/** Creates an element in the toolbar's shadow tree; `undefined` attributes are skipped. */
export const h = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Attributes = {},
  children: (Node | string)[] = [],
) => {
  const element = document.createElement(tag);

  for (const [name, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      element.setAttribute(name, value);
    }
  }

  element.append(...children);

  return element;
};

interface Glyph {
  attributes: Attributes;
  tag: "circle" | "path" | "rect";
}

const svg = (viewBox: string, glyphs: Glyph[], attributes: Attributes = {}) => {
  const root = document.createElementNS(SVG_NS, "svg");
  const size = attributes.size ?? "20";

  for (const [name, value] of Object.entries({
    "aria-hidden": "true",
    fill: "none",
    height: size,
    stroke: "currentColor",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "stroke-width": "1.5",
    viewBox,
    width: size,
    ...attributes,
    size: undefined,
  })) {
    if (value !== undefined) {
      root.setAttribute(name, value);
    }
  }

  for (const glyph of glyphs) {
    const node = document.createElementNS(SVG_NS, glyph.tag);

    for (const [name, value] of Object.entries(glyph.attributes)) {
      if (value !== undefined) {
        node.setAttribute(name, value);
      }
    }

    root.append(node);
  }

  return root;
};

const path = (d: string, extra: Attributes = {}) =>
  ({ attributes: { d, ...extra }, tag: "path" }) satisfies Glyph;

const rect = (attributes: Attributes) => ({ attributes, tag: "rect" }) satisfies Glyph;

export const icons = {
  area: () =>
    svg("0 0 20 20", [rect({ height: "11", rx: "2.5", width: "14", x: "3", y: "4.5" })], {
      "stroke-dasharray": "0.1 3",
    }),
  capture: () =>
    svg("0 0 20 20", [
      path(
        "M3 7V6a3 3 0 0 1 3-3h1M13 3h1a3 3 0 0 1 3 3v1M17 13v1a3 3 0 0 1-3 3h-1M7 17H6a3 3 0 0 1-3-3v-1",
      ),
      rect({
        fill: "currentColor",
        "fill-opacity": ".3",
        height: "7",
        rx: "2",
        stroke: "none",
        width: "7",
        x: "6.5",
        y: "6.5",
      }),
    ]),
  check: () =>
    svg("0 0 24 24", [path("M5.25 12.7033 9.40385 17.37 18.75 6.87")], { "stroke-width": "2.4" }),
  chevron: () =>
    svg(
      "0 0 16 16",
      [
        path(
          "M4.47 6.47a.75.75 0 0 1 1.06 0L8 8.94l2.47-2.47a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 0-1.06Z",
          { fill: "currentColor", stroke: "none" },
        ),
      ],
      { size: "16" },
    ),
  close: () =>
    svg("0 0 24 24", [path("M6 18 18 6M6 6l12 12")], { size: "18", "stroke-width": "1.8" }),
  code: () =>
    svg(
      "0 0 24 24",
      [path("m17.25 6.75 5.25 5.25-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5")],
      {
        size: "16",
        "stroke-width": "2",
      },
    ),
  element: () =>
    svg("0 0 20 20", [
      rect({ height: "12", rx: "3", width: "15", x: "2.5", y: "4" }),
      rect({ fill: "currentColor", height: "3.5", rx: "1", width: "4", x: "8", y: "8.25" }),
    ]),
  gear: () =>
    svg(
      "0 0 24 24",
      [
        path(
          "M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z",
        ),
        { attributes: { cx: "12", cy: "12", r: "3" }, tag: "circle" },
      ],
      { size: "16", "stroke-width": "2" },
    ),
  send: () =>
    svg("0 0 24 24", [path("M12 19.5v-15m0 0-6.75 6.75M12 4.5l6.75 6.75")], {
      "stroke-width": "2.2",
    }),
  tick: () =>
    svg("0 0 24 24", [path("M5.25 12.7033 9.40385 17.37 18.75 6.87")], {
      size: "16",
      "stroke-width": "3",
    }),
  video: () =>
    svg(
      "0 0 24 24",
      [
        path(
          "m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z",
        ),
      ],
      { size: "16", "stroke-width": "2" },
    ),
};

export type IconName = keyof typeof icons;
