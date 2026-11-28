import { useState } from "react";
import type { PointerEvent as ReactPointerEvent, Ref } from "react";

import { arrowHead, hitStroke, penPath, strokeBounds, translate } from "./annotations";
import type { Annotation } from "./annotations";
import { unionRect } from "./geometry";
import type { Point, Rect } from "./geometry";
import { useViewportTick } from "./inspector-root";
import type { AnnotationsState } from "./use-annotations";

export type AnnotationTool = "arrow" | "pen" | "select" | "text";

const HIT_TOLERANCE = 8;
const MIN_ARROW = 6;
const PEN_STEP = 1.5;
const HEAD_SIZE = 14;
const SELECTED_PAD = 6;
const MARK_PAD = 4;

type Draft =
  | { from: Point; kind: "arrow"; to: Point }
  | { kind: "pen"; points: Point[] }
  | { dx: number; dy: number; id: string; kind: "drag"; start: Point };

interface Editing {
  at: Point;
  id: string;
  isNew: boolean;
  text: string;
}

const pagePoint = (event: ReactPointerEvent) => ({
  x: event.clientX + window.scrollX,
  y: event.clientY + window.scrollY,
});

const newId = () => crypto.randomUUID();

const Stroke = ({ annotation, selected }: { annotation: Annotation; selected: boolean }) => {
  if (annotation.kind === "text") {
    return null;
  }

  const points = annotation.kind === "arrow" ? [annotation.from, annotation.to] : annotation.points;

  const box = strokeBounds(points);

  return (
    <g>
      {annotation.kind === "arrow" ? (
        <>
          <line
            className="uic-stroke"
            x1={annotation.from.x}
            x2={annotation.to.x}
            y1={annotation.from.y}
            y2={annotation.to.y}
          />
          <polygon
            className="uic-head"
            points={arrowHead(annotation.from, annotation.to, HEAD_SIZE)
              .map((point) => `${point.x},${point.y}`)
              .join(" ")}
          />
        </>
      ) : (
        <path className="uic-stroke" d={penPath(annotation.points)} />
      )}
      {selected ? (
        <rect
          className="uic-selected uic-chrome"
          height={box.height + SELECTED_PAD * 2}
          rx={4}
          width={box.width + SELECTED_PAD * 2}
          x={box.x - SELECTED_PAD}
          y={box.y - SELECTED_PAD}
        />
      ) : null}
    </g>
  );
};

const focusOnMount = (input: HTMLInputElement | null) => {
  input?.focus();
};

/**
 * Where the drawn annotations sit in the viewport, measured from `layer` (the element passed as
 * the layer's `ref`), or null when nothing is drawn. Grow a capture by it so no mark is cut off.
 */
export const marksBox = (layer: Element) => {
  let box: Rect | null = null;

  for (const mark of layer.querySelectorAll(".uic-stroke, .uic-head, .uic-note")) {
    const bounds = mark.getBoundingClientRect();

    const padded = {
      height: bounds.height + MARK_PAD * 2,
      width: bounds.width + MARK_PAD * 2,
      x: bounds.left - MARK_PAD,
      y: bounds.top - MARK_PAD,
    } satisfies Rect;

    box = box ? unionRect(box, padded) : padded;
  }

  return box;
};

const NoteInput = ({
  editing,
  onCancel,
  onCommit,
}: {
  editing: Editing;
  onCancel: () => void;
  onCommit: (text: string) => void;
}) => (
  <input
    ref={focusOnMount}
    aria-label="Note"
    className="uic-note-input"
    defaultValue={editing.text}
    placeholder="Add a note"
    style={{ left: editing.at.x - window.scrollX, top: editing.at.y - window.scrollY }}
    onBlur={(event) => {
      onCommit(event.currentTarget.value);
    }}
    onKeyDown={(event) => {
      event.stopPropagation();

      if (event.key === "Enter") {
        event.preventDefault();
        onCommit(event.currentTarget.value);
      } else if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    }}
    onPointerDown={(event) => {
      event.stopPropagation();
    }}
  />
);

/**
 * Arrows, pen strokes and text notes over the page. `tool` decides what a press does: draw an
 * arrow, draw freehand, place a note, or (select) pick an annotation and drag it. With no tool the
 * layer only shows the annotations and lets the pointer through.
 */
