import type { Rect } from "./messages";

/** The part of `rect` inside the viewport, or null when too little of it is visible to capture. */
export const clampToViewport = (rect: Rect, viewport: { width: number; height: number }) => {
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
export const rectFromPoints = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  ({
    height: Math.abs(b.y - a.y),
    width: Math.abs(b.x - a.x),
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
  }) satisfies Rect;
