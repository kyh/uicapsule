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

const SHEET_WIDTH = HUD_INNER_WIDTH;
const SHEET_HEIGHT = 132;
const STONE_SIZE = 34;
const HACK_X = 8;
const TRAVEL = SHEET_WIDTH - STONE_SIZE;

/** Throwing speed (px/s) per px of draw-back. */
const THROW_GAIN = 7.4;
const MAX_DRAW = 110;
const MIN_DRAW = 6;

/** Friction on unswept ice, per second. Sweeping cuts it to a fraction of this —
 * that difference is the entire sport. */
const ICE_FRICTION = 1.35;
const SWEPT_FRICTION = 0.42;
/** How fast a burst of sweeping decays back to nothing. Stop scrubbing and the
 * ice pebbles back over within about a third of a second. */
const SWEEP_DECAY = 3.2;
/** Pointer px of scrubbing needed to fully polish the ice ahead of the stone. */
const SWEEP_FULL = 260;
/** Sweeping only counts within this many px of the stone. Waving the broom at the
 * far end of the sheet does nothing, as in life. */
const BROOM_REACH = 90;

const BACKBOARD = 0.3;
const SETTLE_SPEED = 12;
const MAX_SLIDE_SECONDS = 8;

const SETTLE_SPRING = { type: "spring", stiffness: 380, damping: 30 } as const;
const RETURN_SPRING = { type: "spring", stiffness: 220, damping: 24 } as const;

const stoneToVolume = (x: number) => clamp((x / TRAVEL) * VOLUME_MAX, VOLUME_MIN, VOLUME_MAX);
const volumeToStone = (volume: number) => (clampVolume(volume) / VOLUME_MAX) * TRAVEL;

/** Centre of the house, in sheet px — pulled in from the 100 mark so its rings
 * stay on the ice instead of falling off the end of it. */
const HOUSE_X = volumeToStone(92) + STONE_SIZE / 2;

type CurlingTrackProps = {
  volume: MotionValue<number>;
};

/**
 * Volume by curling. Draw the stone back off the hack, release, and it goes out
 * onto the ice with whatever weight you gave it — and then you're not done. While
 * it's travelling you can *sweep*: scrub the pointer back and forth just ahead of
 * the stone and the ice polishes, friction drops, and the stone carries further.
 * Stop sweeping and it grabs. Where it finally sits is the volume.
 */
