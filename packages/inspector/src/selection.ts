import { clampToViewport } from "./geometry";
import type { Rect, Size } from "./geometry";

/**
 * What the picker has selected: an element (its box follows it as the page moves), an area drawn
 * by hand (in document coordinates, so it stays on its content while scrolling), or the whole
 * visible viewport.
 */
export type Selection =
  | { element: Element; kind: "element" }
  | { kind: "area"; rect: Rect }
  | { kind: "visible" };

const MIN_SIZE = 8;

export const viewportSize = () =>
  ({ height: window.innerHeight, width: window.innerWidth }) satisfies Size;

export const boxOf = (element: Element) => {
  const box = element.getBoundingClientRect();

  return { height: box.height, width: box.width, x: box.left, y: box.top } satisfies Rect;
};

/** The part of `rect` inside the viewport, or null when too little of it shows to select. */
export const visiblePart = (rect: Rect) => {
  const visible = clampToViewport(rect, viewportSize());

  return visible && visible.width >= MIN_SIZE && visible.height >= MIN_SIZE ? visible : null;
};

export const toDocument = (rect: Rect) =>
  ({ ...rect, x: rect.x + window.scrollX, y: rect.y + window.scrollY }) satisfies Rect;

export const toViewport = (rect: Rect) =>
  ({ ...rect, x: rect.x - window.scrollX, y: rect.y - window.scrollY }) satisfies Rect;

/** Where the selection sits in the viewport right now, before clipping. */
export const selectionBox = (selection: Selection) => {
  if (selection.kind === "element") {
    return boxOf(selection.element);
  }

  if (selection.kind === "area") {
    return toViewport(selection.rect);
  }

  return { ...viewportSize(), x: 0, y: 0 } satisfies Rect;
};

/** The visible part of the selection: what a screenshot of it would contain. */
export const selectionRect = (selection: Selection) => visiblePart(selectionBox(selection));
