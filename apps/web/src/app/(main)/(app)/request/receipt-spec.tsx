"use client";

import { createContext, useContext, useId } from "react";
import type { ReactNode } from "react";
import { motion, useTransform } from "motion/react";
import type { MotionValue, Transition } from "motion/react";

import { TEAR } from "./use-tear-stub";
import { TILT } from "./use-tilt";
import type { TearPhase } from "./use-tear-stub";

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

const LINE = "fill-none stroke-primary/60";
const EXT = "fill-none stroke-primary/35 [stroke-dasharray:2_3]";
const LABEL = "fill-primary/80 font-mono text-[9px] tracking-[0.15em] uppercase";
const draw: Transition = { delay: 1, duration: 0.9, ease: [0.22, 1, 0.36, 1] };
const fade: Transition = { delay: 1.1, duration: 0.6, ease: "easeOut" };
const shift: Transition = { bounce: 0.15, type: "spring", visualDuration: 0.6 };

const Still = createContext(false);

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
}) => {
  const still = useContext(Still);
  return (
    <motion.line
      className={className}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      initial={still ? false : { pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={draw}
    />
  );
};

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
}) => {
  const still = useContext(Still);
  return (
    <motion.text
      className={LABEL}
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
      initial={still ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fade}
    >
      {children}
    </motion.text>
  );
};

const TICK = 3;

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
    <g>
      <Line className={EXT} x1={x1} y1={edge} x2={x1} y2={y + beyond} />
      <Line className={EXT} x1={x2} y1={edge} x2={x2} y2={y + beyond} />
      <Line x1={x1} y1={y} x2={x2} y2={y} />
      <Line x1={x1 - TICK} y1={y + TICK} x2={x1 + TICK} y2={y - TICK} />
      <Line x1={x2 - TICK} y1={y + TICK} x2={x2 + TICK} y2={y - TICK} />
      <Label x={(x1 + x2) / 2} y={y + (y < edge ? -7 : 8)}>
        {label}
      </Label>
    </g>
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
    <g>
      <Line className={EXT} x1={edge} y1={y1} x2={x + beyond} y2={y1} />
      <Line className={EXT} x1={edge} y1={y2} x2={x + beyond} y2={y2} />
      <Line x1={x} y1={y1} x2={x} y2={y2} />
      <Line x1={x - TICK} y1={y1 + TICK} x2={x + TICK} y2={y1 - TICK} />
      <Line x1={x - TICK} y1={y2 + TICK} x2={x + TICK} y2={y2 - TICK} />
      <Label x={x + (x < edge ? -7 : 8)} y={(y1 + y2) / 2} rotate={-90}>
        {label}
      </Label>
    </g>
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
  <g>
    <Line x1={x} y1={y} x2={x + dx} y2={y + dy} />
    <Label x={x + dx + (dx < 0 ? -4 : 4)} y={y + dy} anchor={dx < 0 ? "end" : "start"}>
      {label}
    </Label>
  </g>
);

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
  const bodyShift = torn ? -half : 0;
  const stubShift = torn ? half : 0;
  const ring = Math.min(width, height) / 2 + RING_REACH;
  const cx = width / 2;
  const cy = height / 2;

  return (
    <Still value={reducedMotion}>
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
        <motion.g
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <g mask={`url(#${id}-mask)`}>
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
          </g>
        </motion.g>
        <g>
          <Line className={EXT} x1={cx - ring - 12} y1={cy} x2={cx + ring + 12} y2={cy} />
          <Line className={EXT} x1={cx} y1={cy - ring - 12} x2={cx} y2={cy + ring + 12} />
          <motion.circle
            className={EXT}
            cx={cx}
            cy={cy}
            r={ring}
            initial={reducedMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={draw}
          />
          <Label x={cx + ring + 18} y={cy} anchor="start">
            X
          </Label>
          <Label x={cx} y={cy - ring - 18}>
            Y
          </Label>

          {horizontal ? (
            <>
              <motion.g animate={{ x: bodyShift }} transition={shift}>
                <HDim x1={0} x2={seam} y={-18} edge={0} label={`${seam}`} />
                <VDim y1={0} y2={height} x={-26} edge={0} label={`${height}`} />
                {art ? (
                  <>
                    <HDim
                      x1={art.x}
                      x2={art.x + art.width}
                      y={height + 18}
                      edge={art.y + art.height}
                      label={`Art ${art.width}`}
                    />
                    <VDim
                      y1={art.y}
                      y2={art.y + art.height}
                      x={-10}
                      edge={art.x}
                      label={`${art.height}`}
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
              <motion.g animate={{ x: stubShift }} transition={shift}>
                <HDim x1={seam} x2={width} y={-18} edge={0} label={`Stub ${stub}`} />
                <VDim y1={0} y2={head} x={width + 22} edge={width} label={`${head}`} />
                <Callout x={width - 2} y={height - 2} dx={14} dy={16} label={`R ${RADIUS}`} />
              </motion.g>
              {torn ? (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={shift}>
                  <HDim
                    x1={seam - half}
                    x2={seam + half}
                    y={-38}
                    edge={-18}
                    label={`Gap ${TEAR.gap}`}
                  />
                </motion.g>
              ) : (
                <HDim x1={0} x2={width} y={-38} edge={0} label={`${width}`} />
              )}
            </>
          ) : (
            <>
              <motion.g animate={{ y: bodyShift }} transition={shift}>
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
              <motion.g animate={{ y: stubShift }} transition={shift}>
                <VDim y1={seam} y2={height} x={-14} edge={0} label={`Stub ${stub}`} />
              </motion.g>
              {torn ? (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={shift}>
                  <VDim y1={seam - half} y2={seam + half} x={-14} edge={0} label={`${TEAR.gap}`} />
                </motion.g>
              ) : null}
              <HDim x1={0} x2={width} y={height + 16} edge={height} label={`${width}`} />
            </>
          )}
        </g>
      </svg>
    </Still>
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
  <div className="flex flex-col gap-1">
    <p className="text-primary/80">{title}</p>
    {lines.map((line) => (
      <p key={line}>{line}</p>
    ))}
  </div>
);

const Readout = ({ label, value }: { label: string; value: MotionValue<string> }) => (
  <div className="flex gap-3">
    <dt className="w-14 shrink-0">{label}</dt>
    <motion.dd className="text-foreground">{value}</motion.dd>
  </div>
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
  const thetaX = useTransform(telemetry.tiltX, (value) => signed(value, 2, "°"));
  const thetaY = useTransform(telemetry.tiltY, (value) => signed(value, 2, "°"));
  const aim = useTransform(
    () => `${signed(telemetry.aimX.get(), 2)}  ${signed(telemetry.aimY.get(), 2)}`,
  );
  const intact = useTransform(telemetry.intact, (value) => `${value}/${bridges}`);
  const phase = useTransform(telemetry.phase, (value): string => value);
  const { spring } = TILT;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fade}
      className="text-muted-foreground grid max-w-3xl gap-6 font-mono text-[10px] tracking-[0.15em] uppercase sm:grid-cols-3"
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
      <dl className="flex flex-col gap-1">
        <Readout label="θX" value={thetaX} />
        <Readout label="θY" value={thetaY} />
        <Readout label="Aim" value={aim} />
        <Readout label="Bridges" value={intact} />
        <Readout label="State" value={phase} />
        <p className="text-primary/80 mt-2">Fig. 1 · {number}</p>
      </dl>
    </motion.div>
  );
};
