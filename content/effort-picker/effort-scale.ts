/** The popover card, and the width the track has to fill inside it. */
export const CARD_WIDTH = 440;
export const CARD_PADDING = 20;
export const TRACK_WIDTH = CARD_WIDTH - CARD_PADDING * 2;

/** The knob's hit box, and the unit the physics moves. Each theme paints a
 * differently sized skin inside it — the box itself never changes, so a reskin
 * can't quietly retune the slingshot. */
export const KNOB_SIZE = 38;

/** The knob runs flush end to end — no inset, so it caps the track exactly. */
export const TRACK_TRAVEL = TRACK_WIDTH - KNOB_SIZE;

export const DEFAULT_LEVEL = 1;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Both performed variants score in percent and only convert to track-pixels at
 * the last moment — the dial is the readout, not the unit of measurement. */
export const percentToX = (percent: number) => (clamp(percent, 0, 100) / 100) * TRACK_TRAVEL;
