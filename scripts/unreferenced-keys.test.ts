import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { unreferencedKeys } from "./unreferenced-keys";

describe("unreferencedKeys", () => {
  test("returns keys dropped from the current set", () => {
    assert.deepEqual(
      unreferencedKeys(
        ["a/a.mp4", "a/a.jpg", "b/b.mp4", "b/b.jpg"],
        ["a/a.20261126.mp4", "a/a.20261126.jpg", "b/b.mp4", "b/b.jpg"],
      ),
      ["a/a.mp4", "a/a.jpg"],
    );
  });

  test("keeps a key another entry still references", () => {
    assert.deepEqual(unreferencedKeys(["shared.mp4", "old.mp4"], ["shared.mp4"]), ["old.mp4"]);
  });

  test("reports each key once", () => {
    assert.deepEqual(unreferencedKeys(["old.mp4", "old.mp4"], []), ["old.mp4"]);
  });

  test("is empty when nothing changed", () => {
    assert.deepEqual(unreferencedKeys(["a.mp4"], ["a.mp4"]), []);
  });
});
