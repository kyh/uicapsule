"use client";

import { motion } from "motion/react";

import type { EffortTheme } from "./effort-theme";

import { CARD_PADDING, KNOB_SIZE, TRACK_TRAVEL } from "./effort-scale";
import { EFFORT_THEMES, notchX } from "./effort-theme";

/** How long the layer stays mounted, in ms. The card tears it down after this —
 * every animation below has finished and faded by then, at any power. */
export const FANFARE_MS = 1700;

const STREAK_COUNT = 15;
const SPARK_COUNT = 30;
const STREAK_GAP = 22;
const FAN_FROM = -205;
const FAN_TO = 25;
const FAN_LEAN = 30;

const GLARE_FLOOR = 0.45;

const VIOLET = "167,139,250";

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/**
 * How much celebration the take earned, 0 (bottom notch) to 1 (top). Exported
 * because the card scales its own share of the landing — the flashbulb, the
 * knob's slam, the kick, the verdict's halo — off the same number, and a
 * celebration that disagreed with itself about how big it was would read as a
 * bug rather than a scale.
 */
export const fanfarePower = (theme: EffortTheme, level: number) =>
  notchX(theme, level) / TRACK_TRAVEL;

const scatter = (index: number, salt: number) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43_758.5453;

  return value - Math.floor(value);
};

interface PoweredProps {
  power: number;
}

const Bloom = ({ power }: PoweredProps) => (
  <motion.span
    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
    style={{
      backgroundImage: `radial-gradient(circle, rgba(${VIOLET},0.55) 0%, rgba(139,92,246,0.3) 30%, rgba(109,40,217,0.14) 52%, transparent 72%)`,
      height: lerp(170, 440, power),
      width: lerp(170, 440, power),
    }}
    initial={{ opacity: 0, scale: 0.12 }}
    animate={{ opacity: [0, lerp(0.55, 1, power), 0], scale: [0.12, 1, 1.25] }}
    transition={{ duration: lerp(0.7, 1.15, power), ease: "easeOut", times: [0, 0.16, 1] }}
  />
);

const Flare = ({ power }: PoweredProps) => (
  <motion.span
    className="absolute mix-blend-screen"
    style={{
      backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(${VIOLET},0.7) 30%, rgba(255,255,255,0.95) 50%, rgba(${VIOLET},0.7) 70%, rgba(255,255,255,0) 100%)`,
      borderRadius: 4,
      filter: "blur(1.5px)",
      height: 4,
      width: lerp(160, 480, power),
      x: lerp(-80, -240, power),
      y: -2,
    }}
    initial={{ opacity: 0, scaleX: 0.05, scaleY: 0.4 }}
    animate={{
      opacity: [0, lerp(0.5, 0.9, power), 0],
      scaleX: [0.05, 1, 1.1],
      scaleY: [0.4, 1, 0.3],
    }}
    transition={{ duration: lerp(0.6, 0.95, power), ease: "easeOut", times: [0, 0.14, 1] }}
  />
);

const Glare = ({ power }: PoweredProps) => (
  <motion.span
    className="absolute -top-1/4 h-[150%] w-28 mix-blend-screen"
    style={{
      backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(221,214,254,0.22) 45%, rgba(255,255,255,0.34) 55%, rgba(255,255,255,0) 100%)`,
      left: -120,
      rotate: 14,
    }}
    initial={{ opacity: 0, x: 0 }}
    animate={{ opacity: [0, power, power, 0], x: [0, 660] }}
    transition={{ duration: 0.7, ease: "easeOut", times: [0, 0.15, 0.7, 1] }}
  />
);

