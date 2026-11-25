interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const parseHex = (hex: string) => {
  const value = hex.replace("#", "");

  const full =
    value.length <= 4
      ? value
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : value;

  const color: Rgba = {
    a: full.length === 8 ? Number.parseInt(full.slice(6, 8), 16) / 255 : 1,
    b: Number.parseInt(full.slice(4, 6), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    r: Number.parseInt(full.slice(0, 2), 16),
  };

  return color;
};

/** Parses `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa` or `rgb(r g b / a)` into channels. */
export const parseColor = (input: string) => {
  if (input.startsWith("#")) {
    return parseHex(input);
  }

  const numbers = input.match(/[\d.]+/gu)?.map(Number) ?? [0, 0, 0, 1];

  const color: Rgba = {
    a: numbers[3] ?? 1,
    b: numbers[2] ?? 0,
    g: numbers[1] ?? 0,
    r: numbers[0] ?? 0,
  };

  return color;
};

const over = (top: Rgba, bottom: Rgba) => {
  const color: Rgba = {
    a: 1,
    b: top.b * top.a + bottom.b * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    r: top.r * top.a + bottom.r * (1 - top.a),
  };

  return color;
};

const channel = (value: number) => {
  const srgb = value / 255;

  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};

const luminance = ({ r, g, b }: Rgba) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

/** WCAG contrast of a possibly translucent foreground laid on an opaque background. */
export const contrast = (foreground: string, background: string) => {
  const base = parseColor(background);
  const top = over(parseColor(foreground), base);
  const light = Math.max(luminance(top), luminance(base));
  const dark = Math.min(luminance(top), luminance(base));

  return (light + 0.05) / (dark + 0.05);
};

/** Formats a ratio the way the foundations print it, such as `5.6:1`. */
export const formatRatio = (ratio: number) => `${(Math.floor(ratio * 10) / 10).toFixed(1)}:1`;

/** Lays a translucent colour over an opaque one and returns the flat result as `rgb()`. */
export const composite = (top: string, bottom: string) => {
  const { r, g, b } = over(parseColor(top), parseColor(bottom));

  return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;
};