export const CurlingTrack = ({ volume }: CurlingTrackProps) => {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "drawing" | "sliding">("idle");
  const [ariaVolume, setAriaVolume] = useState(() => Math.round(volume.get()));

  const stoneX = useMotionValue(volumeToStone(volume.get()));
  /** 0–1. How polished the ice under the broom is right now. */
  const sweep = useMotionValue(0);
  /** Where the broom is, in sheet px. Only meaningful while sweeping. */
  const broomX = useMotionValue(-100);
  const [drawing, setDrawing] = useState(0);

  const velocity = useRef(0);
  const frame = useRef(0);
  const drawOrigin = useRef(0);
  /** Draw distance, mirrored out of state: the throw is read on pointerup, and a
   * render is not guaranteed to have landed by then. */
  const drawn = useRef(0);
  const lastPointer = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Deliberately NOT mirrored off the stone's position: hauling the stone back
  // behind the hack would drag the volume to zero on the way, and the throw would
  // start from a lie. The volume only follows a stone that's actually travelling.

  useEffect(() => {
    const unsubscribe = volume.on("change", (next) => setAriaVolume(Math.round(next)));
    return unsubscribe;
  }, [volume]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const pointerInSheet = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = sheetRef.current?.getBoundingClientRect();
    return box ? event.clientX - box.left : 0;
  };

  const settle = (x: number) => {
    velocity.current = 0;
    setPhase("idle");
    lastPointer.current = null;
    void animate(sweep, 0, { duration: 0.3 });
    broomX.set(-100);
    const landed = snapVolume(stoneToVolume(x));
    volume.set(landed);
    void animate(stoneX, volumeToStone(landed), SETTLE_SPRING);
  };

  const deliver = (speed: number) => {
    velocity.current = speed;
    setPhase("sliding");
    // The stone leaves from the hack, not from wherever your hand hauled it back
    // to. Releasing from behind the line and letting the wall catch it would eat
    // the throw before it started.
    stoneX.set(HACK_X);

    let last = performance.now();
    let elapsed = 0;

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      elapsed += dt;

      // The broom's effect is local: polished ice only helps while the stone is
      // actually on it.
      const swept = sweep.get();
      const friction = ICE_FRICTION + (SWEPT_FRICTION - ICE_FRICTION) * swept;

      let v = velocity.current * Math.exp(-friction * dt);
      let x = stoneX.get() + v * dt;

      // Walls only stop a stone travelling into them — a stone leaving the hack is
      // moving away from the near wall and must be allowed to go.
      if (x < 0 && v < 0) {
        x = 0;
        v = 0;
      } else if (x > TRAVEL && v > 0) {
        // The backboard. Hit it hard enough and you come back down the sheet.
        x = TRAVEL - (x - TRAVEL);
        v = -v * BACKBOARD;
      }

      stoneX.set(x);
      // The stone in motion IS the volume: the menu bar climbs with it the whole
      // way down the sheet, and drops again if it comes back off the backboard.
      volume.set(snapVolume(stoneToVolume(x)));
      velocity.current = v;
      sweep.set(swept * Math.exp(-SWEEP_DECAY * dt));

      if (Math.abs(v) < SETTLE_SPEED || elapsed > MAX_SLIDE_SECONDS) {
        settle(x);
        return;
      }
      frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (phase === "sliding" || reduceMotion) return;
    cancelAnimationFrame(frame.current);
    event.currentTarget.setPointerCapture(event.pointerId);
    drawOrigin.current = event.clientX;
    drawn.current = 0;
    stoneX.set(HACK_X);
    setPhase("drawing");
    setDrawing(0);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (phase === "drawing") {
      // Only backwards counts. Shoving the stone forwards by hand is not a throw.
      const distance = clamp(drawOrigin.current - event.clientX, 0, MAX_DRAW);
      drawn.current = distance;
      setDrawing(distance);
      stoneX.set(clamp(HACK_X - distance * 0.28, -24, TRAVEL));
      return;
    }
    if (phase !== "sliding") return;

    // Sweeping: raw scrubbing distance, but only if the broom is near the stone.
    const at = pointerInSheet(event);
    broomX.set(at);
    const previous = lastPointer.current;
    lastPointer.current = at;
    if (previous === null) return;

    const stoneCentre = stoneX.get() + STONE_SIZE / 2;
    if (Math.abs(at - stoneCentre) > BROOM_REACH) return;

    const scrubbed = Math.abs(at - previous);
    sweep.set(clamp(sweep.get() + scrubbed / SWEEP_FULL, 0, 1));
  };

  const handlePointerUp = () => {
    if (phase !== "drawing") return;
    const distance = drawn.current;
    if (distance < MIN_DRAW) {
      setPhase("idle");
      setDrawing(0);
      // No throw: the stone goes back to where the volume already was.
      void animate(stoneX, volumeToStone(volume.get()), RETURN_SPRING);
      return;
    }
    lastPointer.current = null;
    setDrawing(0);
    deliver(distance * THROW_GAIN);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? DETENT_STEP
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? -DETENT_STEP
          : 0;
    if (delta === 0) return;
    event.preventDefault();
    cancelAnimationFrame(frame.current);
    settle(volumeToStone(clampVolume(snapVolume(volume.get()) + delta)));
  };

  const stoneSpin = useTransform(stoneX, (x) => (x / (Math.PI * STONE_SIZE)) * 220);
  const broomOpacity = useTransform(sweep, [0, 0.15], [0, 1]);
  const iceGlow = useTransform(sweep, [0, 1], [0, 0.5]);
  const drawPower = clamp(drawing / MAX_DRAW, 0, 1);

  return (
    <div
      ref={sheetRef}
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
      style={{ width: SHEET_WIDTH, height: SHEET_HEIGHT, touchAction: "none" }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100/10 to-sky-50/[0.04] outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
        phase === "drawing" ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* The house, painted at the loud end — the target nobody asked for. It sits
          a shade inside 100 so the rings don't run off the end of the sheet. */}
      <span
        aria-hidden
        className="absolute top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/25"
        style={{ left: HOUSE_X }}
      />
      <span
        aria-hidden
        className="absolute top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-rose-300/30 bg-rose-400/10"
        style={{ left: HOUSE_X }}
      />

      <SheetScale />

      {/* Polished ice: a wash of light under the broom while it's working. */}
      <motion.span
        aria-hidden
        className="absolute inset-y-0 w-40 -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(186,230,253,0.9),transparent_70%)]"
        style={{ left: broomX, opacity: iceGlow }}
      />

      <motion.span
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-neutral-300 to-neutral-500 shadow-[0_3px_10px_rgba(0,0,0,0.55)]"
        style={{ width: STONE_SIZE, height: STONE_SIZE, x: stoneX, rotate: stoneSpin }}
      >
        <span className="absolute inset-[6px] rounded-full border border-neutral-600/60 bg-neutral-700" />
        <span className="absolute inset-x-[13px] top-[3px] h-2 rounded-full bg-rose-400/80" />
      </motion.span>

      {/* The broom only exists while you're actually sweeping with it. */}
      <motion.span
        aria-hidden
        className="absolute top-1/2 h-9 w-2 -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-sm bg-amber-200/90 shadow-[0_0_10px_rgba(253,230,138,0.5)]"
        style={{ left: broomX, opacity: broomOpacity }}
      />

      {phase === "drawing" && drawing > MIN_DRAW && (
        <div
          aria-hidden
          className="absolute right-4 bottom-3 left-4 h-1 overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-300 to-rose-300"
            style={{ width: `${drawPower * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};

/** The scale, printed on the ice. */
const SheetScale = () => (
  <div aria-hidden className="absolute inset-x-0 bottom-0 h-5">
    {[0, 25, 50, 75, 100].map((value) => (
      <span
        key={value}
        className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
        style={{ left: volumeToStone(value) + STONE_SIZE / 2 }}
      >
        <span className="h-2 w-px bg-sky-100/30" />
        <span className="text-[10px] tabular-nums text-sky-100/40">{value}</span>
      </span>
    ))}
  </div>
);
