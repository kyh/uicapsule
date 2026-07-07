/**
 * Gesture math shared by capsule interactions.
 *
 * These are the primitives that make drags feel native: velocity
 * projection (where a flick would land), detent snapping (picker/knob
 * stops), hysteresis (thresholds that don't flicker at the boundary),
 * and the iOS rubber-band curve for overscroll.
 */

/** Clamp `value` into [min, max]. */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Project where a gesture would settle given its release velocity.
 * `offset + velocity * factor` — the same heuristic iOS uses for
 * swipe commits and corner snapping. Pair with a threshold or detents.
 *
 * @param offset   current displacement in px
 * @param velocity release velocity in px/s (from PanInfo.velocity)
 * @param factor   deceleration weight; 0.18 feels like UIKit default
 */
export const project = (offset: number, velocity: number, factor = 0.18) =>
  offset + velocity * factor;

/** Nearest detent to `value` from an explicit list of stops. */
export const nearestDetent = (value: number, detents: readonly number[]) => {
  let best = detents[0] ?? 0;
  for (const detent of detents) {
    if (Math.abs(detent - value) < Math.abs(best - value)) best = detent;
  }
  return best;
};

/**
 * Snap `value` to a uniform grid of `step` (optionally offset by
 * `origin`). Use as `dragTransition.modifyTarget` for inertial snapping.
 */
export const snapToStep = (value: number, step: number, origin = 0) =>
  Math.round((value - origin) / step) * step + origin;

/**
 * iOS rubber-band resistance. Maps an out-of-bounds distance to the
 * damped distance actually rendered, asymptotically approaching
 * `dimension`.
 *
 * @param distance  how far past the boundary the pointer has travelled
 * @param dimension size of the viewport/container along the axis
 * @param constant  0.55 matches UIScrollView
 */
export const rubberband = (distance: number, dimension: number, constant = 0.55) =>
  (distance * dimension * constant) / (dimension + constant * Math.abs(distance)) || 0;

/**
 * A boundary that engages at `enter` but only releases below `exit`
 * (exit < enter), so values hovering near the threshold don't flicker.
 * Create one per gesture; call `update` with the live magnitude.
 *
 * ```ts
 * const commit = createHysteresis({ enter: 140, exit: 90 });
 * onDrag: (_, info) => setArmed(commit.update(Math.abs(info.offset.x)))
 * ```
 */
export const createHysteresis = ({ enter, exit }: { enter: number; exit: number }) => {
  let engaged = false;
  return {
    update(magnitude: number) {
      if (engaged) {
        if (magnitude < exit) engaged = false;
      } else if (magnitude > enter) {
        engaged = true;
      }
      return engaged;
    },
    get engaged() {
      return engaged;
    },
    reset() {
      engaged = false;
    },
  };
};

/**
 * Rolling velocity tracker for inputs that don't hand you velocity
 * (wheel events, custom pointer math). Feed positions with `push`;
 * read px/s with `velocity()`. Samples older than `windowMs` fall out.
 */
export const createVelocityTracker = (windowMs = 100) => {
  let samples: { t: number; v: number }[] = [];
  return {
    push(value: number, timestamp = performance.now()) {
      samples.push({ t: timestamp, v: value });
      const cutoff = timestamp - windowMs;
      while (samples.length > 2 && (samples[0]?.t ?? 0) < cutoff) samples.shift();
    },
    velocity(now = performance.now()) {
      const cutoff = now - windowMs;
      const recent = samples.filter((sample) => sample.t >= cutoff);
      const first = recent[0];
      const last = recent[recent.length - 1];
      if (!first || !last || last.t === first.t) return 0;
      return ((last.v - first.v) / (last.t - first.t)) * 1000;
    },
    reset() {
      samples = [];
    },
  };
};
