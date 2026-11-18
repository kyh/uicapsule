"use client";

import { useEffect, useId, useRef, useState } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { ChevronRightIcon, CircleHelpIcon, ZapIcon } from "lucide-react";

import type { MotionValue } from "motion/react";

import type { EffortTheme } from "./effort-theme";

import { DialTrough, knobBoxStyle, KnobSkin, LevelLabel } from "./effort-dial";
import { clamp, DEFAULT_LEVEL, KNOB_SIZE, TRACK_TRAVEL, TRACK_WIDTH } from "./effort-scale";
import { EFFORT_THEMES, labelAt, levelCount, nearestLevel, notchX } from "./effort-theme";

const MAX_OVERPULL = 140;
const LAUNCH_GAIN = 12;
const DRAG = 3.4;
const RESTITUTION = 0.62;
const SETTLE_SPEED = 55;
const MAX_FLIGHT_SECONDS = 6;
const MIN_STRETCH = 4;
const FULL_STRETCH = 170;
const FULL_SPEED = 1800;
const MAX_BLUR = 7;
const BLUR_CUTOFF = 0.03;

const SETTLE_SPRING = { damping: 26, stiffness: 420, type: "spring" } as const;
const IMPACT_SPRING = { damping: 18, stiffness: 500, type: "spring" } as const;
const RELEASE_SPRING = { damping: 30, stiffness: 700, type: "spring" } as const;

export type TrackPhase = "idle" | "pulling" | "flying";

const ARROW_DELTA = new Map([
  ["ArrowLeft", -1],
  ["ArrowRight", 1],
]);

const overpull = (raw: number) => {
  if (raw < 0) {
    return -MAX_OVERPULL * Math.tanh(-raw / MAX_OVERPULL);
  }

  if (raw > TRACK_TRAVEL) {
    return TRACK_TRAVEL + MAX_OVERPULL * Math.tanh((raw - TRACK_TRAVEL) / MAX_OVERPULL);
  }

  return raw;
};

interface PullOrigin {
  anchor: number;
  pointer: number;
}

interface SlingshotTrackProps {
  /** Knob offset in px, owned by the shell so the chrome can follow it. */
  knobX: MotionValue<number>;
  theme: EffortTheme;
  /** Fires whenever the knob starts or stops being a projectile. */
  onPhaseChange?: (phase: TrackPhase) => void;
}

/**
 * An effort slider you cannot place — only fire. Haul the knob back either way
 * against the band and let go: it launches, ricochets off the ends of the track,
 * and settles wherever it ran out of momentum. Aiming is a suggestion.
 */
