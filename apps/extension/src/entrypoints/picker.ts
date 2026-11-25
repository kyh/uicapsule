import { htmlFor, labelFor, selectorFor, videoFor, videoSource } from "@/lib/element";
import { clampToViewport, rectFromPoints } from "@/lib/geometry";
import { pickerCommandSchema } from "@/lib/messages";
import type { PickMode, Rect, Selection } from "@/lib/messages";
import { recordVideo } from "@/lib/record";

const INSTALLED = "data-uicapsule-picker";
const ACCENT = "#ff5a1f";
const MIN_AREA = 8;

const HINTS = {
  area: "Drag to select an area · Esc to cancel",
  element: "Click an element · ↑ parent · ↓ child · Esc to cancel",
} satisfies Record<PickMode, string>;

const nextFrame = () =>
  // oxlint-disable-next-line promise/avoid-new -- requestAnimationFrame has no promise form to await
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

const swallow = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
};

const viewport = () => ({ height: window.innerHeight, width: window.innerWidth });

const toRect = (box: DOMRect) =>
  ({ height: box.height, width: box.width, x: box.left, y: box.top }) satisfies Rect;

const createOverlay = (mode: PickMode) => {
  const host = document.createElement("div");
  host.setAttribute("style", "all: initial; position: fixed; inset: 0; z-index: 2147483647;");
  const root = host.attachShadow({ mode: "closed" });

  const layer = document.createElement("div");
  layer.setAttribute(
    "style",
    `position: fixed; inset: 0; cursor: ${mode === "area" ? "crosshair" : "default"};`,
  );

  const box = document.createElement("div");
  box.setAttribute(
    "style",
    `position: fixed; display: none; pointer-events: none; border: 2px solid ${ACCENT}; background: ${ACCENT}1f; border-radius: 4px; box-shadow: 0 0 0 100vmax rgb(0 0 0 / 0.25); transition: ${mode === "element" ? "all 80ms ease-out" : "none"};`,
  );

  const tag = document.createElement("div");
  tag.setAttribute(
    "style",
    `position: absolute; left: -2px; bottom: calc(100% + 4px); padding: 2px 6px; border-radius: 4px; background: ${ACCENT}; color: white; font: 500 11px/16px ui-monospace, monospace; white-space: nowrap;`,
  );
  box.append(tag);

  const hint = document.createElement("div");
  hint.textContent = HINTS[mode];
  hint.setAttribute(
    "style",
    "position: fixed; top: 16px; left: 50%; transform: translateX(-50%); padding: 8px 14px; border-radius: 999px; background: rgb(17 24 39 / 0.92); color: white; font: 500 13px/18px system-ui, sans-serif; pointer-events: none; box-shadow: 0 8px 24px rgb(0 0 0 / 0.2);",
  );

  root.append(layer, box, hint);
  document.documentElement.append(host);

  const show = (rect: Rect | null, label?: string) => {
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
    tag.style.display = label || rect.width > 60 ? "block" : "none";
  };

  return { host, layer, show };
};

export default defineUnlistedScript(() => {
  if (document.documentElement.hasAttribute(INSTALLED)) {
    return;
  }

  document.documentElement.setAttribute(INSTALLED, "");

  let teardown: (() => void) | undefined;
  let picked: Element | undefined;

  const finish = async (rect: Rect, element?: Element) => {
    teardown?.();
    await nextFrame();
    await nextFrame();

    const visible = clampToViewport(rect, viewport());

    if (!visible) {
      void browser.runtime.sendMessage({ type: "picker:cancel" });

      return;
    }

    const video = element ? videoFor(element) : undefined;
    picked = video;

    const selection: Selection = {
      element: element
        ? { html: htmlFor(element), label: labelFor(element), selector: selectorFor(element) }
        : undefined,
      page: { title: document.title, url: location.href },
      rect: visible,
      video: video ? videoSource(video) : undefined,
      viewport: viewport(),
    };

    void browser.runtime.sendMessage({ selection, type: "picker:done" });
  };

  const start = (mode: PickMode) => {
    teardown?.();
    const overlay = createOverlay(mode);
    const controller = new AbortController();
    const { signal } = controller;

    teardown = () => {
      controller.abort();
      overlay.host.remove();
      teardown = undefined;
    };

    const cancel = () => {
      teardown?.();
      void browser.runtime.sendMessage({ type: "picker:cancel" });
    };

    window.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          swallow(event);
          cancel();
        }
      },
      { capture: true, signal },
    );

    if (mode === "area") {
      let origin: { x: number; y: number } | undefined;

      overlay.layer.addEventListener(
        "pointerdown",
        (event) => {
          swallow(event);
          origin = { x: event.clientX, y: event.clientY };
          overlay.layer.setPointerCapture(event.pointerId);
        },
        { signal },
      );
      overlay.layer.addEventListener(
        "pointermove",
        (event) => {
          if (origin) {
            overlay.show(rectFromPoints(origin, { x: event.clientX, y: event.clientY }));
          }
        },
        { signal },
      );
      overlay.layer.addEventListener(
        "pointerup",
        (event) => {
          if (!origin) {
            return;
          }

          const rect = rectFromPoints(origin, { x: event.clientX, y: event.clientY });
          origin = undefined;

          if (rect.width < MIN_AREA || rect.height < MIN_AREA) {
            overlay.show(null);

            return;
          }

          void finish(rect);
        },
        { signal },
      );

      return;
    }

    let hovered: Element | undefined;
    let pointed: Element | undefined;
    const trail: Element[] = [];

    const highlight = (element: Element | undefined) => {
      hovered = element;
      overlay.show(
        element ? toRect(element.getBoundingClientRect()) : null,
        element && labelFor(element),
      );
    };

    const elementAt = (x: number, y: number) =>
      document.elementsFromPoint(x, y).find((element) => element !== overlay.host);

    overlay.layer.addEventListener(
      "pointermove",
      (event) => {
        const element = elementAt(event.clientX, event.clientY);

        if (element !== pointed) {
          pointed = element;
          trail.length = 0;
          highlight(element);
        }
      },
      { signal },
    );
    overlay.layer.addEventListener(
      "click",
      (event) => {
        swallow(event);

        if (hovered) {
          void finish(toRect(hovered.getBoundingClientRect()), hovered);
        }
      },
      { signal },
    );
    window.addEventListener(
      "keydown",
      (event) => {
        if (!hovered) {
          return;
        }

        if (
          event.key === "ArrowUp" &&
          hovered.parentElement &&
          hovered.parentElement !== document.documentElement
        ) {
          swallow(event);
          trail.push(hovered);
          highlight(hovered.parentElement);
        } else if (event.key === "ArrowDown" && trail.length > 0) {
          swallow(event);
          highlight(trail.pop());
        } else if (event.key === "Enter") {
          swallow(event);
          void finish(toRect(hovered.getBoundingClientRect()), hovered);
        }
      },
      { capture: true, signal },
    );
    window.addEventListener("scroll", () => highlight(hovered), {
      capture: true,
      passive: true,
      signal,
    });
  };

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const command = pickerCommandSchema.safeParse(message);

    if (!command.success) {
      return;
    }

    switch (command.data.type) {
      case "picker:start": {
        start(command.data.mode);

        return;
      }

      case "picker:stop": {
        teardown?.();

        return;
      }

      case "picker:record": {
        if (!(picked instanceof HTMLVideoElement)) {
          sendResponse({ ok: false, reason: "The video is gone from the page." });

          return;
        }

        void recordVideo(picked).then(sendResponse);

        return true;
      }

      default: {
        break;
      }
    }
  });
});
