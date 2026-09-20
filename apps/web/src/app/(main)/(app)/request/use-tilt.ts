"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import { useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";

export const TILT = {
  max: 7,
  parallax: 6,
  perspective: 1000,
  reach: 260,
  spring: { damping: 24, mass: 0.6, stiffness: 220 },
};

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value));

/** Leans the card toward the pointer anywhere on the page; the art drifts the other way. */
export const useTilt = ({
  disabled,
  rootRef,
}: {
  disabled: boolean;
  rootRef: RefObject<HTMLElement | null>;
}) => {
  const tiltX = useSpring(0, TILT.spring);
  const tiltY = useSpring(0, TILT.spring);
  const aimX = useMotionValue(0);
  const aimY = useMotionValue(0);
  const plane = useMotionTemplate`rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  const depth = TILT.parallax / TILT.max;
  const artX = useTransform(() => -tiltY.get() * depth);
  const artY = useTransform(() => tiltX.get() * depth);

  useEffect(() => {
    if (disabled) {
      tiltX.set(0);
      tiltY.set(0);
      aimX.set(0);
      aimY.set(0);
      return;
    }
    const move = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root || event.pointerType === "touch") {
        return;
      }
      const rect = root.getBoundingClientRect();
      const nx = clamp(
        (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2 + TILT.reach),
        -1,
        1,
      );
      const ny = clamp(
        (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2 + TILT.reach),
        -1,
        1,
      );
      aimX.set(nx);
      aimY.set(ny);
      tiltY.set(nx * TILT.max);
      tiltX.set(-ny * TILT.max);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [aimX, aimY, disabled, rootRef, tiltX, tiltY]);

  return { aimX, aimY, artX, artY, plane, tiltX, tiltY };
};
