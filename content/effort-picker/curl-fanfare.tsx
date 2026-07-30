"use client";

import { motion } from "motion/react";

import type { EffortTheme } from "./effort-theme";

import { CARD_PADDING, KNOB_SIZE, TRACK_TRAVEL } from "./effort-scale";
import { EFFORT_THEMES, notchX } from "./effort-theme";

/**
 * The payoff for ten seconds of curling in front of a webcam.
 *
 * Everything here fires from one point — the notch the dial actually landed on —
 * so the celebration is *about the number you earned*, not a generic confetti
 * cannon bolted to the card. Land on Light and the fireworks go off over on the
 * left, next to nothing; land on Ultra and they go off at the end of the track.
 * Same show, different address, and the address is the joke.
 *
 * Layers, in the order the eye reads them: the fill ignites and a bloom opens at
 * the notch, an anamorphic flare rips along the track, streaks fan out, rings
 * chase them, and the whole thing rains sparks over the card while the rim
 * lights up.
 */

/** How long the layer stays mounted, in ms. The card tears it down after this —
 * every animation below has finished and faded by then. */
export const FANFARE_MS = 1700;

const STREAK_COUNT = 15;
const SPARK_COUNT = 30;
/** Streaks start this far out from the notch instead of at it. Fifteen bars
 * converging on one pixel screen-blend themselves into a solid white disc — the
 * hollow core is what keeps the burst reading as separate rays. */
const STREAK_GAP = 22;
/**
 * The burst fires from the notch, which sits on the bottom edge of the card — so
 * a tidy 360° fan throws most of itself straight into an edge and is gone. Rays
 * and sparks are aimed across this arc instead: centred straight up, wide enough
 * to reach both top corners. Screen degrees, where -90 is up and 0 is right.
 */
const FAN_FROM = -205;
const FAN_TO = 25;
/** ...and the whole arc leans away from whichever end of the track it landed on,
 * by up to this many degrees. A Light take fires from the left edge and a Max one
 * from the right; without the lean, half of either burst is clipped on the frame
 * it's born. */
const FAN_LEAN = 30;

/** violet-400, as raw channels — half of these colours are built inside template
 * strings for `boxShadow` and gradients, where a Tailwind class can't reach. */
const VIOLET = "167,139,250";

/**
 * Deterministic 0..1 from an index. The spray has to look scattered without
 * being *actually* random: `Math.random()` would reshuffle every particle on
 * every re-render, and the card re-renders plenty while this is on screen.
 */
const scatter = (index: number, salt: number) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

type CurlFanfareProps = {
  /** The level the take rounded down to — the show's origin point. */
  level: number;
  theme: EffortTheme;
};

