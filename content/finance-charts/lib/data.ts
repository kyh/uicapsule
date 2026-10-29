// Deterministic demo data. Every chart seeds its own stream so a refresh
// draws the exact same wall.

/* oxlint-disable no-bitwise -- mulberry32 needs unsigned 32-bit wraparound */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d_2b_79_f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
};
/* oxlint-enable no-bitwise */

/** A bounded random walk: `n` points starting at `start`. */
export const walk = (
  n: number,
  seed: number,
  { start = 50, vol = 5, drift = 0, min = -Infinity, max = Infinity } = {},
): number[] => {
  const r = rng(seed);
  const out: number[] = [];
  let v = start;
  for (let i = 0; i < n; i += 1) {
    out.push(v);
    v = Math.min(max, Math.max(min, v + drift + (r() - 0.5) * 2 * vol));
  }
  return out;
};

/** `n` uniform values in [lo, hi]. */
export const uniform = (n: number, seed: number, lo: number, hi: number): number[] => {
  const r = rng(seed);
  return Array.from({ length: n }, () => lo + r() * (hi - lo));
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const usdFormat = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});
const usdWhole = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

/** `$1,234.56`, or `$1,235` with `whole`. */
export const usd = (n: number, whole = false) => (whole ? usdWhole : usdFormat).format(n);

/** `$25K`, `$1.2M` — axis labels. */
export const compact = (n: number, prefix = "$") => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    return `${prefix}${+(n / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1000) {
    return `${prefix}${+(n / 1000).toFixed(1)}K`;
  }
  return `${prefix}${Math.round(n)}`;
};
