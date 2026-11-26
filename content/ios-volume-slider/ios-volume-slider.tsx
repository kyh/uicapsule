import { useRef, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";

const decay = (value: number, max: number) => {
  const entry = value / max;
  const sigmoid = 2 / (1 + Math.exp(-entry)) - 1;
  const exit = sigmoid * max;

  return exit;
};

export interface VolumeProps {
  /** Spring bounce when the stretched bar snaps back, 0 (none) to 1. */
  bounce?: number;
  /** Track corner radius in px, capped at half the width. */
  cornerRadius?: number;
  /** Starting value, clamped to `max`. Read on mount only. */
  defaultValue?: number;
  /** Color of the filled range. */
  fillColor?: string;
  /** Top of the value scale. */
  max?: number;
  /** Rubber-band distance in px: how far past an end the bar can stretch or squash. */
  overscroll?: number;
  /** Show the value and stretch readout under the slider. */
  showReadout?: boolean;
  /** Color of the readout text. */
  textColor?: string;
  /** Color of the empty track. */
  trackColor?: string;
  /** Track height in px. */
  trackHeight?: number;
  /** Track width in px. */
  trackWidth?: number;
}

export const Volume = ({
  bounce = 0.5,
  cornerRadius = 12,
  defaultValue = 0,
  fillColor = "#ffffff",
  max = 100,
  overscroll = 50,
  showReadout = true,
  textColor = "#d4d4d4",
  trackColor = "#262626",
  trackHeight = 200,
  trackWidth = 60,
}: VolumeProps) => {
  const [value, setValue] = useState([Math.min(defaultValue, max)]);
  const [position, setPosition] = useState<"top" | "middle" | "bottom">("middle");

  const clientY = useMotionValue(0);
  const y = useMotionValue(1);

  const ref = useRef<HTMLDivElement>(null);

  useMotionValueEvent(clientY, "change", (latestValue) => {
    if (!ref.current) {
      return;
    }

    const overflow = latestValue - ref.current.getBoundingClientRect().top;

    if (overflow < 0) {
      y.jump(decay(overflow, overscroll));
      setPosition("bottom");
    } else if (overflow > trackHeight) {
      y.jump(decay(overflow - trackHeight, overscroll));
      setPosition("top");
    } else {
      y.jump(1);
      setPosition("middle");
    }
  });

  const scaleY = useTransform(y, (latest) => (trackHeight - latest) / trackHeight);
  const yReadout = useTransform(() => Math.floor(y.get()));

  return (
    <div className="flex min-h-96 flex-col items-center justify-center gap-12">
      <Slider.Root
        ref={ref}
        className="relative flex touch-none flex-col items-center select-none"
        value={value}
        onValueChange={setValue}
        max={max}
        step={1}
        orientation="vertical"
        asChild
      >
        <motion.div
          style={{
            height: trackHeight,
            scaleY,
            transformOrigin: position === "middle" ? "center" : "bottom",
            width: trackWidth,
          }}
          onPointerMove={(events) => {
            if (events.buttons > 0) {
              clientY.set(events.clientY);
            }
          }}
          onLostPointerCapture={() => {
            animate(y, 1, { bounce, type: "spring" });
          }}
        >
          <Slider.Track
            className="relative w-full grow overflow-hidden"
            style={{
              backgroundColor: trackColor,
              borderRadius: Math.min(cornerRadius, trackWidth / 2),
            }}
          >
            <Slider.Range className="absolute w-full" style={{ backgroundColor: fillColor }} />
          </Slider.Track>
        </motion.div>
      </Slider.Root>

      {showReadout ? (
        <div className="flex w-96 flex-col items-center gap-1" style={{ color: textColor }}>
          <span>value: {value[0]}</span>
          <span>
            y: <motion.span>{yReadout}</motion.span>
          </span>
        </div>
      ) : null}
    </div>
  );
};
