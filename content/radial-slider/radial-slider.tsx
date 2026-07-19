import { useMemo, useRef } from "react";
import { animate, motion, useMotionValue } from "motion/react";

/** Horizontal drag distance, in px, that advances the dial by one degree. */
const PIXELS_PER_DEGREE = 5;

/**
 * Rounds a rotation to the nearest tick, expressed as an angle in [0, 360].
 * 360 is a valid result: it means "snap forward to the next full turn".
 */
const nearestTickAngle = (rotation: number, snapAngle: number) => {
  const normalized = ((rotation % 360) + 360) % 360;
  return Math.round(normalized / snapAngle) * snapAngle;
};

interface RadialSliderProps {
  onChange: (value: number) => void;
  maxValue?: number;
}

export const RadialSlider = ({ onChange, maxValue = 100 }: RadialSliderProps) => {
  const rotate = useMotionValue(0);
  const accumulatedRotation = useRef(0);

  const ticks = useMemo(
    () =>
      Array.from({ length: maxValue }).map((_, i) => (
        <div
          key={i}
          className="absolute inset-0 flex justify-center overflow-hidden rounded-full"
          style={{
            transform: `rotate(${i * (360 / maxValue)}deg)`,
          }}
        >
          <div className="absolute h-8 w-0.5 bg-gray-200" />
        </div>
      )),
    [maxValue],
  );

  return (
    <>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0}
        onDrag={(_event, info) => {
          rotate.set(accumulatedRotation.current + info.offset.x / PIXELS_PER_DEGREE);

          const snapAngle = 360 / maxValue;
          const nearestMultiple = nearestTickAngle(rotate.get(), snapAngle);

          const topIndex = (maxValue - nearestMultiple / snapAngle) % maxValue;
          onChange(Math.floor(topIndex));
        }}
        onDragEnd={() => {
          const currentRotation = rotate.get();

          const snapAngle = 360 / maxValue;
          const nearestMultiple = nearestTickAngle(currentRotation, snapAngle);

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
        {ticks}
      </motion.div>
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-[calc(50%+1rem)] bg-gradient-to-r from-blue-500 to-yellow-500 mix-blend-multiply" />
    </>
  );
};
