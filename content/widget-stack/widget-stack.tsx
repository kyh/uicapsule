"use client";

import { useEffect, useState } from "react";
import type { FC, ReactNode } from "react";
import { BatteryCharging, CalendarDays, CloudSun, Image as ImageIcon } from "lucide-react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";

const noop = () => null;

const WeatherWidget: FC = () => (
  <div className="flex h-full flex-col justify-between bg-gradient-to-b from-[#2563eb] to-[#0c4a9e] p-5">
    <div>
      <p className="text-[13px] font-medium text-white/85">Kyoto</p>
      <p className="mt-1 text-[40px] leading-none font-light text-white">21°</p>
    </div>
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-white/85">
        <CloudSun className="size-4" /> Partly cloudy
      </span>
      <span className="text-[12px] text-white/60">H:26° L:17°</span>
    </div>
  </div>
);

const CalendarWidget: FC = () => (
  <div className="flex h-full flex-col bg-[#1a1833] p-5">
    <p className="text-[12px] font-semibold text-red-400 uppercase">Tuesday</p>
    <p className="text-[34px] leading-tight font-light text-white">7</p>
    <div className="mt-auto space-y-2">
      <div className="rounded-lg border-l-[3px] border-sky-400 bg-sky-400/10 px-2.5 py-1.5">
        <p className="text-[12px] font-medium text-white">Design crit</p>
        <p className="text-[10px] text-white/50">11:00 AM</p>
      </div>
      <div className="rounded-lg border-l-[3px] border-violet-400 bg-violet-400/10 px-2.5 py-1.5">
        <p className="text-[12px] font-medium text-white">Capsule review</p>
        <p className="text-[10px] text-white/50">2:00 PM</p>
      </div>
    </div>
  </div>
);

const PhotoWidget: FC = () => (
  <div className="relative h-full bg-[radial-gradient(circle_at_30%_30%,#f59e0b_0%,#dc2626_45%,#4c1d95_100%)] p-5">
    <div className="absolute right-4 bottom-4 left-4">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-white/80">
        <ImageIcon className="size-3.5" /> On this day
      </p>
      <p className="text-[14px] font-semibold text-white">Lisbon, 2024</p>
    </div>
  </div>
);

const BatteryWidget: FC = () => (
  <div className="flex h-full items-center justify-around bg-[#1a1833] p-5">
    {[
      ["iPhone", 82, "#30d158"],
      ["Watch", 54, "#ffd60a"],
      ["Pods", 26, "#ff453a"],
    ].map(([label, percent, color]) => (
      <div key={String(label)} className="flex flex-col items-center gap-2">
        <div className="relative size-14">
          <svg viewBox="0 0 56 56" className="size-14 -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="5"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke={String(color)}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${(Number(percent) / 100) * 150.8} 150.8`}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold text-white">
            {percent}
          </span>
        </div>
        <p className="text-[10px] text-white/50">{label}</p>
      </div>
    ))}
  </div>
);

const WIDGETS: { id: string; label: string; icon: FC<{ className?: string }>; node: ReactNode }[] =
  [
    { icon: CloudSun, id: "weather", label: "Weather", node: <WeatherWidget /> },
    { icon: CalendarDays, id: "calendar", label: "Calendar", node: <CalendarWidget /> },
    { icon: ImageIcon, id: "photos", label: "Photos", node: <PhotoWidget /> },
    { icon: BatteryCharging, id: "battery", label: "Batteries", node: <BatteryWidget /> },
  ];

const createVariants = (flipAngle: number, travel: number) => ({
  center: { opacity: 1, rotateX: 0, scale: 1, y: "0%" },
  enter: (direction: number) => ({
    opacity: 0,
    rotateX: direction > 0 ? -flipAngle : flipAngle,
    scale: 0.92,
    y: `${direction > 0 ? travel : -travel}%`,
  }),
  exit: (direction: number) => ({
    opacity: 0,
    rotateX: direction > 0 ? flipAngle : -flipAngle,
    scale: 0.92,
    y: `${direction > 0 ? -travel : travel}%`,
  }),
});

interface Page {
  index: number;
  direction: 1 | -1;
}

