"use client";

import { Canvas } from "@react-three/fiber";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { CITIES, INK } from "./popup-cities";
import { PopupScene } from "./popup-scene";

const noop = () => null;

const LAST = CITIES.length - 1;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const Arrow = ({
  flip,
  disabled,
  onClick,
}: {
  flip: boolean;
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={flip ? "Previous city" : "Next city"}
    disabled={disabled}
    onClick={onClick}
    className="grid size-14 shrink-0 cursor-pointer place-items-center rounded-full transition-[opacity,transform] duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#3528d6]/40 active:scale-90 disabled:cursor-default disabled:opacity-25"
  >
    <svg
      viewBox="0 0 48 24"
      className="w-10"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
    >
      <path
        d="M3 13 C14 11.5 28 12.5 43 12 M33 4 C37 7.5 40 10 44 12 C40 14.5 36 17 32 20.5"
        fill="none"
        stroke={INK}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

export interface PopupBookProps {
  /** Turns a page on its own every `interval` ms until someone interacts. */
  autoPlay?: boolean;
  interval?: number;
  /** Page the book opens on, read at mount. */
  startIndex?: number;
  /** Scales how fast a page turn springs; 1 is the tuned paper weight. */
  turnSpeed?: number;
}

export const PopupBook = ({
  autoPlay = true,
  interval = 2800,
  startIndex = 0,
  turnSpeed = 1,
}: PopupBookProps) => {
  const uid = useId().replaceAll(":", "");
  const start = clamp(Math.round(startIndex), 0, LAST);

  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(start);
  const [value, setValue] = useState(start);
  const [index, setIndex] = useState(start);
  const [ready, setReady] = useState(false);

  const onReady = useCallback(() => {
    setReady(true);
  }, []);

  const idleUntil = useRef(0);
  const drag = useRef<{ x: number; y: number; start: number; moved: boolean } | null>(null);

  useMotionValueEvent(progress, "change", setValue);

  const goTo = useCallback(
    (target: number) => {
      const next = clamp(Math.round(target), 0, LAST);
      setIndex(next);

      if (reduceMotion === true) {
        progress.jump(next);
        setValue(next);

        return;
      }

      const distance = Math.abs(next - progress.get());

      animate(progress, next, {
        damping: 14 * turnSpeed,
        restDelta: 0.0005,
        stiffness: (distance > 1.5 ? 24 : 36) * turnSpeed ** 2,
        type: "spring",
      });
    },
    [progress, reduceMotion, turnSpeed],
  );

  const userGoTo = (target: number) => {
    idleUntil.current = Date.now() + 7000;
    goTo(target);
  };

  useEffect(() => {
    if (!autoPlay || !ready) {
      return noop;
    }

    const timer = setInterval(() => {
      if (drag.current || Date.now() < idleUntil.current) {
        return;
      }

      goTo(index >= LAST ? 0 : index + 1);
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [autoPlay, goTo, index, interval, ready]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    progress.stop();
    drag.current = { moved: false, start: progress.get(), x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;

    if (!state) {
      return;
    }

    const dx = event.clientX - state.x;

    if (Math.abs(dx) > 4 || Math.abs(event.clientY - state.y) > 4) {
      state.moved = true;
    }

    progress.set(clamp(state.start - dx / 200, -0.12, LAST + 0.12));
  };

  const onPointerUp = () => {
    const state = drag.current;
    drag.current = null;

    if (!state) {
      return;
    }

    if (!state.moved) {
      userGoTo(index >= LAST ? 0 : index + 1);

      return;
    }

    userGoTo(progress.get() + clamp(progress.getVelocity() * 0.12, -0.6, 0.6));
  };

  const onPointerCancel = () => {
    if (drag.current) {
      drag.current = null;
      goTo(progress.get());
    }
  };

  const shown = clamp(Math.round(value), 0, LAST);
  const city = CITIES[shown];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Pop-up travel book"
      className="flex w-full max-w-[720px] flex-col items-center gap-1 select-none"
    >
      <div className="flex w-full items-center justify-center gap-1 sm:gap-4">
        <Arrow
          flip
          disabled={index === 0}
          onClick={() => {
            userGoTo(index - 1);
          }}
        />
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          className="relative aspect-[460/376] w-full max-w-[540px] cursor-grab touch-pan-y rounded-3xl outline-none active:cursor-grabbing has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#3528d6]/30"
        >
          <svg
            viewBox="-230 -186 460 376"
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={14} />
              </filter>
              <filter id={`${uid}-contact`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation={6} />
              </filter>
            </defs>
            <ellipse
              cx={12}
              cy={150}
              rx={190}
              ry={40}
              fill="#3a2f5c"
              opacity={0.2}
              filter={`url(#${uid}-soft)`}
            />
            <path
              d="M0 2L-144 86L0 172L144 86z"
              transform="translate(3 5)"
              fill="#2a2150"
              opacity={(
                0.18 *
                Math.max(0, 1 - Math.abs(value - Math.round(value)) / 0.1) ** 2
              ).toFixed(3)}
              filter={`url(#${uid}-contact)`}
            />
          </svg>
          <Canvas
            orthographic
            flat
            shadows
            frameloop="demand"
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true }}
            className="absolute! inset-0 transition-opacity duration-500"
            style={{ opacity: ready ? 1 : 0 }}
          >
            <PopupScene progress={progress} onReady={onReady} />
          </Canvas>
          <input
            type="range"
            min={0}
            max={LAST}
            step={1}
            value={index}
            aria-label="City"
            aria-valuetext={`${CITIES[index]?.name ?? ""}, ${index + 1} of ${CITIES.length}`}
            onChange={(event) => {
              userGoTo(Number(event.currentTarget.value));
            }}
            className="sr-only"
          />
        </div>
        <Arrow
          flip={false}
          disabled={index === LAST}
          onClick={() => {
            userGoTo(index + 1);
          }}
        />
      </div>
      <div className="relative h-16 w-full" aria-live="polite">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={shown}
            initial={{ filter: "blur(2px)", opacity: 0, y: 6 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            exit={{ filter: "blur(2px)", opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-x-0 flex flex-col items-center gap-1"
            style={{ color: INK }}
          >
            <p
              className="text-[30px] leading-none italic"
              style={{
                fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
              }}
            >
              {city?.name}
            </p>
            <p className="text-[10px] font-medium tracking-[0.22em] uppercase opacity-70">
              {city?.country} · {city?.coords}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="sr-only">Drag the book or use the arrows to turn pages.</span>
    </section>
  );
};
