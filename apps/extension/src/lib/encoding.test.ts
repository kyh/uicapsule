import assert from "node:assert/strict";
import { test } from "node:test";

import { decodeFile, encodeBlob } from "./encoding";

test("a blob survives the base64 round trip byte for byte, past one chunk", async () => {
  const bytes = Uint8Array.from({ length: 70_000 }, (_, index) => (index * 31) % 256);
  const encoded = await encodeBlob(new Blob([bytes], { type: "video/webm" }), "clip.webm");
  const file = decodeFile(encoded);

  assert.equal(file.name, "clip.webm");
  assert.equal(file.type, "video/webm");
  assert.deepEqual(new Uint8Array(await file.arrayBuffer()), bytes);
});
