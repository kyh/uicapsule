import { labelFor } from "../element";
import { rectFromPoints } from "../geometry";
import type { PickMode, Rect } from "../messages";

const MIN_AREA = 8;

export interface Picked {
  element?: Element;
  rect: Rect;
}

const toRect = (box: DOMRect) =>
  ({ height: box.height, width: box.width, x: box.left, y: box.top }) satisfies Rect;

/**
 * Drives picking on the full-page layer: element mode highlights what is under the pointer and
 * locks it on click, area mode locks the rectangle a drag spans. A locked pick stays drawn until
 * cleared, and follows its element on scroll.
 */
export const createSelection = (options: {
  host: Element;
  layer: HTMLElement;
  onChange: (picked: Picked | null) => void;
}) => {
  const { host, layer } = options;
  const box = document.createElement("div");
  const tag = document.createElement("div");
  box.className = "box";
  tag.className = "box-tag";
  box.append(tag);
  layer.append(box);

  let mode: PickMode | null = null;
  let picked: Picked | null = null;
  let hovered: Element | undefined;
  let pointed: Element | undefined;
  let origin: { x: number; y: number } | undefined;
  const trail: Element[] = [];

  const draw = (rect: Rect | null, label?: string) => {
    if (!rect) {
      box.style.display = "none";

      return;
    }

    Object.assign(box.style, {
      display: "block",
      height: `${rect.height}px`,
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.width}px`,
    });
    tag.textContent = label ?? `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
  };

  const highlight = (element: Element | undefined) => {
    hovered = element;
    draw(element ? toRect(element.getBoundingClientRect()) : null, element && labelFor(element));
  };

  const lock = (next: Picked) => {
    picked = next;
    layer.dataset.locked = "";
    options.onChange(next);
  };

  const elementAt = (x: number, y: number) =>
    document.elementsFromPoint(x, y).find((element) => element !== host);

  layer.addEventListener("pointerdown", (event) => {
    if (mode !== "area") {
      return;
    }

    event.preventDefault();
    origin = { x: event.clientX, y: event.clientY };
    layer.setPointerCapture(event.pointerId);
  });

  layer.addEventListener("pointermove", (event) => {
    if (mode === "area" && origin) {
      draw(rectFromPoints(origin, { x: event.clientX, y: event.clientY }));
    } else if (mode === "element" && !picked) {
      const element = elementAt(event.clientX, event.clientY);

      if (element !== pointed) {
        pointed = element;
        trail.length = 0;
        highlight(element);
      }
    }
  });

  layer.addEventListener("pointerup", (event) => {
    if (mode !== "area" || !origin) {
      return;
    }

    const rect = rectFromPoints(origin, { x: event.clientX, y: event.clientY });
    origin = undefined;

    if (rect.width < MIN_AREA || rect.height < MIN_AREA) {
      draw(null);

      return;
    }

    lock({ rect });
  });

  layer.addEventListener("click", (event) => {
    if (mode !== "element") {
      return;
    }

    event.preventDefault();

    if (picked) {
      picked = null;
      options.onChange(null);
      highlight(elementAt(event.clientX, event.clientY));
    } else if (hovered) {
      lock({ element: hovered, rect: toRect(hovered.getBoundingClientRect()) });
    }
  });

  const walk = (key: string) => {
    if (mode !== "element" || !hovered) {
      return false;
    }

    const parent = hovered.parentElement;

    if (key === "ArrowUp" && parent && parent !== document.documentElement) {
      trail.push(hovered);
      highlight(parent);
    } else if (key === "ArrowDown" && trail.length > 0) {
      highlight(trail.pop());
    } else {
      return false;
    }

    if (picked) {
      lock({ element: hovered, rect: toRect(hovered.getBoundingClientRect()) });
    }

    return true;
  };

  const follow = () => {
    const element = picked?.element;

    if (element) {
      picked = { element, rect: toRect(element.getBoundingClientRect()) };
      draw(picked.rect, labelFor(element));
    } else if (!picked && hovered) {
      highlight(hovered);
    }
  };

  window.addEventListener("scroll", follow, { capture: true, passive: true });

  return {
    clear: () => {
      picked = null;
      hovered = undefined;
      pointed = undefined;
      delete layer.dataset.locked;
      draw(null);
      options.onChange(null);
    },
    destroy: () => window.removeEventListener("scroll", follow, { capture: true }),
    get picked() {
      return picked;
    },
    setMode: (next: PickMode | null) => {
      mode = next;

      if (next) {
        layer.dataset.picking = next;
      } else {
        delete layer.dataset.picking;
      }

      box.toggleAttribute("data-animate", next === "element");
    },
    setVisible: (visible: boolean) => {
      layer.style.visibility = visible ? "" : "hidden";
    },
    walk,
  };
};

export type SelectionController = ReturnType<typeof createSelection>;
