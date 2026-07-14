"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

import type { MotionValue } from "motion/react";

import { HUD_INNER_WIDTH } from "./macos-chrome";
import {
  clamp,
  clampVolume,
  DETENT_STEP,
  snapVolume,
  VOLUME_MAX,
  VOLUME_MIN,
} from "./volume-scale";

const MARBLE_SIZE = 22;
const GROOVE_HEIGHT = 34;
const TRAVEL = HUD_INNER_WIDTH - MARBLE_SIZE;

/** Degrees of tilt at the ends of the drag. Past this the marble is uncatchable
 * and the joke stops being funny — and the panel starts sweeping through the
 * readout above it (see the clearance the track reserves for its swing). */
const MAX_TILT = 15;
/** Pointer pixels per degree — how heavy the panel feels to lean on. */
const PX_PER_DEGREE = 7;

/** Acceleration (px/s²) the marble would feel if the panel were stood on its end. */
const GRAVITY = 1500;
/** Exponential speed decay per second. Ice would be unplayable; this is more like wood. */
const FRICTION = 2.3;
/** Fraction of speed kept off a wall. The ends are rubber, not a trampoline. */
const RESTITUTION = 0.35;

/** A detent can only catch a marble that's barely moving... */
const CATCH_SPEED = 46;
/** ...and only if it's basically on top of it. */
const CATCH_RADIUS = 7;
/** ...and it lets go the moment the panel leans hard enough to overcome it. This
 * is the whole game: level the panel to let a detent bite, lean to break out. */
const DETENT_GRIP = 300;

const LEVEL_SPRING = { type: "spring", stiffness: 220, damping: 18 } as const;
const SETTLE_SPRING = { type: "spring", stiffness: 400, damping: 30 } as const;

const volumeToX = (volume: number) => (clampVolume(volume) / VOLUME_MAX) * TRAVEL;
const xToVolume = (x: number) => clamp((x / TRAVEL) * VOLUME_MAX, VOLUME_MIN, VOLUME_MAX);
const detentX = (volume: number) => volumeToX(snapVolume(volume));

type TiltTrackProps = {
  volume: MotionValue<number>;
};

/**
 * The panel is a spirit level and the volume is a marble in the groove.
 *
 * Lean on it and gravity does the rest: the marble rolls, gathers speed, and
 * rattles off the ends. Detents every five points will catch it — but only if
 * it's crawling, and only while the panel is near enough to level that the
 * detent can hold it. So you don't set the volume, you *land* it: lean to get
 * moving, then flatten out at exactly the right moment and pray it sticks.
 */
