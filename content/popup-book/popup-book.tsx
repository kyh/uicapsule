"use client";

import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { INK, ROOMS } from "./popup-rooms";

type Vec = readonly [number, number, number];

const SIZE = 200;
const ELEVATION = (26 * Math.PI) / 180;
const SIN_E = Math.sin(ELEVATION);
const COS_E = Math.cos(ELEVATION);
const LIGHT: Vec = [0.45, 0.8, 0.4];
const LAST = ROOMS.length - 1;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const rad = (deg: number) => (deg * Math.PI) / 180;
const dir = (deg: number) => [Math.cos(rad(deg)), Math.sin(rad(deg)), 0] satisfies Vec;
const scale = (v: Vec, s: number) => [v[0] * s, v[1] * s, v[2] * s] satisfies Vec;
const sub = (a: Vec, b: Vec) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]] satisfies Vec;
const add = (a: Vec, b: Vec) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]] satisfies Vec;
const project = (v: Vec) => [v[0], v[1] * SIN_E - v[2] * COS_E] as const;
const depth = (v: Vec) => v[1] * COS_E + v[2] * SIN_E;

const affine = (origin: Vec, xAxis: Vec, yAxis: Vec) => {
  const [ox, oy] = project(origin);
  const [ax, ay] = project(xAxis);
  const [bx, by] = project(yAxis);

  return {
    det: ax * by - ay * bx,
    transform: `matrix(${[ax, ay, bx, by, ox, oy].map((n) => n.toFixed(4)).join(" ")})`,
  };
};

const pageAngle = (page: number, progress: number) => {
  const offset = page - progress;

  if (offset <= 0) {
    return 135 + 26 * (1 - Math.exp(offset / 2.2));
  }

  if (offset >= 1) {
    return 45 - 40 * (1 - Math.exp(-(offset - 1) / 2.5));
  }

  return 135 - 90 * offset;
};

interface Layer {
  key: string;
  depth: number;
  node: ReactNode;
}

const Shade = ({ normal, closed }: { normal: Vec; closed: number }) => {
  const lambert = clamp(normal[0] * LIGHT[0] + normal[1] * LIGHT[1] + normal[2] * LIGHT[2], 0, 1);

  return (
    <rect
      width={SIZE}
      height={SIZE}
      fill="#1d1660"
      opacity={clamp(0.22 * (1 - lambert) + 0.2 * closed, 0, 0.5).toFixed(3)}
    />
  );
};

const pageDepth = (theta: number) => (SIZE / 2) * Math.sin(rad(theta)) * COS_E + (SIZE / 2) * SIN_E;