export const SlingshotTrack = ({ knobX, theme, onPhaseChange }: SlingshotTrackProps) => {
  const tokens = EFFORT_THEMES[theme];
  const [phase, setPhase] = useState<TrackPhase>("idle");

  const enterPhase = (next: TrackPhase) => {
    setPhase(next);
    onPhaseChange?.(next);
  };

  const tension = useMotionValue(0);
  const speed = useMotionValue(0);
  const impact = useMotionValue(0);
  const knobOrigin = useMotionValue(0.5);
  const anchorX = useMotionValue(notchX(theme, DEFAULT_LEVEL));

  const velocity = useRef(0);
  const frame = useRef(0);
  const pullOrigin = useRef<PullOrigin | null>(null);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const settle = (x: number) => {
    const level = nearestLevel(theme, x);
    velocity.current = 0;
    enterPhase("idle");
    void animate(knobX, notchX(theme, level), SETTLE_SPRING);
    void animate(speed, 0, SETTLE_SPRING);
    knobOrigin.set(0.5);
  };

  const hitWall = (collisionSpeed: number, wall: "left" | "right") => {
    knobOrigin.set(wall === "left" ? 0 : 1);
    impact.set(clamp(collisionSpeed / FULL_SPEED, 0.3, 1));
    void animate(impact, 0, IMPACT_SPRING);
  };

  const launch = (stretch: number) => {
    velocity.current = stretch * LAUNCH_GAIN;
    enterPhase("flying");
    void animate(tension, 0, RELEASE_SPRING);

    let last = performance.now();
    let elapsed = 0;

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      elapsed += dt;

      let v = velocity.current;
      let x = knobX.get() + v * dt;
      v *= Math.exp(-DRAG * dt);

      if (x < 0 && v < 0) {
        x = -x;
        hitWall(Math.abs(v), "left");
        v = -v * RESTITUTION;
      } else if (x > TRACK_TRAVEL && v > 0) {
        x = 2 * TRACK_TRAVEL - x;
        hitWall(Math.abs(v), "right");
        v = -v * RESTITUTION;
      }

      knobX.set(x);
      speed.set(clamp(Math.abs(v) / FULL_SPEED, 0, 1));
      velocity.current = v;

      if (Math.abs(v) < SETTLE_SPEED || elapsed > MAX_FLIGHT_SECONDS) {
        settle(x);

        return;
      }

      frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    cancelAnimationFrame(frame.current);
    event.currentTarget.setPointerCapture(event.pointerId);
    const anchor = knobX.get();
    pullOrigin.current = { anchor, pointer: event.clientX };
    anchorX.set(anchor);
    velocity.current = 0;
    speed.set(0);
    enterPhase("pulling");
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const origin = pullOrigin.current;

    if (!origin) {
      return;
    }

    const x = overpull(origin.anchor - (origin.pointer - event.clientX));

    knobX.set(x);
    tension.set(clamp(Math.abs(origin.anchor - x) / FULL_STRETCH, 0, 1));
  };

  const handlePointerUp = () => {
    const origin = pullOrigin.current;
    pullOrigin.current = null;

    if (!origin) {
      return;
    }

    const stretch = origin.anchor - knobX.get();

    if (Math.abs(stretch) < MIN_STRETCH) {
      void animate(tension, 0, RELEASE_SPRING);
      settle(knobX.get());

      return;
    }

    launch(stretch);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const delta = ARROW_DELTA.get(event.key) ?? 0;

    if (delta === 0) {
      return;
    }

    event.preventDefault();
    cancelAnimationFrame(frame.current);
    settle(notchX(theme, nearestLevel(theme, knobX.get()) + delta));
  };

  const level = useTransform(knobX, (x) => nearestLevel(theme, x));
  const [ariaLevel, setAriaLevel] = useState(() => nearestLevel(theme, knobX.get()));
  useMotionValueEvent(level, "change", setAriaLevel);

  const knobScaleX = useTransform(
    [speed, impact],
    ([s, i]: number[]) => 1 + (s ?? 0) * 0.34 * (1 - (i ?? 0)) - (i ?? 0) * 0.34,
  );

  const knobScaleY = useTransform(
    [speed, impact],
    ([s, i]: number[]) => 1 - (s ?? 0) * 0.24 * (1 - (i ?? 0)) + (i ?? 0) * 0.26,
  );

  const knobTransformOrigin = useTransform(knobOrigin, (o) => `${o * 100}% 50%`);

  const blurId = `sling-blur-${useId().replaceAll(":", "")}`;
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  useMotionValueEvent(speed, "change", (s) => {
    blurRef.current?.setAttribute("stdDeviation", `${(s * MAX_BLUR).toFixed(2)} 0`);
  });
  const knobFilter = useTransform(speed, (s) => (s > BLUR_CUTOFF ? `url(#${blurId})` : "none"));

  const bandLeft = useTransform(
    [knobX, anchorX],
    ([x, anchor]: number[]) => Math.min(x ?? 0, anchor ?? 0) + KNOB_SIZE / 2,
  );

  const bandWidth = useTransform([knobX, anchorX], ([x, anchor]: number[]) =>
    Math.abs((anchor ?? 0) - (x ?? 0)),
  );

  const bandColor = useTransform(tension, [0, 1], ["#a855f7", "#f3e8ff"]);
  const bandOpacity = useTransform(tension, [0, 0.04, 1], [0, 0.85, 1]);
  const ghostLeft = useTransform(anchorX, (x) => x + KNOB_SIZE / 2);

  return (
    <div className="relative" style={{ height: KNOB_SIZE, width: TRACK_WIDTH }}>
      <svg aria-hidden className="absolute size-0">
        <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur ref={blurRef} stdDeviation="0 0" />
        </filter>
      </svg>

      <DialTrough knobX={knobX} theme={theme} />

      <motion.span
        aria-hidden
        className="absolute h-[3px] -translate-y-1/2 rounded-full"
        style={{
          backgroundColor: bandColor,
          left: bandLeft,
          opacity: bandOpacity,
          top: "50%",
          width: bandWidth,
        }}
      />

      <motion.span
        aria-hidden
        className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60"
        style={{ left: ghostLeft, opacity: bandOpacity, top: "50%" }}
      />

      <motion.button
        type="button"
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the knob is a projectile drawn by motion, not a value an <input type="range"> could hold
        role="slider"
        aria-label="Reasoning effort"
        aria-valuemin={0}
        aria-valuemax={levelCount(theme) - 1}
        aria-valuenow={ariaLevel}
        aria-valuetext={labelAt(theme, ariaLevel)}
        className={`absolute outline-none focus-visible:ring-2 ${tokens.ring} ${
          phase === "pulling" ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          ...knobBoxStyle(theme),
          filter: knobFilter,
          scaleX: knobScaleX,
          scaleY: knobScaleY,
          touchAction: "none",
          transformOrigin: knobTransformOrigin,
          x: knobX,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <KnobSkin theme={theme} />
      </motion.button>
    </div>
  );
};

const HEADER_FADE = { duration: 0.18, ease: [0.4, 0, 0.2, 1] } as const;

interface SlingshotCardProps {
  knobX: MotionValue<number>;
  theme: EffortTheme;
}

/**
 * The popover the slingshot lives in — and the one place the two apps disagree
 * about how a control introduces itself. ChatGPT hides the ends of the scale
 * until you take hold of the knob; Claude states the level and both ends up
 * front and never moves them. Same track underneath either way.
 */
export const SlingshotCard = ({ knobX, theme }: SlingshotCardProps) => {
  const tokens = EFFORT_THEMES[theme];
  const [phase, setPhase] = useState<TrackPhase>("idle");
  const winding = phase !== "idle";

  return (
    <div className={`p-5 ${tokens.card}`}>
      {theme === "claude" ? (
        <>
          <div className="mb-8 flex h-9 items-center justify-between gap-2">
            <span className={`text-[26px] ${tokens.muted}`}>
              Effort <LevelLabel knobX={knobX} theme={theme} className={tokens.text} />
            </span>
            <CircleHelpIcon aria-hidden className={`size-8 ${tokens.faint}`} />
          </div>
          <div className={`mb-4 flex items-center justify-between text-[24px] ${tokens.muted}`}>
            <span>Faster</span>
            <span>Smarter</span>
          </div>
        </>
      ) : (
        <div className="relative mb-5 h-6">
          <motion.div
            className="absolute inset-0 flex items-center justify-between"
            animate={{ opacity: winding ? 0 : 1 }}
            transition={HEADER_FADE}
          >
            <span className={`flex items-center gap-0.5 text-[15px] ${tokens.muted}`}>
              Advanced
              <ChevronRightIcon className={`size-4 ${tokens.faint}`} />
            </span>
            <ZapIcon className={`size-5 ${tokens.faint}`} />
          </motion.div>

          <motion.div
            aria-hidden={!winding}
            className={`absolute inset-0 flex items-center justify-between px-0.5 text-[15px] ${tokens.faint}`}
            animate={{ opacity: winding ? 1 : 0 }}
            transition={HEADER_FADE}
          >
            <span>Faster</span>
            <span>Smarter</span>
          </motion.div>
        </div>
      )}

      <div className="flex justify-center">
        <SlingshotTrack knobX={knobX} theme={theme} onPhaseChange={setPhase} />
      </div>
    </div>
  );
};
