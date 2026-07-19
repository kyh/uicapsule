"use client";

import { useEffect, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react";

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

const BOARD_WIDTH = HUD_INNER_WIDTH;
const BOARD_HEIGHT = 190;
const FLOOR_Y = BOARD_HEIGHT - 26;

const BALL_SIZE = 14;
/** Where the barrel ends and the ball leaves. Volume is read off the floor, so
 * the muzzle sits at the zero end of the scale. */
const MUZZLE = { x: 30, y: FLOOR_Y - 22 };

const GRAVITY = 1500;
/** Launch speed (px/s) per px of pull-back. */
const POWER_GAIN = 6.2;
const MAX_PULL = 120;
/** A twitch is not a shot. */
const MIN_PULL = 6;
/** Speed kept after the ball hits the floor, and the bite the floor takes out of
 * its forward motion. Cannonballs don't skip like stones. */
const BOUNCE = 0.42;
const FLOOR_DRAG = 0.66;
/** Below this the ball has stopped, whatever it thinks. */
const SETTLE_SPEED = 42;
const MAX_FLIGHT_SECONDS = 6;

const RESET_SPRING = { type: "spring", stiffness: 300, damping: 26 } as const;

type Shot = { x: number; y: number; vx: number; vy: number };

const floorToVolume = (x: number) => clamp((x / BOARD_WIDTH) * VOLUME_MAX, VOLUME_MIN, VOLUME_MAX);
const volumeToFloor = (volume: number) => (clampVolume(volume) / VOLUME_MAX) * BOARD_WIDTH;

type CannonTrackProps = {
  volume: MotionValue<number>;
};

/**
 * Artillery, as a volume control. Haul back off the muzzle to load angle and
 * power together, let go, and watch a cannonball arc across the scale. Wherever
 * it comes to rest is your new volume — no aiming line, no preview, no second
 * guess. Overshoot the board and the shot is simply wide: the volume doesn't
 * change, and you get to do it again.
 */
export const CannonTrack = ({ volume }: CannonTrackProps) => {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "aiming" | "firing">("idle");
  const [wide, setWide] = useState(false);

  const ballX = useMotionValue(MUZZLE.x);
  const ballY = useMotionValue(MUZZLE.y);
  /** Where the pointer has hauled the ball back to: it aims the barrel and sizes
   * the band, so it renders — but the shot is read on pointerup, and a render is
   * not guaranteed to have landed by then, hence the mirror. */
  const [pullVector, setPullVector] = useState({ x: 0, y: 0 });
  const pull = useRef({ x: 0, y: 0 });

  const frame = useRef(0);
  const wideTimer = useRef(0);
  const boardRef = useRef<HTMLDivElement>(null);

  // Written to the attribute rather than held in state, matching the other
  // controls: nothing about the reported value needs a render to land.
  useEffect(() => {
    const report = (value: number) =>
      boardRef.current?.setAttribute("aria-valuenow", String(Math.round(value)));
    report(volume.get());
    return volume.on("change", report);
  }, [volume]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frame.current);
      window.clearTimeout(wideTimer.current);
    };
  }, []);

  /** One step of ballistics. Shared by the animated flight and the reduced-motion
   * fast-forward, so both land the ball in exactly the same place. */
  const advance = (shot: Shot, dt: number): Shot => {
    const vy = shot.vy + GRAVITY * dt;
    let next = { x: shot.x + shot.vx * dt, y: shot.y + vy * dt, vx: shot.vx, vy };

    if (next.y >= FLOOR_Y) {
      next = {
        x: next.x,
        y: FLOOR_Y,
        vx: next.vx * FLOOR_DRAG,
        vy: -Math.abs(next.vy) * BOUNCE,
      };
    }
    return next;
  };

  const land = (x: number) => {
    setPhase("idle");
    if (x > BOARD_WIDTH) {
      // Sailed clean off the board. The volume keeps whatever it had.
      setWide(true);
      window.clearTimeout(wideTimer.current);
      wideTimer.current = window.setTimeout(() => setWide(false), 1600);
      resetBall();
      return;
    }
    const landed = snapVolume(floorToVolume(x));
    volume.set(landed);
    void animate(ballX, volumeToFloor(landed), RESET_SPRING);
  };

  const resetBall = () => {
    void animate(ballX, MUZZLE.x, RESET_SPRING);
    void animate(ballY, MUZZLE.y, RESET_SPRING);
  };

  const fire = (vx: number, vy: number) => {
    if (reduceMotion) {
      // No arc, same maths: run the flight to its conclusion and report the result.
      let shot: Shot = { x: MUZZLE.x, y: MUZZLE.y, vx, vy };
      for (let t = 0; t < MAX_FLIGHT_SECONDS * 60; t += 1) {
        shot = advance(shot, 1 / 60);
        const resting = shot.y >= FLOOR_Y - 0.5 && Math.abs(shot.vy) < SETTLE_SPEED;
        if (resting || shot.x > BOARD_WIDTH) break;
      }
      land(shot.x);
      return;
    }

    setPhase("firing");
    let shot: Shot = { x: MUZZLE.x, y: MUZZLE.y, vx, vy };
    let last = performance.now();
    let elapsed = 0;

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      elapsed += dt;

      shot = advance(shot, dt);
      ballX.set(shot.x);
      ballY.set(shot.y);

      const grounded = shot.y >= FLOOR_Y - 0.5;
      const spent =
        grounded && Math.abs(shot.vy) < SETTLE_SPEED && Math.abs(shot.vx) < SETTLE_SPEED;
      if (spent || shot.x > BOARD_WIDTH + BALL_SIZE || elapsed > MAX_FLIGHT_SECONDS) {
        land(shot.x);
        return;
      }
      frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
  };

  const pointerInBoard = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = boardRef.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (phase === "firing") return;
    cancelAnimationFrame(frame.current);
    event.currentTarget.setPointerCapture(event.pointerId);
    setWide(false);
    setPhase("aiming");
    ballX.set(MUZZLE.x);
    ballY.set(MUZZLE.y);
    pull.current = { x: 0, y: 0 };
    setPullVector({ x: 0, y: 0 });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "aiming") return;
    const point = pointerInBoard(event);
    // Pull is measured from the muzzle and capped, so the barrel can't be hauled
    // through the back of the cannon and the shot has a ceiling.
    const dx = point.x - MUZZLE.x;
    const dy = point.y - MUZZLE.y;
    const distance = Math.hypot(dx, dy);
    const scale = distance > MAX_PULL ? MAX_PULL / distance : 1;
    const vector = { x: dx * scale, y: dy * scale };

    pull.current = vector;
    setPullVector(vector);
    ballX.set(MUZZLE.x + vector.x);
    ballY.set(MUZZLE.y + vector.y);
  };

  const handlePointerUp = () => {
    if (phase !== "aiming") return;
    const vector = pull.current;
    const distance = Math.hypot(vector.x, vector.y);
    if (distance < MIN_PULL) {
      setPhase("idle");
      resetBall();
      setPullVector({ x: 0, y: 0 });
      return;
    }
    // Fired opposite the pull, like every slingshot ever built.
    fire(-vector.x * POWER_GAIN, -vector.y * POWER_GAIN);
    setPullVector({ x: 0, y: 0 });
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
    const next = clampVolume(snapVolume(volume.get()) + delta);
    volume.set(next);
    void animate(ballX, volumeToFloor(next), RESET_SPRING);
    void animate(ballY, FLOOR_Y, RESET_SPRING);
  };

  const pullDistance = Math.hypot(pullVector.x, pullVector.y);
  const barrelAngle =
    pullDistance > 0 ? (Math.atan2(-pullVector.y, -pullVector.x) * 180) / Math.PI : -45;
  const power = clamp(pullDistance / MAX_PULL, 0, 1);

  return (
    <div
      ref={boardRef}
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
      style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, touchAction: "none" }}
      className={`relative overflow-hidden rounded-2xl bg-neutral-950/80 outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
        phase === "aiming" ? "cursor-grabbing" : "cursor-crosshair"
      }`}
    >
      <FloorScale />

      {/* The barrel points wherever the shot is going, and swells with the load. */}
      <motion.span
        aria-hidden
        className="absolute origin-left rounded-r-[3px] bg-gradient-to-b from-neutral-400 to-neutral-600"
        style={{
          left: MUZZLE.x - 16,
          top: MUZZLE.y - 5,
          width: 34 + power * 6,
          height: 10 + power * 3,
          rotate: barrelAngle,
        }}
      />
      <span
        aria-hidden
        className="absolute size-7 rounded-full border-2 border-neutral-600 bg-neutral-800"
        style={{ left: MUZZLE.x - 26, top: MUZZLE.y - 8 }}
      />

      {/* The band you're hauling against — the only read on how hard this will go. */}
      {phase === "aiming" && pullDistance > MIN_PULL && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full">
          <line
            x1={MUZZLE.x}
            y1={MUZZLE.y}
            x2={MUZZLE.x + pullVector.x}
            y2={MUZZLE.y + pullVector.y}
            stroke={power > 0.85 ? "#fca5a5" : "#a78bfa"}
            strokeWidth={2 + power * 2}
            strokeLinecap="round"
          />
        </svg>
      )}

      <motion.span
        aria-hidden
        className="absolute rounded-full bg-gradient-to-b from-neutral-200 to-neutral-500 shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
        style={{
          width: BALL_SIZE,
          height: BALL_SIZE,
          left: -BALL_SIZE / 2,
          top: -BALL_SIZE / 2,
          x: ballX,
          y: ballY,
        }}
      />

      <AnimatePresence>
        {wide && (
          <motion.p
            key="wide"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 right-4 rounded-full bg-rose-500/15 px-3 py-1 text-[13px] text-rose-300"
          >
            Wide. Volume unchanged.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

/** The volume scale, painted on the floor where the ball has to land on it. Ticks
 * sit exactly on their value — the ball is scored against them, so they can't lie
 * — while the two end labels shuffle inwards to clear the board's rounded corner. */
const FloorScale = () => (
  <div aria-hidden className="absolute inset-x-0 bottom-0 h-[26px] border-t border-white/10">
    {[0, 25, 50, 75, 100].map((value) => (
      <span
        key={value}
        className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
        style={{ left: volumeToFloor(value) }}
      >
        <span className="h-2 w-px bg-white/25" />
        <span
          className={`mt-0.5 text-[10px] tabular-nums text-neutral-500 ${
            value === 0 ? "translate-x-2" : value === 100 ? "-translate-x-2.5" : ""
          }`}
        >
          {value}
        </span>
      </span>
    ))}
    {Array.from({ length: VOLUME_MAX / DETENT_STEP + 1 }, (_, index) => index * DETENT_STEP)
      .filter((value) => value % 25 !== 0)
      .map((value) => (
        <span
          key={value}
          className="absolute top-0 h-1 w-px bg-white/10"
          style={{ left: volumeToFloor(value) }}
        />
      ))}
  </div>
);
