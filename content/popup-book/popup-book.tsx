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
import { CITIES, INK, cardSpan, placement } from "./popup-cities";
import type { PopupCity } from "./popup-cities";

type Vec = readonly [number, number, number];

const SIZE = 200;
const ELEVATION = (36 * Math.PI) / 180;
const SIN_E = Math.sin(ELEVATION);
const COS_E = Math.cos(ELEVATION);
const LIGHT: Vec = [0.45, 0.8, 0.4];
const LAST = CITIES.length - 1;
const BACKING = "#e7dfcf";
const CLOTH = "#d6ccb6";
const ORIGIN: Vec = [0, 0, 0];

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
    return 135 + 24 * (1 - Math.exp(offset / 2.4));
  }

  if (offset >= 1) {
    return 45 - 34 * (1 - Math.exp(-(offset - 1) / 2.6));
  }

  return 135 - 90 * offset;
};

const pageDepth = (theta: number) => (SIZE / 2) * Math.sin(rad(theta)) * COS_E + (SIZE / 2) * SIN_E;

interface Layer {
  depth: number;
  node: ReactNode;
}

interface Ids {
  hatch: string;
  page: string;
  triA: string;
  triB: string;
  card: (city: number, layer: number) => string;
}

const Shade = ({
  normal,
  closed,
  width = SIZE,
  height = SIZE,
}: {
  normal: Vec;
  closed: number;
  width?: number;
  height?: number;
}) => {
  const length = Math.hypot(normal[0], normal[1], normal[2]) || 1;

  const lambert = clamp(
    (normal[0] * LIGHT[0] + normal[1] * LIGHT[1] + normal[2] * LIGHT[2]) / length,
    0,
    1,
  );

  return (
    <rect
      width={width}
      height={height}
      fill="#2a2150"
      opacity={clamp(0.2 * (1 - lambert) + 0.22 * closed, 0, 0.5).toFixed(3)}
    />
  );
};

const facingNormal = (axis: Vec, viewerSide: boolean) => {
  const normal: Vec = [axis[1], -axis[0], 0];

  return viewerSide === depth(normal) >= 0 ? normal : scale(normal, -1);
};

const cross = (a: Vec, b: Vec) =>
  [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]] satisfies Vec;

interface CardInput {
  bisector: Vec;
  city: PopupCity;
  closed: number;
  floorZ: (point: Vec) => number;
  ids: Ids;
  index: number;
  left: number;
  right: number;
  roomDepth: number;
}

