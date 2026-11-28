import assert from "node:assert/strict";
import { test } from "node:test";

import {
  UGC_MAX_FILE_BYTES,
  createUploadSchema,
  handleSchema,
  newUgcBuild,
  ugcBuildSchema,
  ugcContentType,
  ugcFileKey,
  ugcSlugSchema,
} from "./ugc-schema";

const required = [
  { path: "index.js", size: 10 },
  { path: "index.css", size: 0 },
];

const upload = (files: { path: string; size: number }[]) =>
  createUploadSchema.safeParse({ build: "0123456789abcdef", files, slug: "knob" }).success;

test("handles and slugs are plain URL segments", () => {
  assert.ok(handleSchema.safeParse("kai").success);
  assert.ok(handleSchema.safeParse("kai-yu-2").success);
  assert.ok(ugcSlugSchema.safeParse("k").success);

  for (const bad of ["ka", "-kai", "kai-", "Kai", "kai_yu", "kai.yu", "../x", "a".repeat(40)]) {
    assert.ok(!handleSchema.safeParse(bad).success, bad);
  }

  for (const bad of ["", "Knob", "knob/x", "..", "knob.json", "a".repeat(65)]) {
    assert.ok(!ugcSlugSchema.safeParse(bad).success, bad);
  }
});

test("a build must carry the two files the shell loads", () => {
  assert.ok(upload(required));
  assert.ok(upload([...required, { path: "assets/dot-E5ONCOU3.png", size: 105 }]));
  assert.ok(upload([...required, { path: "chunks/knob-ABC.js", size: 105 }]));
  assert.ok(!upload(required.slice(1)));
  assert.ok(!upload([...required, { path: "index.js", size: 1 }]));
});

test("a build can only hold what a preview loads", () => {
  for (const path of [
    "index.html",
    "assets/x.html",
    "assets/../index.js",
    "../index.js",
    "/index.js",
    "assets/.hidden.png",
    "a/b/c/d/e/f.png",
    "x.map",
  ]) {
    assert.ok(!upload([...required, { path, size: 1 }]), path);
  }

  assert.ok(!upload([...required, { path: "assets/huge.png", size: UGC_MAX_FILE_BYTES + 1 }]));
  assert.equal(ugcContentType("assets/x.svg"), "image/svg+xml");
  assert.equal(ugcContentType("index.js"), "text/javascript");
  assert.equal(ugcContentType("assets/x.html"), undefined);
});

test("every file of a build lives under its build", () => {
  assert.equal(
    ugcFileKey("u1", "knob", "0123456789abcdef", "index.js"),
    "ugc/u1/knob/0123456789abcdef/index.js",
  );
  assert.equal(
    ugcFileKey("u1", "knob", "0123456789abcdef", "assets/a-1.png"),
    "ugc/u1/knob/0123456789abcdef/assets/a-1.png",
  );
});

test("a fresh build id is a valid, distinct build", () => {
  const [a, b] = [newUgcBuild(), newUgcBuild()];

  assert.ok(ugcBuildSchema.safeParse(a).success, a);
  assert.notEqual(a, b);
});
