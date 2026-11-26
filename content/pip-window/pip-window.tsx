"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Mic, Video } from "lucide-react";
import { motion, useAnimation, useReducedMotion } from "motion/react";

import type { ClayTone } from "./phone-frame";
import { PhoneFrame, SCREEN_HEIGHT, SCREEN_WIDTH } from "./phone-frame";

export type PipCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type Side = "left" | "right";

type Placement =
  | { corner: PipCorner; type: "corner" }
  | { side: Side; tucked: boolean; type: "edge"; y: number };

interface Geometry {
  bottom: number;
  height: number;
  left: number;
  peek: number;
  right: number;
  top: number;
  width: number;
}

const CORNERS: readonly PipCorner[] = ["top-left", "top-right", "bottom-left", "bottom-right"];

const FLICK_VELOCITY = 900;

const measure = (width: number, margin: number, peek: number) => {
  const height = Math.round((width * 2) / 3);

  return {
    bottom: SCREEN_HEIGHT - height - 96,
    height,
    left: margin,
    peek,
    right: SCREEN_WIDTH - width - margin,
    top: margin + 46,
    width,
  } satisfies Geometry;
};

const cornerPoint = (corner: PipCorner, geometry: Geometry) => ({
  x: corner.endsWith("left") ? geometry.left : geometry.right,
  y: corner.startsWith("top") ? geometry.top : geometry.bottom,
});

const resolve = (placement: Placement, geometry: Geometry, tuck: boolean) => {
  if (placement.type === "corner") {
    return cornerPoint(placement.corner, geometry);
  }

  const y = Math.min(geometry.bottom, Math.max(geometry.top, placement.y));
  const tucked = tuck && placement.tucked;

  if (placement.side === "left") {
    return { x: tucked ? -(geometry.width - geometry.peek) : geometry.left, y };
  }

  return { x: tucked ? SCREEN_WIDTH - geometry.peek : geometry.right, y };
};

interface Vector {
  x: number;
  y: number;
}

const nearestCorner = (point: Vector, geometry: Geometry, fallback: PipCorner) => {
  let nearest = fallback;
  let best = Number.POSITIVE_INFINITY;

  for (const corner of CORNERS) {
    const candidate = cornerPoint(corner, geometry);
    const distance = (candidate.x - point.x) ** 2 + (candidate.y - point.y) ** 2;

    if (distance < best) {
      best = distance;
      nearest = corner;
    }
  }

  return nearest;
};

interface Release {
  current: Placement;
  defaultCorner: PipCorner;
  geometry: Geometry;
  momentum: number;
  offset: Vector;
  tuck: boolean;
  velocity: Vector;
}

const land = ({ current, defaultCorner, geometry, momentum, offset, tuck, velocity }: Release) => {
  const start = resolve(current, geometry, tuck);

  const projected = {
    x: start.x + offset.x + velocity.x * momentum,
    y: start.y + offset.y + velocity.y * momentum,
  };

  const thrownLeft =
    projected.x < -geometry.width * 0.35 ||
    (velocity.x < -FLICK_VELOCITY && projected.x < geometry.left);

  const thrownRight =
    projected.x > SCREEN_WIDTH - geometry.width * 0.65 ||
    (velocity.x > FLICK_VELOCITY && projected.x > geometry.right);

  if (tuck && (thrownLeft || thrownRight)) {
    return {
      side: thrownLeft ? "left" : "right",
      tucked: true,
      type: "edge",
      y: projected.y,
    } satisfies Placement;
  }

  return {
    corner: nearestCorner(projected, geometry, defaultCorner),
    type: "corner",
  } satisfies Placement;
};

const springFor = (placement: Placement, bounce: number, duration: number) => {
  if (placement.type === "corner") {
    return { bounce, duration, type: "spring" as const };
  }

  return {
    bounce: Math.max(0, bounce + (placement.tucked ? -0.08 : 0.03)),
    duration: Math.max(0.1, duration - 0.05),
    type: "spring" as const,
  };
};

const NOTES = [
  ["Capsule roadmap", "45 components · 12 shipped"],
  ["PiP physics", "Flick it — velocity picks the corner"],
  ["Edge tuck", "Throw it off the side, tap the tab to bring it back"],
  ["Cover videos", "record restart re-arms capture on the sized tab"],
  ["Motion notes", "One spring config per size change"],
];

interface CallTileProps {
  accent: string;
  avatar: number;
  initials: string;
  name: string;
  reduced: boolean;
}

const CallTile = ({ accent, avatar, initials, name, reduced }: CallTileProps) => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-[#3f6a68] via-[#20393b] to-[#112022]" />
    <motion.div
      aria-hidden
      className="absolute -top-6 left-8 size-24 rounded-full bg-[#8cc2ba]/30 blur-xl"
      animate={reduced ? undefined : { x: [0, 8, -4, 0], y: [0, 4, -2, 0] }}
      transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
    />
    <div
      className="absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-b from-[#f0a58f] to-[#c76b52] font-semibold text-white"
      style={{ fontSize: avatar * 0.3125, height: avatar, width: avatar }}
    >
      {initials}
    </div>
    <div className="absolute bottom-1.5 left-2 flex max-w-[calc(100%-2rem)] items-center gap-1 text-white/80">
      <Video className="size-3 shrink-0" />
      <span className="truncate text-[10px] font-medium">{name}</span>
    </div>
    <motion.div className="absolute right-2 bottom-1.5 flex items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((bar) => (
        <motion.span
          key={bar}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: accent }}
          animate={reduced ? { height: 6 + bar * 2 } : { height: [3, 9 + bar * 2, 4, 8, 3] }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 0.9 + bar * 0.2, ease: "easeInOut", repeat: Infinity }
          }
        />
      ))}
    </motion.div>
  </>
);

