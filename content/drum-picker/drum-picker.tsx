"use client";

import { useState, type FC } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "motion/react";

const ITEM_HEIGHT = 38;
const VISIBLE_ITEMS = 7;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const CENTER_OFFSET = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));
const PERIODS = ["AM", "PM"];

type WheelItemProps = {
  y: MotionValue<number>;
  index: number;
  label: string;
  align: "left" | "center" | "right";
};

const WheelItem: FC<WheelItemProps> = ({ y, index, label, align }) => {
  // Distance of this item from the selection line, in items (-3..3 visible).
  const distance = useTransform(y, (value) => (value + index * ITEM_HEIGHT) / ITEM_HEIGHT);
  const rotateX = useTransform(distance, [-3.5, 0, 3.5], [-62, 0, 62]);
  const opacity = useTransform(distance, [-3.5, -2, 0, 2, 3.5], [0, 0.35, 1, 0.35, 0]);
  const scale = useTransform(distance, [-3.5, 0, 3.5], [0.82, 1, 0.82]);

  return (
    <motion.div
      style={{
        height: ITEM_HEIGHT,
        rotateX,
        opacity,
        scale,
        transformPerspective: 780,
      }}
      className={`flex items-center text-[21px] text-white tabular-nums ${
        align === "right"
          ? "justify-end pr-2"
          : align === "left"
            ? "justify-start pl-2"
            : "justify-center"
      }`}
    >
      {label}
    </motion.div>
  );
};

type WheelProps = {
  items: string[];
  initialIndex: number;
  onChange: (index: number) => void;
  width: string;
  align: "left" | "center" | "right";
};

const Wheel: FC<WheelProps> = ({ items, initialIndex, onChange, width, align }) => {
  const y = useMotionValue(-initialIndex * ITEM_HEIGHT);

  useMotionValueEvent(y, "change", (value) => {
    const index = Math.round(-value / ITEM_HEIGHT);
    onChange(Math.min(items.length - 1, Math.max(0, index)));
  });

  return (
    <div className={`relative ${width}`} style={{ height: WHEEL_HEIGHT }}>
      <div className="absolute inset-0 overflow-hidden" style={{ perspective: 780 }}>
        <motion.div
          drag="y"
          style={{ y, paddingTop: CENTER_OFFSET }}
          dragConstraints={{
            top: -(items.length - 1) * ITEM_HEIGHT,
            bottom: 0,
          }}
          dragElastic={0.12}
          dragTransition={{
            power: 0.55,
            timeConstant: 220,
            bounceStiffness: 320,
            bounceDamping: 28,
            modifyTarget: (target) => Math.round(target / ITEM_HEIGHT) * ITEM_HEIGHT,
          }}
          className="cursor-grab active:cursor-grabbing"
        >
          {items.map((label, index) => (
            <WheelItem key={label} y={y} index={index} label={label} align={align} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export const DrumPicker = () => {
  const [hourIndex, setHourIndex] = useState(8);
  const [minuteIndex, setMinuteIndex] = useState(41);
  const [periodIndex, setPeriodIndex] = useState(0);

  const hour = HOURS[hourIndex] ?? "9";
  const minute = MINUTES[minuteIndex] ?? "41";
  const period = PERIODS[periodIndex] ?? "AM";

  return (
    <div className="w-[340px] rounded-[32px] bg-[#161618] p-6 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      <div className="flex items-baseline justify-between">
        <p className="text-[17px] font-semibold text-white">Alarm</p>
        <p className="text-[13px] text-white/40 tabular-nums">
          {hour}:{minute} {period}
        </p>
      </div>

      <div className="relative mt-4">
        {/* Selection lens */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-xl bg-white/[0.07]"
          style={{ height: ITEM_HEIGHT }}
        />
        {/* Edge fog */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-[#161618] to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-[#161618] to-transparent"
        />

        <div className="flex items-stretch justify-center gap-1 px-6">
          <Wheel
            items={HOURS}
            initialIndex={8}
            onChange={setHourIndex}
            width="w-16"
            align="right"
          />
          <Wheel
            items={MINUTES}
            initialIndex={41}
            onChange={setMinuteIndex}
            width="w-16"
            align="center"
          />
          <Wheel
            items={PERIODS}
            initialIndex={0}
            onChange={setPeriodIndex}
            width="w-14"
            align="left"
          />
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-white/30">Flick a wheel — it snaps to rest</p>
    </div>
  );
};