export const TiltTrack = ({ volume }: TiltTrackProps) => {
  const reduceMotion = useReducedMotion();
  const [tilting, setTilting] = useState(false);
  const [ariaVolume, setAriaVolume] = useState(() => Math.round(volume.get()));

  /** Panel lean, in degrees. Positive = right side down. */
  const tilt = useMotionValue(0);
  /** Marble offset along the groove, in px. */
  const x = useMotionValue(volumeToX(volume.get()));

  const velocity = useRef(0);
  const frame = useRef(0);
  const grabX = useRef(0);
  const grabTilt = useRef(0);
  /** The detent the marble is currently sitting in, or null if it's loose. */
  const seated = useRef<number | null>(snapVolume(volume.get()));

  // The marble's position IS the volume — no commit step, no confirmation. The
  // menu bar's speaker icon follows it the entire way down the groove.
  useEffect(() => {
    const unsubscribe = x.on("change", (next) => volume.set(xToVolume(next)));
    return unsubscribe;
  }, [x, volume]);

  useEffect(() => {
    const unsubscribe = volume.on("change", (next) => setAriaVolume(Math.round(next)));
    return unsubscribe;
  }, [volume]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const run = () => {
    cancelAnimationFrame(frame.current);
    let last = performance.now();

    const step = (now: number) => {
      // Clamped so a backgrounded tab doesn't resume with one enormous step and
      // fire the marble straight through a wall.
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      const radians = (tilt.get() * Math.PI) / 180;
      const accel = GRAVITY * Math.sin(radians);
      let v = velocity.current;
      let next = x.get();

      const seatedAt = seated.current;
      if (seatedAt !== null) {
        // Sitting in a detent: nothing happens until the lean beats the grip.
        if (Math.abs(accel) < DETENT_GRIP) {
          velocity.current = 0;
          frame.current = requestAnimationFrame(step);
          return;
        }
        seated.current = null;
      }

      v += accel * dt;
      v *= Math.exp(-FRICTION * dt);
      next += v * dt;

      if (next < 0) {
        next = -next;
        v = -v * RESTITUTION;
      } else if (next > TRAVEL) {
        next = 2 * TRAVEL - next;
        v = -v * RESTITUTION;
      }

      // A detent bites only a slow marble sitting right on top of it, and only
      // while the panel is flat enough to hold it there.
      const candidate = detentX(xToVolume(next));
      if (
        Math.abs(v) < CATCH_SPEED &&
        Math.abs(candidate - next) < CATCH_RADIUS &&
        Math.abs(accel) < DETENT_GRIP
      ) {
        x.set(candidate);
        velocity.current = 0;
        seated.current = snapVolume(xToVolume(candidate));
        frame.current = requestAnimationFrame(step);
        return;
      }

      x.set(next);
      velocity.current = v;
      frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    grabX.current = event.clientX;
    grabTilt.current = tilt.get();
    setTilting(true);
    run();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!tilting) return;
    const delta = (event.clientX - grabX.current) / PX_PER_DEGREE;
    tilt.set(clamp(grabTilt.current + delta, -MAX_TILT, MAX_TILT));
  };

  const handlePointerUp = () => {
    if (!tilting) return;
    setTilting(false);
    // Hands off: the panel finds level again, and whatever the marble was doing,
    // it now has to do it on a flat surface. Usually that means it stops.
    void animate(tilt, 0, LEVEL_SPRING);
  };

  const settleTo = (next: number) => {
    cancelAnimationFrame(frame.current);
    velocity.current = 0;
    seated.current = snapVolume(next);
    void animate(x, detentX(next), SETTLE_SPRING);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? DETENT_STEP
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? -DETENT_STEP
          : 0;
    if (delta === 0) return;
    // Keyboard gets the boring volume control. The joke isn't worth locking anyone out.
    event.preventDefault();
    settleTo(clampVolume(snapVolume(volume.get()) + delta));
  };

  const bubbleX = useTransform(tilt, [-MAX_TILT, MAX_TILT], [-22, 22]);
  const marbleSpin = useTransform(x, (value) => (value / (Math.PI * MARBLE_SIZE)) * 360);

  return (
    <div>
      {/* The panel swings, so it needs room to swing in: a level bar this wide sweeps
          a box far taller than itself once it leans, and without the clearance it would
          scythe straight through the readout above it. */}
      <motion.div
        role="slider"
        tabIndex={0}
        aria-label="Volume"
        aria-valuemin={VOLUME_MIN}
        aria-valuemax={VOLUME_MAX}
        aria-valuenow={ariaVolume}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        style={{ rotate: reduceMotion ? 0 : tilt, touchAction: "none" }}
        className={`relative my-[62px] rounded-2xl bg-neutral-900/70 px-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
          tilting ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div
          className="relative overflow-hidden rounded-full bg-neutral-950/80 shadow-[inset_0_2px_6px_rgba(0,0,0,0.7)]"
          style={{ height: GROOVE_HEIGHT }}
        >
          <Detents />

          <motion.span
            aria-hidden
            className="absolute top-1/2 left-0 rounded-full bg-gradient-to-b from-white to-neutral-400 shadow-[0_2px_5px_rgba(0,0,0,0.6)]"
            style={{
              width: MARBLE_SIZE,
              height: MARBLE_SIZE,
              marginTop: -MARBLE_SIZE / 2,
              marginLeft: (GROOVE_HEIGHT - MARBLE_SIZE) / 2,
              x,
              rotate: reduceMotion ? 0 : marbleSpin,
            }}
          >
            {/* One off-centre highlight, so the roll is visible. A featureless
                ball sliding down a groove reads as a slider handle. */}
            <span className="absolute top-1 left-[6px] size-1.5 rounded-full bg-white/90" />
          </motion.span>
        </div>
      </motion.div>

      {/* The bubble level: the only feedback telling you how hard you're leaning. */}
      <div
        aria-hidden
        className="mx-auto mt-3 flex h-5 w-24 items-center justify-center rounded-full border border-white/10 bg-neutral-900/70"
      >
        <span className="absolute h-5 w-5 rounded-full border-x border-white/15" />
        <motion.span
          className="size-3 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
          style={{ x: reduceMotion ? 0 : bubbleX }}
        />
      </div>
    </div>
  );
};

/** A notch every five points. They're the only places the marble can rest. */
const Detents = () => (
  <>
    {Array.from({ length: VOLUME_MAX / DETENT_STEP + 1 }, (_, index) => {
      const value = index * DETENT_STEP;
      const major = value % 25 === 0;
      return (
        <span
          key={value}
          aria-hidden
          className={`absolute top-1/2 w-px -translate-y-1/2 ${
            major ? "h-4 bg-white/25" : "h-2 bg-white/10"
          }`}
          style={{ left: volumeToX(value) + MARBLE_SIZE / 2 + (GROOVE_HEIGHT - MARBLE_SIZE) / 2 }}
        />
      );
    })}
  </>
);