const TuckTab = ({ side }: { side: Side }) => (
  <div
    className={`absolute inset-y-0 flex items-center bg-black/30 ${
      side === "left" ? "right-0 pr-1" : "left-0 pl-1"
    }`}
  >
    {side === "left" ? (
      <ChevronRight className="size-4 text-white/80" />
    ) : (
      <ChevronLeft className="size-4 text-white/80" />
    )}
  </div>
);

export interface PipWindowProps {
  /** Color of the speaking indicator bars. */
  accent?: string;
  /** Spring bounce of the corner snap; tucking is a touch firmer, untucking a touch livelier. */
  bounce?: number;
  /** Corner the window starts in. Read on mount only. */
  defaultCorner?: PipCorner;
  /** Spring duration of the corner snap, in seconds. */
  duration?: number;
  /** Instruction line under the call bar. Empty hides it. */
  hint?: string;
  /** Avatar initials. */
  initials?: string;
  /** Gap between the window and the screen edges, in px. */
  margin?: number;
  /** Seconds of release velocity projected forward to pick the landing spot. */
  momentum?: number;
  /** Caller name in the window's caption. */
  name?: string;
  /** Width of the tab left on screen when tucked, in px. */
  peek?: number;
  /** Clay color of the phone shell. */
  tone?: ClayTone;
  /** Whether throwing the window off a side edge tucks it. */
  tuck?: boolean;
  /** Window width in px; height follows at 3:2. */
  width?: number;
}

export const PipWindow = ({
  accent = "#00d492",
  bounce = 0.32,
  defaultCorner = "bottom-right",
  duration = 0.55,
  hint = "Flick the call window · throw it off an edge to tuck it",
  initials = "NV",
  margin = 14,
  momentum = 0.18,
  name = "Nova",
  peek = 26,
  tone = "teal",
  tuck = true,
  width = 150,
}: PipWindowProps) => {
  const controls = useAnimation();

  const [placement, setPlacement] = useState<Placement>({
    corner: defaultCorner,
    type: "corner",
  });

  const reduced = useReducedMotion() ?? false;
  const geometry = measure(width, margin, peek);
  const tucked = tuck && placement.type === "edge" && placement.tucked ? placement.side : null;

  useEffect(() => {
    void controls.start({
      ...resolve(placement, measure(width, margin, peek), tuck),
      transition: reduced ? { duration: 0 } : springFor(placement, bounce, duration),
    });
  }, [bounce, controls, duration, margin, peek, placement, reduced, tuck, width]);

  const settle = (offset: Vector, velocity: Vector) => {
    setPlacement(
      land({ current: placement, defaultCorner, geometry, momentum, offset, tuck, velocity }),
    );
  };

  const untuck = () => {
    if (placement.type === "edge" && tucked) {
      setPlacement({ ...placement, tucked: false });
    }
  };

  return (
    <PhoneFrame className="bg-[#0b1516]" tone={tone}>
      <div className="px-5 pt-[60px]">
        <p className="text-[24px] font-bold text-white">Notes</p>
        <div className="mt-4 space-y-2.5">
          {NOTES.map(([title, body]) => (
            <div key={title} className="rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/[0.05]">
              <p className="text-[13px] font-semibold text-white/90">{title}</p>
              <p className="mt-0.5 text-[12px] text-white/40">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.12}
        initial={resolve(placement, geometry, tuck)}
        animate={controls}
        onDragEnd={(_, info) => {
          settle(info.offset, info.velocity);
        }}
        onClick={untuck}
        style={{ height: geometry.height, width: geometry.width }}
        className="absolute top-0 left-0 cursor-grab overflow-hidden rounded-2xl shadow-2xl shadow-black/70 ring-1 ring-white/20 active:cursor-grabbing"
      >
        <CallTile
          accent={accent}
          avatar={Math.round(geometry.height * 0.48)}
          initials={initials}
          name={name}
          reduced={reduced}
        />
        {tucked && <TuckTab side={tucked} />}
      </motion.div>

      {hint && (
        <p className="pointer-events-none absolute inset-x-0 bottom-6 truncate px-6 text-center text-[11px] text-white/30">
          {hint}
        </p>
      )}

      <div className="pointer-events-none absolute inset-x-16 bottom-12 flex items-center justify-center gap-4 rounded-full bg-white/[0.07] py-2.5 backdrop-blur-md ring-1 ring-white/10">
        <Mic className="size-4 text-white/70" />
        <Video className="size-4 text-white/70" />
        <span className="size-4 rounded-full bg-red-500" />
      </div>
    </PhoneFrame>
  );
};
