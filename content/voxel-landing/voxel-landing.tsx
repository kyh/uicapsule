"use client";

import { useEffect, useRef, useState } from "react";

// 5x5 pixel font — only the glyphs the sections need.
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

const SECTION_GAP = 60;
const SECTIONS = [
  { word: "VOXEL", accent: ACCENTS[0] },
  { word: "BUILD", accent: ACCENTS[1] },
  { word: "STACK", accent: ACCENTS[2] },
  { word: "SHIP", accent: ACCENTS[3] },
  { word: "START", accent: ACCENTS[0] },
] as const;
const WORLD_LEN = SECTION_GAP * (SECTIONS.length - 1);

const TILE = 13; // iso half-width of a unit cube, in px
const GRASS = ["#2c7a33", "#3fa945", "#57b85e"] as const;

// Deterministic randomness — every load (and recording) is identical.
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

type Kind = "static" | "sign" | "road";

type Voxel = {
  x: number; // world tiles, camera travels +x
  y: number; // up, in tiles
  z: number; // depth across the corridor
  size: number; // horizontal scale (1 = full tile)
  h: number; // vertical scale
  color: string;
  alpha: number;
  kind: Kind;
  section: number; // for sign marquee cells
  seed: number;
};

const vox = (partial: Partial<Voxel> & Pick<Voxel, "x" | "y" | "z" | "color">): Voxel => ({
  size: 1,
  h: 1,
  alpha: 1,
  kind: "static",
  section: -1,
  seed: 0,
  ...partial,
});

// Upright marquee sign: hollow dark frame + floating glyph cells, facing the camera.
const buildSign = (out: Voxel[], word: string, cx: number, section: number) => {
  const cols = word.length * 6 - 1;
  const half = Math.floor(cols / 2) + 2;
  const zs = -8;
  for (let x = -half; x <= half; x++) {
    out.push(vox({ x: cx + x, y: 1, z: zs, color: "#33363b" }));
    out.push(vox({ x: cx + x, y: 9, z: zs, color: "#33363b" }));
  }
  for (let y = 2; y <= 8; y++) {
    out.push(vox({ x: cx - half, y, z: zs, color: "#33363b" }));
    out.push(vox({ x: cx + half, y, z: zs, color: "#33363b" }));
  }
  word.split("").forEach((ch, li) => {
    const glyph = FONT[ch];
    if (!glyph) return;
    glyph.forEach((row, gy) => {
      row.split("").forEach((cell, gx) => {
        if (cell !== "#") return;
        const x = cx + li * 6 + gx - cols / 2;
        out.push(
          vox({ x, y: 7 - gy, z: zs, color: "#62666c", kind: "sign", section, seed: out.length }),
        );
      });
    });
  });
};

// Word laid flat on the ground plane, rows running along z.
const buildFlatWord = (out: Voxel[], word: string, cx: number, cz: number, accent: string) => {
  const cols = word.length * 6 - 1;
  word.split("").forEach((ch, li) => {
    const glyph = FONT[ch];
    if (!glyph) return;
    glyph.forEach((row, gz) => {
      row.split("").forEach((cell, gx) => {
        if (cell !== "#") return;
        const seed = out.length;
        out.push(
          vox({
            x: cx + li * 6 + gx - cols / 2,
            y: 0,
            z: cz + gz,
            h: 0.35,
            color: hash(seed * 3.7) < 0.09 ? accent : "#8b9096",
            seed,
          }),
        );
      });
    });
  });
};

const buildTree = (out: Voxel[], x: number, z: number, seed: number) => {
  out.push(vox({ x, y: 0, z, size: 0.5, color: "#7a5a3a" }));
  out.push(vox({ x, y: 1, z, size: 0.5, color: "#7a5a3a" }));
  const canopy: [number, number, number][] = [
    [0, 2, 0],
    [1, 2, 0],
    [-1, 2, 0],
    [0, 2, 1],
    [0, 2, -1],
    [0, 3, 0],
  ];
  canopy.forEach(([dx, dy, dz], i) => {
    out.push(vox({ x: x + dx, y: dy, z: z + dz, color: GRASS[(i + seed) % 3] }));
  });
};

