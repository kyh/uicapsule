/**
 * Geometry and levels shared by the picker shell and its tracks. The physics is
 * written in track-pixels, so the track has a fixed width — every constant here
 * is derived from it rather than measured at runtime.
 */

export const EFFORT_LEVELS = ["Light", "Medium", "High", "Extra High", "Ultra"] as const;

export const LEVEL_COUNT = EFFORT_LEVELS.length;
export const DEFAULT_LEVEL = 1;

/** The track fills the card: 440px card, 20px padding each side. */
export const TRACK_WIDTH = 400;
/** The trough is shorter than the knob: the knob rides ON the track, proud of
 * it, rather than sitting down inside the groove. */
export const TRACK_HEIGHT = 30;
export const KNOB_SIZE = 38;
/** Vertical offset that centres the trough against the taller knob. */
export const TRACK_OFFSET_Y = (KNOB_SIZE - TRACK_HEIGHT) / 2;
/** The knob runs flush end to end — no inset, so it caps the track exactly. */
export const TRACK_TRAVEL = TRACK_WIDTH - KNOB_SIZE;
export const NOTCH_GAP = TRACK_TRAVEL / (LEVEL_COUNT - 1);

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const notchX = (level: number) => clamp(level, 0, LEVEL_COUNT - 1) * NOTCH_GAP;

export const nearestLevel = (x: number) => clamp(Math.round(x / NOTCH_GAP), 0, LEVEL_COUNT - 1);

/** Takes a level *index*, not a track position. */
export const labelAt = (index: number) =>
  EFFORT_LEVELS[clamp(Math.round(index), 0, LEVEL_COUNT - 1)] ?? EFFORT_LEVELS[0];
