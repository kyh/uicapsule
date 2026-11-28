import assert from "node:assert/strict";
import { test } from "node:test";

import { barCommand, toolKey } from "./bar-keys";

const press = (
  key: string,
  modifiers: { altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean } = {},
) => barCommand({ altKey: false, ctrlKey: false, key, metaKey: false, ...modifiers });

test("letters pick tools and digits switch groups", () => {
  assert.deepEqual(press("d"), { kind: "tool", tool: "arrow" });
  assert.deepEqual(press("N"), { kind: "tool", tool: "pen" });
  assert.deepEqual(press("i"), { kind: "tool", tool: "inspect" });
  assert.deepEqual(press("2"), { kind: "tool", tool: "last-annotate" });
  assert.deepEqual(press("v"), { kind: "visible" });
});

test("a modified key is left to the page", () => {
  assert.equal(press("d", { metaKey: true }), null);
  assert.equal(press("t", { altKey: true }), null);
  assert.equal(press(",", { metaKey: true }), null);
});

test("Enter requests and Escape steps back", () => {
  assert.deepEqual(press("Enter"), { kind: "request" });
  assert.equal(press("Enter", { metaKey: true }), null);
  assert.deepEqual(press("Escape"), { kind: "back" });
});

test("unmapped keys do nothing", () => {
  assert.equal(press("x"), null);
  assert.equal(press("ArrowUp"), null);
});

test("each annotate tool names its key", () => {
  assert.equal(toolKey("arrow"), "D");
  assert.equal(toolKey("text"), "T");
});