const cardLayers = ({
  bisector,
  city,
  closed,
  floorZ,
  ids,
  index,
  left,
  right,
  roomDepth,
}: CardInput) => {
  const layers: Layer[] = [];

  for (const [layerIndex, layer] of city.layers.entries()) {
    const { width, crease } = cardSpan(layer.left, layer.right);
    const longLeft = crease;
    const longRight = width - crease;
    const pL = scale(dir(left), layer.left);
    const pR = scale(dir(right), layer.right);
    const gap = sub(pR, pL);
    const span = Math.hypot(gap[0], gap[1]) || 1;
    const along = scale(gap, 1 / span);
    let side: Vec = [-along[1], along[0], 0];

    if (side[0] * pL[0] + side[1] * pL[1] > 0) {
      side = scale(side, -1);
    }

    const reachAlong = (longLeft ** 2 - longRight ** 2 + span ** 2) / (2 * span);
    const offset = Math.sqrt(Math.max(0, longLeft ** 2 - reachAlong ** 2));
    const flat = add(add(pL, scale(along, reachAlong)), scale(side, offset));
    const apex: Vec = [flat[0], flat[1], floorZ(flat)];
    const up: Vec = [0, 0, layer.height];
    const down: Vec = [0, 0, -1];
    const leftAxis = scale(sub(apex, pL), 1 / longLeft);
    const rightAxis = scale(sub(pR, apex), 1 / longRight);
    const id = ids.card(index, layerIndex);
    const transform = placement(layer);
    const lineScale = layer.place?.zoom ?? 1;
    const toward = scale(bisector, 9);
    const shadowPoints = [pL, apex, pR, add(pR, toward), add(apex, toward), add(pL, toward)];

    layers.push({
      depth: roomDepth + 0.1 + layerIndex * 0.05,
      node: (
        <path
          key={`shadow-${index}-${layerIndex}`}
          d={`M${shadowPoints
            .map((point) => {
              const [x, y] = project([point[0], point[1], floorZ(point)]);

              return `${x.toFixed(2)} ${y.toFixed(2)}`;
            })
            .join("L")}z`}
          fill="#2a2150"
          opacity={(0.16 * (1 - closed)).toFixed(3)}
        />
      ),
    });

    const panels = [
      {
        axis: leftAxis,
        frame: affine(add(pL, up), leftAxis, down),
        mid: scale(add(pL, apex), 0.5),
      },
      {
        axis: rightAxis,
        frame: affine(add(sub(apex, scale(rightAxis, longLeft)), up), rightAxis, down),
        mid: scale(add(pR, apex), 0.5),
      },
    ];

    for (const [panelIndex, panel] of panels.entries()) {
      const front = panel.frame.det > 0;

      layers.push({
        depth: roomDepth + 0.2 + layerIndex * 0.05 + depth(panel.mid) * 0.0001,
        node: (
          <g key={`card-${index}-${layerIndex}-${panelIndex}`} transform={panel.frame.transform}>
            <g clipPath={`url(#${id}-${panelIndex})`}>
              <path
                d={layer.outline}
                transform={transform}
                fill="none"
                stroke="#fffdf8"
                strokeWidth={4.5 / lineScale}
                strokeLinejoin="round"
              />
              <g clipPath={`url(#${id})`}>
                {front ? (
                  <g transform={transform}>{layer.art}</g>
                ) : (
                  <>
                    <rect width={width} height={layer.height} fill={BACKING} />
                    <rect width={width} height={layer.height} fill={`url(#${ids.hatch})`} />
                  </>
                )}
                <Shade
                  normal={facingNormal(panel.axis, front)}
                  closed={closed * 0.4}
                  width={width}
                  height={layer.height}
                />
              </g>
              <path
                d={layer.outline}
                transform={transform}
                fill="none"
                stroke={INK}
                strokeWidth={1.6 / lineScale}
                strokeLinejoin="round"
              />
            </g>
          </g>
        ),
      });
    }
  }

  return layers;
};

const roomDepthFor = (left: number, right: number) => {
  const leftOpen = Math.cos(rad(left)) < 0;
  const rightOpen = Math.cos(rad(right)) >= 0;
  const leftDepth = pageDepth(left);
  const rightDepth = pageDepth(right);

  if (leftOpen && rightOpen) {
    return Math.max(leftDepth, rightDepth) + 0.5;
  }

  if (leftOpen) {
    return leftDepth + 0.5;
  }

  if (rightOpen) {
    return rightDepth + 0.5;
  }

  return Math.min(leftDepth, rightDepth) - 0.5;
};

