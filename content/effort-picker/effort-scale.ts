/**
 * Geometry shared by the picker shell and its tracks. The physics is written in
 * track-pixels, so the track has a fixed width — every constant here is derived
 * from it rather than measured at runtime.
 *
 * Everything is staged at 2× the host app's real sizes, because the whole scene
 * is a zoomed crop of somebody's composer. The zoom comes from intrinsic sizes,
 * never a transform: scaling the subtree would leave the slingshot's pointer
 * deltas (screen px) out of step with its physics (local px).
 *
 * How many notches the track has is *not* here — that belongs to the theme, since
 * the two apps disagree about it. See `effort-theme.ts`.
 */

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
