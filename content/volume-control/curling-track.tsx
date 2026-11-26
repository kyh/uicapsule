"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

import type { MotionValue } from "motion/react";

import { HUD_INNER_WIDTH } from "./macos-chrome";
import { arrowDelta, clamp, clampVolume, snapVolume, VOLUME_MAX, VOLUME_MIN } from "./volume-scale";

const SHEET_WIDTH = HUD_INNER_WIDTH;
const SHEET_HEIGHT = 132;
const STONE_SIZE = 34;
const HACK_X = 8;
const TRAVEL = SHEET_WIDTH - STONE_SIZE;

const THROW_GAIN = 7.4;
const MAX_DRAW = 110;
const MIN_DRAW = 6;

const ICE_FRICTION = 1.35;
const SWEPT_FRICTION = 0.42;
const SWEEP_DECAY = 3.2;
const SWEEP_FULL = 260;
const BROOM_REACH = 90;

const BACKBOARD = 0.3;
const SETTLE_SPEED = 12;
const MAX_SLIDE_SECONDS = 8;

const SETTLE_SPRING = { damping: 30, stiffness: 380, type: "spring" } as const;
const RETURN_SPRING = { damping: 24, stiffness: 220, type: "spring" } as const;

const stoneToVolume = (x: number) => clamp((x / TRAVEL) * VOLUME_MAX, VOLUME_MIN, VOLUME_MAX);
const volumeToStone = (volume: number) => (clampVolume(volume) / VOLUME_MAX) * TRAVEL;

const HOUSE_X = volumeToStone(92) + STONE_SIZE / 2;

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

interface CurlingTrackProps {
  volume: MotionValue<number>;
}

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

  const stoneX = useMotionValue(volumeToStone(volume.get()));
  const sweep = useMotionValue(0);
  const broomX = useMotionValue(-100);
  const [drawing, setDrawing] = useState(0);

  const velocity = useRef(0);
  const frame = useRef(0);
  const drawOrigin = useRef(0);
  const drawn = useRef(0);
  const lastPointer = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const report = (value: number) =>
      sheetRef.current?.setAttribute("aria-valuenow", String(Math.round(value)));

    report(volume.get());

    return volume.on("change", report);
  }, [volume]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
    },
    [],
  );

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
    stoneX.set(HACK_X);

    let last = performance.now();
    let elapsed = 0;

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      elapsed += dt;

      const swept = sweep.get();
      const friction = ICE_FRICTION + (SWEPT_FRICTION - ICE_FRICTION) * swept;

      let v = velocity.current * Math.exp(-friction * dt);
      let x = stoneX.get() + v * dt;

      if (x < 0 && v < 0) {
        x = 0;
        v = 0;
      } else if (x > TRAVEL && v > 0) {
        x = TRAVEL - (x - TRAVEL);
        v = -v * BACKBOARD;
      }

      stoneX.set(x);
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
    if (phase === "sliding" || reduceMotion === true) {
      return;
    }

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
      const distance = clamp(drawOrigin.current - event.clientX, 0, MAX_DRAW);
      drawn.current = distance;
      setDrawing(distance);
      stoneX.set(clamp(HACK_X - distance * 0.28, -24, TRAVEL));

      return;
    }

    if (phase !== "sliding") {
      return;
    }

    const at = pointerInSheet(event);
    broomX.set(at);
    const previous = lastPointer.current;
    lastPointer.current = at;

    if (previous === null) {
      return;
    }

    const stoneCentre = stoneX.get() + STONE_SIZE / 2;

    if (Math.abs(at - stoneCentre) > BROOM_REACH) {
      return;
    }

    const scrubbed = Math.abs(at - previous);
    sweep.set(clamp(sweep.get() + scrubbed / SWEEP_FULL, 0, 1));
  };

  const handlePointerUp = () => {
    if (phase !== "drawing") {
      return;
    }

    const distance = drawn.current;

    if (distance < MIN_DRAW) {
      setPhase("idle");
      setDrawing(0);
      void animate(stoneX, volumeToStone(volume.get()), RETURN_SPRING);

      return;
    }

    lastPointer.current = null;
    setDrawing(0);
    deliver(distance * THROW_GAIN);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const delta = arrowDelta(event.key);

    if (delta === 0) {
      return;
    }

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
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role, jsx-a11y/role-has-required-aria-props -- a physics toy, not a range input; aria-valuenow is written straight to the DOM every frame (see the effect above)
      role="slider"
      tabIndex={0}
      aria-label="Volume"
      aria-valuemin={VOLUME_MIN}
      aria-valuemax={VOLUME_MAX}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      style={{ height: SHEET_HEIGHT, touchAction: "none", width: SHEET_WIDTH }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100/10 to-sky-50/[0.04] outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
        phase === "drawing" ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
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

      <motion.span
        aria-hidden
        className="absolute inset-y-0 w-40 -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(186,230,253,0.9),transparent_70%)]"
        style={{ left: broomX, opacity: iceGlow }}
      />

      <motion.span
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-neutral-300 to-neutral-500 shadow-[0_3px_10px_rgba(0,0,0,0.55)]"
        style={{ height: STONE_SIZE, rotate: stoneSpin, width: STONE_SIZE, x: stoneX }}
      >
        <span className="absolute inset-[6px] rounded-full border border-neutral-600/60 bg-neutral-700" />
        <span className="absolute inset-x-[13px] top-[3px] h-2 rounded-full bg-rose-400/80" />
      </motion.span>

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