const pageLayers = (angles: number[], openness: (spread: number) => number, ids: Ids) => {
  const layers: Layer[] = [];

  for (const [page, theta] of angles.entries()) {
    const u = dir(theta);
    const facesForward = Math.cos(rad(theta)) >= 0;
    const spread = facesForward ? page - 1 : page;
    const city = CITIES[spread];
    const top: Vec = [0, 0, SIZE];
    const down: Vec = [0, 0, -1];

    const { transform } = facesForward
      ? affine(top, u, down)
      : affine(add(scale(u, SIZE), top), scale(u, -1), down);

    const normal: Vec = facesForward ? [-u[1], u[0], 0] : [u[1], -u[0], 0];
    const isCover = page === 0 || page === CITIES.length;

    layers.push({
      depth: pageDepth(theta),
      node: (
        <g key={`page-${page}`} transform={transform}>
          {isCover ? (
            <rect
              x={facesForward ? 0 : -5}
              y={-5}
              width={SIZE + 5}
              height={SIZE + 10}
              rx={3}
              fill={CLOTH}
              stroke={INK}
              strokeWidth={1.4}
            />
          ) : null}
          <g clipPath={`url(#${ids.page})`}>
            {city ? (
              <g transform={facesForward ? `translate(${-SIZE} 0)` : undefined}>{city.panorama}</g>
            ) : (
              <>
                <rect width={SIZE} height={SIZE} fill={BACKING} />
                <rect width={SIZE} height={SIZE} fill={`url(#${ids.hatch})`} />
              </>
            )}
            <Shade normal={normal} closed={1 - openness(spread)} />
            <rect
              width={SIZE}
              height={SIZE}
              fill={BACKING}
              opacity={(0.82 * (1 - openness(spread)) ** 2).toFixed(3)}
            />
            <rect
              width={SIZE}
              height={SIZE}
              fill={`url(#${ids.hatch})`}
              opacity={(1 - openness(spread)).toFixed(3)}
            />
          </g>
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

  return layers;
};

const buildLayers = (progress: number, ids: Ids) => {
  const angles = Array.from({ length: CITIES.length + 1 }, (_, page) => pageAngle(page, progress));
  const angleAt = (page: number) => angles[page] ?? 0;

  const openness = (spread: number) =>
    spread < 0 || spread > LAST ? 0 : clamp((angleAt(spread) - angleAt(spread + 1)) / 90, 0, 1);

  const layers: Layer[] = pageLayers(angles, openness, ids);

  for (const [index, city] of CITIES.entries()) {
    const left = angleAt(index);
    const right = angleAt(index + 1);
    const spread = left - right;

    if (spread < 0.5) {
      continue;
    }

    const roomDepth = roomDepthFor(left, right);

    const bisector = dir((left + right) / 2);
    const halfSpread = rad(spread / 2);
    const cosLift = Math.min(1, Math.SQRT1_2 / Math.cos(halfSpread));
    const sinLift = Math.sqrt(1 - cosLift * cosLift);
    const tip = scale([bisector[0] * cosLift, bisector[1] * cosLift, sinLift], SIZE * Math.SQRT2);
    const a3 = scale(dir(left), SIZE);
    const b3 = scale(dir(right), SIZE);
    const closed = 1 - openness(index);

    const halves = [
      {
        clip: ids.triA,
        edge: "M0 0 H200 V200",
        frame: affine(ORIGIN, scale(a3, 1 / SIZE), scale(sub(tip, a3), 1 / SIZE)),
        mid: scale(add(a3, tip), 1 / 3),
      },
      {
        clip: ids.triB,
        edge: "M0 0 V200 H200",
        frame: affine(ORIGIN, scale(sub(tip, b3), 1 / SIZE), scale(b3, 1 / SIZE)),
        mid: scale(add(b3, tip), 1 / 3),
      },
    ];

    for (const [side, half] of halves.entries()) {
      const upward = half.frame.det < 0;
      const normal: Vec = upward ? [0, 0, 1] : [0, 0, -1];

      layers.push({
        depth: roomDepth + depth(half.mid) * 0.0001,
        node: (
          <g key={`floor-${index}-${side}`} transform={half.frame.transform}>
            <g clipPath={`url(#${half.clip})`}>
              <rect width={SIZE} height={SIZE} fill={upward ? city.ground : BACKING} />
              {upward ? (
                city.floor
              ) : (
                <rect width={SIZE} height={SIZE} fill={`url(#${ids.hatch})`} />
              )}
              <Shade normal={normal} closed={closed * 0.5} />
            </g>
            <path d={half.edge} fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
            <path
              d="M0 0 L200 200"
              stroke={INK}
              strokeWidth={1.2}
              opacity={(0.2 + closed * 0.6).toFixed(3)}
            />
          </g>
        ),
      });
    }

    const floorZ = (point: Vec) => {
      const wall = bisector[0] * point[1] - bisector[1] * point[0] >= 0 ? a3 : b3;
      const normal = cross(wall, tip);

      return Math.abs(normal[2]) < 1e-6
        ? 0
        : -(normal[0] * point[0] + normal[1] * point[1]) / normal[2];
    };

    layers.push(
      ...cardLayers({ bisector, city, closed, floorZ, ids, index, left, right, roomDepth }),
    );
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
}

export const PopupBook = ({ autoPlay = true, interval = 2800 }: PopupBookProps) => {
  const uid = useId().replaceAll(":", "");

  const ids = {
    card: (city: number, layer: number) => `${uid}-c${city}-${layer}`,
    hatch: `${uid}-hatch`,
    page: `${uid}-page`,
    contact: `${uid}-contact`,
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
        stiffness: distance > 1.5 ? 24 : 36,
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
  const shown = clamp(Math.round(value), 0, LAST);
  const city = CITIES[shown];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Pop-up travel book"
      className="flex w-full max-w-[720px] flex-col items-center gap-1 select-none"
    >
      <div className="flex w-full items-center justify-center gap-1 sm:gap-4">
        <Arrow flip disabled={index === 0} onClick={() => userGoTo(index - 1)} />
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative aspect-[460/370] w-full max-w-[540px] cursor-grab touch-pan-y rounded-3xl outline-none active:cursor-grabbing has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#3528d6]/30"
        >
          <svg
            viewBox="-230 -186 460 376"
            className="size-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id={ids.hatch}
                width={6}
                height={6}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <path d="M0 0 V6" stroke={INK} strokeWidth={0.7} opacity={0.22} />
              </pattern>
              <clipPath id={ids.page}>
                <rect width={SIZE} height={SIZE} />
              </clipPath>
              <clipPath id={ids.triA}>
                <path d="M0 0 L200 0 L200 200 z" />
              </clipPath>
              <clipPath id={ids.triB}>
                <path d="M0 0 L0 200 L200 200 z" />
              </clipPath>
              {CITIES.map((entry, cityIndex) =>
                entry.layers.map((layer, layerIndex) => {
                  const id = ids.card(cityIndex, layerIndex);
                  const { width, crease } = cardSpan(layer.left, layer.right);

                  return (
                    <g key={id}>
                      <clipPath id={id}>
                        <path d={layer.outline} transform={placement(layer)} />
                      </clipPath>
                      <clipPath id={`${id}-0`}>
                        <rect x={-6} y={-6} width={crease + 6.6} height={layer.height + 12} />
                      </clipPath>
                      <clipPath id={`${id}-1`}>
                        <rect
                          x={crease}
                          y={-6}
                          width={width - crease + 6}
                          height={layer.height + 12}
                        />
                      </clipPath>
                    </g>
                  );
                }),
              )}
              <filter id={ids.contact} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation={6} />
              </filter>
              <filter id={ids.ink} x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.035"
                  numOctaves={2}
                  seed={3}
                  result="wobble"
                />
                <feDisplacementMap in="SourceGraphic" in2="wobble" scale={1.5} result="inked" />
                <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={11} />
                <feColorMatrix
                  values="0 0 0 0 0.92  0 0 0 0 0.9  0 0 0 0 0.95  -1.4 0 0 0 1.3"
                  result="grain"
                />
                <feComposite in="grain" in2="inked" operator="in" result="speckle" />
                <feBlend in="speckle" in2="inked" mode="multiply" />
              </filter>
              <filter id={ids.shadow} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={14} />
              </filter>
            </defs>
            <ellipse
              cx={12}
              cy={150}
              rx={190}
              ry={40}
              fill="#3a2f5c"
              opacity={0.2}
              filter={`url(#${ids.shadow})`}
            />
            <path
              d="M0 2L-144 86L0 172L144 86z"
              transform="translate(3 5)"
              fill="#2a2150"
              opacity={(
                0.18 *
                Math.max(0, 1 - Math.abs(value - Math.round(value)) / 0.1) ** 2
              ).toFixed(3)}
              filter={`url(#${ids.contact})`}
            />
            <g filter={`url(#${ids.ink})`}>{layers.map((layer) => layer.node)}</g>
          </svg>
          <input
            type="range"
            min={0}
            max={LAST}
            step={1}
            value={index}
            aria-label="City"
            aria-valuetext={`${CITIES[index]?.name ?? ""}, ${index + 1} of ${CITIES.length}`}
            onChange={(event) => userGoTo(Number(event.currentTarget.value))}
            className="sr-only"
          />
        </div>
        <Arrow flip={false} disabled={index === LAST} onClick={() => userGoTo(index + 1)} />
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
