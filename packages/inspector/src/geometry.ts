export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface Size {
  height: number;
  width: number;
}

/** The smallest rect holding both `a` and `b`. */
export const unionRect = (a: Rect, b: Rect) => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);

  return {
    height: Math.max(a.y + a.height, b.y + b.height) - y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    x,
    y,
  } satisfies Rect;
};

/** The part of `rect` inside the viewport, or null when too little of it is visible to capture. */
export const clampToViewport = (rect: Rect, viewport: Size) => {
  const x = Math.max(0, rect.x);
  const y = Math.max(0, rect.y);
  const right = Math.min(viewport.width, rect.x + rect.width);
  const bottom = Math.min(viewport.height, rect.y + rect.height);

  if (right - x < 4 || bottom - y < 4) {
    return null;
  }

  return { height: bottom - y, width: right - x, x, y } satisfies Rect;
};

/** Maps a viewport rect onto a screenshot of that viewport, in whole device pixels. */
export const toImagePixels = (rect: Rect, viewportWidth: number, imageWidth: number) => {
  const scale = imageWidth / viewportWidth;

  return {
    height: Math.round(rect.height * scale),
    width: Math.round(rect.width * scale),
    x: Math.round(rect.x * scale),
    y: Math.round(rect.y * scale),
  } satisfies Rect;
};

/** The rect spanned by two drag points, in either direction. */
export const rectFromPoints = (a: Point, b: Point) =>
  ({
    height: Math.abs(b.y - a.y),
    width: Math.abs(b.x - a.x),
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
  }) satisfies Rect;

export type Handle = "e" | "n" | "ne" | "nw" | "s" | "se" | "sw" | "w";

export const HANDLES: Handle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));

/** Moves `rect` by a drag delta without letting it leave the viewport. */
export const moveRect = (rect: Rect, dx: number, dy: number, bounds: Size) =>
  ({
    ...rect,
    x: clamp(rect.x + dx, bounds.width - rect.width),
    y: clamp(rect.y + dy, bounds.height - rect.height),
  }) satisfies Rect;

/** Drags one edge or corner of `rect`; crossing the opposite edge flips the box. */
export const resizeRect = (rect: Rect, handle: Handle, dx: number, dy: number, bounds: Size) => {
  const left = rect.x + (handle.includes("w") ? dx : 0);
  const right = rect.x + rect.width + (handle.includes("e") ? dx : 0);
  const top = rect.y + (handle.includes("n") ? dy : 0);
  const bottom = rect.y + rect.height + (handle.includes("s") ? dy : 0);

  const next = rectFromPoints(
    { x: clamp(left, bounds.width), y: clamp(top, bounds.height) },
    { x: clamp(right, bounds.width), y: clamp(bottom, bounds.height) },
  );

  return {
    ...next,
    height: Math.max(1, next.height),
    width: Math.max(1, next.width),
  } satisfies Rect;
};
