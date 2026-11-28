import type { Point, Rect } from "./geometry";

/** A mark drawn over the page, in document coordinates so it stays on its content while scrolling. */
export type Annotation =
  | { from: Point; id: string; kind: "arrow"; to: Point }
  | { id: string; kind: "pen"; points: Point[] }
  | { at: Point; id: string; kind: "text"; text: string };

export type AnnotationKind = Annotation["kind"];

export interface AnnotationHistory {
  future: Annotation[][];
  past: Annotation[][];
  present: Annotation[];
}

export type AnnotationAction =
  | { annotation: Annotation; type: "add" }
  | { annotation: Annotation; type: "update" }
  | { dx: number; dy: number; id: string; type: "move" }
  | { id: string; type: "remove" }
  | { type: "clear" }
  | { type: "redo" }
  | { type: "undo" };

const HISTORY_LIMIT = 100;

export const emptyHistory = { future: [], past: [], present: [] } satisfies AnnotationHistory;

const commit = (history: AnnotationHistory, present: Annotation[]) =>
  ({
    future: [],
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present,
  }) satisfies AnnotationHistory;

/** Moves an annotation by a drag delta. */
export const translate = (annotation: Annotation, dx: number, dy: number) => {
  const shift = (point: Point) => ({ x: point.x + dx, y: point.y + dy });

  switch (annotation.kind) {
    case "arrow": {
      return { ...annotation, from: shift(annotation.from), to: shift(annotation.to) };
    }

    case "pen": {
      return { ...annotation, points: annotation.points.map(shift) };
    }

    case "text": {
      return { ...annotation, at: shift(annotation.at) };
    }

    default: {
      return annotation;
    }
  }
};

/** Every change goes through here, so each one can be undone. */
export const reduceAnnotations = (history: AnnotationHistory, action: AnnotationAction) => {
  switch (action.type) {
    case "add": {
      return commit(history, [...history.present, action.annotation]);
    }

    case "update": {
      return commit(
        history,
        history.present.map((annotation) =>
          annotation.id === action.annotation.id ? action.annotation : annotation,
        ),
      );
    }

    case "move": {
      return commit(
        history,
        history.present.map((annotation) =>
          annotation.id === action.id ? translate(annotation, action.dx, action.dy) : annotation,
        ),
      );
    }

    case "remove": {
      return commit(
        history,
        history.present.filter((annotation) => annotation.id !== action.id),
      );
    }

    case "clear": {
      return history.present.length === 0 ? history : commit(history, []);
    }

    case "undo": {
      const previous = history.past.at(-1);

      return previous === undefined
        ? history
        : {
            future: [history.present, ...history.future],
            past: history.past.slice(0, -1),
            present: previous,
          };
    }

    case "redo": {
      const [next, ...future] = history.future;

      return next === undefined
        ? history
        : { future, past: [...history.past, history.present], present: next };
    }

    default: {
      return history;
    }
  }
};

const distanceToSegment = (point: Point, a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = dx * dx + dy * dy;

  const t =
    length === 0
      ? 0
      : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length));

  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
};

const segments = (annotation: Annotation) => {
  if (annotation.kind === "arrow") {
    return [[annotation.from, annotation.to]] satisfies [Point, Point][];
  }

  if (annotation.kind === "pen") {
    return annotation.points
      .slice(1)
      .map<[Point, Point]>((point, index) => [annotation.points[index] ?? point, point]);
  }

  return [];
};

/**
 * The topmost arrow or pen stroke within `tolerance` of `point`. Text notes are hit by their own
 * element, since only the DOM knows how wide a note renders.
 */
export const hitStroke = (annotations: Annotation[], point: Point, tolerance: number) =>
  annotations.findLast((annotation) =>
    segments(annotation).some(([a, b]) => distanceToSegment(point, a, b) <= tolerance),
  );

/** The box around an arrow or pen stroke. */
export const strokeBounds = (points: Point[]) => {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);

  return { height: Math.max(...ys) - y, width: Math.max(...xs) - x, x, y } satisfies Rect;
};

/** A smooth SVG path through freehand points: quadratic curves between segment midpoints. */
export const penPath = (points: Point[]) => {
  const [first, ...rest] = points;

  if (first === undefined) {
    return "";
  }

  if (rest.length === 0) {
    return `M${first.x} ${first.y}l0.01 0`;
  }

  const curves = rest.map((point, index) => {
    const previous = points[index] ?? first;
    const mid = { x: (previous.x + point.x) / 2, y: (previous.y + point.y) / 2 };

    return `Q${previous.x} ${previous.y} ${mid.x} ${mid.y}`;
  });

  const last = rest.at(-1) ?? first;

  return `M${first.x} ${first.y}${curves.join("")}L${last.x} ${last.y}`;
};

/** The three corners of an arrowhead at `to`, pointing away from `from`. */
export const arrowHead = (from: Point, to: Point, size: number) => {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const spread = Math.PI / 7;

  return [
    to,
    {
      x: to.x - size * Math.cos(angle - spread),
      y: to.y - size * Math.sin(angle - spread),
    },
    {
      x: to.x - size * Math.cos(angle + spread),
      y: to.y - size * Math.sin(angle + spread),
    },
  ] satisfies Point[];
};
