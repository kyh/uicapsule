"use client";

import { type ReactNode } from "react";
import { MotionConfig } from "motion/react";

/**
 * `reducedMotion="user"` makes every Motion component in the tree honour the OS setting:
 * transform and layout animations are skipped, while opacity still crossfades, so nothing
 * teleports without explanation. CSS-driven animation (tw-animate-css, vaul) is handled
 * separately by the reduced-motion block in globals.css.
 */
export const MotionProvider = ({ children }: { children: ReactNode }) => (
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);
