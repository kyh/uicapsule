import { useMemo, useRef } from "react";
import { animate, motion, useMotionValue } from "motion/react";

const nearestTickAngle = (rotation: number, snapAngle: number) => {
  const normalized = ((rotation % 360) + 360) % 360;

  return Math.round(normalized / snapAngle) * snapAngle;
};

interface RadialSliderProps {
  onChange: (value: number) => void;
  maxValue?: number;
  /** Degrees the ring turns per pixel dragged. */
  dragSensitivity?: number;
  tickColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  snapStiffness?: number;
  snapDamping?: number;
}

export const RadialSlider = ({
  onChange,
  maxValue = 100,
  dragSensitivity = 0.2,
  tickColor = "#e5e7eb",
  gradientFrom = "#2b7fff",
  gradientTo = "#f0b100",
  snapStiffness = 300,
  snapDamping = 30,
}: RadialSliderProps) => {
  const rotate = useMotionValue(0);
  const accumulatedRotation = useRef(0);

  const ticks = useMemo(
    () =>
      Array.from({ length: maxValue }, (_, tick) => tick * (360 / maxValue)).map((angle) => (
        <div
          key={angle}
          className="absolute inset-0 flex justify-center overflow-hidden rounded-full"
          style={{
            transform: `rotate(${angle}deg)`,
          }}
        >
          <div className="absolute h-8 w-0.5" style={{ backgroundColor: tickColor }} />
        </div>
      )),
    [maxValue, tickColor],
  );

  return (
    <>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0}
        onDrag={(_event, info) => {
          rotate.set(accumulatedRotation.current + info.offset.x * dragSensitivity);

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
            damping: snapDamping,
            stiffness: snapStiffness,
            type: "spring",
          });
        }}
        style={{ rotate }}
        className="relative aspect-square w-full cursor-grab rounded-full bg-transparent active:cursor-grabbing"
      >
        {ticks}
      </motion.div>
      <div
        className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-[calc(50%+1rem)] mix-blend-multiply"
        style={{ backgroundImage: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` }}
      />
    </>
  );
};
