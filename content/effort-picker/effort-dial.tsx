"use client";

import { useRef } from "react";
import { motion, useMotionValueEvent, useTransform } from "motion/react";

import type { MotionValue } from "motion/react";

import type { EffortTheme } from "./effort-theme";

import { KNOB_SIZE, percentToX, TRACK_TRAVEL, TRACK_WIDTH } from "./effort-scale";
import { EFFORT_THEMES, labelAt, nearestLevel, notchX } from "./effort-theme";

type DialTroughProps = {
  knobX: MotionValue<number>;
  theme: EffortTheme;
};

/**
 * Everything about the dial that is purely a function of the knob's position:
 * the trough, the fill, the notch dots. All three variants render this; each
 * brings its own knob, because a knob you sling and a knob you sing at behave
 * nothing alike even though they sit in the same groove.
 */
export const DialTrough = ({ knobX, theme }: DialTroughProps) => {
  const tokens = EFFORT_THEMES[theme];
  const offsetY = (KNOB_SIZE - tokens.troughHeight) / 2;

  // The trough follows the knob out past either cap, so the knob always sits ON
  // the track rather than floating off the end of it.
  const troughLeft = useTransform(knobX, (x) => Math.min(0, x));
  const troughWidth = useTransform(
    knobX,
    (x) => TRACK_WIDTH + Math.max(0, -x) + Math.max(0, x - TRACK_TRAVEL),
  );

  const fillLeft = useTransform(knobX, (x) => Math.min(0, x));
  const fillWidth = useTransform(knobX, (x) => x - Math.min(0, x) + KNOB_SIZE / 2);
  const [rampFrom, rampTo] = tokens.fill;
  const fillColor = useTransform(
    knobX,
    [0, TRACK_TRAVEL * 0.75, TRACK_TRAVEL],
    [rampFrom, rampFrom, rampTo],
  );

  return (
    <>
      <motion.div
        className={`absolute ${tokens.trough}`}
        style={{
          top: offsetY,
          height: tokens.troughHeight,
          borderRadius: tokens.troughRadius,
          left: troughLeft,
          width: troughWidth,
        }}
      />

      <motion.div
        className="absolute"
        style={{
          top: offsetY,
          left: fillLeft,
          height: tokens.troughHeight,
          borderRadius: tokens.troughRadius,
          width: fillWidth,
          backgroundColor: fillColor,
        }}
      />

      {tokens.levels.map((effortLabel, index) => (
        <span
          key={effortLabel}
          aria-hidden
          className={`absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
            index === tokens.levels.length - 1 ? tokens.dotTop : tokens.dot
          }`}
          style={{ top: "50%", left: KNOB_SIZE / 2 + notchX(theme, index) }}
        />
      ))}
    </>
  );
};

/**
 * The visible knob, riding inside the invariant hit box. Sizing it here rather
 * than on the box is what lets Claude's knob sit down inside its groove while
 * Codex's caps the track, without either app's paint reaching the physics.
 */
export const KnobSkin = ({ theme }: { theme: EffortTheme }) => {
  const { knob } = EFFORT_THEMES[theme];

  return (
    <span
      aria-hidden
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${knob.className}`}
      style={{ width: knob.width, height: knob.height, borderRadius: knob.radius }}
    />
  );
};

/** The hit box every knob is dragged by. Themes paint inside it; nothing about
 * it changes, because `TRACK_TRAVEL` is measured against it. */
export const knobBoxStyle = (theme: EffortTheme) => ({
  top: 0,
  left: 0,
  width: KNOB_SIZE,
  height: KNOB_SIZE,
  borderRadius: EFFORT_THEMES[theme].knob.radius,
});

type LevelLabelProps = {
  knobX: MotionValue<number>;
  theme: EffortTheme;
  className?: string;
};

/**
 * The dial's word for where it is. The knob moves every frame but the *level*
 * only changes when it crosses a notch, so the text is written straight to the
 * DOM rather than re-rendering React — and the same span serves the composer
 * chip and the card header.
 */
export const LevelLabel = ({ knobX, theme, className }: LevelLabelProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  useMotionValueEvent(knobX, "change", (x) => {
    if (ref.current) ref.current.textContent = labelAt(theme, nearestLevel(theme, x));
  });

  // Reading the knob during render is safe: it only ever seeds the first paint,
  // and a card that mounts mid-flight should open on the level it can already see.
  return (
    <span ref={ref} className={className}>
      {labelAt(theme, nearestLevel(theme, knobX.get()))}
    </span>
  );
};

const SPARK_ANGLES = [-140, -110, -75, -45, 45, 75, 110, 140];

/** A hit of confetti at the point on the track a percentage just claimed. Both
 * performed variants throw these — a sung percentage and a completed curl are
 * the same event as far as the dial is concerned. */
export const Sparks = ({ percent }: { percent: number }) => (
  <motion.span
    aria-hidden
    className="absolute top-1/2 size-0"
    style={{ left: percentToX(percent) + KNOB_SIZE / 2 }}
  >
    <motion.span
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-violet-400"
      initial={{ width: 10, height: 10, opacity: 0.9 }}
      animate={{ width: 64, height: 64, opacity: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    />
    {SPARK_ANGLES.map((angle) => (
      <motion.span
        key={angle}
        className="absolute size-1 rounded-full bg-violet-300"
        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
        animate={{
          x: Math.cos((angle * Math.PI) / 180) * 30,
          y: Math.sin((angle * Math.PI) / 180) * 26,
          opacity: 0,
          scale: 0.4,
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    ))}
  </motion.span>
);
