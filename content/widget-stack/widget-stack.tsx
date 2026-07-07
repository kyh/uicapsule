"use client";

import { useCallback, useEffect, useRef, useState, type FC, type ReactNode } from "react";
import { BatteryCharging, CalendarDays, CloudSun, Image as ImageIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const AUTO_ADVANCE_MS = 4000;

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
  <div className="flex h-full flex-col bg-[#17181c] p-5">
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
  <div className="flex h-full items-center justify-around bg-[#17181c] p-5">
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
    { id: "weather", label: "Weather", icon: CloudSun, node: <WeatherWidget /> },
    { id: "calendar", label: "Calendar", icon: CalendarDays, node: <CalendarWidget /> },
    { id: "photos", label: "Photos", icon: ImageIcon, node: <PhotoWidget /> },
    { id: "battery", label: "Batteries", icon: BatteryCharging, node: <BatteryWidget /> },
  ];

const variants = {
  enter: (direction: number) => ({
    rotateX: direction > 0 ? -78 : 78,
    y: direction > 0 ? "38%" : "-38%",
    opacity: 0,
    scale: 0.92,
  }),
  center: { rotateX: 0, y: "0%", opacity: 1, scale: 1 },
  exit: (direction: number) => ({
    rotateX: direction > 0 ? 78 : -78,
    y: direction > 0 ? "-38%" : "38%",
    opacity: 0,
    scale: 0.92,
  }),
};

export const WidgetStack = () => {
  const [[index, direction], setPage] = useState<[number, number]>([0, 1]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const paginate = useCallback((delta: number) => {
    setPage(([current]) => [(current + delta + WIDGETS.length) % WIDGETS.length, delta]);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => paginate(1), AUTO_ADVANCE_MS);
  }, [paginate]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const widget = WIDGETS[index];

  return (
    <div className="flex flex-col items-center gap-5 select-none">
      <div className="flex items-center gap-4">
        <div className="relative h-[170px] w-[300px]" style={{ perspective: 900 }}>
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={widget?.id ?? index}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", duration: 0.55, bounce: 0.2 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.28}
              onDragEnd={(_, info) => {
                if (info.offset.y < -40 || info.velocity.y < -400) {
                  paginate(1);
                  resetTimer();
                } else if (info.offset.y > 40 || info.velocity.y > 400) {
                  paginate(-1);
                  resetTimer();
                }
              }}
              className="absolute inset-0 cursor-grab overflow-hidden rounded-[24px] shadow-2xl shadow-black/50 ring-1 ring-white/10 active:cursor-grabbing"
              style={{ transformStyle: "preserve-3d" }}
            >
              {widget?.node}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Page dots */}
        <div className="flex flex-col gap-1.5">
          {WIDGETS.map((entry, dotIndex) => (
            <button
              type="button"
              key={entry.id}
              aria-label={`Show ${entry.label}`}
              onClick={() => {
                paginate(dotIndex > index ? 1 : -1);
                resetTimer();
              }}
              className={`size-1.5 rounded-full transition-colors ${
                dotIndex === index ? "bg-white" : "bg-white/25"
              }`}
            />
          ))}
        </div>
      </div>

      <p className="text-[11px] text-white/30">Swipe the widget vertically — or wait</p>
    </div>
  );
};
