import { useRef, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";

/** Height of the track in px. Must stay in sync with the `h-[200px]` class below. */
const TRACK_HEIGHT = 200;
/** How far the bar may rubber-band past either end of the track, in px. */
const OVERSCROLL = 50;

/** Sigmoid falloff: maps unbounded overshoot into (-max, max). */
function decay(value: number, max: number) {
  const entry = value / max;
  const sigmoid = 2 / (1 + Math.exp(-entry)) - 1;
  const exit = sigmoid * max;

  return exit;
}

export function Volume() {
  const [value, setValue] = useState([0]);
  const [position, setPosition] = useState<"top" | "middle" | "bottom">("middle");

  const clientY = useMotionValue(0);
  const y = useMotionValue(1);

  const ref = useRef<HTMLDivElement>(null);

  useMotionValueEvent(clientY, "change", (latestValue) => {
    if (!ref.current) return;

    const overflow = latestValue - ref.current.getBoundingClientRect().top;

    if (overflow < 0) {
      y.jump(decay(overflow, OVERSCROLL));
      setPosition("bottom");
    } else if (overflow > TRACK_HEIGHT) {
      y.jump(decay(overflow - TRACK_HEIGHT, OVERSCROLL));
      setPosition("top");
    } else {
      y.jump(1);
      setPosition("middle");
    }
  });

  // Negative `y` stretches the bar past the track, positive `y` squashes it.
  const scaleY = useTransform(() => (TRACK_HEIGHT - y.get()) / TRACK_HEIGHT);
  const yReadout = useTransform(() => Math.floor(y.get()));

  return (
    <div className="flex h-96 flex-col items-center justify-center gap-12">
      <Slider.Root
        ref={ref}
        className="relative flex h-[200px] w-[60px] touch-none flex-col items-center select-none"
        value={value}
        onValueChange={setValue}
        max={100}
        step={1}
        orientation="vertical"
        asChild
      >
        <motion.div
          style={{
            scaleY,
            // Both overscroll directions pivot on the track's bottom edge, which is
            // the bar's fixed physical anchor.
            transformOrigin: position === "middle" ? "center" : "bottom",
          }}
          onPointerMove={(events) => {
            if (events.buttons > 0) {
              clientY.set(events.clientY);
            }
          }}
          onLostPointerCapture={() => {
            animate(y, 1, { type: "spring", bounce: 0.5 });
          }}
        >
          <Slider.Track className="relative w-full grow overflow-hidden rounded-xl bg-neutral-800">
            <Slider.Range className="absolute w-full bg-white" />
          </Slider.Track>
        </motion.div>
      </Slider.Root>

      <div className="flex w-96 flex-col items-center gap-1">
        <span className="text-neutral-300">value: {value[0]}</span>
        <span className="text-neutral-300">
          y: <motion.span>{yReadout}</motion.span>
        </span>
      </div>
    </div>
  );
}
