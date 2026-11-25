import { createElement } from "react";
import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";

import { parseParentMessage } from "../preview-protocol";
import type { FrameMessage, PreviewTheme } from "../preview-protocol";

const post = (message: FrameMessage) => window.parent.postMessage(message, "*");

const applyTheme = (theme: PreviewTheme) => {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
};

const describe = (element: Element) => {
  const slot = element instanceof HTMLElement ? element.dataset.slot : undefined;

  if (slot) {
    return slot;
  }

  const tag = element.tagName.toLowerCase();
  const [firstClass] = element.classList;

  return firstClass ? `${tag}.${firstClass}` : tag;
};

const clearBox = () => post({ box: null, type: "uicapsule:inspect-box" });

const blockEvent = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
};

const startInspector = () => {
  const root = document.documentElement;

  const onMove = (event: PointerEvent) => {
    const { target } = event;

    if (!(target instanceof Element) || target === root) {
      clearBox();

      return;
    }

    const rect = target.getBoundingClientRect();
    post({
      box: {
        height: rect.height,
        label: `${describe(target)} · ${Math.round(rect.width)}×${Math.round(rect.height)}`,
        width: rect.width,
        x: rect.left,
        y: rect.top,
      },
      type: "uicapsule:inspect-box",
    });
  };

  const previousCursor = root.style.cursor;
  root.style.cursor = "crosshair";
  document.addEventListener("pointermove", onMove, true);
  root.addEventListener("pointerleave", clearBox);
  document.addEventListener("click", blockEvent, true);
  document.addEventListener("pointerdown", blockEvent, true);

  return () => {
    root.style.cursor = previousCursor;
    document.removeEventListener("pointermove", onMove, true);
    root.removeEventListener("pointerleave", clearBox);
    document.removeEventListener("click", blockEvent, true);
    document.removeEventListener("pointerdown", blockEvent, true);
    clearBox();
  };
};

/** Boots a component preview inside its sandboxed frame. Called by each generated bundle. */
export const startPreview = (Preview: ComponentType) => {
  let stopInspector: (() => void) | null = null;

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) {
      return;
    }

    const message = parseParentMessage(event);

    if (message?.type === "uicapsule:theme") {
      applyTheme(message.theme);
    }

    if (message?.type === "uicapsule:inspect") {
      stopInspector?.();
      stopInspector = message.enabled ? startInspector() : null;
    }
  });

  const container = document.querySelector("#root");

  if (container) {
    createRoot(container).render(
      createElement(MotionConfig, { reducedMotion: "user" }, createElement(Preview)),
    );
  }

  post({ type: "uicapsule:ready" });
};
