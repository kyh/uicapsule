import type { Photo } from "./photos";

/* ── Grid + tile geometry ─────────────────────────────────────────────── */
export const CELL_H_DESKTOP = 100;
export const CELL_H_MOBILE = 72;
export const CELL_GAP_DESKTOP = 12;
export const CELL_GAP_MOBILE = 8;
/* The wrapping tile is this many viewports across. It only has to exceed the
   frame (each cell renders once, at whichever torus repeat sits nearest the
   frame centre) — the source used 3, trimmed here because the gallery can run
   several previews at once and every cell is a live DOM node. */
export const TILE_SCALE_DESKTOP = 2.4;
export const TILE_SCALE_MOBILE = 2.4;

export const MOBILE_BREAKPOINT = 768;

/* ── Gravity void radii (idle < hover < expanded) ─────────────────────── */
export const VOID_RADIUS_IDLE_DESKTOP = 200;
export const VOID_RADIUS_HOVER_DESKTOP = 280;
export const VOID_RADIUS_EXPANDED_DESKTOP = 420;
export const VOID_RADIUS_IDLE_MOBILE = 130;
export const VOID_RADIUS_HOVER_MOBILE = 180;
export const VOID_RADIUS_EXPANDED_MOBILE = 280;
/* Absolute radii are tuned for a full viewport; the preview frame can be much
   shorter. Cap the clearing so it can never swallow the whole wall. */
export const VOID_RADIUS_CAP_RATIO = 0.4;
export const VOID_RADIUS_CAP_RATIO_EXPANDED = 0.52;

/* ── Physics tuning ───────────────────────────────────────────────────── */
export const VOID_LERP = 0.25;
export const PAN_LERP = 0.07;
export const RADIUS_LERP = 0.07;
export const SOFT_PUSH_RATIO = 1.3;
/* Cells this far outside the frame skip their transform write. Generous
   enough to cover the largest displacement the void can apply. */
export const CULL_MARGIN = 240;

export const CELL_CLASS =
  "absolute left-0 top-0 select-none overflow-hidden rounded-[3px] pointer-events-none will-change-transform origin-center [backface-visibility:hidden]";

/* ── Deterministic helpers (no Math.random anywhere) ──────────────────── */
function hash(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function rowDriftSpeed(rowIndex: number): number {
  const magnitude = 0.05 + hash(rowIndex * 41.3 + 17.1) * 0.18;
  const sign = rowIndex % 2 === 0 ? -1 : 1;
  return magnitude * sign;
}

/* ── Types ────────────────────────────────────────────────────────────── */
export interface Cell {
  index: number;
  rowIndex: number;
  baseX: number;
  baseY: number;
  width: number;
  height: number;
  photoIndex: number;
  angle: number;
  rotation: number;
  scale: number;
}

export interface TileSize {
  width: number;
  height: number;
  rows: number;
}

export interface Dims {
  vw: number;
  vh: number;
  isMobile: boolean;
}

interface RawItem {
  photoIndex: number;
  width: number;
  rawX: number;
  colIdx: number;
}

/* ── Build the wrapping tile of cells ─────────────────────────────────── */
export function buildCells(
  dims: Dims,
  photos: readonly [Photo, ...Photo[]],
): { cells: Cell[]; tile: TileSize } {
  const { vw, vh, isMobile } = dims;
  const cellH = isMobile ? CELL_H_MOBILE : CELL_H_DESKTOP;
  const gap = isMobile ? CELL_GAP_MOBILE : CELL_GAP_DESKTOP;
  const scale = isMobile ? TILE_SCALE_MOBILE : TILE_SCALE_DESKTOP;
  const stepY = cellH + gap;

  const targetTileW = vw * scale;
  const targetTileH = vh * scale;

  const rows = Math.ceil(targetTileH / stepY);
  const tileH = rows * stepY;
  const firstRowY = -tileH / 2 + cellH / 2 + gap / 2;

  /* Pass 1 — pick photos with anti-collision, record natural row widths.
     The left-neighbour half is exact. The above-neighbour half is only
     best-effort: it tests the un-respaced `rawX` spans, and pass 2 then
     redistributes the slack per row independently, so the column alignment
     reasoned about here no longer holds by the time cells are committed.
     Measured, it cuts vertical repeats to roughly a quarter of chance rather
     than eliminating them. Making it exact means deferring photo selection to
     pass 2, which is not worth the restructure at this repeat rate. */
  const rawRows: RawItem[][] = [];
  let maxNaturalWidth = 0;
  let prevRow: RawItem[] | null = null;

  for (let r = 0; r < rows; r++) {
    const rowItems: RawItem[] = [];
    let rawX = 0;
    let colIdx = 0;

    while (rawX < targetTileW) {
      let candidate = Math.floor(hash(r * 17.3 + colIdx * 31.7 + 5) * photos.length);

      const left = rowItems[rowItems.length - 1];
      const leftIdx = left ? left.photoIndex : -1;
      let aboveIdx = -1;
      if (prevRow) {
        for (const prev of prevRow) {
          if (rawX >= prev.rawX && rawX < prev.rawX + prev.width + gap) {
            aboveIdx = prev.photoIndex;
            break;
          }
        }
      }

      let attempts = 0;
      while ((candidate === leftIdx || candidate === aboveIdx) && attempts < photos.length) {
        candidate = (candidate + 1) % photos.length;
        attempts++;
      }

      const photo = photos[candidate] ?? photos[0];
      const width = cellH * photo.aspect;
      rowItems.push({ photoIndex: candidate, width, rawX, colIdx });
      rawX += width + gap;
      colIdx++;
    }

    rawRows.push(rowItems);
    prevRow = rowItems;

    const rowNaturalWidth = rawX - gap;
    if (rowNaturalWidth > maxNaturalWidth) maxNaturalWidth = rowNaturalWidth;
  }

  /* Tile width = widest natural row; shorter rows widen their gaps to match,
     so the horizontal wrap seam is clean. */
  const tileW = maxNaturalWidth + gap;

  /* Pass 2 — commit Cell objects, each row centred on world x = 0. */
  const cells: Cell[] = [];
  let idx = 0;

  for (let r = 0; r < rows; r++) {
    const rowItems = rawRows[r];
    if (!rowItems || rowItems.length === 0) continue;

    const last = rowItems[rowItems.length - 1];
    if (!last) continue;
    const rowNaturalWidth = last.rawX + last.width;
    const extra = tileW - rowNaturalWidth - gap;
    const extraPerGap = rowItems.length > 1 ? extra / rowItems.length : 0;

    let runningX = -tileW / 2 + gap / 2;
    for (const item of rowItems) {
      const cellCenterX = runningX + item.width / 2;
      cells.push({
        index: idx++,
        rowIndex: r,
        baseX: cellCenterX,
        baseY: r * stepY + firstRowY,
        width: item.width,
        height: cellH,
        photoIndex: item.photoIndex,
        angle: hash(r * 31 + item.colIdx * 17 + 7) * Math.PI * 2,
        rotation: (hash(r * 5 + item.colIdx * 11 + 3) - 0.5) * 3.6,
        scale: 1 + (hash(r * 7 + item.colIdx * 13 + 5) - 0.5) * 0.05,
      });
      runningX += item.width + gap + extraPerGap;
    }
  }

  return { cells, tile: { width: tileW, height: tileH, rows } };
}
