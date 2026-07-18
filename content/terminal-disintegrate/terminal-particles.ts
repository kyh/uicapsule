import type { Grid } from "./terminal-grid";

import { OUTER_COLS, OUTER_ROWS } from "./terminal-grid";

// ---------------------------------------------------------------------------
// Math helpers — all pure and deterministic
// ---------------------------------------------------------------------------

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

export const smoothstep = (t: number): number => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Mulberry32 — seeded, so scrubbing forwards/backwards is identical every time.
export function seededRng(seed: number): () => number {
  let s = seed | 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function curl(seed: number, t: number, axis: number): number {
  const base = seed * 0.0173 + axis * 7.91;
  return Math.sin(base + t * 5.21) * 0.6 + Math.sin(base * 1.6 + t * 11.4) * 0.4;
}

// ---------------------------------------------------------------------------
// Cell pixel sizing — the aspect ratio that makes the grid read as an iPhone
// ---------------------------------------------------------------------------

// A monospace cell is roughly 0.572 as wide as it is tall. Holding that ratio
// is what turns a 50x60 character grid into a phone-shaped object.
export const CELL_ASPECT = 0.572;

export type CellMetrics = {
  cellW: number;
  cellH: number;
  canvasW: number;
  canvasH: number;
};

// Sized against the stage box, not the viewport: the component lives in an
// arbitrarily-sized frame and must never clip its own bezel.
export function cellMetrics(stageW: number, stageH: number): CellMetrics {
  const fitH = (stageH * 0.9) / OUTER_ROWS;
  const fitW = (stageW * 0.92) / (OUTER_COLS * CELL_ASPECT);

  const raw = Math.min(fitH, fitW);
  const cellH = Math.max(2.4, Math.min(16, Math.round(raw * 100) / 100));
  const cellW = Math.round(cellH * CELL_ASPECT * 100) / 100;

  return {
    cellW,
    cellH,
    canvasW: cellW * OUTER_COLS,
    canvasH: cellH * OUTER_ROWS,
  };
}

// ---------------------------------------------------------------------------
// Particles
// ---------------------------------------------------------------------------

export type Particle = {
  char: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  a0: number;
  a1: number;
  begin: number;
  end: number;
  seed: number;
};

export type BuildOpts = {
  cellW: number;
  cellH: number;
  frameX: number;
  frameY: number;
  windDir: number;
  rngSeed: number;
  stageW: number;
  stageH: number;
};

export type RenderOpts = {
  curlAmp: number;
  scorchAmp: number;
};

// Deliberately narrowed to glyphs every monospace fallback ships, so a scorched
// character can never render as a tofu box inside an otherwise perfect grid.
const NOISE = [".", ":", "·", "*", "+", "◦", "▪", "▫", "°"];

// Outgoing — every lit source cell lifts off toward a shared convergence zone
// near the centre of the stage. The wind-facing edge crumbles first.
export function buildOutgoing(grid: Grid, opts: BuildOpts): Particle[] {
  const { cellW, cellH, frameX, frameY, windDir, rngSeed, stageW, stageH } = opts;
  const rng = seededRng(rngSeed);

  const convergeX = stageW * 0.5 + windDir * 60;
  const convergeY = stageH * 0.5;

  const out: Particle[] = [];

  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    if (!row) continue;
    const cols = row.length;

    for (let c = 0; c < cols; c++) {
      const cell = row[c];
      if (!cell || cell.alpha < 0.04 || cell.char === " ") continue;

      const x0 = frameX + c * cellW;
      const y0 = frameY + r * cellH;

      const spreadX = 60 + rng() * 110;
      const spreadY = (rng() - 0.5) * 180;
      const x1 = convergeX + windDir * spreadX * (rng() < 0.5 ? -0.4 : 1);
      const y1 = convergeY + spreadY;

      const colNorm = c / Math.max(1, cols - 1);
      const stagger = windDir > 0 ? (1 - colNorm) * 0.55 : colNorm * 0.55;
      const begin = stagger + rng() * 0.04;
      const duration = 0.28 + rng() * 0.1;

      out.push({
        char: cell.char,
        x0,
        y0,
        x1,
        y1,
        a0: cell.alpha,
        a1: 0,
        begin,
        end: Math.min(0.72, begin + duration),
        seed: Math.floor(rng() * 1e7),
      });
    }
  }

  return out;
}

