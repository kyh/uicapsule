import type { Photo } from "./photos";

export const CELL_H_DESKTOP = 100;
export const CELL_H_MOBILE = 72;
export const CELL_GAP_DESKTOP = 12;
export const CELL_GAP_MOBILE = 8;
export const TILE_SCALE_DESKTOP = 2.4;
export const TILE_SCALE_MOBILE = 2.4;

export const MOBILE_BREAKPOINT = 768;

export const VOID_RADIUS_IDLE_DESKTOP = 200;
export const VOID_RADIUS_HOVER_DESKTOP = 280;
export const VOID_RADIUS_EXPANDED_DESKTOP = 420;
export const VOID_RADIUS_IDLE_MOBILE = 130;
export const VOID_RADIUS_HOVER_MOBILE = 180;
export const VOID_RADIUS_EXPANDED_MOBILE = 280;
export const VOID_RADIUS_CAP_RATIO = 0.4;
export const VOID_RADIUS_CAP_RATIO_EXPANDED = 0.52;

export const VOID_LERP = 0.25;
export const PAN_LERP = 0.07;
export const RADIUS_LERP = 0.07;
export const SOFT_PUSH_RATIO = 1.3;
export const CULL_MARGIN = 240;

export const CELL_CLASS =
  "absolute left-0 top-0 select-none overflow-hidden rounded-[3px] pointer-events-none will-change-transform origin-center [backface-visibility:hidden]";

const hash = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43_758.5453;

  return x - Math.floor(x);
};

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));

  return t * t * (3 - 2 * t);
};

export const rowDriftSpeed = (rowIndex: number) => {
  const magnitude = 0.05 + hash(rowIndex * 41.3 + 17.1) * 0.18;
  const sign = rowIndex % 2 === 0 ? -1 : 1;

  return magnitude * sign;
};

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

const photoAbove = (prevRow: RawItem[] | null, rawX: number, gap: number) => {
  if (!prevRow) {
    return -1;
  }

  for (const prev of prevRow) {
    if (rawX >= prev.rawX && rawX < prev.rawX + prev.width + gap) {
      return prev.photoIndex;
    }
  }

  return -1;
};

const pickPhoto = (seed: number, leftIdx: number, aboveIdx: number, poolSize: number) => {
  let candidate = seed;
  let attempts = 0;

  while ((candidate === leftIdx || candidate === aboveIdx) && attempts < poolSize) {
    candidate = (candidate + 1) % poolSize;
    attempts += 1;
  }

  return candidate;
};

export const buildCells = (dims: Dims, photos: readonly [Photo, ...Photo[]]) => {
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

  const rawRows: RawItem[][] = [];
  let maxNaturalWidth = 0;
  let prevRow: RawItem[] | null = null;

  for (let r = 0; r < rows; r += 1) {
    const rowItems: RawItem[] = [];
    let rawX = 0;
    let colIdx = 0;

    while (rawX < targetTileW) {
      const left = rowItems.at(-1);
      const leftIdx = left ? left.photoIndex : -1;

      const candidate = pickPhoto(
        Math.floor(hash(r * 17.3 + colIdx * 31.7 + 5) * photos.length),
        leftIdx,
        photoAbove(prevRow, rawX, gap),
        photos.length,
      );

      const photo = photos[candidate] ?? photos[0];
      const width = cellH * photo.aspect;
      rowItems.push({ colIdx, photoIndex: candidate, rawX, width });
      rawX += width + gap;
      colIdx += 1;
    }

    rawRows.push(rowItems);
    prevRow = rowItems;

    const rowNaturalWidth = rawX - gap;

    if (rowNaturalWidth > maxNaturalWidth) {
      maxNaturalWidth = rowNaturalWidth;
    }
  }

  const tileW = maxNaturalWidth + gap;

  const cells: Cell[] = [];
  let idx = 0;

  for (let r = 0; r < rows; r += 1) {
    const rowItems = rawRows[r];

    if (!rowItems || rowItems.length === 0) {
      continue;
    }

    const last = rowItems.at(-1);

    if (!last) {
      continue;
    }

    const rowNaturalWidth = last.rawX + last.width;
    const extra = tileW - rowNaturalWidth - gap;
    const extraPerGap = rowItems.length > 1 ? extra / rowItems.length : 0;

    let runningX = -tileW / 2 + gap / 2;

    for (const item of rowItems) {
      const cellCenterX = runningX + item.width / 2;
      cells.push({
        angle: hash(r * 31 + item.colIdx * 17 + 7) * Math.PI * 2,
        baseX: cellCenterX,
        baseY: r * stepY + firstRowY,
        height: cellH,
        index: idx,
        photoIndex: item.photoIndex,
        rotation: (hash(r * 5 + item.colIdx * 11 + 3) - 0.5) * 3.6,
        rowIndex: r,
        scale: 1 + (hash(r * 7 + item.colIdx * 13 + 5) - 0.5) * 0.05,
        width: item.width,
      });
      idx += 1;
      runningX += item.width + gap + extraPerGap;
    }
  }

  return { cells, tile: { height: tileH, rows, width: tileW } };
};
