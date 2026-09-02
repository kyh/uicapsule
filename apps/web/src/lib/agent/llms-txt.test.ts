import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { renderLlmsTxt } from "./llms-txt";

import type { ContentComponentSummary } from "@/lib/content/content-schema";

const components: ContentComponentSummary[] = [
  {
    slug: "dynamic-island",
    type: "local",
    name: "Dynamic Island",
    description: "A springy Dynamic Island interaction with ring and timer states.",
    tags: ["overlay", "minimal"],
  },
  { slug: "feed", type: "local", name: "Feed" },
];

const body = renderLlmsTxt(components);
const lines = body.split("\n");

describe("renderLlmsTxt — llmstxt.org format", () => {
  test("starts with a single H1 naming the project", () => {
    assert.equal(lines[0], "# UICapsule");
    assert.equal(lines.filter((line) => line.startsWith("# ")).length, 1);
  });

  test("follows the H1 with a blockquote summary", () => {
    assert.equal(lines[1], "");
    assert.equal(lines[2]?.startsWith("> "), true);
  });

  test("keeps every H2 section a link list", () => {
    // The spec reserves H2 sections for file lists: a markdown list whose items
    // each open with a link or a bold label. Prose belongs above the first H2.
    const sections = body.split(/^## /m).slice(1);
    assert.ok(sections.length > 0, "expected > 0");
    for (const section of sections) {
      const items = section
        .split("\n")
        .slice(1)
        .filter((line) => line.trim().length > 0);
      assert.ok(items.length > 0, "expected > 0");
      for (const item of items) {
        assert.equal(item.startsWith("- "), true);
      }
    }
  });

  test("puts the when-to-use guidance above the first H2, where free prose is allowed", () => {
    const beforeFirstHeading = body.slice(0, body.indexOf("\n## "));
    assert.ok(
      beforeFirstHeading.includes("**When to use this:**"),
      'should contain "**When to use this:**"',
    );
    assert.ok(beforeFirstHeading.includes("How to call it:"), 'should contain "How to call it:"');
    assert.ok(
      beforeFirstHeading.includes("Reading it as an agent:"),
      'should contain "Reading it as an agent:"',
    );
    assert.ok(
      beforeFirstHeading.includes("Licensing and support:"),
      'should contain "Licensing and support:"',
    );
    assert.ok(beforeFirstHeading.includes("Not a fit"), 'should contain "Not a fit"');
  });

  test("names concrete jobs rather than marketing copy", () => {
    assert.ok(body.includes("shadcn registry item"), 'should contain "shadcn registry item"');
    assert.ok(body.includes("npx shadcn@latest add"), 'should contain "npx shadcn@latest add"');
    assert.ok(body.includes("no account required"), 'should contain "no account required"');
  });

  test("lists every component as an absolute link with notes", () => {
    assert.ok(
      body.includes(
        "- [Dynamic Island](https://uicapsule.com/ui/dynamic-island): A springy Dynamic Island interaction with ring and timer states. — tags: overlay, minimal",
      ),
      'should contain "- [Dynamic Island](https://uicapsule.com/ui/dyn…',
    );
    assert.ok(
      body.includes("- [Feed](https://uicapsule.com/ui/feed)"),
      'should contain "- [Feed](https://uicapsule.com/ui/feed)"',
    );
  });

  test("links the trust anchor pages and the machine-readable endpoints", () => {
    for (const path of ["/about", "/contact", "/privacy", "/sitemap.xml", "/robots.txt"]) {
      assert.ok(
        body.includes(`https://uicapsule.com${path}`),
        "should contain `https://uicapsule.com${path}`",
      );
    }
  });

  test("ends with exactly one trailing newline", () => {
    assert.equal(body.endsWith("\n"), true);
    assert.equal(body.endsWith("\n\n"), false);
  });
});
