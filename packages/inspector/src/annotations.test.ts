import assert from "node:assert/strict";
import { test } from "node:test";

import {
  arrowHead,
  emptyHistory,
  hitStroke,
  penPath,
  reduceAnnotations,
  strokeBounds,
} from "./annotations";
import type { Annotation } from "./annotations";

const arrow = {
  from: { x: 0, y: 0 },
  id: "a",
  kind: "arrow",
  to: { x: 100, y: 0 },
} satisfies Annotation;

const note = { at: { x: 10, y: 10 }, id: "t", kind: "text", text: "Hi" } satisfies Annotation;

test("undo and redo walk the history, and a new change drops the redo branch", () => {
  const added = reduceAnnotations(
    reduceAnnotations(emptyHistory, { annotation: arrow, type: "add" }),
    {
      annotation: note,
      type: "add",
    },
  );

  const undone = reduceAnnotations(added, { type: "undo" });

  assert.deepEqual(undone.present, [arrow]);
  assert.deepEqual(reduceAnnotations(undone, { type: "redo" }).present, [arrow, note]);

  const branched = reduceAnnotations(undone, { id: "a", type: "remove" });

  assert.deepEqual(branched.present, []);
  assert.deepEqual(branched.future, []);
});

test("undo with nothing to undo leaves the history as it is", () => {
  assert.equal(reduceAnnotations(emptyHistory, { type: "undo" }), emptyHistory);
  assert.equal(reduceAnnotations(emptyHistory, { type: "clear" }), emptyHistory);
});

test("move shifts every point of the annotation it names", () => {
  const history = reduceAnnotations(
    reduceAnnotations(emptyHistory, { annotation: arrow, type: "add" }),
    { dx: 5, dy: -5, id: "a", type: "move" },
  );

  assert.deepEqual(history.present[0], { ...arrow, from: { x: 5, y: -5 }, to: { x: 105, y: -5 } });
});

test("a stroke is hit near its line, not beyond its ends", () => {
  assert.equal(hitStroke([arrow], { x: 50, y: 4 }, 6), arrow);
  assert.equal(hitStroke([arrow], { x: 120, y: 0 }, 6), undefined);
  assert.equal(hitStroke([note], { x: 10, y: 10 }, 6), undefined);
});

test("the topmost stroke wins a hit", () => {
  const over = { ...arrow, id: "b" } satisfies Annotation;

  assert.equal(hitStroke([arrow, over], { x: 50, y: 0 }, 6)?.id, "b");
});

test("stroke bounds span every point", () => {
  assert.deepEqual(
    strokeBounds([
      { x: 10, y: 40 },
      { x: 30, y: 5 },
    ]),
    { height: 35, width: 20, x: 10, y: 5 },
  );
});

test("a pen path starts at the first point and ends at the last", () => {
  const path = penPath([
    { x: 0, y: 0 },
    { x: 10, y: 10 },
    { x: 20, y: 0 },
  ]);

  assert.match(path, /^M0 0/u);
  assert.match(path, /L20 0$/u);
  assert.equal(penPath([]), "");
});

test("an arrowhead's tip is the arrow's end", () => {
  const [tip, left, right] = arrowHead({ x: 0, y: 0 }, { x: 100, y: 0 }, 10);

  assert.deepEqual(tip, { x: 100, y: 0 });
  assert.ok(left !== undefined && right !== undefined && left.x < 100 && right.x < 100);
});
