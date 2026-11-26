import assert from "node:assert/strict";
import { test } from "node:test";

import { mergeControlValues } from "./preview-controls";
import {
  PREVIEW_SANDBOX,
  parseFrameMessage,
  parseParentMessage,
  previewFrameSrc,
} from "./preview-protocol";

type Sample =
  | boolean
  | number
  | string
  | null
  | readonly Sample[]
  | { readonly [key: string]: Sample };

const event = (data: Sample) => new MessageEvent("message", { data });

test("the preview sandbox never grants the serving origin back", () => {
  const flags = PREVIEW_SANDBOX.split(" ");

  assert.ok(flags.includes("allow-scripts"));
  assert.ok(!flags.includes("allow-same-origin"));
  assert.ok(!flags.some((flag) => flag.startsWith("allow-top-navigation")));
});

test("parent messages parse only the theme, inspect and props shapes", () => {
  assert.deepEqual(parseParentMessage(event({ theme: "dark", type: "uicapsule:theme" })), {
    theme: "dark",
    type: "uicapsule:theme",
  });
  assert.deepEqual(parseParentMessage(event({ enabled: true, type: "uicapsule:inspect" })), {
    enabled: true,
    type: "uicapsule:inspect",
  });
  assert.deepEqual(
    parseParentMessage(
      event({ type: "uicapsule:props", values: { hue: 90, label: "a", on: true } }),
    ),
    { type: "uicapsule:props", values: { hue: 90, label: "a", on: true } },
  );
  assert.equal(parseParentMessage(event({ type: "uicapsule:props", values: [90] })), null);
  assert.equal(parseParentMessage(event({ theme: "sepia", type: "uicapsule:theme" })), null);
  assert.equal(parseParentMessage(event("uicapsule:theme")), null);
  assert.equal(parseParentMessage(event({ type: "uicapsule:ready" })), null);
});

test("one bad props value never drops the valid ones beside it", () => {
  const controls = {
    hue: { default: 0, max: 360, min: 0, type: "number" },
    on: { default: false, type: "boolean" },
  } as const;

  const message = parseParentMessage(
    event({ type: "uicapsule:props", values: { hue: Number.NaN, on: true } }),
  );

  assert.equal(message?.type, "uicapsule:props");
  assert.deepEqual(
    message?.type === "uicapsule:props"
      ? mergeControlValues(controls, { hue: 12, on: false }, message.values)
      : null,
    { hue: 12, on: true },
  );
});

test("frame messages parse ready and inspect boxes, nothing else", () => {
  const box = { height: 20, label: "button · 40×20", width: 40, x: 1, y: 2 };

  const controls = { hue: { default: 0, max: 360, min: 0, type: "number" } };

  assert.deepEqual(parseFrameMessage(event({ controls, type: "uicapsule:ready" })), {
    controls,
    type: "uicapsule:ready",
  });
  assert.deepEqual(parseFrameMessage(event({ controls: null, type: "uicapsule:ready" })), {
    controls: null,
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

test("a ready without valid controls still readies the frame, with no controls", () => {
  const invalid = { hue: { default: 400, max: 360, min: 0, type: "number" } };

  assert.deepEqual(parseFrameMessage(event({ type: "uicapsule:ready" })), {
    controls: null,
    type: "uicapsule:ready",
  });
  assert.deepEqual(parseFrameMessage(event({ controls: invalid, type: "uicapsule:ready" })), {
    controls: null,
    type: "uicapsule:ready",
  });
});

test("preview frames resolve against the preview origin when one is set", () => {
  assert.equal(previewFrameSrc("popup-book", ""), "/preview-frame/popup-book");
  assert.equal(
    previewFrameSrc("popup-book", "https://preview.uicapsule.com"),
    "https://preview.uicapsule.com/preview-frame/popup-book",
  );
});
