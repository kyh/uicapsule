import assert from "node:assert/strict";
import { test } from "node:test";

import { parseUgcManifest, parseUgcSlug, ugcBuildKey, ugcManifestKey } from "./ugc-preview";

test("only plain slugs become Blob keys", () => {
  assert.equal(parseUgcSlug("rotary-knob"), "rotary-knob");

  for (const slug of [
    "",
    "-knob",
    "knob-",
    "Knob",
    "../secrets",
    "a/b",
    "knob.json",
    "a".repeat(65),
  ]) {
    assert.equal(parseUgcSlug(slug), null, slug);
  }
});

test("a manifest names an immutable build under its slug", () => {
  const manifest = parseUgcManifest('{"build":"0123456789abcdef","name":"Knob","version":1}');

  assert.deepEqual(manifest, { build: "0123456789abcdef", name: "Knob", version: 1 });
  assert.equal(ugcManifestKey("knob"), "ugc/knob/manifest.json");
  assert.equal(ugcBuildKey("knob", "0123456789abcdef"), "ugc/knob/0123456789abcdef");
});

test("a malformed manifest is ignored", () => {
  for (const source of [
    "not json",
    "{}",
    '{"build":"../../x","name":"Knob","version":1}',
    '{"build":"0123456789abcdef","name":"","version":1}',
    '{"build":"0123456789abcdef","name":"Knob","version":2}',
  ]) {
    assert.equal(parseUgcManifest(source), null, source);
  }
});
