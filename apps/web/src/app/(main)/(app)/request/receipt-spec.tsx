"use client";

import { useEffect, useId } from "react";
import type { ReactNode } from "react";
import { motion, stagger, useSpring, useTransform } from "motion/react";
import type { MotionValue, Transition, Variants } from "motion/react";

import { TEAR } from "./use-tear-stub";
import type { TearPhase } from "./use-tear-stub";
import { TILT } from "./use-tilt";

export interface ReceiptLayout {
  art: { height: number; width: number; x: number; y: number } | null;
  head: number;
  height: number;
  seam: number;
  width: number;
}

const HOLE_DIAMETER = 22;
const RADIUS = 8;
const GRID_REACH = 96;
const RING_REACH = 40;
const TICK = 3;

const LINE = "fill-none stroke-primary/35";
const EXT = "fill-none stroke-primary/20 [stroke-dasharray:2_3]";
const LABEL = "fill-primary/50 font-mono text-[9px] tracking-[0.15em] uppercase";

const EASE: Transition["ease"] = [0.22, 1, 0.36, 1];
const shift: Transition = { bounce: 0.15, type: "spring", visualDuration: 0.6 };

// Every piece of the drawing is a variant node, so the sequence is the DOM order:
// grid, crosshair, ring, then each dimension draws its extension lines out from the
// card edge, then the dimension line, ticks, and finally the label.
const sequence = (step: number, startDelay = 0): Variants => ({
  hidden: {},
  shown: { transition: { delayChildren: stagger(step, { startDelay }) } },
});
const draw: Variants = {
  hidden: { opacity: 0, pathLength: 0 },
  shown: {
    opacity: 1,
    pathLength: 1,
    transition: { opacity: { duration: 0.01 }, pathLength: { duration: 0.55, ease: EASE } },
  },
};
const ring: Variants = {
  hidden: { opacity: 0, pathLength: 0 },
  shown: {
    opacity: 1,
    pathLength: 1,
    transition: { opacity: { duration: 0.01 }, pathLength: { duration: 1.2, ease: EASE } },
  },
};
const fade: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.45, ease: "easeOut" } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 4 },
  shown: { opacity: 1, transition: { duration: 0.4, ease: EASE }, y: 0 },
};