const buildWorld = (): Voxel[] => {
  const out: Voxel[] = [];

  buildSign(out, "VOXEL", 0, 0);
  buildSign(out, "START", WORLD_LEN, 4);

  buildFlatWord(out, "BUILD", SECTION_GAP, 9, ACCENTS[1]);
  buildFlatWord(out, "STACK", SECTION_GAP * 2, 9, ACCENTS[2]);
  buildFlatWord(out, "SHIP", SECTION_GAP * 3, 9, ACCENTS[3]);

  // BUILD: a grove behind the word.
  buildTree(out, SECTION_GAP - 12, -11, 0);
  buildTree(out, SECTION_GAP - 2, -14, 1);
  buildTree(out, SECTION_GAP + 9, -10, 2);
  buildTree(out, SECTION_GAP + 16, -13, 0);

  // STACK: a bar-chart skyline of cube towers.
  for (let i = 0; i < 12; i++) {
    const tx = SECTION_GAP * 2 + Math.floor((hash(i * 7.9) - 0.5) * 30);
    const tz = -8 - Math.floor(hash(i * 3.3) * 8);
    const height = 2 + Math.floor(hash(i * 5.1) * 5);
    for (let y = 0; y < height; y++) {
      const topmost = y === height - 1;
      out.push(
        vox({
          x: tx,
          y,
          z: tz,
          color: topmost ? ACCENTS[i % 4] : y % 2 === 0 ? "#5a5f66" : "#6b7076",
        }),
      );
    }
  }

  // SHIP: pond of flat water tiles.
  for (let dx = -8; dx <= 8; dx++) {
    for (let dz = -5; dz <= 5; dz++) {
      if ((dx / 8) ** 2 + (dz / 5) ** 2 > 1) continue;
      const seed = out.length;
      out.push(
        vox({
          x: SECTION_GAP * 3 + dx,
          y: 0,
          z: -10 + dz,
          h: 0.18,
          color: hash(seed * 2.1) < 0.15 ? "#4a9de0" : "#3186d4",
          seed,
        }),
      );
    }
  }

  // Winding dash-road tying the whole strip together.
  for (let x = -14; x <= WORLD_LEN + 14; x++) {
    if (hash(x * 9.7) < 0.3) continue;
    const z = Math.round(Math.sin(x * 0.16) * 4);
    out.push(
      vox({ x, y: 0, z, size: 0.6, h: 0.12, color: "#4a9de0", kind: "road", seed: x }),
    );
  }

  // Flag poles along the road.
  for (let i = 0; i < 14; i++) {
    const px = Math.floor(hash(i * 13.7) * (WORLD_LEN + 20)) - 10;
    const pz = Math.round(Math.sin(px * 0.16) * 4) + (hash(i * 3.9) < 0.5 ? 3 : -3);
    out.push(vox({ x: px, y: 0, z: pz, size: 0.22, h: 3, color: "#7d838a" }));
    out.push(vox({ x: px, y: 3, z: pz, size: 0.5, color: ACCENTS[i % 4] }));
  }

  // Flora scattered across the whole corridor.
  for (let i = 0; i < 260; i++) {
    const fx = Math.floor(hash(i * 17.3) * (WORLD_LEN + 36)) - 18;
    const fz = Math.floor((hash(i * 23.1) - 0.5) * 34);
    const roll = hash(i * 5.9);
    if (roll < 0.72) {
      out.push(vox({ x: fx, y: 0, z: fz, size: 0.4, h: 0.5, color: GRASS[i % 3] }));
    } else {
      out.push(vox({ x: fx, y: 0, z: fz, size: 0.16, h: 1, color: "#3fa945" }));
      out.push(vox({ x: fx, y: 1, z: fz, size: 0.34, color: ACCENTS[i % 4] }));
    }
  }

  return out;
};

// Walkers wander around a home point; position is a pure function of time.
type Walker = { home: [number, number]; radius: number; body: string; id: number };

