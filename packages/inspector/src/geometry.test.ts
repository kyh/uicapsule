import assert from "node:assert/strict";
import { test } from "node:test";

import {
  clampToViewport,
  moveRect,
  rectFromPoints,
  resizeRect,
  toImagePixels,
  unionRect,
} from "./geometry";

const viewport = { height: 800, width: 1200 };

test("a drag normalizes to the same rect in any direction", () => {
  assert.deepEqual(rectFromPoints({ x: 300, y: 200 }, { x: 100, y: 50 }), {
    height: 150,
    width: 200,
    x: 100,
    y: 50,
  });
});

test("an element hanging off the viewport is cropped to what is visible", () => {
  assert.deepEqual(clampToViewport({ height: 400, width: 600, x: -100, y: 600 }, viewport), {
    height: 200,
    width: 500,
    x: 0,
    y: 600,
  });
});

test("an element scrolled out of view has nothing to capture", () => {
  assert.equal(clampToViewport({ height: 100, width: 100, x: 10, y: 900 }, viewport), null);
});

test("viewport pixels scale by the screenshot's own width, not devicePixelRatio", () => {
  assert.deepEqual(toImagePixels({ height: 50.4, width: 100, x: 10.2, y: 20 }, 1200, 2400), {
    height: 101,
    width: 200,
    x: 20,
    y: 40,
  });
});

test("a moved box stops at the viewport edge", () => {
  assert.deepEqual(moveRect({ height: 100, width: 100, x: 1050, y: 10 }, 200, -50, viewport), {
    height: 100,
    width: 100,
    x: 1100,
    y: 0,
  });
});

test("dragging a corner past the opposite edge flips the box instead of inverting it", () => {
  assert.deepEqual(
    resizeRect({ height: 100, width: 100, x: 100, y: 100 }, "se", -150, 0, viewport),
    {
      height: 100,
      width: 50,
      x: 50,
      y: 100,
    },
  );
});

test("an edge handle only moves its own edge", () => {
  assert.deepEqual(resizeRect({ height: 100, width: 100, x: 100, y: 100 }, "n", 30, 40, viewport), {
    height: 60,
    width: 100,
    x: 100,
    y: 140,
  });
});

test("a union holds both rects, whichever side each sits on", () => {
  assert.deepEqual(
    unionRect({ height: 10, width: 10, x: 50, y: 50 }, { height: 5, width: 5, x: 0, y: 70 }),
    { height: 25, width: 60, x: 0, y: 50 },
  );
});
