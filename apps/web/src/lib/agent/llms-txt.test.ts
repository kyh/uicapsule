import { describe, expect, it } from "vitest";

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
  it("starts with a single H1 naming the project", () => {
    expect(lines[0]).toBe("# UICapsule");
    expect(lines.filter((line) => line.startsWith("# "))).toHaveLength(1);
  });

  it("follows the H1 with a blockquote summary", () => {
    expect(lines[1]).toBe("");
    expect(lines[2]?.startsWith("> ")).toBe(true);
  });

  it("keeps every H2 section a link list", () => {
    // The spec reserves H2 sections for file lists: a markdown list whose items
    // each open with a link or a bold label. Prose belongs above the first H2.
    const sections = body.split(/^## /m).slice(1);
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      const items = section
        .split("\n")
        .slice(1)
        .filter((line) => line.trim().length > 0);
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.startsWith("- ")).toBe(true);
      }
    }
  });

  it("puts the when-to-use guidance above the first H2, where free prose is allowed", () => {
    const beforeFirstHeading = body.slice(0, body.indexOf("\n## "));
    expect(beforeFirstHeading).toContain("**When to use this:**");
    expect(beforeFirstHeading).toContain("How to call it:");
    expect(beforeFirstHeading).toContain("Reading it as an agent:");
    expect(beforeFirstHeading).toContain("Licensing and support:");
    expect(beforeFirstHeading).toContain("Not a fit");
  });

  it("names concrete jobs rather than marketing copy", () => {
    expect(body).toContain("shadcn registry item");
    expect(body).toContain("npx shadcn@latest add");
    expect(body).toContain("no account required");
  });

  it("lists every component as an absolute link with notes", () => {
    expect(body).toContain(
      "- [Dynamic Island](https://uicapsule.com/ui/dynamic-island): A springy Dynamic Island interaction with ring and timer states. — tags: overlay, minimal",
    );
    expect(body).toContain("- [Feed](https://uicapsule.com/ui/feed)");
  });

  it("links the trust anchor pages and the machine-readable endpoints", () => {
    for (const path of ["/about", "/contact", "/privacy", "/sitemap.xml", "/robots.txt"]) {
      expect(body).toContain(`https://uicapsule.com${path}`);
    }
  });

  it("ends with exactly one trailing newline", () => {
    expect(body.endsWith("\n")).toBe(true);
    expect(body.endsWith("\n\n")).toBe(false);
  });
});
