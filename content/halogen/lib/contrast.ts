const channel = (value: number) => {
  const c = value / 255;

  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string) => {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** WCAG 2 contrast ratio between two #rrggbb colours. */
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].toSorted((x, y) => y - x);

  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
};

/** A ratio as written in the tables, such as 7.6:1. */
export const ratio = (a: string, b: string) => `${contrast(a, b).toFixed(1)}:1`;
