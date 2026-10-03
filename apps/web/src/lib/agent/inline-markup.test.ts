import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { inlineLinks, parseInline } from "./inline-markup";

describe("parseInline", () => {
  test("plain copy is one text token", () => {
    assert.deepEqual(parseInline("No markup here."), [{ kind: "text", text: "No markup here." }]);
  });

  test("reads bold, code and links in order, keeping the text between them", () => {
    assert.deepEqual(parseInline("**Lead.** Run `pnpm verify`, then see [Terms](/terms)."), [
      { kind: "bold", text: "Lead." },
      { kind: "text", text: " Run " },
      { kind: "code", text: "pnpm verify" },
      { kind: "text", text: ", then see " },
      { href: "/terms", kind: "link", text: "Terms" },
      { kind: "text", text: "." },
    ]);
  });

  test("takes in-page anchors, mailto and off-site hrefs as they are", () => {
    assert.deepEqual(
      inlineLinks(
        "[Index](#index), [mail](mailto:a@b.c) and [Vercel](https://vercel.com/legal/privacy-notice)",
      ),
      [
        { href: "#index", text: "Index" },
        { href: "mailto:a@b.c", text: "mail" },
        { href: "https://vercel.com/legal/privacy-notice", text: "Vercel" },
      ],
    );
  });

  test("leaves unpaired markers as text", () => {
    assert.deepEqual(parseInline("a * b ** c [d] (e)"), [
      { kind: "text", text: "a * b ** c [d] (e)" },
    ]);
  });

  test("round-trips: concatenating the spans' text drops only the markers", () => {
    const text = "**Email**: [uicapsule@kyh.io](mailto:uicapsule@kyh.io)";
    const plain = parseInline(text)
      .map((token) => token.text)
      .join("");
    assert.equal(plain, "Email: uicapsule@kyh.io");
  });
});