const Streaks = ({ power, lean }: PoweredProps & { lean: number }) => {
  const count = Math.round(lerp(3, STREAK_COUNT, power));

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const angle =
          lean + FAN_FROM + ((index + scatter(index, 1) * 0.7) / count) * (FAN_TO - FAN_FROM);

        const length = lerp(55, 110, power) + scatter(index, 2) * lerp(70, 230, power);
        const thickness = 2 + scatter(index, 3) * 3.5;

        return (
          <span
            key={index}
            className="absolute size-0"
            style={{ rotate: `${angle}deg`, transformOrigin: "0% 0%" }}
          >
            <motion.span
              className="absolute mix-blend-screen"
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(${VIOLET},0.85) 30%, rgba(139,92,246,0.35) 65%, rgba(139,92,246,0) 100%)`,
                borderRadius: thickness,
                height: thickness,
                left: STREAK_GAP,
                top: -thickness / 2,
                transformOrigin: "0% 50%",
                width: length,
              }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: [0, lerp(0.7, 1, power), 0], scaleX: [0, 1, 1] }}
              transition={{
                delay: scatter(index, 5) * 0.12,
                duration: 0.75 + scatter(index, 4) * 0.5,
                ease: "easeOut",
                times: [0, 0.24, 1],
              }}
            />
          </span>
        );
      })}
    </>
  );
};

const Rings = ({ power }: PoweredProps) => (
  <>
    {[0, 0.1, 0.22].slice(0, 1 + Math.round(power * 2)).map((delay, index) => (
      <motion.span
        key={delay}
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-violet-200/70 mix-blend-screen"
        style={{ boxShadow: `0 0 22px rgba(${VIOLET},0.55)` }}
        initial={{ height: 20, opacity: 0, width: 20 }}
        animate={{
          height: lerp(130, 280, power) + index * 110,
          opacity: [0, lerp(0.5, 0.8, power), 0],
          width: lerp(130, 280, power) + index * 110,
        }}
        transition={{ delay, duration: 0.95, ease: [0.16, 1, 0.3, 1], times: [0, 0.1, 1] }}
      />
    ))}
  </>
);

const SparkSpray = ({ power, lean }: PoweredProps & { lean: number }) => {
  const count = Math.round(lerp(4, SPARK_COUNT, power));

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const heading =
          ((lean + FAN_FROM + scatter(index, 6) * (FAN_TO - FAN_FROM)) * Math.PI) / 180;

        const speed = lerp(50, 90, power) + scatter(index, 7) * lerp(90, 320, power);
        const dx = Math.cos(heading) * speed;
        const dy = Math.sin(heading) * speed;
        const size = 3 + scatter(index, 8) * 4;
        const elongated = index % 3 === 0;

        return (
          <motion.span
            key={index}
            className="absolute"
            style={{
              background: index % 2 ? `rgb(${VIOLET})` : "#ffffff",
              borderRadius: size,
              boxShadow: `0 0 ${6 + size}px rgba(${VIOLET},0.85)`,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              rotate: (heading * 180) / Math.PI,
              width: elongated ? size * 3.5 : size,
            }}
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: [1, 1, 0.35],
              x: [0, dx, dx * 1.25],
              y: [0, dy, dy + 210],
            }}
            transition={{
              duration: 1.05 + scatter(index, 9) * 0.45,
              ease: ["easeOut", "easeIn"],
              times: [0, 0.45, 1],
            }}
          />
        );
      })}
    </>
  );
};

interface CurlFanfareProps {
  /** The level the take rounded down to — the show's origin point, and its size. */
  level: number;
  theme: EffortTheme;
}

export const CurlFanfare = ({ level, theme }: CurlFanfareProps) => {
  const tokens = EFFORT_THEMES[theme];
  const landedX = notchX(theme, level);
  const power = fanfarePower(theme, level);
  const anchorLeft = CARD_PADDING + KNOB_SIZE / 2 + landedX;
  const anchorBottom = CARD_PADDING + KNOB_SIZE / 2;
  const lean = (0.5 - power) * 2 * FAN_LEAN;

  return (
    <>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          boxShadow: `inset 0 0 0 2px rgba(196,181,253,0.7), inset 0 0 40px rgba(${VIOLET},0.28), 0 0 60px rgba(139,92,246,0.45)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, lerp(0.22, 1, power), 0] }}
        transition={{ duration: 1.3, ease: "easeOut", times: [0, 0.1, 1] }}
      />

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] isolate"
      >
        <span
          className="absolute overflow-hidden"
          style={{
            borderRadius: tokens.troughRadius,
            bottom: CARD_PADDING + (KNOB_SIZE - tokens.troughHeight) / 2,
            height: tokens.troughHeight,
            left: CARD_PADDING,
            width: landedX + KNOB_SIZE / 2,
          }}
        >
          <motion.span
            className="absolute inset-y-0 w-1/2 mix-blend-screen"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 55%, rgba(255,255,255,0) 100%)",
            }}
            initial={{ x: "-130%" }}
            animate={{ x: "320%" }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          />
        </span>

        {power >= GLARE_FLOOR && <Glare power={power} />}

        <span className="absolute size-0" style={{ bottom: anchorBottom, left: anchorLeft }}>
          <Bloom power={power} />
          <Flare power={power} />
          <Streaks power={power} lean={lean} />
          <Rings power={power} />
          <SparkSpray power={power} lean={lean} />
        </span>
      </span>
    </>
  );
};
