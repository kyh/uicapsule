import { parseHex } from "./color";

const channel = (value: number) => {
  const c = value / 255;

  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (rgb: readonly number[]) => {
  const [r = 0, g = 0, b = 0] = rgb.map(channel);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG 2 contrast ratio between two hex colors, rounded to one decimal; NaN if either is not hex. */
export const contrastRatio = (a: string, b: string) => {
  const ra = parseHex(a);
  const rb = parseHex(b);

  if (!ra || !rb) {
    return Number.NaN;
  }

  const la = luminance(ra);
  const lb = luminance(rb);
  const ratio = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);

  return Math.round(ratio * 10) / 10;
};