const Line = ({
  className = LINE,
  x1,
  y1,
  x2,
  y2,
}: {
  className?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) => <motion.line className={className} x1={x1} y1={y1} x2={x2} y2={y2} variants={draw} />;

const Label = ({
  x,
  y,
  children,
  anchor = "middle",
  rotate = 0,
}: {
  anchor?: "start" | "middle" | "end";
  children: ReactNode;
  rotate?: number;
  x: number;
  y: number;
}) => (
  <motion.text
    className={LABEL}
    x={x}
    y={y}
    textAnchor={anchor}
    dominantBaseline="middle"
    transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
    variants={fade}
  >
    {children}
  </motion.text>
);

const HDim = ({
  x1,
  x2,
  y,
  edge,
  label,
}: {
  edge: number;
  label: string;
  x1: number;
  x2: number;
  y: number;
}) => {
  const beyond = y < edge ? -4 : 4;
  return (
    <motion.g variants={sequence(0.09)}>
      <Line className={EXT} x1={x1} y1={edge} x2={x1} y2={y + beyond} />
      <Line className={EXT} x1={x2} y1={edge} x2={x2} y2={y + beyond} />
      <Line x1={x1} y1={y} x2={x2} y2={y} />
      <Line x1={x1 - TICK} y1={y + TICK} x2={x1 + TICK} y2={y - TICK} />
      <Line x1={x2 - TICK} y1={y + TICK} x2={x2 + TICK} y2={y - TICK} />
      <Label x={(x1 + x2) / 2} y={y + (y < edge ? -7 : 8)}>
        {label}
      </Label>
    </motion.g>
  );
};

const VDim = ({
  y1,
  y2,
  x,
  edge,
  label,
}: {
  edge: number;
  label: string;
  x: number;
  y1: number;
  y2: number;
}) => {
  const beyond = x < edge ? -4 : 4;
  return (
    <motion.g variants={sequence(0.09)}>
      <Line className={EXT} x1={edge} y1={y1} x2={x + beyond} y2={y1} />
      <Line className={EXT} x1={edge} y1={y2} x2={x + beyond} y2={y2} />
      <Line x1={x} y1={y1} x2={x} y2={y2} />
      <Line x1={x - TICK} y1={y1 + TICK} x2={x + TICK} y2={y1 - TICK} />
      <Line x1={x - TICK} y1={y2 + TICK} x2={x + TICK} y2={y2 - TICK} />
      <Label x={x + (x < edge ? -7 : 8)} y={(y1 + y2) / 2} rotate={-90}>
        {label}
      </Label>
    </motion.g>
  );
};

const Callout = ({
  x,
  y,
  dx,
  dy,
  label,
}: {
  dx: number;
  dy: number;
  label: string;
  x: number;
  y: number;
}) => (
  <motion.g variants={sequence(0.2)}>
    <Line x1={x} y1={y} x2={x + dx} y2={y + dy} />
    <Label x={x + dx + (dx < 0 ? -4 : 4)} y={y + dy} anchor={dx < 0 ? "end" : "start"}>
      {label}
    </Label>
  </motion.g>
);

const Crosshair = ({ cx, cy, radius }: { cx: number; cy: number; radius: number }) => {
  const reach = radius + 12;
  return (
    <motion.g variants={sequence(0)}>
      <Line className={EXT} x1={cx} y1={cy} x2={cx - reach} y2={cy} />
      <Line className={EXT} x1={cx} y1={cy} x2={cx + reach} y2={cy} />
      <Line className={EXT} x1={cx} y1={cy} x2={cx} y2={cy - reach} />
      <Line className={EXT} x1={cx} y1={cy} x2={cx} y2={cy + reach} />
    </motion.g>
  );
};

const useShift = (value: number) => {
  const spring = useSpring(0, shift);
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  return spring;
};

export const ReceiptSpec = ({
  layout,
  horizontal,
  torn,
  reducedMotion,
}: {
  horizontal: boolean;
  layout: ReceiptLayout;
  reducedMotion: boolean;
  torn: boolean;
}) => {
  const id = useId();
  const { art, head, height, seam, width } = layout;
  const stub = horizontal ? width - seam : height - seam;
  const half = TEAR.gap / 2;
  const bodyShift = useShift(torn ? -half : 0);
  const stubShift = useShift(torn ? half : 0);
  const radius = Math.min(width, height) / 2 + RING_REACH;
  const cx = width / 2;
  const cy = height / 2;
  const initial = reducedMotion ? false : "hidden";

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
    >
      <defs>
        <pattern id={`${id}-minor`} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M8 0H0V8" className="stroke-border fill-none" strokeWidth="0.5" />
        </pattern>
        <pattern id={`${id}-major`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" className="stroke-border fill-none" />
        </pattern>
        <radialGradient id={`${id}-fade`}>
          <stop offset="40%" stopColor="white" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect
            x={-GRID_REACH}
            y={-GRID_REACH}
            width={width + GRID_REACH * 2}
            height={height + GRID_REACH * 2}
            fill={`url(#${id}-fade)`}
          />
        </mask>
      </defs>
      <motion.g initial={initial} animate="shown" variants={sequence(0.14, 0.8)}>
        <motion.g variants={fade} mask={`url(#${id}-mask)`}>
          <rect
            x={-GRID_REACH}
            y={-GRID_REACH}
            width={width + GRID_REACH * 2}
            height={height + GRID_REACH * 2}
            fill={`url(#${id}-minor)`}
          />
          <rect
            x={-GRID_REACH}
            y={-GRID_REACH}
            width={width + GRID_REACH * 2}
            height={height + GRID_REACH * 2}
            fill={`url(#${id}-major)`}
          />
        </motion.g>
        <Crosshair cx={cx} cy={cy} radius={radius} />
        <motion.circle className={EXT} cx={cx} cy={cy} r={radius} variants={ring} />
        <motion.g variants={sequence(0.05)}>
          <Label x={cx + radius + 18} y={cy} anchor="start">
            X
          </Label>
          <Label x={cx} y={cy - radius - 18}>
            Y
          </Label>
        </motion.g>

        {horizontal ? (
          <>
            {torn ? null : <HDim x1={0} x2={width} y={-38} edge={0} label={`${width}`} />}
            <motion.g style={{ x: bodyShift }} variants={sequence(0.14)}>
              <HDim x1={0} x2={seam} y={-18} edge={0} label={`${seam}`} />
              <VDim y1={0} y2={height} x={-26} edge={0} label={`${height}`} />
              {art ? (
                <>
                  <VDim
                    y1={art.y}
                    y2={art.y + art.height}
                    x={-10}
                    edge={art.x}
                    label={`${art.height}`}
                  />
                  <HDim
                    x1={art.x}
                    x2={art.x + art.width}
                    y={height + 18}
                    edge={art.y + art.height}
                    label={`Art ${art.width}`}
                  />
                </>
              ) : null}
              <Callout
                x={seam}
                y={height}
                dx={-14}
                dy={16}
                label={`Ø ${HOLE_DIAMETER} · perforated`}
              />
            </motion.g>
            <motion.g style={{ x: stubShift }} variants={sequence(0.14)}>
              <HDim x1={seam} x2={width} y={-18} edge={0} label={`Stub ${stub}`} />
              <VDim y1={0} y2={head} x={width + 22} edge={width} label={`${head}`} />
              <Callout x={width - 2} y={height - 2} dx={14} dy={16} label={`R ${RADIUS}`} />
            </motion.g>
          </>
        ) : (
          <>
            <HDim x1={0} x2={width} y={height + 16} edge={height} label={`${width}`} />
            <motion.g style={{ y: bodyShift }} variants={sequence(0.14)}>
              <VDim y1={0} y2={seam} x={-14} edge={0} label={`${seam}`} />
              {art ? (
                <HDim
                  x1={art.x}
                  x2={art.x + art.width}
                  y={-16}
                  edge={art.y}
                  label={`Art ${art.width}`}
                />
              ) : null}
            </motion.g>
            <motion.g style={{ y: stubShift }} variants={sequence(0.14)}>
              <VDim y1={seam} y2={height} x={-14} edge={0} label={`Stub ${stub}`} />
            </motion.g>
          </>
        )}
      </motion.g>
      {torn ? (
        <motion.g initial={initial} animate="shown">
          {horizontal ? (
            <HDim x1={seam - half} x2={seam + half} y={-38} edge={-18} label={`Gap ${TEAR.gap}`} />
          ) : (
            <VDim y1={seam - half} y2={seam + half} x={-14} edge={0} label={`${TEAR.gap}`} />
          )}
        </motion.g>
      ) : null}
    </svg>
  );
};

export interface SpecTelemetry {
  aimX: MotionValue<number>;
  aimY: MotionValue<number>;
  intact: MotionValue<number>;
  phase: MotionValue<TearPhase>;
  tiltX: MotionValue<number>;
  tiltY: MotionValue<number>;
}

const signed = (value: number, digits: number, unit = "") =>
  `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(digits)}${unit}`;

const Note = ({ title, lines }: { lines: string[]; title: string }) => (
  <motion.div className="flex flex-col gap-1" variants={sequence(0.07)}>
    <motion.p className="text-primary/50" variants={rise}>
      {title}
    </motion.p>
    {lines.map((line) => (
      <motion.p key={line} variants={rise}>
        {line}
      </motion.p>
    ))}
  </motion.div>
);

const Readout = ({ label, value }: { label: string; value: MotionValue<string> }) => (
  <motion.div className="flex gap-3" variants={rise}>
    <dt className="w-14 shrink-0">{label}</dt>
    <motion.dd className="text-foreground/60">{value}</motion.dd>
  </motion.div>
);

export const ReceiptSpecNotes = ({
  bridges,
  number,
  telemetry,
  reducedMotion,
}: {
  bridges: number;
  number: string;
  reducedMotion: boolean;
  telemetry: SpecTelemetry;
}) => {
  const thetaX = useTransform(() => signed(telemetry.tiltX.get(), 2, "°"));
  const thetaY = useTransform(() => signed(telemetry.tiltY.get(), 2, "°"));
  const aim = useTransform(
    () => `${signed(telemetry.aimX.get(), 2)}  ${signed(telemetry.aimY.get(), 2)}`,
  );
  const intact = useTransform(() => `${telemetry.intact.get()}/${bridges}`);
  const phase = useTransform((): string => telemetry.phase.get());
  const { spring } = TILT;

  return (
    <motion.div
      initial={reducedMotion ? false : "hidden"}
      animate="shown"
      variants={sequence(0.12, 1.9)}
      className="text-muted-foreground/60 grid max-w-3xl gap-6 font-mono text-[10px] tracking-[0.15em] uppercase sm:grid-cols-3"
    >
      <Note
        title="Tilt · underdamped spring"
        lines={[
          `k ${spring.stiffness} · ζ ${spring.damping} · m ${spring.mass}`,
          `θmax ${TILT.max}° · reach ${TILT.reach} px`,
          `art ${TILT.parallax} px against the lean`,
        ]}
      />
      <Note
        title="Stub · perforated"
        lines={[
          `${bridges} bridges · snap at ${TEAR.stretch} px`,
          `free past ${TEAR.angle}° · resistance ${TEAR.resistance}`,
          `rests ${TEAR.gap} px out · ${TEAR.restAngle}° off true`,
        ]}
      />
      <motion.dl className="flex flex-col gap-1" variants={sequence(0.07)}>
        <Readout label="θX" value={thetaX} />
        <Readout label="θY" value={thetaY} />
        <Readout label="Aim" value={aim} />
        <Readout label="Bridges" value={intact} />
        <Readout label="State" value={phase} />
        <motion.p className="text-primary/50 mt-2" variants={rise}>
          Fig. 1 · {number}
        </motion.p>
      </motion.dl>
    </motion.div>
  );
};
