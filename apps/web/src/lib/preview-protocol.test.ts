import assert from "node:assert/strict";
import { test } from "node:test";

import {
  PREVIEW_SANDBOX,
  parseFrameMessage,
  parseParentMessage,
  previewFrameSrc,
} from "./preview-protocol";

type Sample =
  | string
  | Record<string, boolean | number | string | null | Record<string, number | string>>;

const event = (data: Sample) => new MessageEvent("message", { data });

test("the preview sandbox never grants the serving origin back", () => {
  const flags = PREVIEW_SANDBOX.split(" ");

  assert.ok(flags.includes("allow-scripts"));
  assert.ok(!flags.includes("allow-same-origin"));
  assert.ok(!flags.some((flag) => flag.startsWith("allow-top-navigation")));
});

test("parent messages parse only the theme and inspect shapes", () => {
  assert.deepEqual(parseParentMessage(event({ theme: "dark", type: "uicapsule:theme" })), {
    theme: "dark",
    type: "uicapsule:theme",
  });
  assert.deepEqual(parseParentMessage(event({ enabled: true, type: "uicapsule:inspect" })), {
    enabled: true,
    type: "uicapsule:inspect",
  });
  assert.equal(parseParentMessage(event({ theme: "sepia", type: "uicapsule:theme" })), null);
  assert.equal(parseParentMessage(event("uicapsule:theme")), null);
  assert.equal(parseParentMessage(event({ type: "uicapsule:ready" })), null);
});

test("frame messages parse ready and inspect boxes, nothing else", () => {
  const box = { height: 20, label: "button · 40×20", width: 40, x: 1, y: 2 };

  assert.deepEqual(parseFrameMessage(event({ type: "uicapsule:ready" })), {
    type: "uicapsule:ready",
  });
  assert.deepEqual(parseFrameMessage(event({ box, type: "uicapsule:inspect-box" })), {
    box,
    type: "uicapsule:inspect-box",
  });
  assert.deepEqual(parseFrameMessage(event({ box: null, type: "uicapsule:inspect-box" })), {
    box: null,
    type: "uicapsule:inspect-box",
  });
  assert.equal(parseFrameMessage(event({ box: { x: "1" }, type: "uicapsule:inspect-box" })), null);
  assert.equal(parseFrameMessage(event({ enabled: true, type: "uicapsule:inspect" })), null);
});

test("preview frames resolve against the preview origin when one is set", () => {
  assert.equal(previewFrameSrc("popup-book", ""), "/preview-frame/popup-book");
  assert.equal(
    previewFrameSrc("popup-book", "https://preview.uicapsule.com"),
    "https://preview.uicapsule.com/preview-frame/popup-book",
  );
});