const buildLayers = (progress: number, ids: { hatch: string; triA: string; triB: string }) => {
  const angles = Array.from({ length: ROOMS.length + 1 }, (_, page) => pageAngle(page, progress));
  const angleAt = (page: number) => angles[page] ?? 0;

  const openness = (room: number) =>
    room < 0 || room > LAST ? 0 : clamp((angleAt(room) - angleAt(room + 1)) / 90, 0, 1);

  const layers: Layer[] = [];

  for (const [page, theta] of angles.entries()) {
    const u = dir(theta);
    const facesForward = Math.cos(rad(theta)) >= 0;
    const roomIndex = facesForward ? page - 1 : page;
    const room = ROOMS[roomIndex];
    const top: Vec = [0, 0, SIZE];
    const down: Vec = [0, 0, -1];

    const { transform } = facesForward
      ? affine(top, u, down)
      : affine(add(scale(u, SIZE), top), scale(u, -1), down);

    const normal: Vec = facesForward ? [-u[1], u[0], 0] : [u[1], -u[0], 0];

    layers.push({
      depth: pageDepth(theta),
      key: `page-${page}`,
      node: (
        <g key={`page-${page}`} transform={transform}>
          {room ? (
            <>
              <rect width={SIZE} height={SIZE} fill={room.wall} />
              {facesForward ? room.right : room.left}
            </>
          ) : (
            <>
              <rect width={SIZE} height={SIZE} fill="#d9d2ee" />
              <rect width={SIZE} height={SIZE} fill={`url(#${ids.hatch})`} />
            </>
          )}
          <Shade normal={normal} closed={1 - openness(roomIndex)} />
          <rect
            width={SIZE}
            height={SIZE}
            fill="none"
            stroke={INK}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </g>
      ),
    });
  }

  for (const [index, room] of ROOMS.entries()) {
    const left = angleAt(index);
    const right = angleAt(index + 1);
    const spread = left - right;

    if (spread < 0.5) {
      continue;
    }

    const bisector = (left + right) / 2;
    const cosLift = Math.min(1, Math.SQRT1_2 / Math.cos(rad(spread / 2)));
    const sinLift = Math.sqrt(1 - cosLift * cosLift);
    const b = dir(bisector);
    const tip: Vec = scale([b[0] * cosLift, b[1] * cosLift, sinLift], SIZE * Math.SQRT2);
    const a3 = scale(dir(left), SIZE);
    const b3 = scale(dir(right), SIZE);
    const origin: Vec = [0, 0, 0];
    const closed = 1 - openness(index);

    const halves = [
      {
        clip: ids.triA,
        crease: "M0 0 L200 200",
        edge: "M0 0 H200 V200",
        frame: affine(origin, scale(a3, 1 / SIZE), scale(sub(tip, a3), 1 / SIZE)),
        hinge: index,
        mid: scale(add(a3, tip), 1 / 3),
        roomSide: Math.cos(rad(left)) < 0,
      },
      {
        clip: ids.triB,
        crease: "M0 0 L200 200",
        edge: "M0 0 V200 H200",
        frame: affine(origin, scale(sub(tip, b3), 1 / SIZE), scale(b3, 1 / SIZE)),
        hinge: index + 1,
        mid: scale(add(b3, tip), 1 / 3),
        roomSide: Math.cos(rad(right)) >= 0,
      },
    ];

    for (const [side, half] of halves.entries()) {
      const upward = half.frame.det < 0;
      const normal: Vec = upward ? [0, 0, 1] : [0, 0, -1];
      layers.push({
        depth:
          pageDepth(angleAt(half.hinge)) + (half.roomSide ? 0.5 : -0.5) + depth(half.mid) * 0.001,
        key: `floor-${index}-${side}`,
        node: (
          <g key={`floor-${index}-${side}`} transform={half.frame.transform}>
            <g clipPath={`url(#${half.clip})`}>
              <rect width={SIZE} height={SIZE} fill={upward ? room.floor : "#d9d2ee"} />
              {upward ? (
                room.ground
              ) : (
                <rect width={SIZE} height={SIZE} fill={`url(#${ids.hatch})`} />
              )}
              <Shade normal={normal} closed={closed * 0.6} />
            </g>
            <path d={half.edge} fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
            <path
              d={half.crease}
              stroke={INK}
              strokeWidth={1.2}
              opacity={(0.25 + closed * 0.6).toFixed(3)}
            />
          </g>
        ),
      });
    }
  }

  return layers.toSorted((first, second) => first.depth - second.depth);
};

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
    aria-label={flip ? "Previous room" : "Next room"}
    disabled={disabled}
    onClick={onClick}
    className="grid size-14 shrink-0 cursor-pointer place-items-center rounded-full transition-opacity duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#3528d6]/40 disabled:cursor-default disabled:opacity-25"
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
}

