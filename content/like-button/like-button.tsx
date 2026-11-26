"use client";

import { useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";

const HEART_PATH =
  "m18.199 2.04c-2.606-.284-4.262.961-6.199 3.008-2.045-2.047-3.593-3.292-6.199-3.008-3.544.388-6.321 4.43-5.718 7.96.966 5.659 5.944 9 11.917 12 5.973-3 10.951-6.341 11.917-12 .603-3.53-2.174-7.572-5.718-7.96z";

const CUBIC_OUT = [0.33, 1, 0.68, 1] as const;
const QUAD_IN = [0.55, 0.085, 0.68, 0.53] as const;
const QUINT_OUT = [0.23, 1, 0.32, 1] as const;

interface RingProps {
  from: string;
  to: string;
  radius: number;
  offset: number;
  timeScale: number;
}

const CircleAnimation = ({ from, to, radius, offset, timeScale }: RingProps) => (
  <svg
    className="pointer-events-none absolute"
    style={{
      height: radius * 2,
      left: -offset,
      top: -offset,
      width: radius * 2,
    }}
  >
    <motion.circle
      cx={radius}
      cy={radius}
      r={radius - 2}
      fill="none"
      initial={{
        scale: 0,
        stroke: from,
        strokeWidth: radius * 2,
      }}
      animate={{
        scale: 1,
        stroke: to,
        strokeWidth: 0,
      }}
      transition={{
        duration: 0.4 * timeScale,
        ease: CUBIC_OUT,
      }}
    />
  </svg>
);

export interface ParticleColors {
  from: string;
  to: string;
}

const DEFAULT_PARTICLE_COLORS: ParticleColors[] = [
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
];

const START_RADIUS = 4;
const PATH_SCALE_FACTOR = 0.8;

interface Flight {
  angle: number;
  from: string;
  to: string;
  burstDistance: number;
  duration: number;
  timeScale: number;
}

interface BurstOptions {
  colors: readonly ParticleColors[];
  count: number;
  radius: number;
  timeScale: number;
}

const rollBurst = ({ colors, count, radius, timeScale }: BurstOptions) =>
  Array.from({ length: count }, (_, index) => {
    const pair = colors[index % colors.length] ?? { from: "currentColor", to: "currentColor" };

    return {
      angle: (index / count) * 360 + 45,
      burstDistance: radius * (0.85 + Math.random() * 0.3),
      duration: (500 + Math.random() * 200) * timeScale,
      from: pair.from,
      timeScale,
      to: pair.to,
    };
  });

const Particle = ({
  from: fromColor,
  to: toColor,
  angle,
  burstDistance,
  duration,
  timeScale,
  dotSize,
  onSettle,
}: Flight & { dotSize: number; onSettle: () => void }) => {
  const radians = (angle * Math.PI) / 180;

  const degreeShift = (13 * Math.PI) / 180;
  const seconds = duration / 1000;
  const delay = 0.3 * timeScale;

  return (
    <motion.div
      className="pointer-events-none absolute rounded-full"
      style={{ backgroundColor: fromColor, height: dotSize, opacity: 0, width: dotSize }}
      onAnimationComplete={onSettle}
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
          delay,
          duration: seconds,
        },
        opacity: {
          delay: 0.4 * timeScale,
          duration: seconds,
          times: [0, 0.01, 0.99, 1],
        },
        scale: {
          delay,
          duration: seconds,
          ease: QUAD_IN,
        },
        x: {
          delay,
          duration: seconds,
          ease: QUINT_OUT,
        },
        y: {
          delay,
          duration: seconds,
          ease: QUINT_OUT,
        },
      }}
    />
  );
};

interface BurstProps {
  flights: Flight[];
  radius: number;
  offset: number;
  dotSize: number;
  onSettle: () => void;
}

