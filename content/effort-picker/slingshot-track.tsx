"use client";

import { useEffect, useId, useRef, useState } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { ChevronRightIcon, CircleHelpIcon, ZapIcon } from "lucide-react";

import type { MotionValue } from "motion/react";

import type { EffortTheme } from "./effort-theme";

import { DialTrough, knobBoxStyle, KnobSkin, LevelLabel } from "./effort-dial";
import { clamp, DEFAULT_LEVEL, KNOB_SIZE, TRACK_TRAVEL, TRACK_WIDTH } from "./effort-scale";
import { EFFORT_THEMES, labelAt, levelCount, nearestLevel, notchX } from "./effort-theme";

/**
 * How far past either cap the band stretches. Tuned by simulating the landing
 * distribution: below ~100px a shot from the bottom notch can never reach the
 * top ones, and every notch has to stay winnable from every other.
 */
const MAX_OVERPULL = 140;
/** Launch speed (px/s) earned per px of stretch. */
const LAUNCH_GAIN = 12;
/** Exponential velocity decay, per second. */
const DRAG = 3.4;
/** Fraction of speed kept after hitting a wall. */
const RESTITUTION = 0.62;
/** Below this speed the knob gives up and snaps to the nearest notch. */
const SETTLE_SPEED = 55;
/** Escape hatch: nothing flies forever. */
const MAX_FLIGHT_SECONDS = 6;
/** A stretch smaller than this is a fidget, not a shot. */
const MIN_STRETCH = 4;
/** The stretch that reads as "fully wound up", for the band's colour. */
const FULL_STRETCH = 170;
/** The speed that reads as "flat out", for the knob's stretch. */
const FULL_SPEED = 1800;
/** Blur radius at full speed, in px. Applied along X only — motion blur smears
 * along the direction of travel; an even blur just looks out of focus. */
const MAX_BLUR = 7;
/** Below this speed the blur filter is dropped entirely rather than left at ~0,
 * so a resting knob keeps its crisp edge and costs nothing to composite. */
const BLUR_CUTOFF = 0.03;

const SETTLE_SPRING = { type: "spring", stiffness: 420, damping: 26 } as const;
const IMPACT_SPRING = { type: "spring", stiffness: 500, damping: 18 } as const;
const RELEASE_SPRING = { type: "spring", stiffness: 700, damping: 30 } as const;

export type TrackPhase = "idle" | "pulling" | "flying";

type PullOrigin = { anchor: number; pointer: number };

type SlingshotTrackProps = {
  /** Knob offset in px, owned by the shell so the chrome can follow it. */
  knobX: MotionValue<number>;
  theme: EffortTheme;
  /** Fires whenever the knob starts or stops being a projectile. */
  onPhaseChange?: (phase: TrackPhase) => void;
};

/**
 * An effort slider you cannot place — only fire. Haul the knob back either way
 * against the band and let go: it launches, ricochets off the ends of the track,
 * and settles wherever it ran out of momentum. Aiming is a suggestion.
 */
