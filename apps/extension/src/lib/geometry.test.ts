import assert from "node:assert/strict";
import { test } from "node:test";

import { clampToViewport, rectFromPoints, toImagePixels } from "./geometry";

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
