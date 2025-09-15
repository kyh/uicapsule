import React, { useRef, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";

function decay(value: number, max: number) {
  let entry = value / max;
  let sigmoid = 2 / (1 + Math.exp(-entry)) - 1;
  let exit = sigmoid * max;

  return exit;
}

export function Volume() {
  const [value, setValue] = useState([0]);
  const [position, setPosition] = useState<"top" | "middle" | "bottom">(
    "middle",
  );

  const clientY = useMotionValue(0);
  const y = useMotionValue(1);

  const ref = useRef<HTMLDivElement>(null);

  useMotionValueEvent(clientY, "change", (latestValue) => {
    if (!ref.current) return;

    let overflow = latestValue - ref.current.getBoundingClientRect().top;

    if (overflow < 0) {
      y.jump(decay(overflow, 50));
      setPosition("bottom");
    } else if (overflow > 200) {
      y.jump(decay(overflow - 200, 50));
      setPosition("top");
    } else {
      y.jump(1);
      setPosition("middle");
    }
  });

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
            scaleY: useTransform(() => (200 - y.get()) / 200),
            transformOrigin:
              position === "top"
                ? "bottom"
                : position === "bottom"
                  ? "bottom"
                  : "center",
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
          y:{" "}
          <motion.span>{useTransform(() => Math.floor(y.get()))}</motion.span>
        </span>
      </div>
    </div>
  );
}
