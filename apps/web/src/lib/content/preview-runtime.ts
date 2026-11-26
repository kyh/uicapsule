import { createElement, useSyncExternalStore } from "react";
import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import * as z from "zod/mini";

import { parseParentMessage } from "../preview-protocol";
import type { FrameMessage, PreviewTheme } from "../preview-protocol";
import {
  defaultControlValues,
  mergeControlValues,
  previewControlsSchema,
} from "../preview-controls";
import type { ControlValue, PreviewControls } from "../preview-controls";

type ControlProps = Readonly<Record<string, ControlValue>>;

/** What a generated entry hands over: the namespace of one `content/<slug>/preview.tsx`. */
interface PreviewModule {
  readonly controls?: unknown;
  readonly default: ComponentType<ControlProps>;
}

const post = (message: FrameMessage) => {
  window.parent.postMessage(message, "*");
};

const applyTheme = (theme: PreviewTheme) => {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
};

const describe = (element: Element) => {
  const slot = element instanceof HTMLElement ? element.dataset.slot : undefined;

  if (slot !== undefined && slot !== "") {
    return slot;
  }

  const tag = element.tagName.toLowerCase();
  const [firstClass] = element.classList;

  return firstClass !== undefined && firstClass !== "" ? `${tag}.${firstClass}` : tag;
};

const clearBox = () => {
  post({ box: null, type: "uicapsule:inspect-box" });
};

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

const createValueStore = (initial: ControlProps) => {
  let current = initial;
  const listeners = new Set<() => void>();

  return {
    read: () => current,
    subscribe: (listener: () => void) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    write: (next: ControlProps) => {
      current = next;

      for (const listener of listeners) {
        listener();
      }
    },
  };
};

interface PreviewHostProps {
  preview: ComponentType<ControlProps>;
  store: ReturnType<typeof createValueStore>;
}

const PreviewHost = ({ preview, store }: PreviewHostProps) =>
  createElement(preview, useSyncExternalStore(store.subscribe, store.read));

const parseControls = (previewModule: PreviewModule) => {
  if (previewModule.controls === undefined) {
    return null;
  }

  const parsed = previewControlsSchema.safeParse(previewModule.controls);

  if (!parsed.success) {
    throw new Error(`Invalid preview controls export:\n${z.prettifyError(parsed.error)}`);
  }

  return parsed.data;
};

interface PreviewSession {
  controls: PreviewControls | null;
  readonly store: ReturnType<typeof createValueStore>;
}

let session: PreviewSession | null = null;

/**
 * Boots a component preview inside its sandboxed frame. Called by each generated bundle with
 * the preview module's namespace; a `controls` export makes `Preview` receive their values.
 */
export const startPreview = (previewModule: PreviewModule) => {
  const controls = parseControls(previewModule);

  const current: PreviewSession = {
    controls,
    store: createValueStore(controls ? defaultControlValues(controls) : {}),
  };

  let stopInspector: (() => void) | null = null;
  session = current;

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

    if (message?.type === "uicapsule:props" && current.controls) {
      current.store.write(
        mergeControlValues(current.controls, current.store.read(), message.values),
      );
    }
  });

  const container = document.querySelector("#root");

  if (container) {
    createRoot(container).render(
      createElement(
        MotionConfig,
        { reducedMotion: "user" },
        createElement(PreviewHost, { preview: previewModule.default, store: current.store }),
      ),
    );
  }

  post({ controls, type: "uicapsule:ready" });
};

const replaceControls = (previewModule: PreviewModule) => {
  const next = parseControls(previewModule);

  if (!session || JSON.stringify(next) === JSON.stringify(session.controls)) {
    return;
  }

  const { store } = session;

  session.controls = next;
  store.write(next ? mergeControlValues(next, defaultControlValues(next), store.read()) : {});

  post({ controls: next, type: "uicapsule:ready" });
};

declare global {
  interface Window {
    __getReactRefreshIgnoredExports?: (module: { id: string }) => readonly string[];
  }
}

/**
 * Dev only, called from the HMR footer the preview dev server appends to `preview.tsx` (`id`
 * is its file path). Keeps `controls` out of React Refresh's boundary check, so an edit
 * hot-swaps `Preview` instead of reloading the frame, and returns the module's accept callback,
 * which applies a changed `controls` export with the current values carried over.
 */
export const hotPreviewModule = (id: string) => {
  window.__getReactRefreshIgnoredExports = (module) => (module.id === id ? ["controls"] : []);

  return (next: PreviewModule | undefined) => {
    if (next) {
      replaceControls(next);
    }
  };
};