const wrap = (value: number) => (value + WIDGETS.length) % WIDGETS.length;

interface PageDotsProps {
  index: number;
  visible: boolean;
  onSelect: (index: number) => void;
}

const PageDots = ({ index, visible, onSelect }: PageDotsProps) => (
  <div className={`flex flex-col gap-1.5 ${visible ? "" : "invisible"}`}>
    {WIDGETS.map((entry, dotIndex) => (
      <button
        type="button"
        key={entry.id}
        aria-label={`Show ${entry.label}`}
        onClick={() => {
          onSelect(dotIndex);
        }}
        className={`size-1.5 rounded-full transition-colors ${
          dotIndex === index ? "bg-white" : "bg-white/25"
        }`}
      />
    ))}
  </div>
);

export interface WidgetStackProps {
  /** Roll to the next widget on a timer until reduced motion is requested. */
  autoAdvance?: boolean;
  /** Milliseconds each widget stays before auto-advancing. */
  interval?: number;
  /** Which way the auto-advance rolls the stack. */
  direction?: "up" | "down";
  /** Degrees a widget tips back as it rolls in or out. */
  flipAngle?: number;
  /** Vertical distance a widget travels while rolling, as a percent of its height. */
  travel?: number;
  /** Spring duration of one roll, in seconds. */
  duration?: number;
  /** Spring bounce of one roll, 0 to 1. */
  bounce?: number;
  /** CSS perspective depth of the flip, in pixels. */
  perspective?: number;
  /** Widget corner radius, in pixels. */
  cornerRadius?: number;
  showDots?: boolean;
  showHint?: boolean;
}

export const WidgetStack = ({
  autoAdvance = true,
  interval = 4000,
  direction: autoDirection = "up",
  flipAngle = 78,
  travel = 38,
  duration = 0.55,
  bounce = 0.2,
  perspective = 900,
  cornerRadius = 24,
  showDots = true,
  showHint = true,
}: WidgetStackProps) => {
  const [page, setPage] = useState<Page>({ direction: 1, index: 0 });
  const { index, direction } = page;
  const reduced = useReducedMotion() ?? false;

  const goTo = (next: number, nextDirection: 1 | -1) => {
    setPage({ direction: nextDirection, index: wrap(next) });
  };

  const autoStep = autoDirection === "up" ? 1 : -1;
  const autoRolls = autoAdvance && !reduced;

  useEffect(() => {
    if (!autoRolls) {
      return noop;
    }

    const timer = setTimeout(() => {
      setPage({ direction: autoStep, index: wrap(index + autoStep) });
    }, interval);

    return () => {
      clearTimeout(timer);
    };
  }, [autoRolls, autoStep, index, interval]);

  const widget = WIDGETS[index];
  const variants = createVariants(flipAngle, travel);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col items-center gap-5 select-none">
        <div className="flex items-center gap-4">
          <div className="relative h-[170px] w-[300px]" style={{ perspective }}>
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={widget?.id ?? index}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ bounce, duration, type: "spring" }}
                drag="y"
                dragConstraints={{ bottom: 0, top: 0 }}
                dragElastic={0.28}
                onDragEnd={(_, info) => {
                  if (info.offset.y < -40 || info.velocity.y < -400) {
                    goTo(index + 1, 1);
                  } else if (info.offset.y > 40 || info.velocity.y > 400) {
                    goTo(index - 1, -1);
                  }
                }}
                className="absolute inset-0 cursor-grab overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10 active:cursor-grabbing"
                style={{ borderRadius: cornerRadius, transformStyle: "preserve-3d" }}
              >
                {widget?.node}
              </motion.div>
            </AnimatePresence>
          </div>

          <PageDots
            index={index}
            visible={showDots}
            onSelect={(dotIndex) => {
              goTo(dotIndex, dotIndex > index ? 1 : -1);
            }}
          />
        </div>

        <p className={`text-[11px] text-white/30 ${showHint ? "" : "invisible"}`}>
          {autoRolls ? "Swipe the widget vertically — or wait" : "Swipe the widget vertically"}
        </p>
      </div>
    </MotionConfig>
  );
};