const buildWalkers = (): Walker[] => {
  const walkers: Walker[] = [];
  const add = (hx: number, hz: number, radius: number) => {
    walkers.push({
      home: [hx, hz],
      radius,
      body: ACCENTS[walkers.length % 4],
      id: walkers.length,
    });
  };
  for (let i = 0; i < 5; i++) add(Math.floor(hash(i * 3.1) * 24) - 12, 4 + i * 2, 5);
  add(SECTION_GAP - 8, 2, 6);
  add(SECTION_GAP + 6, 16, 6);
  add(SECTION_GAP * 2 + 4, 3, 6);
  add(SECTION_GAP * 2 - 10, 17, 5);
  add(SECTION_GAP * 3 - 6, 2, 5);
  add(SECTION_GAP * 3 + 8, 16, 5);
  for (let i = 0; i < 9; i++) {
    add(WORLD_LEN + Math.floor(hash(i * 7.7) * 22) - 11, 2 + Math.floor(hash(i * 4.3) * 10), 4);
  }
  return walkers;
};

const walkerPos = (w: Walker, t: number): [number, number, boolean] => {
  const epoch = Math.floor(t / 2.6 + hash(w.id * 31.7));
  const frac = (t / 2.6 + hash(w.id * 31.7)) % 1;
  const wp = (k: number): [number, number] => [
    w.home[0] + (hash(w.id * 91.3 + k * 17.1) - 0.5) * 2 * w.radius,
    w.home[1] + (hash(w.id * 47.9 + k * 29.3) - 0.5) * 2 * w.radius,
  ];
  const [ax, az] = wp(epoch);
  const [bx, bz] = wp(epoch + 1);
  const ease = frac < 0.7 ? frac / 0.7 : 1; // walk, then idle at the waypoint
  const x = Math.round((ax + (bx - ax) * ease) * 2) / 2;
  const z = Math.round((az + (bz - az) * ease) * 2) / 2;
  return [x, z, frac < 0.7];
};