export const AnnotationLayer = ({
  ref,
  state,
  tool,
}: {
  ref?: Ref<HTMLDivElement>;
  state: AnnotationsState;
  tool: AnnotationTool | null;
}) => {
  useViewportTick();
  const { annotations, dispatch, selectedId, setSelectedId } = state;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);

  const startDrag = (event: ReactPointerEvent<HTMLElement>, id: string) => {
    setSelectedId(id);
    setDraft({ dx: 0, dy: 0, id, kind: "drag", start: pagePoint(event) });
  };

  const commitNote = (text: string) => {
    if (!editing) {
      return;
    }

    const trimmed = text.trim();

    const note = {
      at: editing.at,
      id: editing.id,
      kind: "text",
      text: trimmed,
    } satisfies Annotation;

    if (trimmed === "") {
      if (!editing.isNew) {
        dispatch({ id: editing.id, type: "remove" });
      }
    } else if (editing.isNew) {
      dispatch({ annotation: note, type: "add" });
    } else if (trimmed !== editing.text) {
      dispatch({ annotation: note, type: "update" });
    }

    setEditing(null);
  };

  const onDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (tool === null || event.button !== 0 || editing) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const at = pagePoint(event);

    if (tool === "arrow") {
      setDraft({ from: at, kind: "arrow", to: at });
    } else if (tool === "pen") {
      setDraft({ kind: "pen", points: [at] });
    } else if (tool === "text") {
      setEditing({ at, id: newId(), isNew: true, text: "" });
    } else {
      const hit = hitStroke(annotations, at, HIT_TOLERANCE);

      if (hit) {
        startDrag(event, hit.id);
      } else {
        setSelectedId(null);
      }
    }
  };

  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const at = pagePoint(event);

    if (draft?.kind === "arrow") {
      setDraft({ ...draft, to: at });
    } else if (draft?.kind === "pen") {
      const last = draft.points.at(-1);

      if (!last || Math.hypot(at.x - last.x, at.y - last.y) >= PEN_STEP) {
        setDraft({ ...draft, points: [...draft.points, at] });
      }
    } else if (draft?.kind === "drag") {
      setDraft({ ...draft, dx: at.x - draft.start.x, dy: at.y - draft.start.y });
    }
  };

  const onUp = () => {
    setDraft(null);

    if (
      draft?.kind === "arrow" &&
      Math.hypot(draft.to.x - draft.from.x, draft.to.y - draft.from.y) >= MIN_ARROW
    ) {
      dispatch({ annotation: { ...draft, id: newId() }, type: "add" });
    } else if (draft?.kind === "pen" && draft.points.length > 1) {
      dispatch({ annotation: { ...draft, id: newId() }, type: "add" });
    } else if (draft?.kind === "drag" && (draft.dx !== 0 || draft.dy !== 0)) {
      dispatch({ dx: draft.dx, dy: draft.dy, id: draft.id, type: "move" });
    }
  };

  const shown = annotations.map((annotation) =>
    draft?.kind === "drag" && draft.id === annotation.id
      ? translate(annotation, draft.dx, draft.dy)
      : annotation,
  );

  const preview: Annotation | null =
    draft?.kind === "arrow" || draft?.kind === "pen" ? { ...draft, id: "draft" } : null;

  return (
    <div
      ref={ref}
      className="uic-marks"
      data-tool={tool ?? undefined}
      onPointerCancel={onUp}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
    >
      <svg aria-hidden>
        <g transform={`translate(${-window.scrollX} ${-window.scrollY})`}>
          {shown.map((annotation) => (
            <Stroke
              key={annotation.id}
              annotation={annotation}
              selected={annotation.id === selectedId}
            />
          ))}
          {preview ? <Stroke annotation={preview} selected={false} /> : null}
        </g>
      </svg>
      {shown.map((annotation) =>
        annotation.kind === "text" && annotation.id !== editing?.id ? (
          <div
            key={annotation.id}
            className="uic-note"
            data-selected={annotation.id === selectedId ? "" : undefined}
            style={{
              left: annotation.at.x - window.scrollX,
              top: annotation.at.y - window.scrollY,
            }}
            onDoubleClick={() => {
              setEditing({ ...annotation, isNew: false });
            }}
            onPointerDown={(event) => {
              if (tool !== "select" && tool !== "text") {
                return;
              }

              event.stopPropagation();

              if (tool === "text") {
                setEditing({ ...annotation, isNew: false });

                return;
              }

              event.currentTarget.setPointerCapture(event.pointerId);
              startDrag(event, annotation.id);
            }}
            onPointerMove={onMove}
            onPointerUp={onUp}
          >
            {annotation.text}
          </div>
        ) : null,
      )}
      {editing ? (
        <NoteInput
          editing={editing}
          onCancel={() => {
            setEditing(null);
          }}
          onCommit={commitNote}
        />
      ) : null}
    </div>
  );
};
