import assert from "node:assert/strict";
import { test } from "node:test";

import { attachmentMetaSchema } from "./attachment-schema";

test("caps size and type at the boundary", () => {
  assert.ok(
    !attachmentMetaSchema.safeParse({ name: "a.mp4", size: 5e6, type: "video/mp4" }).success,
  );
  assert.ok(
    !attachmentMetaSchema.safeParse({ name: "a.exe", size: 1, type: "application/x-msdownload" })
      .success,
  );
});
