import type { ChartMotionSpringTransition } from "@tanstack/charts/motion";
import { motion } from "@tanstack/charts/motion";
import { useMemo } from "react";

/**
 * A `<Chart>` adopts its renderer once, at mount: spread `key` onto it so a new
 * spring remounts the chart instead of being ignored.
 */
export const useSpringRenderer = (spring: ChartMotionSpringTransition) => {
  const { damping, mass, stiffness } = spring;

  return useMemo(
    () => ({
      key: `${stiffness}:${damping}:${mass}`,
      renderer: motion({
        initial: "always",
        transition: { damping, mass, stiffness, type: "spring" },
      }),
    }),
    [damping, mass, stiffness],
  );
};