const BurstAnimation = ({ flights, radius, offset, dotSize, onSettle }: BurstProps) => (
  <div
    className="pointer-events-none absolute grid place-items-center"
    style={{ height: radius * 2, left: -offset, top: -offset, width: radius * 2 }}
  >
    {flights.map((flight) => (
      <Particle key={flight.angle} dotSize={dotSize} onSettle={onSettle} {...flight} />
    ))}
  </div>
);

export interface LikeButtonProps {
  /** Likes from everyone else; the viewer's like adds one. */
  count?: number;
  /** Heart size in pixels; the ring and particles scale with it. */
  size?: number;
  /** Fill of the liked heart. */
  color?: string;
  /** Ring stroke at the start of the pop. */
  ringFrom?: string;
  /** Ring stroke as it fades out. */
  ringTo?: string;
  /** Number of burst particles, spaced evenly around the heart. */
  particleCount?: number;
  /** Start and end color of each particle, cycled when there are more particles than pairs. */
  particleColors?: readonly ParticleColors[];
  /** How far particles fly, in pixels. */
  burstRadius?: number;
  /** Playback rate of the whole effect; 2 is twice as fast. */
  speed?: number;
}

const BASE_SIZE = 16;

interface Burst {
  id: number;
  flights: Flight[];
}

export const LikeButton = ({
  count = 0,
  size = BASE_SIZE,
  color = "#fb2c36",
  ringFrom = "#E5214A",
  ringTo = "#CC8EF5",
  particleCount = DEFAULT_PARTICLE_COLORS.length,
  particleColors = DEFAULT_PARTICLE_COLORS,
  burstRadius = 32,
  speed = 1,
}: LikeButtonProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [burst, setBurst] = useState<Burst | null>(null);
  const pending = useRef({ id: 0, remaining: 0 });
  const timeScale = 1 / speed;
  const scale = size / BASE_SIZE;
  const ringRadius = size * 1.25;
  const ringOffset = ringRadius - size / 2;
  const dotSize = 6 * scale;

  const settle = (id: number) => () => {
    if (pending.current.id !== id) {
      return;
    }

    pending.current.remaining -= 1;

    if (pending.current.remaining === 0) {
      setBurst(null);
    }
  };

  const toggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
    } else {
      setIsLiked(true);
      const id = pending.current.id + 1;
      pending.current = { id, remaining: particleCount + 1 };
      setBurst({
        flights: rollBurst({
          colors: particleColors,
          count: particleCount,
          radius: burstRadius * scale,
          timeScale,
        }),
        id,
      });
    }
  };

  return (
    <button
      type="button"
      className="hover:bg-accent relative flex cursor-pointer items-center gap-1.5 rounded-lg p-2 transition"
      style={{ height: Math.max(32, size + 16) }}
      onClick={toggleLike}
    >
      <div className="relative">
        {burst && (
          <CircleAnimation
            key={burst.id}
            from={ringFrom}
            to={ringTo}
            radius={ringRadius}
            offset={ringOffset}
            timeScale={timeScale}
          />
        )}
        {burst && (
          <BurstAnimation
            key={burst.id}
            flights={burst.flights}
            radius={ringRadius}
            offset={ringOffset}
            dotSize={dotSize}
            onSettle={settle(burst.id)}
          />
        )}
        {burst ? (
          <motion.svg
            key={burst.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              damping: 10 * speed,
              delay: 0.3 * timeScale,
              stiffness: 300 * speed * speed,
              type: "spring",
            }}
            onAnimationComplete={settle(burst.id)}
            style={{ color }}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="currentColor"
          >
            <path d={HEART_PATH} />
          </motion.svg>
        ) : (
          <svg
            style={isLiked ? { color } : undefined}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="currentColor"
          >
            <path d={HEART_PATH} />
          </svg>
        )}
      </div>
      <span className="min-w-[0.75rem]">
        <NumberFlow value={count + (isLiked ? 1 : 0)} />
        <span className="sr-only"> likes, click to {isLiked ? "unlike" : "like"}</span>
      </span>
    </button>
  );
};
