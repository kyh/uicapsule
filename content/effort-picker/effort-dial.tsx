"use client";

import { motion, useTransform } from "motion/react";

import type { MotionValue } from "motion/react";

import {
  EFFORT_LEVELS,
  KNOB_SIZE,
  notchX,
  TRACK_HEIGHT,
  TRACK_OFFSET_Y,
  TRACK_TRAVEL,
  TRACK_WIDTH,
} from "./effort-scale";

type DialTroughProps = {
  knobX: MotionValue<number>;
};

/**
 * Everything about the dial that is purely a function of the knob's position:
 * the trough, the fill, the notch dots. Both variants render this; each brings
 * its own knob, because a knob you sling and a knob you sing at behave nothing
 * alike even though they sit in the same groove.
 */
export const DialTrough = ({ knobX }: DialTroughProps) => {
  // The trough follows the knob out past either cap, so the knob always sits ON
  // the track rather than floating off the end of it.
  const troughLeft = useTransform(knobX, (x) => Math.min(0, x));
  const troughWidth = useTransform(
    knobX,
    (x) => TRACK_WIDTH + Math.max(0, -x) + Math.max(0, x - TRACK_TRAVEL),
  );

  const fillLeft = useTransform(knobX, (x) => Math.min(0, x));
  const fillWidth = useTransform(knobX, (x) => x - Math.min(0, x) + KNOB_SIZE / 2);
  // Codex blue for most of the track, shifting into violet over the last stretch —
  // the fill reads as a temperature before any label does. It tops out at violet,
  // not white: white belongs to the knob and the band.
  const fillColor = useTransform(
    knobX,
    [0, TRACK_TRAVEL * 0.75, TRACK_TRAVEL],
    ["#3b82f6", "#3b82f6", "#a855f7"],
  );

  return (
    <>
      <motion.div
        className="absolute rounded-full bg-neutral-700/60"
        style={{
          top: TRACK_OFFSET_Y,
          height: TRACK_HEIGHT,
          left: troughLeft,
          width: troughWidth,
        }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          top: TRACK_OFFSET_Y,
          left: fillLeft,
          height: TRACK_HEIGHT,
          width: fillWidth,
          backgroundColor: fillColor,
        }}
      />

      {EFFORT_LEVELS.map((effortLabel, index) => (
        <span
          key={effortLabel}
          aria-hidden
          className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/45"
          style={{ top: "50%", left: KNOB_SIZE / 2 + notchX(index) }}
        />
      ))}
    </>
  );
};
