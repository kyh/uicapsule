"use client";

import { useCallback, useRef, useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type Item = {
  id: string;
  name: string;
  price: string;
  hue: number;
  result: string;
};

const ITEMS: Item[] = [
  {
    id: "lamp",
    name: "Arc lamp",
    price: "$249",
    hue: 38,
    result: "Arne floor lamp · from $219 at 4 stores",
  },
  {
    id: "chair",
    name: "Lounge chair",
    price: "$1,190",
    hue: 20,
    result: "Teak lounge chair · $980–$1,320",
  },
  {
    id: "vase",
    name: "Stone vase",
    price: "$89",
    hue: 150,
    result: "Travertine vase · $74 at 9 stores",
  },
  { id: "rug", name: "Wool rug", price: "$430", hue: 260, result: "Berber wool rug · from $389" },
];

type Point = { x: number; y: number };

export const CircleToSearch = () => {
  const [searchMode, setSearchMode] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [match, setMatch] = useState<Item | null>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<Point[]>([]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  const localPoint = (clientX: number, clientY: number): Point | null => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const finishDraw = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const drawn = pointsRef.current;
    if (drawn.length < 8) {
      pointsRef.current = [];
      setPoints([]);
      return;
    }
    const cx = drawn.reduce((sum, p) => sum + p.x, 0) / drawn.length;
    const cy = drawn.reduce((sum, p) => sum + p.y, 0) / drawn.length;
    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!stageRect) return;
    for (const item of ITEMS) {
      const node = cardRefs.current.get(item.id);
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      const left = rect.left - stageRect.left;
      const top = rect.top - stageRect.top;
      if (cx >= left && cx <= left + rect.width && cy >= top && cy <= top + rect.height) {
        setMatch(item);
        break;
      }
    }
  }, []);

  const reset = useCallback(() => {
    setSearchMode(false);
    pointsRef.current = [];
    setPoints([]);
    setMatch(null);
  }, []);

  return (
    <div
      ref={stageRef}
      className="relative h-[620px] w-[340px] overflow-hidden rounded-[44px] bg-[#101116] shadow-2xl shadow-black/60 ring-8 ring-black select-none"
    >
      {/* Shop content */}
      <div className="px-5 pt-12">
        <p className="text-[20px] font-bold text-white">Autumn lookbook</p>
        <p className="text-[12px] text-white/40">Editorial · 12 pieces</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {ITEMS.map((item) => (
            <div
              key={item.id}
              ref={(node) => {
                if (node) cardRefs.current.set(item.id, node);
                else cardRefs.current.delete(item.id);
              }}
              className="overflow-hidden rounded-2xl ring-1 ring-white/[0.07] transition-shadow"
              style={
                match?.id === item.id
                  ? { boxShadow: "0 0 0 3px #a5b4fc, 0 8px 40px rgba(129,140,248,0.35)" }
                  : undefined
              }
            >
              <div
                className="h-24"
                style={{
                  background: `linear-gradient(135deg, hsl(${item.hue} 35% 45%), hsl(${item.hue} 45% 22%))`,
                }}
              />
              <div className="bg-white/[0.04] px-3 py-2">
                <p className="text-[12px] font-semibold text-white">{item.name}</p>
                <p className="text-[11px] text-white/40">{item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search-mode dim + shimmer border */}
      <AnimatePresence>
        {searchMode && (
          <motion.div
            key="mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute inset-0 bg-black/35" />
            <motion.div
              aria-hidden
              className="absolute inset-0 rounded-[36px] ring-2 ring-indigo-300/70"
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawing layer */}
      {searchMode && (
        <div
          className="absolute inset-0 z-20 cursor-crosshair touch-none"
          onPointerDown={(event) => {
            if (match) return;
            drawingRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            const point = localPoint(event.clientX, event.clientY);
            if (point) {
              pointsRef.current = [point];
              setPoints([point]);
            }
          }}
          onPointerMove={(event) => {
            if (!drawingRef.current) return;
            const point = localPoint(event.clientX, event.clientY);
            if (point) {
              pointsRef.current = [...pointsRef.current, point];
              setPoints(pointsRef.current);
            }
          }}
          onPointerUp={finishDraw}
          onPointerCancel={finishDraw}
        >
          <svg className="absolute inset-0 size-full">
            <defs>
              <linearGradient id="cts-stroke" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" />
                <stop offset="50%" stopColor="#f0abfc" />
                <stop offset="100%" stopColor="#67e8f9" />
              </linearGradient>
            </defs>
            {points.length > 1 && (
              <polyline
                points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="url(#cts-stroke)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.95"
                style={{ filter: "drop-shadow(0 0 10px rgba(165,180,252,0.8))" }}
              />
            )}
          </svg>
        </div>
      )}

      {/* Result sheet */}
      <AnimatePresence>
        {match && (
          <motion.div
            key="sheet"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.18 }}
            className="absolute inset-x-3 bottom-3 z-30 rounded-[26px] bg-[#1d1e26]/95 p-4 shadow-2xl shadow-black/60 ring-1 ring-white/10 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 text-[11px] font-medium text-indigo-300">
              <Sparkles className="size-3.5" /> Circle to Search
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <div
                className="size-12 shrink-0 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, hsl(${match.hue} 35% 45%), hsl(${match.hue} 45% 22%))`,
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white">{match.result}</p>
                <p className="mt-0.5 text-[11px] text-white/40">Visual match · {match.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-3 w-full rounded-full bg-indigo-400/90 py-2 text-[12px] font-semibold text-indigo-950 transition-colors hover:bg-indigo-300"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Home pill trigger */}
      <div className="absolute inset-x-0 bottom-3 z-40 flex justify-center">
        <motion.button
          type="button"
          aria-pressed={searchMode}
          onClick={() => (searchMode ? reset() : setSearchMode(true))}
          whileTap={{ scale: 0.9 }}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium ring-1 backdrop-blur-md transition-colors ${
            searchMode
              ? "bg-indigo-400/20 text-indigo-200 ring-indigo-300/40"
              : "bg-white/10 text-white/70 ring-white/15"
          }`}
        >
          {searchMode ? <X className="size-3.5" /> : <Search className="size-3.5" />}
          {searchMode ? "Exit search" : "Hold to search"}
        </motion.button>
      </div>

      {searchMode && !match && (
        <p className="pointer-events-none absolute inset-x-0 top-[46px] z-20 text-center text-[12px] font-medium text-indigo-200/90">
          Circle anything
        </p>
      )}
    </div>
  );
};
