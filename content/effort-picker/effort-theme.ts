import { clamp, TRACK_TRAVEL } from "./effort-scale";

/**
 * A theme is the *host app* the picker is pretending to live inside: its surfaces
 * and its dial. It is orthogonal to the variant, because the variant owns the
 * physics and the theme owns the paint.
 *
 * Every value below was read off the real product with the browser open, then
 * doubled: the scene is staged at 2× (see `effort-scale.ts`), so a 12px radius
 * over there is a 24px radius here.
 */
export type EffortTheme = "chatgpt" | "claude";

/** Positional — the index is the level. Two names minimum so there is always a
 * `levels[0]` to fall back on, and so a notch gap is never a division by zero. */
type LevelNames = readonly [string, string, ...string[]];

const LEVELS = ["Light", "Medium", "High", "Extra High", "Ultra"] as const;

/** The knob's paint. Sized independently of `KNOB_SIZE`: the hit box drives the
 * physics, this is only what you see riding in it. */
interface KnobSkin {
  width: number;
  height: number;
  radius: number;
  className: string;
}

interface ThemeTokens {
  levels: LevelNames;
  /** The cropped app the composer sits in. */
  frame: string;
  /** The popover shell — shared by all three variants, so whichever take you
   * perform, it lands on the host app's own surface. */
  card: string;
  /** Chrome text, in descending loudness. */
  text: string;
  muted: string;
  faint: string;
  /** Focus ring, matched to the host app's accent. */
  ring: string;
  /** The dial: trough, the bar filling it, notches, knob. */
  troughHeight: number;
  troughRadius: number;
  trough: string;
  /** Colour ramp under the knob, low end to high end. Both stops can be the same
   * colour when the app fills its track flatly rather than by temperature. */
  fill: readonly [string, string];
  dot: string;
  /** The top notch gets its own colour: the one rung the app wants you to notice. */
  dotTop: string;
  knob: KnobSkin;
}

export const EFFORT_THEMES = {
  chatgpt: {
    card: "rounded-[28px] border border-white/10 bg-neutral-800/95 shadow-2xl shadow-black/60",
    dot: "bg-white/45",
    dotTop: "bg-white/45",
    faint: "text-neutral-500",
    fill: ["#3b82f6", "#a855f7"],
    frame: "bg-neutral-950 text-neutral-100",
    knob: { className: "bg-white shadow-lg", height: 38, radius: 19, width: 38 },
    levels: LEVELS,
    muted: "text-neutral-400",
    ring: "focus-visible:ring-violet-500/60",
    text: "text-neutral-100",
    trough: "bg-neutral-700/60",
    troughHeight: 30,
    troughRadius: 15,
  },
  claude: {
    card: "rounded-[24px] bg-[#2c2c2a] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.08)]",
    dot: "bg-white/25",
    dotTop: "bg-[#b796ff]",
    faint: "text-white/25",
    fill: ["rgba(255,255,255,0.16)", "rgba(255,255,255,0.16)"],
    frame: "bg-[#20201f] text-[#e1e0d9]",
    knob: { className: "bg-[#a5a49a]", height: 40, radius: 12, width: 32 },
    levels: LEVELS,
    muted: "text-white/48",
    ring: "focus-visible:ring-[#b796ff]/60",
    text: "text-white/70",
    trough: "bg-[#1a1a19]",
    troughHeight: 40,
    troughRadius: 12,
  },
} satisfies Record<EffortTheme, ThemeTokens>;

export const levelCount = (theme: EffortTheme) => EFFORT_THEMES[theme].levels.length;

const notchGap = (theme: EffortTheme) => TRACK_TRAVEL / (levelCount(theme) - 1);

export const notchX = (theme: EffortTheme, level: number) =>
  clamp(level, 0, levelCount(theme) - 1) * notchGap(theme);

export const nearestLevel = (theme: EffortTheme, x: number) =>
  clamp(Math.round(x / notchGap(theme)), 0, levelCount(theme) - 1);

/** Takes a level *index*, not a track position. */
export const labelAt = (theme: EffortTheme, index: number) => {
  const { levels } = EFFORT_THEMES[theme];

  return levels[clamp(Math.round(index), 0, levels.length - 1)] ?? levels[0];
};