type VoxelLandingProps = {
  autoTour?: boolean;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Auto-tour keyframes: [time, scroll]. Holds at each section, long hold on START, rewind.
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

export const VoxelLanding = ({ autoTour = true }: VoxelLandingProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const world = buildWorld();
    const walkers = buildWalkers();
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
    let tourOffset = 0;
    let pausedAt: number | null = null;
    let raf = 0;
    let last = 0;
    let shownSection = 0;
    let shownMoved = false;
    const start = performance.now();

    const hw = TILE;
    const hh = TILE * 0.5;
    const vy = TILE * 1.05;

    type Drawable = {
      depth: number;
      sx: number;
      sy: number;
      size: number;
      h: number;
      color: string;
      alpha: number;
    };

    const frame = (nowMs: number) => {
      raf = requestAnimationFrame(frame);
      if (nowMs - last < 1000 / 30) return;
      last = nowMs;
      const now = reducedMotion ? 0 : (nowMs - start) / 1000;

      if (autoTour && !reducedMotion) {
        if ((nowMs - start) / 1000 - lastInput < 4) {
          if (pausedAt === null) pausedAt = (nowMs - start) / 1000;
        } else {
          if (pausedAt !== null) {
            tourOffset += (nowMs - start) / 1000 - pausedAt;
            pausedAt = null;
          }
          target = tourScroll((nowMs - start) / 1000 - tourOffset);
        }
      }

      scroll += (target - scroll) * 0.09;
      const camX = scroll * WORLD_LEN;
      // Camera anchor: keep world point (camX, 0, 0) at a fixed screen spot.
      const offX = width / 2 - camX * TILE;
      const offY = height * 0.52 - camX * TILE * 0.5;

      ctx.fillStyle = dotPattern ?? "#0f1114";
      ctx.fillRect(0, 0, width, height);

      const nearest = Math.round(scroll * (SECTIONS.length - 1));
      if (nearest !== shownSection) {
        shownSection = nearest;
        setSectionIdx(nearest);
      }
      if (!shownMoved && scroll > 0.02) {
        shownMoved = true;
        setMoved(true);
      }

      const pulsePhase = Math.floor(now * 2.5);
      const atFinale = nearest === SECTIONS.length - 1 && Math.abs(scroll - 1) < 0.02;
      const tick = Math.floor(now / 0.16);

      const drawables: Drawable[] = [];
      const push = (
        x: number,
        y: number,
        z: number,
        size: number,
        h: number,
        color: string,
        alpha: number,
      ) => {
        const sx = (x - z) * TILE + offX;
        const sy = (x + z) * hh + offY - y * vy;
        if (sx < -70 || sx > width + 70 || sy < -90 || sy > height + 90) return;
        drawables.push({ depth: (x + z) * 1000 + y, sx, sy, size, h, color, alpha });
      };

      for (const v of world) {
        let color = v.color;
        let alpha = v.alpha;
        if (v.kind === "sign") {
          const rate = v.section === 4 && atFinale ? 0.34 : 0.16;
          if (hash(v.seed * 13.7 + pulsePhase * 3.3) < rate) {
            color = ACCENTS[Math.floor(hash(v.seed + pulsePhase) * 4)]!;
          }
        } else if (v.kind === "road") {
          alpha = 0.35 + 0.65 * hash(v.seed * 7.1 + Math.floor(now * 3.2));
        }
        push(v.x, v.y, v.z, v.size, v.h, color, alpha);
      }

      // Walkers: legs alternate, tiny bob, everything snapped to half tiles.
      for (const w of walkers) {
        const [wx, wz, walking] = walkerPos(w, now);
        const step = walking && (tick + w.id) % 2 === 0;
        const bob = step ? 0.12 : 0;
        push(wx, 0, wz, 0.42, step ? 0.85 : 1, "#23304a", 1);
        push(wx, 1 + bob, wz, 0.62, 1, w.body, 1);
        push(wx, 2 + bob, wz, 0.5, 0.9, "#dcc9a0", 1);
      }

      // Birds crossing the corridor.
      for (let i = 0; i < 5; i++) {
        const bx = 20 + hash(i * 19.3) * (WORLD_LEN - 20);
        const bz = ((now * 2.4 + hash(i * 7.7) * 40) % 44) - 22;
        const flap = (tick + i) % 2 === 0;
        push(bx, 6, bz, 0.42, 0.5, "#e8ecef", 1);
        push(bx + (flap ? 0.5 : -0.5), 6.2, bz, 0.3, 0.35, "#c9ced3", 1);
      }

      // Clouds drifting high above.
      for (let i = 0; i < 7; i++) {
        const cx = ((hash(i * 11.1) * (WORLD_LEN + 60) + now * 0.5) % (WORLD_LEN + 60)) - 20;
        const cz = (hash(i * 5.3) - 0.5) * 26;
        const qx = Math.round(cx * 4) / 4;
        for (let p = 0; p < 4; p++) {
          push(qx + p - 1.5, 8 + (p % 2) * 0.3, cz + (p > 1 ? 0.8 : 0), 0.8, 0.7, "#e8ecef", 0.92);
        }
      }

      drawables.sort((a, b) => a.depth - b.depth);

      for (const d of drawables) {
        const w2 = hw * d.size;
        const h2 = hh * d.size;
        const v2 = vy * d.h;
        ctx.globalAlpha = d.alpha;
        // top
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.moveTo(d.sx, d.sy - h2);
        ctx.lineTo(d.sx + w2, d.sy);
        ctx.lineTo(d.sx, d.sy + h2);
        ctx.lineTo(d.sx - w2, d.sy);
        ctx.closePath();
        ctx.fill();
        // left
        ctx.fillStyle = shade(d.color, 0.62);
        ctx.beginPath();
        ctx.moveTo(d.sx - w2, d.sy);
        ctx.lineTo(d.sx, d.sy + h2);
        ctx.lineTo(d.sx, d.sy + h2 + v2);
        ctx.lineTo(d.sx - w2, d.sy + v2);
        ctx.closePath();
        ctx.fill();
        // right
        ctx.fillStyle = shade(d.color, 0.4);
        ctx.beginPath();
        ctx.moveTo(d.sx + w2, d.sy);
        ctx.lineTo(d.sx, d.sy + h2);
        ctx.lineTo(d.sx, d.sy + h2 + v2);
        ctx.lineTo(d.sx + w2, d.sy + v2);
        ctx.closePath();
        ctx.fill();
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

  const accent = SECTIONS[sectionIdx]?.accent ?? ACCENTS[0];

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
          STN 0{sectionIdx + 1} / 0{SECTIONS.length}
        </div>

        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {SECTIONS.map((section, i) => (
            <span
              key={section.word}
              className="size-2 border border-neutral-700 transition-colors duration-300"
              style={i === sectionIdx ? { backgroundColor: accent, borderColor: accent } : undefined}
            />
          ))}
        </div>

        <div className="absolute bottom-5 right-6 text-[10px] tracking-[0.3em] text-neutral-600">
          {SECTIONS[sectionIdx]?.word}
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
