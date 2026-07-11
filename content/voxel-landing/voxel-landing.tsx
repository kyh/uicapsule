"use client";

import { useEffect, useRef, useState } from "react";

// 5x5 pixel font — only the glyphs the stations need.
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#####", "#...#", "#...#"],
  B: ["####.", "#...#", "####.", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "####.", "#....", "#####"],
  H: ["#...#", "#...#", "#####", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "#####"],
  K: ["#...#", "#..#.", "###..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#####"],
  O: [".###.", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "####.", "#....", "#...."],
  R: ["####.", "#...#", "####.", "#..#.", "#...#"],
  S: [".####", "#....", ".###.", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", ".#.#.", "..#.."],
  X: ["#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
};

const ACCENTS = ["#e23d2e", "#f0b429", "#3fa945", "#3186d4"] as const;

type Station = {
  word: string;
  accent: string;
  z: number;
};

const STATION_GAP = 70;
const STATIONS: Station[] = [
  { word: "VOXEL", accent: ACCENTS[0], z: 0 },
  { word: "BUILD", accent: ACCENTS[1], z: STATION_GAP },
  { word: "STACK", accent: ACCENTS[2], z: STATION_GAP * 2 },
  { word: "SHIP", accent: ACCENTS[3], z: STATION_GAP * 3 },
  { word: "START", accent: ACCENTS[0], z: STATION_GAP * 4 },
];

const VIEW_DIST = 45; // camera-to-station distance when a station is "arrived at"
const TRACK = STATIONS[STATIONS.length - 1]!.z; // camZ travels [-VIEW_DIST, TRACK - VIEW_DIST]

const GRAYS = ["#c9ced3", "#b3bac1", "#d8dce0"] as const;
const QUANT_STEPS = 6; // assembly/scatter animate in chunky steps, not smoothly

// Deterministic per-voxel randomness so every load (and recording) is identical.
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const shadeCache = new Map<string, string>();
const shade = (hex: string, factor: number) => {
  const key = `${hex}:${factor}`;
  const cached = shadeCache.get(key);
  if (cached) return cached;
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  const out = `rgb(${r},${g},${b})`;
  shadeCache.set(key, out);
  return out;
};

type Voxel = {
  x: number;
  y: number;
  z: number;
  station: number;
  seed: number;
  accent: boolean;
  scatterX: number;
  scatterY: number;
  dropY: number;
};

const buildStationVoxels = (): Voxel[] => {
  const voxels: Voxel[] = [];
  STATIONS.forEach((station, si) => {
    const cols = station.word.length * 6 - 1;
    station.word.split("").forEach((ch, li) => {
      const glyph = FONT[ch];
      if (!glyph) return;
      glyph.forEach((row, gy) => {
        row.split("").forEach((cell, gx) => {
          if (cell !== "#") return;
          const x = li * 6 + gx - cols / 2;
          const y = gy - 2.5;
          const seed = voxels.length;
          const mag = Math.hypot(x, y) || 1;
          voxels.push({
            x,
            y,
            z: station.z,
            station: si,
            seed,
            accent: hash(seed * 7.3) < 0.14,
            scatterX: (x / mag + (hash(seed * 3.1) - 0.5) * 1.6) * 30,
            scatterY: (y / mag + (hash(seed * 5.7) - 0.5) * 1.6) * 30,
            dropY: -(16 + hash(seed * 2.3) * 14),
          });
        });
      });
    });
  });
  return voxels;
};

type Confetto = {
  x: number;
  y: number;
  z: number;
  color: string;
  seed: number;
};

const buildConfetti = (): Confetto[] => {
  const out: Confetto[] = [];
  for (let i = 0; i < 70; i++) {
    const colorRoll = hash(i * 11.3);
    out.push({
      x: (hash(i * 1.7) - 0.5) * 90,
      y: (hash(i * 2.9) - 0.5) * 50,
      z: hash(i * 4.3) * (TRACK + 60) - 25,
      color: colorRoll < 0.55 ? ACCENTS[Math.floor(colorRoll * 20) % 4]! : GRAYS[1],
      seed: i,
    });
  }
  return out;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const quantize = (v: number) => Math.floor(clamp01(v) * QUANT_STEPS) / QUANT_STEPS;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Auto-tour keyframes: [time, scroll]. Holds at each station, long hold on START, rewind.
const TOUR: [number, number][] = [
  [0, 0],
  [2.8, 0],
  [4.6, 0.25],
  [5.6, 0.25],
  [7.4, 0.5],
  [8.4, 0.5],
  [10.2, 0.75],
  [11.2, 0.75],
  [13.0, 1],
  [17.5, 1],
  [19.5, 0],
  [21.0, 0],
];
const TOUR_LENGTH = TOUR[TOUR.length - 1]![0];

const tourScroll = (t: number) => {
  const cycle = t % TOUR_LENGTH;
  for (let i = 1; i < TOUR.length; i++) {
    const [t1, s1] = TOUR[i]!;
    const [t0, s0] = TOUR[i - 1]!;
    if (cycle <= t1) {
      const span = t1 - t0;
      const p = span > 0 ? (cycle - t0) / span : 1;
      return s0 + (s1 - s0) * easeInOut(p);
    }
  }
  return 0;
};

type VoxelLandingProps = {
  autoTour?: boolean;
};

export const VoxelLanding = ({ autoTour = true }: VoxelLandingProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stationIdx, setStationIdx] = useState(0);
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const voxels = buildStationVoxels();
    const confetti = buildConfetti();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dotPattern: CanvasPattern | null = null;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const tile = document.createElement("canvas");
      tile.width = 18;
      tile.height = 18;
      const tileCtx = tile.getContext("2d");
      if (tileCtx) {
        tileCtx.fillStyle = "#0f1114";
        tileCtx.fillRect(0, 0, 18, 18);
        tileCtx.fillStyle = "#1a1d21";
        tileCtx.fillRect(8, 8, 2, 2);
        dotPattern = ctx.createPattern(tile, "repeat");
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let scroll = 0;
    let target = 0;
    let lastInput = -Infinity;
    let tourOffset = 0; // keeps the tour resumable after manual input
    let pausedAt: number | null = null;
    const triggers: (number | null)[] = STATIONS.map(() => null);
    let raf = 0;
    let last = 0;
    let shownStation = 0;
    let shownMoved = false;
    const start = performance.now();

    const frame = (nowMs: number) => {
      raf = requestAnimationFrame(frame);
      if (nowMs - last < 1000 / 30) return;
      last = nowMs;
      const now = (nowMs - start) / 1000;

      // Auto-tour drives the scroll target unless the user recently intervened.
      if (autoTour && !reducedMotion) {
        if (now - lastInput < 4) {
          if (pausedAt === null) pausedAt = now;
        } else {
          if (pausedAt !== null) {
            tourOffset += now - pausedAt;
            pausedAt = null;
          }
          target = tourScroll(now - tourOffset);
        }
      }

      scroll += (target - scroll) * 0.09;
      const camZ = -VIEW_DIST + scroll * TRACK;
      const focal = width * 0.95;
      const cx = width / 2;
      const cy = height / 2;

      ctx.fillStyle = dotPattern ?? "#0f1114";
      ctx.fillRect(0, 0, width, height);

      const nearest = Math.round(scroll * (STATIONS.length - 1));
      if (nearest !== shownStation) {
        shownStation = nearest;
        setStationIdx(nearest);
      }
      if (!shownMoved && scroll > 0.02) {
        shownMoved = true;
        setMoved(true);
      }

      // Arm/reset per-station assembly timers based on camera proximity.
      STATIONS.forEach((station, si) => {
        const d = station.z - camZ;
        if (d > -20 && d < 110 && triggers[si] === null) triggers[si] = now;
        if ((d >= 130 || d <= -25) && triggers[si] !== null) triggers[si] = null;
      });

      const pulsePhase = Math.floor(now * 2.5);
      const atFinale = nearest === STATIONS.length - 1 && Math.abs(scroll - 1) < 0.02;

      type Drawable = {
        x: number;
        y: number;
        z: number;
        size: number;
        color: string;
        alpha: number;
      };
      const drawables: Drawable[] = [];

      for (const c of confetti) {
        const twinkle = 0.25 + 0.55 * Math.abs(Math.sin(now * 0.8 + c.seed * 2.1));
        drawables.push({ x: c.x, y: c.y, z: c.z, size: 0.5, color: c.color, alpha: twinkle });
      }

      for (const v of voxels) {
        const station = STATIONS[v.station]!;
        const d = station.z - camZ;
        if (d <= 0.4 || d > 130) continue;

        const t0 = triggers[v.station];
        const stagger = hash(v.seed * 9.1) * 0.9;
        const timeP = t0 === null || reducedMotion ? 1 : clamp01((now - t0 - stagger) / 1.1);
        const proxP = clamp01((110 - d) / 45);
        const assembleQ = quantize(Math.min(timeP, proxP));
        if (assembleQ <= 0) continue;

        const scatterQ = quantize((22 - d) / 18);
        const x = v.x + v.scatterX * scatterQ * scatterQ;
        const y = v.y + v.dropY * (1 - assembleQ) + v.scatterY * scatterQ * scatterQ;
        const alpha = assembleQ * (1 - clamp01((scatterQ - 0.5) * 2.2));
        if (alpha <= 0.01) continue;

        let color: string = v.accent ? station.accent : GRAYS[Math.floor(hash(v.seed * 4.7) * 3)]!;
        if (atFinale && v.station === STATIONS.length - 1) {
          const lit = hash(v.seed * 13.7 + pulsePhase * 3.3) < 0.3;
          if (lit) color = ACCENTS[Math.floor(hash(v.seed + pulsePhase) * 4)]!;
        }

        drawables.push({ x, y, z: station.z, size: 0.45, color, alpha });
      }

      drawables.sort((a, b) => b.z - a.z);

      for (const item of drawables) {
        const df = item.z - camZ - item.size;
        const db = item.z - camZ + item.size;
        if (df <= 0.3) continue;
        const sf = focal / df;
        const sb = focal / db;
        const fx = cx + item.x * sf;
        const fy = cy + item.y * sf;
        const bx = cx + item.x * sb;
        const by = cy + item.y * sb;
        const hf = item.size * sf;
        const hb = item.size * sb;
        if (fx + hf < 0 || fx - hf > width || fy + hf < 0 || fy - hf > height) continue;
        if (hf < 0.75) continue;

        ctx.globalAlpha = item.alpha;
        const side = shade(item.color, 0.45);
        const top = shade(item.color, 0.7);

        // Side faces first (overdrawn by the front face where hidden).
        ctx.fillStyle = side;
        ctx.beginPath();
        ctx.moveTo(fx - hf, fy - hf);
        ctx.lineTo(bx - hb, by - hb);
        ctx.lineTo(bx - hb, by + hb);
        ctx.lineTo(fx - hf, fy + hf);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(fx + hf, fy - hf);
        ctx.lineTo(bx + hb, by - hb);
        ctx.lineTo(bx + hb, by + hb);
        ctx.lineTo(fx + hf, fy + hf);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = top;
        ctx.beginPath();
        ctx.moveTo(fx - hf, fy - hf);
        ctx.lineTo(bx - hb, by - hb);
        ctx.lineTo(bx + hb, by - hb);
        ctx.lineTo(fx + hf, fy - hf);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(fx - hf, fy + hf);
        ctx.lineTo(bx - hb, by + hb);
        ctx.lineTo(bx + hb, by + hb);
        ctx.lineTo(fx + hf, fy + hf);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = item.color;
        ctx.fillRect(fx - hf, fy - hf, hf * 2, hf * 2);
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(frame);

    const nudge = (delta: number) => {
      target = clamp01(target + delta);
      lastInput = (performance.now() - start) / 1000;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      nudge(e.deltaY * 0.0004);
    };
    container.addEventListener("wheel", onWheel, { passive: false });

    let dragY: number | null = null;
    const onPointerDown = (e: PointerEvent) => {
      dragY = e.clientY;
      container.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (dragY === null) return;
      nudge((dragY - e.clientY) * 0.0016);
      dragY = e.clientY;
    };
    const onPointerUp = () => {
      dragY = null;
    };
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
    };
  }, [autoTour]);

  const accent = STATIONS[stationIdx]?.accent ?? ACCENTS[0];

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none select-none overflow-hidden bg-[#0f1114]"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 font-mono uppercase">
        <div className="absolute left-6 top-5 flex items-center gap-2 text-[11px] font-bold tracking-[0.35em] text-neutral-200">
          <span className="inline-block size-2.5" style={{ backgroundColor: accent }} />
          Voxelworks
        </div>
        <div className="absolute right-6 top-5 text-[10px] tracking-[0.3em] text-neutral-500">
          STN 0{stationIdx + 1} / 0{STATIONS.length}
        </div>

        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {STATIONS.map((station, i) => (
            <span
              key={station.word}
              className="size-2 border border-neutral-700 transition-colors duration-300"
              style={i === stationIdx ? { backgroundColor: accent, borderColor: accent } : undefined}
            />
          ))}
        </div>

        <div className="absolute bottom-5 right-6 text-[10px] tracking-[0.3em] text-neutral-600">
          {STATIONS[stationIdx]?.word}
        </div>

        <div
          className={`absolute bottom-16 left-6 text-[10px] tracking-[0.3em] text-neutral-500 transition-opacity duration-700 ${moved ? "opacity-0" : "animate-pulse opacity-100"}`}
        >
          Scroll ▾
        </div>
      </div>
    </div>
  );
};
