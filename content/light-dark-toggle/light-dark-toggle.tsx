"use client";

import { useId } from "react";
import { motion } from "motion/react";

const CENTER = 9;
const RAY_ORBIT = 8;

interface LightDarkToggleProps {
  isLight: boolean;
  duration?: number;
  rayCount?: number;
  rayRadius?: number;
  rayStagger?: number;
  size?: number;
}

export const LightDarkToggle = ({
  isLight,
  duration = 500,
  rayCount = 6,
  rayRadius = 1.5,
  rayStagger = 0.05,
  size = 24,
}: LightDarkToggleProps) => {
  const maskId = `moon-mask-${useId().replaceAll(/[^a-zA-Z0-9]/gu, "")}`;

  const rays = Array.from({ length: rayCount }, (_, index) => {
    const angle = (index * 2 * Math.PI) / rayCount;

    return {
      angle,
      cx: CENTER + RAY_ORBIT * Math.cos(angle),
      cy: CENTER + RAY_ORBIT * Math.sin(angle),
      delay: index * rayStagger,
    };
  });

  return (
    <svg
      viewBox="0 0 18 18"
      width={size}
      height={size}
      style={{
        transform: isLight ? "rotate(90deg)" : "rotate(40deg)",
        transitionDuration: `${duration}ms`,
      }}
      className="overflow-visible transition-transform"
    >
      <mask id={maskId}>
        <rect x="0" y="0" width="18" height="18" fill="#FFF" />
        <motion.circle animate={{ cx: isLight ? 25 : 10 }} cy="2" r="8" fill="black" />
      </mask>
      <motion.circle
        cx={CENTER}
        cy={CENTER}
        fill="currentColor"
        mask={`url(#${maskId})`}
        animate={{ r: isLight ? 5 : 8 }}
      />
      <g>
        {rays.map((ray) => (
          <motion.circle
            key={ray.angle}
            cx={ray.cx}
            cy={ray.cy}
            r={rayRadius}
            fill="currentColor"
            animate={{ scale: isLight ? 1 : 0 }}
            transition={{ delay: isLight ? ray.delay : 0 }}
          />
        ))}
      </g>
    </svg>
  );
};
