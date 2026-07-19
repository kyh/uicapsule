"use client";

import { useId } from "react";
import { motion } from "motion/react";

/**
 * The six sun rays, in the order they pop in when switching to light.
 * Positions are the vertices of a hexagon inscribed at r=8 around (9, 9);
 * `delay` is written out literally rather than derived from the index so the
 * stagger ramp stays free of floating-point drift.
 */
const SUN_RAYS = [
  { cx: 17, cy: 9, delay: 0 },
  { cx: 13, cy: 15.928203230275509, delay: 0.05 },
  { cx: 5.000000000000002, cy: 15.92820323027551, delay: 0.1 },
  { cx: 1, cy: 9.000000000000002, delay: 0.15 },
  { cx: 4.9999999999999964, cy: 2.071796769724492, delay: 0.2 },
  { cx: 13, cy: 2.0717967697244912, delay: 0.25 },
] as const;

const RAY_RADIUS = 1.5;

type LightDarkToggleProps = {
  isLight: boolean;
};

export const LightDarkToggle = ({ isLight }: LightDarkToggleProps) => {
  // Scoped so several toggles can coexist on one page without their masks colliding.
  const maskId = `moon-mask-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      viewBox="0 0 18 18"
      style={{ transform: isLight ? "rotate(90deg)" : "rotate(40deg)" }}
      className="size-6 overflow-visible transition-transform duration-500"
    >
      <mask id={maskId}>
        <rect x="0" y="0" width="18" height="18" fill="#FFF" />
        <motion.circle animate={{ cx: isLight ? 25 : 10 }} cy="2" r="8" fill="black" />
      </mask>
      <motion.circle
        cx="9"
        cy="9"
        fill="currentColor"
        mask={`url(#${maskId})`}
        animate={{ r: isLight ? 5 : 8 }}
      />
      <g>
        {SUN_RAYS.map((ray) => (
          <motion.circle
            key={`${ray.cx}-${ray.cy}`}
            cx={ray.cx}
            cy={ray.cy}
            r={RAY_RADIUS}
            fill="currentColor"
            animate={{ scale: isLight ? 1 : 0 }}
            transition={{ delay: isLight ? ray.delay : 0 }}
          />
        ))}
      </g>
    </svg>
  );
};
