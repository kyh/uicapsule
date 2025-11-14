import React, { useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
} from "motion/react";

interface RadialSliderProps {
  value: number;
  onChange: (value: number) => void;
  maxValue?: number;
}

export const RadialSlider = ({
  onChange,
  maxValue = 100,
}: RadialSliderProps) => {
  const motionX = useMotionValue(0);
  const rotate = useMotionValue(0);
  const accumulatedRotation = useRef(0);

  useMotionValueEvent(motionX, "change", (latest) => {
    rotate.set(accumulatedRotation.current + latest / 5);
  });

  return (
    <>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0}
        onDrag={(event, info) => {
          motionX.set(info.offset.x);

          const currentRotation = rotate.get();

          const snapAngle = 360 / maxValue;
          let normalizedRotation = currentRotation;
          normalizedRotation = ((normalizedRotation % 360) + 360) % 360;
          const nearestMultiple =
            Math.round(normalizedRotation / snapAngle) * snapAngle;

          const topIndex = (maxValue - nearestMultiple / snapAngle) % maxValue;
          onChange(Math.floor(topIndex));
        }}
        onDragEnd={() => {
          const currentRotation = rotate.get();

          const snapAngle = 360 / maxValue;
          let normalizedRotation = currentRotation;
          normalizedRotation = ((normalizedRotation % 360) + 360) % 360;
          const nearestMultiple =
            Math.round(normalizedRotation / snapAngle) * snapAngle;

          const fullRotations = Math.floor(currentRotation / 360) * 360;
          const finalRotation = fullRotations + nearestMultiple;

          accumulatedRotation.current = finalRotation;

          animate(rotate, finalRotation, {
            type: "spring",
            stiffness: 300,
            damping: 30,
          });
        }}
        style={{ rotate }}
        className="relative aspect-square w-full cursor-grab rounded-full bg-transparent active:cursor-grabbing"
      >
        {Array.from({ length: maxValue }).map((_, i) => (
          <div
            key={i}
            data-index={i}
            className="absolute inset-0 flex justify-center overflow-hidden rounded-full"
            style={{
              transform: `rotate(${i * (360 / maxValue)}deg)`,
            }}
          >
            <div className="absolute h-8 w-0.5 bg-gray-200" />
          </div>
        ))}
      </motion.div>
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-[calc(50%+1rem)] bg-gradient-to-r from-blue-500 to-yellow-500 mix-blend-multiply" />
    </>
  );
};
