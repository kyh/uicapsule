import assert from "node:assert/strict";
import { test } from "node:test";

import { componentRequestSchema } from "./request-schema";

test("credit link requires a name", () => {
  const result = componentRequestSchema.safeParse({
    attachments: [],
    credit: { name: "", url: "https://github.com/ada" },
    description: "A latch that snaps shut with a visible overshoot.",
    name: "Latch",
    references: [],
  });
  assert.ok(!result.success);
});