// Incoming — mirror of outgoing. Spawns in the convergence zone on the
// opposite side of centre so the two clouds pass through each other.
export function buildIncoming(grid: Grid, opts: BuildOpts): Particle[] {
  const { cellW, cellH, frameX, frameY, windDir, rngSeed, stageW, stageH } = opts;
  const rng = seededRng(rngSeed);

  const convergeX = stageW * 0.5 - windDir * 60;
  const convergeY = stageH * 0.5;

  const out: Particle[] = [];

  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    if (!row) continue;
    const cols = row.length;

    for (let c = 0; c < cols; c++) {
      const cell = row[c];
      if (!cell || cell.alpha < 0.04 || cell.char === " ") continue;

      const x1 = frameX + c * cellW;
      const y1 = frameY + r * cellH;

      const spreadX = 60 + rng() * 110;
      const spreadY = (rng() - 0.5) * 180;
      const x0 = convergeX - windDir * spreadX * (rng() < 0.5 ? -0.4 : 1);
      const y0 = convergeY + spreadY;

      const colNorm = c / Math.max(1, cols - 1);
      const stagger = windDir > 0 ? colNorm * 0.5 : (1 - colNorm) * 0.5;
      const begin = 0.35 + stagger + rng() * 0.04;
      const duration = 0.28 + rng() * 0.1;

      out.push({
        char: cell.char,
        x0,
        y0,
        x1,
        y1,
        a0: 0,
        a1: cell.alpha,
        begin,
        end: Math.min(0.96, begin + duration),
        seed: Math.floor(rng() * 1e7),
      });
    }
  }

  return out;
}

// Entrance — every cell spawns in a wide ring around the destination and
// drifts inward. Outer cells settle first, the centre resolves last.
export function buildEntrance(grid: Grid, opts: Omit<BuildOpts, "windDir">): Particle[] {
  const { cellW, cellH, frameX, frameY, rngSeed, stageW, stageH } = opts;
  const rng = seededRng(rngSeed);

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const centerX = frameX + (cols * cellW) / 2;
  const centerY = frameY + (rows * cellH) / 2;
  const maxR = Math.hypot(cols * cellW, rows * cellH) / 2;

  const out: Particle[] = [];

  for (let r = 0; r < rows; r++) {
    const row = grid[r];
    if (!row) continue;

    for (let c = 0; c < cols; c++) {
      const cell = row[c];
      if (!cell || cell.alpha < 0.04 || cell.char === " ") continue;

      const x1 = frameX + c * cellW;
      const y1 = frameY + r * cellH;

      const angle = rng() * Math.PI * 2;
      const distance = Math.min(stageW, stageH) * 0.5 + rng() * 320;
      const burstX = centerX + (rng() - 0.5) * 220;
      const burstY = stageH * 0.5 + (rng() - 0.5) * 180;
      const x0 = burstX + Math.cos(angle) * distance;
      const y0 = burstY + Math.sin(angle) * distance;

      const dx = x1 - centerX;
      const dy = y1 - centerY;
      const distNorm = Math.min(1, Math.hypot(dx, dy) / maxR);
      const stagger = (1 - distNorm) * 0.5 + rng() * 0.1;
      const duration = 0.34 + rng() * 0.16;

      out.push({
        char: cell.char,
        x0,
        y0,
        x1,
        y1,
        a0: 0,
        a1: cell.alpha,
        begin: stagger,
        end: Math.min(0.98, stagger + duration),
        seed: Math.floor(rng() * 1e7),
      });
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Renderers — fillStyle + font are set by the caller before invoking these
// ---------------------------------------------------------------------------

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  frameX: number,
  frameY: number,
  cellW: number,
  cellH: number,
) {
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    if (!row) continue;

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (!cell || cell.char === " " || cell.alpha <= 0) continue;
      ctx.globalAlpha = cell.alpha;
      ctx.fillText(cell.char, frameX + c * cellW, frameY + r * cellH);
    }
  }
  ctx.globalAlpha = 1;
}

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  t: number,
  opts: RenderOpts,
) {
  const { curlAmp, scorchAmp } = opts;

  for (const p of particles) {
    if (t <= p.begin) {
      if (p.a0 > 0) {
        ctx.globalAlpha = p.a0;
        ctx.fillText(p.char, p.x0, p.y0);
      }
      continue;
    }

    if (t >= p.end) {
      if (p.a1 > 0) {
        ctx.globalAlpha = p.a1;
        ctx.fillText(p.char, p.x1, p.y1);
      }
      continue;
    }

    const local = (t - p.begin) / (p.end - p.begin);
    const eased = easeInOutCubic(local);

    const x = lerp(p.x0, p.x1, eased) + curl(p.seed, local, 0) * curlAmp;
    const y = lerp(p.y0, p.y1, eased) + curl(p.seed + 1, local, 1) * curlAmp * 0.7;

    let alpha: number;
    if (p.a1 === 0) {
      const fadeStart = 0.7;
      alpha = local < fadeStart ? p.a0 : p.a0 * (1 - (local - fadeStart) / (1 - fadeStart));
    } else {
      const fadeIn = 0.25;
      alpha = local < fadeIn ? p.a1 * (local / fadeIn) : p.a1;
    }

    // Mid-flight scorch: a bit-mixed per-particle hash decides whether this
    // glyph burns into noise, and only inside its own 0.32-0.72 window.
    let ch = p.char;
    if (scorchAmp > 0 && local > 0.32 && local < 0.72) {
      const pick = (p.seed * 2654435761) >>> 0;
      if (((pick >>> 8) & 0xff) / 255 < scorchAmp) {
        ch = NOISE[(pick + Math.floor(local * 64)) % NOISE.length] ?? p.char;
      }
    }

    ctx.globalAlpha = alpha;
    ctx.fillText(ch, x, y);
  }

  ctx.globalAlpha = 1;
}
