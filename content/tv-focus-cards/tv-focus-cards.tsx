"use client";

import { useEffect, useRef, useState, type FC } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

type Poster = {
  id: string;
  title: string;
  tag: string;
  art: string;
};

const POSTERS: Poster[] = [
  {
    id: "p1",
    title: "Solaris Run",
    tag: "Sci-fi",
    art: "linear-gradient(150deg,#f59e0b 0%,#dc2626 55%,#450a0a 100%)",
  },
  {
    id: "p2",
    title: "Northline",
    tag: "Thriller",
    art: "linear-gradient(150deg,#38bdf8 0%,#1e3a8a 60%,#0c1533 100%)",
  },
  {
    id: "p3",
    title: "Verdant",
    tag: "Nature",
    art: "linear-gradient(150deg,#4ade80 0%,#065f46 60%,#02201a 100%)",
  },
  {
    id: "p4",
    title: "Midnight Cab",
    tag: "Noir",
    art: "linear-gradient(150deg,#a78bfa 0%,#4c1d95 55%,#170b33 100%)",
  },
  {
    id: "p5",
    title: "Static",
    tag: "Horror",
    art: "linear-gradient(150deg,#94a3b8 0%,#334155 55%,#0b0f16 100%)",
  },
  {
    id: "p6",
    title: "Copper Coast",
    tag: "Drama",
    art: "linear-gradient(150deg,#fb7185 0%,#9f1239 55%,#2c0410 100%)",
  },
];

const COLUMNS = 3;

const FocusCard: FC<{ poster: Poster; focused: boolean; onFocus: () => void }> = ({
  poster,
  focused,
  onFocus,
}) => {
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-7, 7]), {
    stiffness: 220,
    damping: 20,
  });
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [6, -6]), {
    stiffness: 220,
    damping: 20,
  });
  const sheenX = useTransform(pointerX, [0, 1], ["18%", "82%"]);
  const sheenY = useTransform(pointerY, [0, 1], ["12%", "88%"]);
  const sheen = useTransform(
    [sheenX, sheenY],
    ([x, y]) =>
      `radial-gradient(circle at ${String(x)} ${String(y)}, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 35%, transparent 65%)`,
  );

  return (
    <div className="flex flex-col items-center gap-2.5" style={{ perspective: 700 }}>
      <motion.button
        type="button"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          pointerX.set((event.clientX - rect.left) / rect.width);
          pointerY.set((event.clientY - rect.top) / rect.height);
        }}
        onPointerEnter={onFocus}
        onPointerLeave={() => {
          pointerX.set(0.5);
          pointerY.set(0.5);
        }}
        onClick={onFocus}
        animate={{ scale: focused ? 1.12 : 1 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.25 }}
        style={{
          rotateX: focused ? rotateX : 0,
          rotateY: focused ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        className={`relative h-[150px] w-[108px] overflow-hidden rounded-xl transition-shadow duration-300 ${
          focused
            ? "z-10 shadow-2xl shadow-black/70 ring-2 ring-white/70"
            : "shadow-lg shadow-black/40"
        }`}
      >
        <div className="absolute inset-0" style={{ background: poster.art }} />
        {/* Title treatment on the art */}
        <span className="absolute right-2 bottom-2 left-2 text-left text-[12px] leading-tight font-bold tracking-tight text-white drop-shadow">
          {poster.title}
        </span>
        {/* Specular sheen follows the pointer while focused */}
        {focused && (
          <motion.span aria-hidden className="absolute inset-0" style={{ background: sheen }} />
        )}
      </motion.button>
      <motion.span
        animate={{ opacity: focused ? 1 : 0, y: focused ? 0 : -4 }}
        className="text-[11px] font-medium text-white/80"
      >
        {poster.tag}
      </motion.span>
    </div>
  );
};

export const TvFocusCards = () => {
  const [focusIndex, setFocusIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const move = (delta: number) => {
    setFocusIndex((current) => {
      const next = current + delta;
      if (next < 0 || next >= POSTERS.length) return current;
      return next;
    });
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="listbox"
      aria-label="Poster shelf"
      className="w-[560px] rounded-[28px] bg-[#101116] p-8 shadow-2xl shadow-black/60 ring-1 ring-white/10 outline-none select-none focus-visible:ring-white/25"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") move(1);
        else if (event.key === "ArrowLeft") move(-1);
        else if (event.key === "ArrowDown") move(COLUMNS);
        else if (event.key === "ArrowUp") move(-COLUMNS);
        else return;
        event.preventDefault();
      }}
    >
      <div className="flex items-baseline justify-between">
        <p className="text-[18px] font-semibold text-white">Up next</p>
        <p className="text-[11px] text-white/35">Arrow keys · hover to steer the sheen</p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-x-6 gap-y-7">
        {POSTERS.map((poster, index) => (
          <FocusCard
            key={poster.id}
            poster={poster}
            focused={index === focusIndex}
            onFocus={() => setFocusIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};
