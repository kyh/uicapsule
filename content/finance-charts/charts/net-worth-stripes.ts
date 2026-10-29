import type { ChartGradient } from "@tanstack/charts";

/**
 * Chart specs declare gradients but not patterns, so a hatch is a linear
 * gradient of hard stops. Gradients use the painted box as their unit square;
 * passing the box's expected pixel size keeps the stripes leaning at one angle
 * (and one pitch) whatever the bar's height.
 */
export const stripes = ({
  id,
  base,
  line,
  width,
  height,
  pitch = 7,
  lean = 1.6,
  duty = 0.4,
}: {
  id: string;
  /** Ground color between stripes. */
  base: string;
  /** Stripe color. */
  line: string;
  /** Expected painted width in px. */
  width: number;
  /** Expected painted height in px. */
  height: number;
  /** Stripe period in px. */
  pitch?: number;
  /** Stripe slope: rise per px of run. */
  lean?: number;
  /** Fraction of each period painted `line`. */
  duty?: number;
}): ChartGradient => {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const gx = (lean * w) / h;
  // Pixel distance between the gradient's 0 and 1 iso-lines.
  const span = (lean * gx * w + h) / ((gx * gx + 1) * Math.sqrt(1 + lean * lean));
  const periods = Math.max(1, Math.round(span / pitch));
  const stops: { color: string; offset: number }[] = [];
  for (let i = 0; i < periods; i += 1) {
    const a = i / periods;
    const b = (i + duty) / periods;
    const c = (i + 1) / periods;
    stops.push(
      { color: line, offset: a },
      { color: line, offset: b },
      { color: base, offset: b },
      { color: base, offset: c },
    );
  }
  return { id, stops, x1: 0, x2: gx, y1: 0, y2: 1 };
};
