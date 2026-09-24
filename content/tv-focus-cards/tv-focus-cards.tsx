"use client";

import { useEffect, useRef, useState } from "react";
import type { FC, KeyboardEvent, Ref } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface Poster {
  id: string;
  title: string;
  tag: string;
  art: string;
}

const POSTERS: Poster[] = [
  {
    art: "linear-gradient(150deg,#f59e0b 0%,#dc2626 55%,#450a0a 100%)",
    id: "p1",
    tag: "Sci-fi",
    title: "Solaris Run",
  },
  {
    art: "linear-gradient(150deg,#38bdf8 0%,#1e3a8a 60%,#0c1533 100%)",
    id: "p2",
    tag: "Thriller",
    title: "Northline",
  },
  {
    art: "linear-gradient(150deg,#4ade80 0%,#065f46 60%,#02201a 100%)",
    id: "p3",
    tag: "Nature",
    title: "Verdant",
  },
  {
    art: "linear-gradient(150deg,#a78bfa 0%,#4c1d95 55%,#170b33 100%)",
    id: "p4",
    tag: "Noir",
    title: "Midnight Cab",
  },
  {
    art: "linear-gradient(150deg,#94a3b8 0%,#334155 55%,#0b0f16 100%)",
    id: "p5",
    tag: "Horror",
    title: "Static",
  },
  {
    art: "linear-gradient(150deg,#fb7185 0%,#9f1239 55%,#2c0410 100%)",
    id: "p6",
    tag: "Drama",
    title: "Copper Coast",
  },
];

const COLUMNS = 3;

const FocusCard: FC<{
  poster: Poster;
  focused: boolean;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  ref: Ref<HTMLButtonElement>;
}> = ({ poster, focused, onFocus, onKeyDown, ref }) => {
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-7, 7]), {
    damping: 20,
    stiffness: 220,
  });
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [6, -6]), {
    damping: 20,
    stiffness: 220,
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
        ref={ref}
        type="button"
        tabIndex={focused ? 0 : -1}
        aria-label={`${poster.title}, ${poster.tag}`}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
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
        transition={{ bounce: 0.25, duration: 0.4, type: "spring" }}
        style={{
          rotateX: focused ? rotateX : 0,
          rotateY: focused ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        className={`relative h-[150px] w-[108px] overflow-hidden rounded-xl outline-none transition-shadow duration-300 ${
          focused
            ? "z-10 shadow-2xl shadow-black/70 ring-2 ring-white/70"
            : "shadow-lg shadow-black/40"
        }`}
      >
        <div className="absolute inset-0" style={{ background: poster.art }} />
        <span className="absolute right-2 bottom-2 left-2 text-left text-[12px] leading-tight font-bold tracking-tight text-white drop-shadow">
          {poster.title}
        </span>
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
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    cardRefs.current[0]?.focus();
  }, []);

  // Roving tabindex: arrows move real DOM focus, and the card's onFocus syncs state.
  const move = (delta: number) => {
    const next = focusIndex + delta;
    if (next < 0 || next >= POSTERS.length) {
      return;
    }
    setFocusIndex(next);
    cardRefs.current[next]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowRight") {
      move(1);
    } else if (event.key === "ArrowLeft") {
      move(-1);
    } else if (event.key === "ArrowDown") {
      move(COLUMNS);
    } else if (event.key === "ArrowUp") {
      move(-COLUMNS);
    } else {
      return;
    }
    event.preventDefault();
  };

  return (
    <section
      aria-label="Poster shelf"
      className="w-[560px] rounded-[28px] bg-[#101116] p-8 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none"
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
            onKeyDown={handleKeyDown}
            ref={(element) => {
              cardRefs.current[index] = element;
            }}
          />
        ))}
      </div>
    </section>
  );
};