export const PopupBook = ({ autoPlay = true, interval = 2600 }: PopupBookProps) => {
  const uid = useId().replaceAll(":", "");

  const ids = {
    hatch: `${uid}-hatch`,
    ink: `${uid}-ink`,
    shadow: `${uid}-shadow`,
    triA: `${uid}-a`,
    triB: `${uid}-b`,
  };

  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const [value, setValue] = useState(0);
  const [index, setIndex] = useState(0);
  const idleUntil = useRef(0);
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null);

  useMotionValueEvent(progress, "change", setValue);

  const goTo = useCallback(
    (target: number) => {
      const next = clamp(Math.round(target), 0, LAST);
      setIndex(next);

      if (reduceMotion) {
        progress.jump(next);
        setValue(next);

        return;
      }

      const distance = Math.abs(next - progress.get());
      animate(progress, next, {
        damping: 14,
        restDelta: 0.0005,
        stiffness: distance > 1.5 ? 26 : 38,
        type: "spring",
      });
    },
    [progress, reduceMotion],
  );

  const userGoTo = (target: number) => {
    idleUntil.current = Date.now() + 7000;
    goTo(target);
  };

  useEffect(() => {
    if (!autoPlay) {
      return;
    }

    const timer = setInterval(() => {
      if (drag.current || Date.now() < idleUntil.current) {
        return;
      }

      goTo(index >= LAST ? 0 : index + 1);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, goTo, index, interval]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    progress.stop();
    drag.current = { moved: false, start: progress.get(), x: event.clientX };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;

    if (!state) {
      return;
    }

    const dx = event.clientX - state.x;

    if (Math.abs(dx) > 4) {
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

  const layers = buildLayers(value, ids);
  const label = ROOMS[clamp(Math.round(value), 0, LAST)]?.name ?? "";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Pop-up book"
      className="flex w-full max-w-[720px] flex-col items-center gap-2 select-none"
    >
      <div className="flex w-full items-center justify-center gap-1 sm:gap-4">
        <Arrow flip disabled={index === 0} onClick={() => userGoTo(index - 1)} />
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative aspect-[460/370] w-full max-w-[520px] cursor-grab touch-pan-y rounded-3xl outline-none active:cursor-grabbing has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#3528d6]/30"
        >
          <svg
            viewBox="-230 -218 460 370"
            className="size-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id={ids.hatch}
                width={7}
                height={7}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <path d="M0 0 V7" stroke={INK} strokeWidth={0.8} opacity={0.25} />
              </pattern>
              <clipPath id={ids.triA}>
                <path d="M0 0 L200 0 L200 200 z" />
              </clipPath>
              <clipPath id={ids.triB}>
                <path d="M0 0 L0 200 L200 200 z" />
              </clipPath>
              <filter id={ids.ink} x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={7} />
                <feDisplacementMap in="SourceGraphic" scale={1.4} />
              </filter>
              <filter id={ids.shadow} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={14} />
              </filter>
            </defs>
            <ellipse
              cx={0}
              cy={112}
              rx={170}
              ry={34}
              fill="#3a2f5c"
              opacity={0.2}
              filter={`url(#${ids.shadow})`}
            />
            <g filter={`url(#${ids.ink})`}>{layers.map((layer) => layer.node)}</g>
          </svg>
          <input
            type="range"
            min={0}
            max={LAST}
            step={1}
            value={index}
            aria-label="Page"
            aria-valuetext={`${ROOMS[index]?.name ?? ""}, room ${index + 1} of ${ROOMS.length}`}
            onChange={(event) => userGoTo(Number(event.currentTarget.value))}
            className="sr-only"
          />
        </div>
        <Arrow flip={false} disabled={index === LAST} onClick={() => userGoTo(index + 1)} />
      </div>
      <div className="relative h-10 w-full" aria-live="polite">
        <AnimatePresence initial={false}>
          <motion.p
            key={label}
            initial={{ filter: "blur(4px)", opacity: 0, y: 6 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            exit={{ filter: "blur(4px)", opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-x-0 text-center text-[26px] font-bold tracking-wide italic"
            style={{
              color: INK,
              fontFamily: "'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive",
            }}
          >
            {label}
          </motion.p>
        </AnimatePresence>
      </div>
      <span className="sr-only">Drag the book or use the arrows to turn pages.</span>
    </section>
  );
};
