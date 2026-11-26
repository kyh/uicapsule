"use client";

import { useState } from "react";
import type { FC } from "react";
import { motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";

type Align = "left" | "center" | "right";

export type ClockFormat = "12h" | "24h";

const ALIGN_CLASS = {
  center: "justify-center",
  left: "justify-start pl-2",
  right: "justify-end pr-2",
} satisfies Record<Align, string>;

const PERIODS = ["AM", "PM"];
const PERSPECTIVE = 780;
const FOG_RATIO = 0.24;
const FONT_RATIO = 0.553;

const tint = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

const range = (length: number, toLabel: (index: number) => string) =>
  Array.from({ length }, (_, index) => toLabel(index));

const pad = (value: number) => String(value).padStart(2, "0");

const clampIndex = (index: number, length: number) => Math.min(length - 1, Math.max(0, index));

interface WheelGeometry {
  itemHeight: number;
  visibleItems: number;
  curvature: number;
}

interface WheelItemProps extends WheelGeometry {
  y: MotionValue<number>;
  index: number;
  label: string;
  align: Align;
  color: string;
}

const WheelItem: FC<WheelItemProps> = ({
  y,
  index,
  label,
  align,
  color,
  itemHeight,
  visibleItems,
  curvature,
}) => {
  const edge = visibleItems / 2;
  const fade = Math.max(edge - 1.5, 0.5);
  const distance = useTransform(y, (value) => (value + index * itemHeight) / itemHeight);
  const rotateX = useTransform(distance, [-edge, 0, edge], [-curvature, 0, curvature]);
  const opacity = useTransform(distance, [-edge, -fade, 0, fade, edge], [0, 0.35, 1, 0.35, 0]);
  const scale = useTransform(distance, [-edge, 0, edge], [0.82, 1, 0.82]);

  return (
    <motion.div
      style={{
        color,
        fontSize: Math.round(itemHeight * FONT_RATIO),
        height: itemHeight,
        opacity,
        rotateX,
        scale,
        transformPerspective: PERSPECTIVE,
      }}
      className={`flex items-center tabular-nums ${ALIGN_CLASS[align]}`}
    >
      {label}
    </motion.div>
  );
};

interface WheelProps extends WheelGeometry {
  items: string[];
  initialIndex: number;
  onChange: (index: number) => void;
  width: string;
  align: Align;
  color: string;
  glide: number;
  momentum: number;
}

const Wheel: FC<WheelProps> = ({
  items,
  initialIndex,
  onChange,
  width,
  align,
  color,
  itemHeight,
  visibleItems,
  curvature,
  glide,
  momentum,
}) => {
  const wheelHeight = itemHeight * visibleItems;
  const y = useMotionValue(-initialIndex * itemHeight);

  useMotionValueEvent(y, "change", (value) => {
    onChange(clampIndex(Math.round(-value / itemHeight), items.length));
  });

  return (
    <div className={`relative ${width}`} style={{ height: wheelHeight }}>
      <div className="absolute inset-0 overflow-hidden" style={{ perspective: PERSPECTIVE }}>
        <motion.div
          drag="y"
          style={{ paddingTop: (wheelHeight - itemHeight) / 2, y }}
          dragConstraints={{
            bottom: 0,
            top: -(items.length - 1) * itemHeight,
          }}
          dragElastic={0.12}
          dragTransition={{
            bounceDamping: 28,
            bounceStiffness: 320,
            modifyTarget: (target) => Math.round(target / itemHeight) * itemHeight,
            power: momentum,
            timeConstant: glide,
          }}
          className="cursor-grab active:cursor-grabbing"
        >
          {items.map((label, index) => (
            <WheelItem
              key={label}
              y={y}
              index={index}
              label={label}
              align={align}
              color={color}
              itemHeight={itemHeight}
              visibleItems={visibleItems}
              curvature={curvature}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

interface ClockOptions {
  format?: ClockFormat;
  minuteStep?: number;
  initialHour?: number;
  initialMinute?: number;
}

interface WheelOptions {
  itemHeight?: number;
  visibleItems?: number;
  curvature?: number;
  glide?: number;
  momentum?: number;
}

const resolveClock = ({
  format = "12h",
  minuteStep = 1,
  initialHour = 9,
  initialMinute = 41,
}: ClockOptions) => {
  const is12h = format === "12h";
  const hours = is12h ? range(12, (index) => String(index + 1)) : range(24, pad);
  const minutes = range(Math.ceil(60 / minuteStep), (index) => pad(index * minuteStep));

  return {
    hours,
    is12h,
    minutes,
    startHourIndex: is12h ? (initialHour % 12 || 12) - 1 : initialHour,
    startMinuteIndex: clampIndex(Math.round(initialMinute / minuteStep), minutes.length),
    startPeriodIndex: initialHour >= 12 ? 1 : 0,
  };
};

const resolveWheel = ({
  itemHeight = 38,
  visibleItems = 7,
  curvature = 62,
  glide = 220,
  momentum = 0.55,
}: WheelOptions) => ({ curvature, glide, itemHeight, momentum, visibleItems });

/** Props for {@link DrumPicker}. Clock values apply at mount; remount to change them. */
export interface DrumPickerProps extends ClockOptions, WheelOptions {
  title?: string;
  hint?: string;
  fog?: boolean;
  accent?: string;
  surface?: string;
  textColor?: string;
}

export const DrumPicker: FC<DrumPickerProps> = ({
  title = "Alarm",
  hint = "Flick a wheel — it snaps to rest",
  fog = true,
  accent = "#ff637e",
  surface = "#1d0b10",
  textColor = "#ffffff",
  format,
  minuteStep,
  initialHour,
  initialMinute,
  ...wheelOptions
}) => {
  const { hours, is12h, minutes, startHourIndex, startMinuteIndex, startPeriodIndex } =
    resolveClock({ format, initialHour, initialMinute, minuteStep });

  const wheel = resolveWheel(wheelOptions);

  const [hourIndex, setHourIndex] = useState(startHourIndex);
  const [minuteIndex, setMinuteIndex] = useState(startMinuteIndex);
  const [periodIndex, setPeriodIndex] = useState(startPeriodIndex);

  const hour = hours[hourIndex] ?? "";
  const minute = minutes[minuteIndex] ?? "";
  const period = is12h ? ` ${PERIODS[periodIndex] ?? ""}` : "";
  const { itemHeight } = wheel;
  const fogHeight = Math.round(itemHeight * wheel.visibleItems * FOG_RATIO);

  return (
    <div
      className="w-[340px] rounded-[32px] p-6 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none"
      style={{ backgroundColor: surface }}
    >
      <div className="flex items-baseline justify-between">
        <p className="text-[17px] font-semibold" style={{ color: textColor }}>
          {title}
        </p>
        <p className="text-[13px] tabular-nums" style={{ color: tint(textColor, 40) }}>
          {hour}:{minute}
          {period}
        </p>
      </div>

      <div className="relative mt-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-xl"
          style={{ backgroundColor: tint(accent, 10), height: itemHeight }}
        />
        {fog ? (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-10"
              style={{
                background: `linear-gradient(to bottom, ${surface}, transparent)`,
                height: fogHeight,
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
              style={{
                background: `linear-gradient(to top, ${surface}, transparent)`,
                height: fogHeight,
              }}
            />
          </>
        ) : null}

        <div className="flex items-stretch justify-center gap-1 px-6">
          <Wheel
            items={hours}
            initialIndex={startHourIndex}
            onChange={setHourIndex}
            width="w-16"
            align={is12h ? "right" : "center"}
            color={textColor}
            {...wheel}
          />
          <Wheel
            items={minutes}
            initialIndex={startMinuteIndex}
            onChange={setMinuteIndex}
            width="w-16"
            align="center"
            color={textColor}
            {...wheel}
          />
          {is12h ? (
            <Wheel
              items={PERIODS}
              initialIndex={startPeriodIndex}
              onChange={setPeriodIndex}
              width="w-14"
              align="left"
              color={textColor}
              {...wheel}
            />
          ) : null}
        </div>
      </div>

      {hint ? (
        <p className="mt-4 text-center text-[11px]" style={{ color: tint(textColor, 30) }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
};
