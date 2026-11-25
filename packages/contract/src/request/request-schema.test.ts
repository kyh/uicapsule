import assert from "node:assert/strict";
import { test } from "node:test";

import { CAPTURE_HTML_MAX, componentRequestSchema } from "./request-schema";

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

test("a capture needs a full page URL and caps the element HTML", () => {
  const base = {
    attachments: [],
    credit: { name: "", url: "" },
    description: "A latch that snaps shut with a visible overshoot.",
    name: "Latch",
    references: [],
  };

  assert.ok(componentRequestSchema.safeParse({ ...base, capture: { url: "example.com" } }).error);
  assert.ok(
    componentRequestSchema.safeParse({
      ...base,
      capture: { html: "x".repeat(CAPTURE_HTML_MAX + 1), url: "https://example.com" },
    }).error,
  );
  assert.ok(
    componentRequestSchema.safeParse({
      ...base,
      capture: { html: "<div></div>", selector: "div", url: "https://example.com" },
    }).success,
  );
});
