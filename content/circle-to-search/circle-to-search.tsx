"use client";

import { useRef, useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import type { ClayTone } from "./phone-frame";
import { PhoneFrame } from "./phone-frame";

interface Item {
  id: string;
  name: string;
  price: string;
  hue: number;
  result: string;
}

const ITEMS: Item[] = [
  {
    hue: 38,
    id: "lamp",
    name: "Arc lamp",
    price: "$249",
    result: "Arne floor lamp · from $219 at 4 stores",
  },
  {
    hue: 20,
    id: "chair",
    name: "Lounge chair",
    price: "$1,190",
    result: "Teak lounge chair · $980–$1,320",
  },
  {
    hue: 150,
    id: "vase",
    name: "Stone vase",
    price: "$89",
    result: "Travertine vase · $74 at 9 stores",
  },
  { hue: 260, id: "rug", name: "Wool rug", price: "$430", result: "Berber wool rug · from $389" },
];

interface Point {
  x: number;
  y: number;
}

export interface CircleToSearchProps {
  /** Brand color for the edge glow, match outline, labels and the Done button. */
  accent?: string;
  /** Opacity of the scrim over the screen in search mode, 0–1. */
  dim?: number;
  /** Seconds per breath of the screen-edge glow. */
  pulseDuration?: number;
  /** Spring bounce of the results sheet, 0–1. */
  sheetBounce?: number;
  /** Gradient stops of the lasso stroke, start to end. */
  strokeColors?: readonly [string, string, string];
  /** Blur radius in px of the lasso's glow. */
  strokeGlow?: number;
  strokeWidth?: number;
  tone?: ClayTone;
  title?: string;
  subtitle?: string;
  hint?: string;
}

const tint = (color: string, amount: number) => `color-mix(in oklab, ${color} ${amount}%, white)`;

const alpha = (color: string, amount: number) =>
  `color-mix(in srgb, ${color} ${amount}%, transparent)`;

const DEFAULT_STROKE = ["#a5b4fc", "#f0abfc", "#67e8f9"] as const;

const swatch = (hue: number) => `linear-gradient(135deg, hsl(${hue} 35% 45%), hsl(${hue} 45% 22%))`;

interface ScrimProps {
  dim: number;
  glow: string;
  pulseDuration: number;
}

const SearchScrim = ({ dim, glow, pulseDuration }: ScrimProps) => {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-0"
    >
      <div className="absolute inset-0 bg-black" style={{ opacity: dim }} />
      <motion.div
        key={pulseDuration}
        aria-hidden
        className="absolute inset-0 rounded-[50px]"
        style={{
          boxShadow: `inset 0 0 0 2px ${alpha(glow, 70)}, inset 0 0 28px ${alpha(glow, 45)}`,
        }}
        animate={{ opacity: reduceMotion ? 0.7 : [0.4, 0.9, 0.4] }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: pulseDuration, ease: "easeInOut", repeat: Infinity }
        }
      />
    </motion.div>
  );
};

interface LassoProps {
  colors: readonly [string, string, string];
  glow: number;
  points: Point[];
  width: number;
}

const Lasso = ({ colors, glow, points, width }: LassoProps) => (
  <svg className="absolute inset-0 size-full">
    <defs>
      <linearGradient id="cts-stroke" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={colors[0]} />
        <stop offset="50%" stopColor={colors[1]} />
        <stop offset="100%" stopColor={colors[2]} />
      </linearGradient>
    </defs>
    {points.length > 1 && (
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke="url(#cts-stroke)"
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
        style={{
          filter: glow > 0 ? `drop-shadow(0 0 ${glow}px ${alpha(colors[0], 80)})` : undefined,
        }}
      />
    )}
  </svg>
);

interface ResultSheetProps {
  accent: string;
  bounce: number;
  item: Item;
  light: string;
  onDone: () => void;
}

const ResultSheet = ({ accent, bounce, item, light, onDone }: ResultSheetProps) => (
  <motion.div
    initial={{ y: "110%" }}
    animate={{ y: 0 }}
    exit={{ y: "110%" }}
    transition={{ bounce, duration: 0.5, type: "spring" }}
    className="absolute inset-x-3 bottom-[76px] z-30 rounded-[26px] bg-[#211a29]/95 p-4 shadow-2xl shadow-black/60 ring-1 ring-white/10 backdrop-blur-xl"
  >
    <div className="flex items-center gap-2 text-[11px] font-medium" style={{ color: light }}>
      <Sparkles className="size-3.5" /> Circle to Search
    </div>
    <div className="mt-2.5 flex items-center gap-3">
      <div className="size-12 shrink-0 rounded-xl" style={{ background: swatch(item.hue) }} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-white">{item.result}</p>
        <p className="mt-0.5 text-[11px] text-white/40">Visual match · {item.name}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={onDone}
      className="mt-3 w-full rounded-full py-2 text-[12px] font-semibold transition-[filter] hover:brightness-110"
      style={{
        backgroundColor: alpha(accent, 90),
        color: `color-mix(in oklab, ${accent} 30%, black)`,
      }}
    >
      Done
    </button>
  </motion.div>
);

interface SearchToggleProps {
  accent: string;
  active: boolean;
  light: string;
  onToggle: () => void;
}

