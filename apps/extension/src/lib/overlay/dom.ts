const SVG_NS = "http://www.w3.org/2000/svg";

type Attributes = Record<string, string | undefined>;

/** Creates an element in the overlay's shadow tree; `undefined` attributes are skipped. */
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
  tag: "path";
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

export const icons = {
  check: () =>
    svg("0 0 24 24", [path("M5.25 12.7033 9.40385 17.37 18.75 6.87")], { "stroke-width": "2.4" }),
  close: () =>
    svg("0 0 24 24", [path("M6 18 18 6M6 6l12 12")], { size: "16", "stroke-width": "1.8" }),
};
