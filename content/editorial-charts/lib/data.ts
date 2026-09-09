// Three quarters of a fictional product, cycled by the set. Deterministic on
// purpose — a refresh must draw the exact same page.

export interface PlanRow {
  plan: string;
  value: number;
}
export interface DayRow {
  day: number;
  value: number;
  weekend: boolean;
}
export interface ChannelRow {
  channel: string;
  share: number;
}
export interface MixRow {
  plan: string;
  share: number;
}

export interface Scene {
  quarter: string;
  /** $k MRR per plan. Keep every value divisible by 2: one rung = $2k, and the
   * rung-bars ladder must count exactly to its label. */
  plans: PlanRow[];
  days: DayRow[];
  channels: ChannelRow[];
  sessions: number;
  mix: MixRow[];
}

/* oxlint-disable no-bitwise -- integer hash: xorshift-multiply needs unsigned 32-bit wraparound */
const hash = (n: number) => {
  let x = (n + 0x9e_37_79_b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x4_5d_9f_3b) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x4_5d_9f_3b) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 0xff_ff_ff_ff;
};
/* oxlint-enable no-bitwise */

const days = (seed: number, base: number, slope: number): DayRow[] =>
  Array.from({ length: 30 }, (_, i) => {
    const weekend = i % 7 === 5 || i % 7 === 6;
    const wiggle = (hash(seed * 1000 + i) - 0.5) * 16;
    const value = Math.max(6, Math.round(base + i * slope + wiggle - (weekend ? 11 : 0)));
    return { day: i + 1, value, weekend };
  });

export const SCENES: Scene[] = [
  {
    channels: [
      { channel: "ORGANIC", share: 37 },
      { channel: "REFERRAL", share: 21 },
      { channel: "SOCIAL", share: 14 },
      { channel: "PAID", share: 28 },
    ],
    days: days(1, 34, 0.9),
    mix: [
      { plan: "FREE", share: 46 },
      { plan: "STARTER", share: 27 },
      { plan: "PRO", share: 17 },
      { plan: "TEAM", share: 10 },
    ],
    plans: [
      { plan: "FREE", value: 38 },
      { plan: "STARTER", value: 28 },
      { plan: "PRO", value: 22 },
      { plan: "TEAM", value: 16 },
      { plan: "SCALE", value: 10 },
    ],
    quarter: "Q1",
    sessions: 41_800,
  },
  {
    channels: [
      { channel: "ORGANIC", share: 41 },
      { channel: "REFERRAL", share: 23 },
      { channel: "SOCIAL", share: 12 },
      { channel: "PAID", share: 24 },
    ],
    days: days(2, 42, 1.15),
    mix: [
      { plan: "FREE", share: 41 },
      { plan: "STARTER", share: 29 },
      { plan: "PRO", share: 19 },
      { plan: "TEAM", share: 11 },
    ],
    plans: [
      { plan: "FREE", value: 44 },
      { plan: "STARTER", value: 32 },
      { plan: "PRO", value: 26 },
      { plan: "TEAM", value: 20 },
      { plan: "SCALE", value: 14 },
    ],
    quarter: "Q2",
    sessions: 48_200,
  },
  {
    channels: [
      { channel: "ORGANIC", share: 46 },
      { channel: "REFERRAL", share: 24 },
      { channel: "SOCIAL", share: 11 },
      { channel: "PAID", share: 19 },
    ],
    days: days(3, 52, 1.4),
    mix: [
      { plan: "FREE", share: 34 },
      { plan: "STARTER", share: 31 },
      { plan: "PRO", share: 22 },
      { plan: "TEAM", share: 13 },
    ],
    plans: [
      { plan: "FREE", value: 52 },
      { plan: "STARTER", value: 36 },
      { plan: "PRO", value: 30 },
      { plan: "TEAM", value: 24 },
      { plan: "SCALE", value: 18 },
    ],
    quarter: "Q3",
    sessions: 56_400,
  },
];

// Shared y ceiling so the line visibly climbs across quarters.
export const DAY_MAX = Math.max(...SCENES.flatMap((s) => s.days.map((d) => d.value)));