export const SlingshotTrack = ({ knobX, theme, onPhaseChange }: SlingshotTrackProps) => {
  const tokens = EFFORT_THEMES[theme];
  const [phase, setPhaseState] = useState<TrackPhase>("idle");

  const setPhase = (next: TrackPhase) => {
    setPhaseState(next);
    onPhaseChange?.(next);
  };

  /** How wound up the band is, 0–1. Lights the band — but never deforms the
   * knob: a knob that squashes while you haul on it reads as slack, not loaded. */
  const tension = useMotionValue(0);
  /** Speed, 0–1, while the knob is a projectile. Stretches it along its travel. */
  const speed = useMotionValue(0);
  /** A spike on each wall hit, kept separate so impacts don't light up the band. */
  const impact = useMotionValue(0);
  /** 0 = left edge, 1 = right edge: which wall the knob is being crushed against. */
  const knobOrigin = useMotionValue(0.5);
  /** Where the band is pinned: the notch the knob is being hauled off of. */
  const anchorX = useMotionValue(notchX(theme, DEFAULT_LEVEL));

  const velocity = useRef(0);
  const frame = useRef(0);
  const pullOrigin = useRef<PullOrigin | null>(null);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const settle = (x: number) => {
    const level = nearestLevel(theme, x);
    velocity.current = 0;
    setPhase("idle");
    void animate(knobX, notchX(theme, level), SETTLE_SPRING);
    void animate(speed, 0, SETTLE_SPRING);
    knobOrigin.set(0.5);
  };

  /**
   * Harder hits squash harder — a wall tap shouldn't deform it like a wall slam.
   * The origin snaps to the contact edge so the knob flattens *against* the wall
   * instead of shrinking away from it on both sides.
   */
  const hitWall = (collisionSpeed: number, wall: "left" | "right") => {
    knobOrigin.set(wall === "left" ? 0 : 1);
    impact.set(clamp(collisionSpeed / FULL_SPEED, 0.3, 1));
    void animate(impact, 0, IMPACT_SPRING);
  };

  /** Stretch is signed: haul left, it fires right; haul right, it fires left. */
  const launch = (stretch: number) => {
    velocity.current = stretch * LAUNCH_GAIN;
    setPhase("flying");
    void animate(tension, 0, RELEASE_SPRING);

    let last = performance.now();
    let elapsed = 0;

    const step = (now: number) => {
      // Clamped so a backgrounded tab doesn't resume with one enormous step and
      // tunnel the knob straight through a wall.
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      elapsed += dt;

      let v = velocity.current;
      let x = knobX.get() + v * dt;
      v *= Math.exp(-DRAG * dt);

      // Reflect only off a wall the knob is actually moving into. A shot fired
      // from the overpull zone starts outside the track and has to be allowed to
      // fly home, not bounce off the cap it's launching through.
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
    setPhase("pulling");
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const origin = pullOrigin.current;
    if (!origin) return;

    const raw = origin.anchor - (origin.pointer - event.clientX);
    // Past either cap the band goes taut rather than snapping — an asymptote, so
    // there is always runway to pull against even when sitting on an end notch.
    const x =
      raw < 0
        ? -MAX_OVERPULL * Math.tanh(-raw / MAX_OVERPULL)
        : raw > TRACK_TRAVEL
          ? TRACK_TRAVEL + MAX_OVERPULL * Math.tanh((raw - TRACK_TRAVEL) / MAX_OVERPULL)
          : raw;

    knobX.set(x);
    tension.set(clamp(Math.abs(origin.anchor - x) / FULL_STRETCH, 0, 1));
  };

  const handlePointerUp = () => {
    const origin = pullOrigin.current;
    pullOrigin.current = null;
    if (!origin) return;

    const stretch = origin.anchor - knobX.get();
    if (Math.abs(stretch) < MIN_STRETCH) {
      void animate(tension, 0, RELEASE_SPRING);
      settle(knobX.get());
      return;
    }
    launch(stretch);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;
    // Keyboard users get the boring slider. The joke isn't worth locking them out.
    event.preventDefault();
    cancelAnimationFrame(frame.current);
    settle(notchX(theme, nearestLevel(theme, knobX.get()) + delta));
  };

  // The knob moves every frame, but the *level* changes a handful of times a
  // flight — cheap enough to mirror into React for assistive tech.
  const level = useTransform(knobX, (x) => nearestLevel(theme, x));
  const [ariaLevel, setAriaLevel] = useState(() => nearestLevel(theme, knobX.get()));
  useMotionValueEvent(level, "change", setAriaLevel);

  // The knob deforms only when it's a projectile, and the two deformations run on
  // opposite axes: speed smears it ALONG its travel (wide and flat), while a wall
  // crushes it INTO the wall (narrow and tall). The impact damps the smear as it
  // lands, otherwise the two would cancel out at exactly the moment of the hit —
  // which is the one frame the squash has to read.
  const knobScaleX = useTransform(
    [speed, impact],
    ([s, i]: number[]) => 1 + (s ?? 0) * 0.34 * (1 - (i ?? 0)) - (i ?? 0) * 0.34,
  );
  const knobScaleY = useTransform(
    [speed, impact],
    ([s, i]: number[]) => 1 - (s ?? 0) * 0.24 * (1 - (i ?? 0)) + (i ?? 0) * 0.26,
  );
  const knobTransformOrigin = useTransform(knobOrigin, (o) => `${o * 100}% 50%`);

  // Motion blur. CSS `blur()` is isotropic — it reads as out-of-focus, not fast —
  // so this is an SVG feGaussianBlur with a horizontal-only deviation, driven off
  // the same speed value. React can't re-render an attribute 60× a second cheaply,
  // so the deviation is written straight to the filter node.
  const blurId = `sling-blur-${useId().replaceAll(":", "")}`;
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  useMotionValueEvent(speed, "change", (s) => {
    blurRef.current?.setAttribute("stdDeviation", `${(s * MAX_BLUR).toFixed(2)} 0`);
  });
  const knobFilter = useTransform(speed, (s) => (s > BLUR_CUTOFF ? `url(#${blurId})` : "none"));

  // The elastic itself: a taut line from the knob back to the notch it's being
  // hauled off of, brightening as it winds up. Without it, a pull just looks
  // like a slider being dragged.
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
    <div className="relative" style={{ width: TRACK_WIDTH, height: KNOB_SIZE }}>
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
          top: "50%",
          left: bandLeft,
          width: bandWidth,
          backgroundColor: bandColor,
          opacity: bandOpacity,
        }}
      />

      <motion.span
        aria-hidden
        className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60"
        style={{ top: "50%", left: ghostLeft, opacity: bandOpacity }}
      />

      <motion.button
        type="button"
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
          x: knobX,
          scaleX: knobScaleX,
          scaleY: knobScaleY,
          transformOrigin: knobTransformOrigin,
          filter: knobFilter,
          touchAction: "none",
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

type SlingshotCardProps = {
  knobX: MotionValue<number>;
  theme: EffortTheme;
};

/**
 * The popover the slingshot lives in — and the one place the two apps disagree
 * about how a control introduces itself. ChatGPT hides the ends of the scale
 * until you take hold of the knob; Claude states the level and both ends up
 * front and never moves them. Same track underneath either way.
 */
export const SlingshotCard = ({ knobX, theme }: SlingshotCardProps) => {
  const tokens = EFFORT_THEMES[theme];
  const [phase, setPhase] = useState<TrackPhase>("idle");
  // Hold the knob and the ChatGPT panel stops labelling itself and starts
  // labelling the *track* — which end buys you what. It's the only instruction
  // the thing gives.
  const winding = phase !== "idle";

  return (
    <div className={`p-5 ${tokens.card}`}>
      {theme === "claude" ? (
        // 16px between the header and the scale, 8px between the scale's labels
        // and its track — doubled, like everything else in the scene.
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
