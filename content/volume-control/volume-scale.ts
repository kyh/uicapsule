/**
 * The volume domain, shared by the HUD and all five controls.
 *
 * Volume is a number 0–100 and nothing else. Each control owns its own geometry
 * — a groove, a board, a sheet of ice — and converts to and from this domain at
 * its edges, so no control ever has to know what another one's pixels mean.
 */

export const VOLUME_MIN = 0;
export const VOLUME_MAX = 100;
export const DEFAULT_VOLUME = 35;

/** Volume lands on multiples of this. Nothing here is precise enough to deserve
 * finer resolution, and a round number reads better in the readout. */
export const DETENT_STEP = 5;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const clampVolume = (value: number) => clamp(value, VOLUME_MIN, VOLUME_MAX);

export const snapVolume = (value: number) =>
  clampVolume(Math.round(value / DETENT_STEP) * DETENT_STEP);

export type SpeakerTier = "muted" | "low" | "mid" | "high";

/** Which speaker glyph the menu bar wears. */
export const speakerTier = (volume: number): SpeakerTier =>
  volume <= 0 ? "muted" : volume < 34 ? "low" : volume < 67 ? "mid" : "high";
