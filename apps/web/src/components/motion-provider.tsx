"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

export const MotionProvider = ({ children }: { children: ReactNode }) => (
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);
