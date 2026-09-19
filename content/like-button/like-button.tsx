"use client";

import { useState } from "react";
import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";

const HEART_PATH =
  "m18.199 2.04c-2.606-.284-4.262.961-6.199 3.008-2.045-2.047-3.593-3.292-6.199-3.008-3.544.388-6.321 4.43-5.718 7.96.966 5.659 5.944 9 11.917 12 5.973-3 10.951-6.341 11.917-12 .603-3.53-2.174-7.572-5.718-7.96z";

const CIRCLE_RADIUS = 20;

const CUBIC_OUT = [0.33, 1, 0.68, 1] as const;
const QUAD_IN = [0.55, 0.085, 0.68, 0.53] as const;
const QUINT_OUT = [0.23, 1, 0.32, 1] as const;

const CircleAnimation = () => (
  <svg
    className="pointer-events-none absolute -top-3 -left-3"
    style={{
      height: CIRCLE_RADIUS * 2,
      width: CIRCLE_RADIUS * 2,
    }}
  >
    <motion.circle
      cx={CIRCLE_RADIUS}
      cy={CIRCLE_RADIUS}
      r={CIRCLE_RADIUS - 2}
      fill="none"
      initial={{
        scale: 0,
        stroke: "#E5214A",
        strokeWidth: CIRCLE_RADIUS * 2,
      }}
      animate={{
        scale: 1,
        stroke: "#CC8EF5",
        strokeWidth: 0,
      }}
      transition={{
        duration: 0.4,
        ease: CUBIC_OUT,
      }}
    />
  </svg>
);

// One entry per particle; each fades from `from` to `to` over its flight.
const PARTICLE_COLOR_PAIRS = [
  { from: "#9EC9F5", to: "#9ED8C6" },
  { from: "#91D3F7", to: "#9AE4CF" },
  { from: "#DC93CF", to: "#E3D36B" },
  { from: "#CF8EEF", to: "#CBEB98" },
  { from: "#87E9C6", to: "#1FCC93" },
  { from: "#A7ECD0", to: "#9AE4CF" },
  { from: "#87E9C6", to: "#A635D9" },
  { from: "#D58EB3", to: "#E0B6F5" },
  { from: "#F48BA2", to: "#CF8EEF" },
  { from: "#91D3F7", to: "#A635D9" },
  { from: "#CF8EEF", to: "#CBEB98" },
  { from: "#87E9C6", to: "#A635D9" },
  { from: "#9EC9F5", to: "#9ED8C6" },
  { from: "#91D3F7", to: "#9AE4CF" },
].map((colors, index, pairs) => ({
  angle: (index / pairs.length) * 360 + 45,
  from: colors.from,
  to: colors.to,
}));

const BURST_RADIUS = 32;
const START_RADIUS = 4;
const PATH_SCALE_FACTOR = 0.8;

interface Flight {
  angle: number;
  from: string;
  to: string;
  burstDistance: number;
  duration: number;
}

// Rolled once per burst, in the click handler rather than in render: a re-render
// mid-flight would otherwise hand motion new targets and jolt the particles.
const rollBurst = (): Flight[] =>
  PARTICLE_COLOR_PAIRS.map((colors) => ({
    ...colors,
    // Add randomness to the burst distance (±15%)
    burstDistance: BURST_RADIUS * (0.85 + Math.random() * 0.3),
    // Randomize duration between 500-700ms
    duration: 500 + Math.random() * 200,
  }));

const Particle = ({ from: fromColor, to: toColor, angle, burstDistance, duration }: Flight) => {
  const radians = (angle * Math.PI) / 180;

  // Calculate the degree shift (13 degrees in radians)
  const degreeShift = (13 * Math.PI) / 180;

  return (
    <motion.div
      className="pointer-events-none absolute size-1.5 rounded-full"
      style={{ backgroundColor: fromColor, opacity: 0 }}
      initial={{
        backgroundColor: fromColor,
        opacity: 0,
        scale: 1,
        x: Math.cos(radians) * START_RADIUS * PATH_SCALE_FACTOR,
        y: Math.sin(radians) * START_RADIUS * PATH_SCALE_FACTOR,
      }}
      animate={{
        backgroundColor: toColor,
        opacity: [0, 1, 1, 0],
        scale: 0,
        x: Math.cos(radians + degreeShift) * burstDistance * PATH_SCALE_FACTOR,
        y: Math.sin(radians + degreeShift) * burstDistance * PATH_SCALE_FACTOR,
      }}
      transition={{
        backgroundColor: {
          delay: 0.3,
          duration: duration / 1000,
        },
        opacity: {
          delay: 0.4,
          duration: duration / 1000,
          times: [0, 0.01, 0.99, 1],
        },
        scale: {
          delay: 0.3,
          duration: duration / 1000,
          ease: QUAD_IN,
        },
        x: {
          delay: 0.3,
          duration: duration / 1000,
          ease: QUINT_OUT,
        },
        y: {
          delay: 0.3,
          duration: duration / 1000,
          ease: QUINT_OUT,
        },
      }}
    />
  );
};

const BurstAnimation = ({ flights }: { flights: Flight[] }) => (
  <div className="pointer-events-none absolute -top-3 -left-3 grid size-10 place-items-center">
    {flights.map((flight) => (
      <Particle key={flight.angle} {...flight} />
    ))}
  </div>
);

export const LikeButton = () => {
  const [isLiked, setIsLiked] = useState(false);
  const [burst, setBurst] = useState<Flight[] | null>(null);
  const isAnimating = burst !== null;

  const toggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
    } else {
      setIsLiked(true);
      setBurst(rollBurst());
    }
  };

  return (
    <button
      type="button"
      className="hover:bg-accent relative flex h-8 cursor-pointer items-center gap-1.5 rounded-lg p-2 transition"
      onClick={toggleLike}
    >
      <div className="relative">
        {isAnimating && <CircleAnimation />}
        {burst && <BurstAnimation flights={burst} />}
        {isAnimating ? (
          <motion.svg
            key="animating-heart"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              damping: 10,
              delay: 0.3,
              stiffness: 300,
              type: "spring",
            }}
            onAnimationComplete={() => setBurst(null)}
            className="text-red-500"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="currentColor"
          >
            <path d={HEART_PATH} />
          </motion.svg>
        ) : (
          <svg
            className={isLiked ? "text-red-500" : "text-inherit"}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="currentColor"
          >
            <path d={HEART_PATH} />
          </svg>
        )}
      </div>
      <span className="min-w-[0.75rem]">
        <NumberFlow value={isLiked ? 1 : 0} />
        <span className="sr-only"> likes, click to {isLiked ? "unlike" : "like"}</span>
      </span>
    </button>
  );
};