export const CurlFanfare = ({ level, theme }: CurlFanfareProps) => {
  const tokens = EFFORT_THEMES[theme];
  const landedX = notchX(theme, level);
  // Card coordinates, not track coordinates: the fanfare covers the whole card,
  // so the notch has to be re-expressed against the card's own padding box. The
  // track sits flush in that box, which makes this the knob's centre.
  const anchorLeft = CARD_PADDING + KNOB_SIZE / 2 + landedX;
  const anchorBottom = CARD_PADDING + KNOB_SIZE / 2;
  const lean = (0.5 - landedX / TRACK_TRAVEL) * 2 * FAN_LEAN;

  return (
    <>
      {/* The card's own edge, lit. Unclipped, so the outer bloom escapes the
          popover the way a real light source would. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          boxShadow: `inset 0 0 0 2px rgba(196,181,253,0.7), inset 0 0 40px rgba(${VIOLET},0.28), 0 0 60px rgba(139,92,246,0.45)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.3, times: [0, 0.1, 1], ease: "easeOut" }}
      />

      {/* Everything with a trajectory lives in here, clipped to the card. Sparks
          that outlive the card's edge should die at it — a firework that leaks
          out of the popover reads as a rendering bug, not a flourish.

          `isolate` matters as much as the clip: every layer below blends screen,
          and without an isolation group they blend against the whole card —
          including the verdict's `backdrop-blur` panel, which Chrome composites
          in a different pass. Left un-isolated they stack into one flat white
          disc over the camera. Isolated, they screen against each other and the
          group lands on the card as ordinary alpha. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] isolate"
      >
        {/* The fill charges: a hot band runs the length of everything the take
            earned, arriving at the notch just as the knob commits to it. */}
        <span
          className="absolute overflow-hidden"
          style={{
            left: CARD_PADDING,
            bottom: CARD_PADDING + (KNOB_SIZE - tokens.troughHeight) / 2,
            width: landedX + KNOB_SIZE / 2,
            height: tokens.troughHeight,
            borderRadius: tokens.troughRadius,
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

        <Glare />

        {/* Zero-sized anchor at the notch. Everything below centres on it the
            same way the per-rep `Sparks` do — position once, then only ever
            animate transforms. */}
        <span className="absolute size-0" style={{ left: anchorLeft, bottom: anchorBottom }}>
          <Bloom />
          <Flare />
          <Streaks lean={lean} />
          <Rings />
          <SparkSpray lean={lean} />
        </span>
      </span>
    </>
  );
};

/**
 * The soft glow under everything else. Deliberately smaller than the card: an
 * earlier pass sized it to swallow the whole popover and the result was a white
 * rectangle with a knob in it. The celebration has to stay *local to the notch*,
 * or the card stops being a card for half a second.
 */
const Bloom = () => (
  <motion.span
    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
    style={{
      width: 440,
      height: 440,
      backgroundImage: `radial-gradient(circle, rgba(${VIOLET},0.55) 0%, rgba(139,92,246,0.3) 30%, rgba(109,40,217,0.14) 52%, transparent 72%)`,
    }}
    initial={{ scale: 0.12, opacity: 0 }}
    animate={{ scale: [0.12, 1, 1.25], opacity: [0, 1, 0] }}
    transition={{ duration: 1.15, times: [0, 0.16, 1], ease: "easeOut" }}
  />
);

/** The anamorphic streak along the track axis. One horizontal bar does more for
 * "this is a light source" than any amount of radial spray. */
const Flare = () => (
  <motion.span
    className="absolute mix-blend-screen"
    style={{
      width: 480,
      height: 4,
      x: -240,
      y: -2,
      borderRadius: 4,
      backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(${VIOLET},0.7) 30%, rgba(255,255,255,0.95) 50%, rgba(${VIOLET},0.7) 70%, rgba(255,255,255,0) 100%)`,
      filter: "blur(1.5px)",
    }}
    initial={{ scaleX: 0.05, scaleY: 0.4, opacity: 0 }}
    animate={{ scaleX: [0.05, 1, 1.1], scaleY: [0.4, 1, 0.3], opacity: [0, 0.9, 0] }}
    transition={{ duration: 0.95, times: [0, 0.14, 1], ease: "easeOut" }}
  />
);

/**
 * A single bar of glare raked across the whole card, once. The notch burst is
 * pinned to one corner by definition; this is the only layer that touches every
 * part of the card, and it's what makes the celebration feel card-sized rather
 * than corner-sized.
 */
const Glare = () => (
  <motion.span
    className="absolute -top-1/4 h-[150%] w-28 mix-blend-screen"
    style={{
      left: -120,
      rotate: 14,
      backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(221,214,254,0.22) 45%, rgba(255,255,255,0.34) 55%, rgba(255,255,255,0) 100%)`,
    }}
    initial={{ x: 0, opacity: 0 }}
    animate={{ x: [0, 660], opacity: [0, 1, 1, 0] }}
    transition={{ duration: 0.7, times: [0, 0.15, 0.7, 1], ease: "easeOut" }}
  />
);

/**
 * The fan of glowing streaks. Each bar hangs off a wrapper that does nothing but
 * rotate about the notch — the split is what lets the bar sit `STREAK_GAP` out
 * along its own axis. Rotating a pre-offset bar directly would swing the offset
 * with it, since motion applies translation before rotation.
 *
 * No `filter: blur()` on these, deliberately. Fifteen filtered layers all
 * appearing on the same frame promote fifteen render surfaces at once, and the
 * first composited frame of the burst can come out as one white flash. The soft
 * edge is baked into the gradient instead, which costs nothing.
 */
const Streaks = ({ lean }: { lean: number }) => (
  <>
    {Array.from({ length: STREAK_COUNT }, (_, index) => {
      const angle =
        lean + FAN_FROM + ((index + scatter(index, 1) * 0.7) / STREAK_COUNT) * (FAN_TO - FAN_FROM);
      const length = 110 + scatter(index, 2) * 230;
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
              left: STREAK_GAP,
              top: -thickness / 2,
              width: length,
              height: thickness,
              borderRadius: thickness,
              transformOrigin: "0% 50%",
              backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(${VIOLET},0.85) 30%, rgba(139,92,246,0.35) 65%, rgba(139,92,246,0) 100%)`,
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: [0, 1, 1], opacity: [0, 1, 0] }}
            transition={{
              duration: 0.75 + scatter(index, 4) * 0.5,
              times: [0, 0.24, 1],
              ease: "easeOut",
              delay: scatter(index, 5) * 0.12,
            }}
          />
        </span>
      );
    })}
  </>
);

/** Three shockwaves, staggered. Width and height are animated rather than
 * `scale` so the stroke stays hairline-thin as the ring grows — a scaled border
 * fattens up and stops reading as a shockwave. */
const Rings = () => (
  <>
    {[0, 0.1, 0.22].map((delay, index) => (
      <motion.span
        key={delay}
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-violet-200/70 mix-blend-screen"
        style={{ boxShadow: `0 0 22px rgba(${VIOLET},0.55)` }}
        initial={{ width: 20, height: 20, opacity: 0 }}
        animate={{ width: 280 + index * 110, height: 280 + index * 110, opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.95, delay, times: [0, 0.1, 1], ease: [0.16, 1, 0.3, 1] }}
      />
    ))}
  </>
);

/** Ballistic sparks: a fan launched up and out of the notch, then dropped. The
 * two-segment easing is what sells it — `easeOut` on the way up, `easeIn` on the
 * way down, because a firework that decelerates into the floor looks like it's
 * being lowered on a wire. */
const SparkSpray = ({ lean }: { lean: number }) => (
  <>
    {Array.from({ length: SPARK_COUNT }, (_, index) => {
      const heading = ((lean + FAN_FROM + scatter(index, 6) * (FAN_TO - FAN_FROM)) * Math.PI) / 180;
      const speed = 90 + scatter(index, 7) * 320;
      const dx = Math.cos(heading) * speed;
      const dy = Math.sin(heading) * speed;
      const size = 3 + scatter(index, 8) * 4;
      const elongated = index % 3 === 0;

      return (
        <motion.span
          key={index}
          className="absolute"
          style={{
            width: elongated ? size * 3.5 : size,
            height: size,
            // Centred with margins, not a translate class: the keyframes below
            // own the transform outright and would overwrite one.
            marginLeft: -size / 2,
            marginTop: -size / 2,
            borderRadius: size,
            background: index % 2 ? `rgb(${VIOLET})` : "#ffffff",
            boxShadow: `0 0 ${6 + size}px rgba(${VIOLET},0.85)`,
            rotate: (heading * 180) / Math.PI,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: [0, dx, dx * 1.25],
            y: [0, dy, dy + 210],
            opacity: [1, 1, 0],
            scale: [1, 1, 0.35],
          }}
          transition={{
            duration: 1.05 + scatter(index, 9) * 0.45,
            times: [0, 0.45, 1],
            ease: ["easeOut", "easeIn"],
          }}
        />
      );
    })}
  </>
);
