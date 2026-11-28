import { createRoot } from "react-dom/client";
import { inspectorCss } from "@repo/inspector/styles";

import type { OverlayStart } from "../messages";
import { OverlayApp } from "./app";
import { REQUEST_CSS } from "./request-styles";

const PAGE_EVENTS = [
  "click",
  "dblclick",
  "keydown",
  "keypress",
  "keyup",
  "mousedown",
  "mouseup",
  "pointerdown",
  "pointerup",
];

/**
 * Mounts the overlay in a shadow root, so no page CSS or framework leaks in either way, and stops
 * its events at the host so the page never reacts to them. The root is open because a closed one
 * hides the focused field from the window key listeners, so shortcuts would fire while typing.
 * `start` (re)opens the bar for a tool; `destroy` takes it all away.
 */
export const mountOverlay = (onClosed: () => void) => {
  const host = document.createElement("uicapsule-capture");
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  const container = document.createElement("div");
  const root = createRoot(container);
  const controller = new AbortController();
  let runs = 0;

  const destroy = () => {
    controller.abort();
    root.unmount();
    host.remove();
    onClosed();
  };

  for (const type of PAGE_EVENTS) {
    host.addEventListener(
      type,
      (event) => {
        event.stopPropagation();
      },
      { signal: controller.signal },
    );
  }

  style.textContent = inspectorCss + REQUEST_CSS;
  shadow.append(style, container);
  document.documentElement.append(host);

  return {
    destroy,
    start: (start: OverlayStart) => {
      runs += 1;
      root.render(<OverlayApp key={runs} start={start} onClose={destroy} />);
    },
  };
};
