import assert from "node:assert/strict";
import { test } from "node:test";

import { addReference, parseReferences } from "./references";

test("references are one full URL per line, blank lines ignored", () => {
  assert.deepEqual(parseReferences("https://a.com\n\n  https://b.com  "), {
    ok: true,
    references: ["https://a.com", "https://b.com"],
  });
  assert.equal(parseReferences("a.com").ok, false);
  assert.equal(
    parseReferences(Array.from({ length: 6 }, (_, i) => `https://${i}.com`).join("\n")).ok,
    false,
  );
});

test("a video link is appended once", () => {
  assert.equal(addReference("https://a.com", "https://v.mp4"), "https://a.com\nhttps://v.mp4");
  assert.equal(addReference("https://v.mp4", "https://v.mp4"), "https://v.mp4");
});
