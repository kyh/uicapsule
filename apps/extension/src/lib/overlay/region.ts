import { labelFor } from "../element";
import { clampToViewport, HANDLES, moveRect, rectFromPoints, resizeRect } from "../geometry";
import type { Handle } from "../geometry";
import type { Rect } from "../messages";
import { h } from "./dom";

const DRAG_THRESHOLD = 4;
const MIN_SIZE = 8;
const ACTIONS_GAP = 10;

export interface Region {
  element?: Element;
  label?: string;
  rect: Rect;
}

type Gesture =
  | { kind: "draw"; moved: boolean; start: { x: number; y: number } }
  | { from: Rect; kind: Handle | "move"; start: { x: number; y: number } };

const viewport = () => ({ height: window.innerHeight, width: window.innerWidth });

const toRect = (box: DOMRect) =>
  ({ height: box.height, width: box.width, x: box.left, y: box.top }) satisfies Rect;

const clip = (rect: Rect) => {
  const visible = clampToViewport(rect, viewport());

  return visible && visible.width >= MIN_SIZE && visible.height >= MIN_SIZE ? visible : null;
};

const point = (event: PointerEvent) => ({
  x: Math.min(window.innerWidth, Math.max(0, event.clientX)),
  y: Math.min(window.innerHeight, Math.max(0, event.clientY)),
});

const place = (element: HTMLElement, rect: Rect) => {
  Object.assign(element.style, {
    height: `${rect.height}px`,
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
  });
};

/**
 * The region picker: the element under the pointer is highlighted, a click snaps to it and a drag
 * draws a box. The box can then be moved or resized by its handles before Save (or Enter).
 */
export const createRegion = (options: {
  host: Element;
  onCancel: () => void;
  onSave: (region: Region) => void;
}) => {
  const { host } = options;
  const highlight = h("div", { class: "highlight", hidden: "" });
  const highlightTag = h("span", { class: "tag" });
  const box = h("div", { class: "box", hidden: "" });
  const size = h("span", { class: "size" });
  const handles = HANDLES.map((handle) => h("span", { class: "handle", "data-handle": handle }));
  const cancel = h("button", { class: "btn", type: "button" }, ["Cancel"]);
  const save = h("button", { class: "btn", "data-primary": "", type: "button" }, ["Save"]);
  const actions = h("div", { class: "actions", hidden: "" }, [cancel, save]);

  const hint = h("div", { class: "hint" }, [
    "Click an element or drag to select. ",
    h("kbd", {}, ["Esc"]),
    " to cancel.",
  ]);

  highlight.append(highlightTag);
  box.append(size, ...handles);

  const surface = h("div", { class: "surface", "data-picking": "" }, [
    highlight,
    box,
    actions,
    hint,
  ]);

  let hovered: Element | undefined;
  let rect: Rect | null = null;
  let snapped: Element | undefined;
  let gesture: Gesture | null = null;
  const trail: Element[] = [];

  const elementAt = (x: number, y: number) =>
    document
      .elementsFromPoint(x, y)
      .find((element) => element !== host && element !== document.documentElement);

  const hover = (element: Element | undefined) => {
    hovered = element;
    const visible = element ? clip(toRect(element.getBoundingClientRect())) : null;
    highlight.hidden = visible === null;
    surface.toggleAttribute("data-hovering", visible !== null);

    if (element && visible) {
      place(highlight, visible);
      highlightTag.textContent = labelFor(element);
    }
  };

  const render = () => {
    const drawing = gesture?.kind === "draw";
    const settled = rect !== null && gesture === null;
    box.hidden = rect === null;
    hint.hidden = rect !== null;
    surface.toggleAttribute("data-picking", rect === null);
    box.toggleAttribute("data-drawing", drawing);

    for (const handle of handles) {
      handle.hidden = !settled;
    }

    actions.hidden = !settled;

    if (!rect) {
      return;
    }

    highlight.hidden = true;
    place(box, rect);
    size.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;

    if (settled) {
      const width = actions.offsetWidth;
      const below = rect.y + rect.height + ACTIONS_GAP;
      const fitsBelow = below + actions.offsetHeight + 8 <= window.innerHeight;
      const top = fitsBelow ? below : Math.max(8, rect.y - ACTIONS_GAP - actions.offsetHeight);

      const left = Math.min(
        window.innerWidth - width - 8,
        Math.max(8, rect.x + rect.width - width),
      );

      actions.style.left = `${left}px`;
      actions.style.top = `${top}px`;
    }
  };

  const begin = (event: PointerEvent, next: Gesture) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    surface.setPointerCapture(event.pointerId);
    gesture = next;
    render();
  };

  surface.addEventListener("pointerdown", (event) => {
    begin(event, { kind: "draw", moved: false, start: point(event) });
  });

  box.addEventListener("pointerdown", (event) => {
    if (!rect) {
      return;
    }

    const name = event.target instanceof HTMLElement ? event.target.dataset.handle : undefined;
    const kind = HANDLES.find((handle) => handle === name) ?? "move";
    begin(event, { from: rect, kind, start: point(event) });
  });

  actions.addEventListener("pointerdown", (event) => event.stopPropagation());

  surface.addEventListener("pointermove", (event) => {
    const at = point(event);

    if (!gesture) {
      if (!rect) {
        const element = elementAt(at.x, at.y);

        if (element !== hovered) {
          trail.length = 0;
          hover(element);
        }
      }

      return;
    }

    const dx = at.x - gesture.start.x;
    const dy = at.y - gesture.start.y;

    if (gesture.kind === "draw") {
      if (!gesture.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) {
        return;
      }

      gesture.moved = true;
      snapped = undefined;
      rect = rectFromPoints(gesture.start, at);
    } else {
      snapped = undefined;
      rect =
        gesture.kind === "move"
          ? moveRect(gesture.from, dx, dy, viewport())
          : resizeRect(gesture.from, gesture.kind, dx, dy, viewport());
    }

    render();
  });

  const finish = () => {
    if (gesture?.kind === "draw") {
      if (gesture.moved) {
        rect = rect ? clip(rect) : null;
      } else if (hovered) {
        rect = clip(toRect(hovered.getBoundingClientRect()));
        snapped = rect ? hovered : undefined;
      }
    }

    gesture = null;
    render();

    if (!rect) {
      hover(hovered);
    }
  };

  surface.addEventListener("pointerup", finish);
  surface.addEventListener("pointercancel", finish);

  const submit = () => {
    if (rect && !gesture) {
      options.onSave({ element: snapped, rect });
    }
  };

  cancel.addEventListener("click", () => options.onCancel());
  save.addEventListener("click", submit);

  const onScroll = () => {
    if (!rect) {
      hover(hovered);

      return;
    }

    if (snapped && !gesture) {
      const next = clip(toRect(snapped.getBoundingClientRect()));
      snapped = next ? snapped : undefined;
      rect = next ?? rect;
      render();
    }
  };

  window.addEventListener("scroll", onScroll, { capture: true, passive: true });

  return {
    destroy: () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      surface.remove();
    },
    element: surface,
    get ready() {
      return rect !== null && gesture === null;
    },
    submit,
    walk: (key: string) => {
      if (rect || !hovered) {
        return false;
      }

      const parent = hovered.parentElement;

      if (key === "ArrowUp" && parent && parent !== document.documentElement) {
        trail.push(hovered);
        hover(parent);
      } else if (key === "ArrowDown" && trail.length > 0) {
        hover(trail.pop());
      } else {
        return false;
      }

      return true;
    },
  };
};

export type RegionPicker = ReturnType<typeof createRegion>;