const SearchToggle = ({ accent, active, light, onToggle }: SearchToggleProps) => (
  <motion.button
    type="button"
    aria-pressed={active}
    onClick={onToggle}
    whileTap={{ scale: 0.9 }}
    className={`flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium backdrop-blur-md transition-colors ${
      active ? "" : "bg-white/10 text-white/70 ring-1 ring-white/15"
    }`}
    style={
      active
        ? {
            backgroundColor: alpha(accent, 20),
            boxShadow: `inset 0 0 0 1px ${alpha(light, 40)}`,
            color: tint(accent, 40),
          }
        : undefined
    }
  >
    {active ? <X className="size-3.5" /> : <Search className="size-3.5" />}
    {active ? "Exit search" : "Tap to search"}
  </motion.button>
);

export const CircleToSearch = ({
  accent = "#7c86ff",
  dim = 0.35,
  pulseDuration = 2,
  sheetBounce = 0.18,
  strokeColors = DEFAULT_STROKE,
  strokeGlow = 10,
  strokeWidth = 5,
  tone = "plum",
  title = "Autumn lookbook",
  subtitle = "Editorial · 12 pieces",
  hint = "Circle anything",
}: CircleToSearchProps) => {
  const light = tint(accent, 60);
  const [searchMode, setSearchMode] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [match, setMatch] = useState<Item | null>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<Point[]>([]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  const localPoint = (clientX: number, clientY: number) => {
    const stage = stageRef.current;

    if (!stage) {
      return null;
    }

    const rect = stage.getBoundingClientRect();
    const scale = rect.width / stage.offsetWidth || 1;

    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  };

  const finishDraw = () => {
    if (!drawingRef.current) {
      return;
    }

    drawingRef.current = false;
    const drawn = pointsRef.current;

    if (drawn.length < 8) {
      pointsRef.current = [];
      setPoints([]);

      return;
    }

    const cx = drawn.reduce((sum, p) => sum + p.x, 0) / drawn.length;
    const cy = drawn.reduce((sum, p) => sum + p.y, 0) / drawn.length;

    for (const item of ITEMS) {
      const node = cardRefs.current.get(item.id);

      if (!node) {
        continue;
      }

      const rect = node.getBoundingClientRect();
      const topLeft = localPoint(rect.left, rect.top);
      const bottomRight = localPoint(rect.right, rect.bottom);

      if (!topLeft || !bottomRight) {
        continue;
      }

      if (cx >= topLeft.x && cx <= bottomRight.x && cy >= topLeft.y && cy <= bottomRight.y) {
        setMatch(item);
        break;
      }
    }
  };

  const reset = () => {
    setSearchMode(false);
    pointsRef.current = [];
    setPoints([]);
    setMatch(null);
  };

  return (
    <PhoneFrame tone={tone} className="bg-[#130f19]">
      <div ref={stageRef} className="absolute inset-0">
        <div className="px-5 pt-[60px]">
          <p className="min-h-[30px] text-[20px] font-bold text-white">{title}</p>
          <p className="min-h-[18px] text-[12px] text-white/40">{subtitle}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {ITEMS.map((item) => (
              <div
                key={item.id}
                ref={(node) => {
                  if (node) {
                    cardRefs.current.set(item.id, node);
                  } else {
                    cardRefs.current.delete(item.id);
                  }
                }}
                className="overflow-hidden rounded-2xl ring-1 ring-white/[0.07] transition-shadow"
                style={
                  match?.id === item.id
                    ? { boxShadow: `0 0 0 3px ${light}, 0 8px 40px ${alpha(accent, 35)}` }
                    : undefined
                }
              >
                <div className="h-[148px]" style={{ background: swatch(item.hue) }} />
                <div className="bg-white/[0.04] px-3 py-2">
                  <p className="text-[12px] font-semibold text-white">{item.name}</p>
                  <p className="text-[11px] text-white/40">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[12px] leading-relaxed text-white/45">
            Warm woods, washed stone and low light — the pieces we keep reaching for once the
            evenings draw in.
          </p>
        </div>

        <AnimatePresence>
          {searchMode && (
            <SearchScrim key="mode" dim={dim} glow={light} pulseDuration={pulseDuration} />
          )}
        </AnimatePresence>

        {searchMode && (
          <div
            className="absolute inset-0 z-20 cursor-crosshair touch-none"
            onPointerDown={(event) => {
              if (match) {
                return;
              }

              drawingRef.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              const point = localPoint(event.clientX, event.clientY);

              if (point) {
                pointsRef.current = [point];
                setPoints([point]);
              }
            }}
            onPointerMove={(event) => {
              if (!drawingRef.current) {
                return;
              }

              const point = localPoint(event.clientX, event.clientY);

              if (point) {
                pointsRef.current = [...pointsRef.current, point];
                setPoints(pointsRef.current);
              }
            }}
            onPointerUp={finishDraw}
            onPointerCancel={finishDraw}
          >
            <Lasso colors={strokeColors} glow={strokeGlow} points={points} width={strokeWidth} />
          </div>
        )}

        <AnimatePresence>
          {match && (
            <ResultSheet
              key="sheet"
              accent={accent}
              bounce={sheetBounce}
              item={match}
              light={light}
              onDone={reset}
            />
          )}
        </AnimatePresence>

        <div className="absolute inset-x-0 bottom-7 z-40 flex justify-center">
          <SearchToggle
            accent={accent}
            active={searchMode}
            light={light}
            onToggle={() => {
              if (searchMode) {
                reset();
              } else {
                setSearchMode(true);
              }
            }}
          />
        </div>

        {searchMode && !match && (
          <p
            className="pointer-events-none absolute inset-x-0 bottom-[84px] z-20 text-center text-[12px] font-medium"
            style={{ color: alpha(tint(accent, 40), 90) }}
          >
            {hint}
          </p>
        )}
      </div>
    </PhoneFrame>
  );
};
