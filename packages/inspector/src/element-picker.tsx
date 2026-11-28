import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";

import { HANDLES, moveRect, rectFromPoints, resizeRect } from "./geometry";
import type { Handle, Point, Rect } from "./geometry";
import { useIsOwnElement, useViewportTick } from "./inspector-root";
import { boxOf, selectionBox, toDocument, viewportSize, visiblePart } from "./selection";
import type { Selection } from "./selection";

const DRAG_THRESHOLD = 4;

type Gesture =
  | { kind: "draw"; moved: boolean; start: Point }
  | { from: Rect; kind: Handle | "move"; start: Point };

const pointOf = (event: ReactPointerEvent) => ({
  x: Math.min(window.innerWidth, Math.max(0, event.clientX)),
  y: Math.min(window.innerHeight, Math.max(0, event.clientY)),
});

const placed = (rect: Rect) =>
  ({ height: rect.height, left: rect.x, top: rect.y, width: rect.width }) satisfies CSSProperties;

const isHandle = (value: string | undefined): value is Handle =>
  HANDLES.some((handle) => handle === value);

const useAncestorWalk = (
  enabled: boolean,
  hovered: Element | null,
  setHovered: (element: Element) => void,
) => {
  const trail = useRef<Element[]>([]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!enabled || !hovered) {
        return;
      }

      const parent = hovered.parentElement;

      if (event.key === "ArrowUp" && parent && parent !== document.documentElement) {
        trail.current.push(hovered);
        setHovered(parent);
      } else if (event.key === "ArrowDown" && trail.current.length > 0) {
        setHovered(trail.current.pop() ?? hovered);
      } else {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("keydown", onKey, { capture: true });

    return () => {
      window.removeEventListener("keydown", onKey, { capture: true });
    };
  }, [enabled, hovered, setHovered]);

  return () => {
    trail.current = [];
  };
};

const Frame = ({
  box,
  drawing,
  handles,
  onGrab,
  whole,
}: {
  box: Rect;
  drawing: boolean;
  handles: boolean;
  onGrab: (event: ReactPointerEvent<HTMLElement>, kind: Handle | "move") => void;
  whole: boolean;
}) => (
  <div
    className="uic-box"
    data-drawing={drawing ? "" : undefined}
    data-whole={whole ? "" : undefined}
    style={placed(box)}
    onPointerDown={(event) => {
      if (whole) {
        return;
      }

      const name = event.target instanceof HTMLElement ? event.target.dataset.handle : undefined;
      onGrab(event, isHandle(name) ? name : "move");
    }}
  >
    <span className="uic-label">
      {whole ? "Visible area" : `${Math.round(box.width)} × ${Math.round(box.height)}`}
    </span>
    {handles
      ? HANDLES.map((handle) => <span key={handle} className="uic-handle" data-handle={handle} />)
      : null}
  </div>
);

const Highlight = ({ element, label }: { element: Element; label: string }) => {
  const rect = visiblePart(boxOf(element));

  return rect ? (
    <div className="uic-highlight" style={placed(rect)}>
      <span className="uic-label">{label}</span>
    </div>
  ) : null;
};

/**
 * Picks part of the page. While `active`, the element under the pointer is highlighted, a click
 * selects it and a drag draws an area; a selection can then be moved or resized by its handles
 * (which turns it into an area). ArrowUp/ArrowDown walk the hovered element's ancestors. While
 * inactive it only shows the selection, so annotations can be drawn over it.
 */
export const ElementPicker = ({
  active,
  hint,
  labelFor,
  onSelect,
  selection,
}: {
  active: boolean;
  hint?: ReactNode;
  labelFor: (element: Element) => string;
  onSelect: (selection: Selection) => void;
  selection: Selection | null;
}) => {
  useViewportTick();
  const isOwn = useIsOwnElement();
  const [hovered, setHovered] = useState<Element | null>(null);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [draft, setDraft] = useState<Rect | null>(null);
  const picking = active && selection === null;
  const resetWalk = useAncestorWalk(picking, hovered, setHovered);

  const elementAt = (point: Point) =>
    document
      .elementsFromPoint(point.x, point.y)
      .find((element) => !isOwn(element) && element !== document.documentElement) ?? null;

  const begin = (event: ReactPointerEvent<HTMLElement>, next: Gesture) => {
    if (!active || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setGesture(next);
  };

  const onMove = (event: ReactPointerEvent<HTMLElement>) => {
    const at = pointOf(event);

    if (!gesture) {
      const element = picking ? elementAt(at) : null;

      if (picking && element !== hovered) {
        resetWalk();
        setHovered(element);
      }

      return;
    }

    const dx = at.x - gesture.start.x;
    const dy = at.y - gesture.start.y;

    if (gesture.kind !== "draw") {
      setDraft(
        gesture.kind === "move"
          ? moveRect(gesture.from, dx, dy, viewportSize())
          : resizeRect(gesture.from, gesture.kind, dx, dy, viewportSize()),
      );
    } else if (gesture.moved || Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
      setGesture({ ...gesture, moved: true });
      setDraft(rectFromPoints(gesture.start, at));
    }
  };

  const select = (next: Selection) => {
    setHovered(null);
    onSelect(next);
  };

  const onUp = (event: ReactPointerEvent<HTMLElement>) => {
    const ended = gesture;
    const rect = draft ? visiblePart(draft) : null;
    setGesture(null);
    setDraft(null);

    if (ended?.kind === "draw" && !ended.moved) {
      const element = picking ? hovered : elementAt(pointOf(event));

      if (element && visiblePart(boxOf(element))) {
        select({ element, kind: "element" });
      }
    } else if (ended && rect) {
      select({ kind: "area", rect: toDocument(rect) });
    }
  };

  const box = draft ?? (selection ? visiblePart(selectionBox(selection)) : null);
  const whole = draft === null && selection?.kind === "visible";
  const highlighted = picking ? hovered : null;
  const showHint = picking && gesture === null && hint !== undefined;

  return (
    <div
      className="uic-surface uic-chrome"
      data-active={active ? "" : undefined}
      data-dim={active && box === null ? "" : undefined}
      data-hovering={highlighted ? "" : undefined}
      onPointerCancel={onUp}
      onPointerDown={(event) => {
        begin(event, { kind: "draw", moved: false, start: pointOf(event) });
      }}
      onPointerMove={onMove}
      onPointerUp={onUp}
    >
      {highlighted ? <Highlight element={highlighted} label={labelFor(highlighted)} /> : null}
      {box ? (
        <Frame
          box={box}
          drawing={gesture?.kind === "draw"}
          handles={active && gesture === null && !whole}
          whole={whole}
          onGrab={(event, kind) => {
            begin(event, { from: box, kind, start: pointOf(event) });
          }}
        />
      ) : null}
      {showHint ? <div className="uic-hint">{hint}</div> : null}
    </div>
  );
};
