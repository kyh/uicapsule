import { describe, expect, it } from "vitest";

import {
  absoluteUrl,
  notFoundRecoveryLinks,
  renderComponentMarkdown,
  renderHomeMarkdown,
  renderNotFoundMarkdown,
  renderProsePageMarkdown,
} from "./markdown";
import { aboutPage, contactPage, privacyPage, prosePages, utilityPages } from "./site-pages";

import type { ContentComponentSummary } from "@/lib/content/content-schema";

const localComponent: ContentComponentSummary = {
  slug: "dynamic-island",
  type: "local",
  name: "Dynamic Island",
  description: "A springy Dynamic Island interaction with ring and timer states.",
  category: "mobile",
  tags: ["overlay", "minimal"],
  authors: [{ name: "Kaiyu Hsu", url: "https://kyh.io", avatarUrl: "https://kyh.io/avatar.png" }],
};

const bareComponent: ContentComponentSummary = {
  slug: "feed",
  type: "local",
  name: "Feed",
};

const remoteComponent: ContentComponentSummary = {
  slug: "elsewhere",
  type: "remote",
  name: "Elsewhere",
  iframeUrl: "https://example.com/embed",
  sourceUrl: "https://example.com/source",
};

describe("absoluteUrl", () => {
  it("leaves absolute and mailto URLs alone", () => {
    expect(absoluteUrl("https://example.com/x")).toBe("https://example.com/x");
    expect(absoluteUrl("mailto:a@b.c")).toBe("mailto:a@b.c");
  });

  it("prefixes site-relative paths with the site origin", () => {
    expect(absoluteUrl("/about")).toMatch(/^https?:\/\/[^/]+\/about$/);
  });
});

describe("renderProsePageMarkdown", () => {
  it("opens with a single H1 and a blockquote summary", () => {
    const body = renderProsePageMarkdown(aboutPage);
    expect(body.startsWith(`# ${aboutPage.heading}\n`)).toBe(true);
    expect(body.match(/^# /gm)).toHaveLength(1);
    expect(body).toContain(`> ${aboutPage.description}`);
  });

  it("renders headings, paragraphs and linked list items", () => {
    const body = renderProsePageMarkdown(contactPage);
    expect(body).toContain("## Channels");
    expect(body).toContain("[uicapsule@kyh.io](mailto:uicapsule@kyh.io)");
    expect(body).toContain("GitHub issues");
  });

  it("ends with a newline and links back to the discovery surfaces", () => {
    const body = renderProsePageMarkdown(privacyPage);
    expect(body.endsWith("\n")).toBe(true);
    expect(body).toContain("/llms.txt");
    expect(body).toContain("/sitemap.xml");
  });

  it("gives every registered page a non-trivial body", () => {
    for (const page of [...prosePages, ...utilityPages]) {
      const body = renderProsePageMarkdown(page);
      expect(body).toContain(`# ${page.heading}`);
      expect(body.length).toBeGreaterThan(100);
    }
  });
});

describe("trust anchor pages", () => {
  // These are the pages an agent reads to decide whether a site is a real
  // operation. Below ~500 characters they read as placeholders.
  const textLength = (page: (typeof prosePages)[number]) =>
    page.blocks
      .map((block) =>
        block.kind === "list"
          ? block.items.map((item) => `${item.label} ${item.text ?? ""}`).join(" ")
          : block.text,
      )
      .join(" ").length;

  it.each([aboutPage, contactPage, privacyPage])("$path carries real content", (page) => {
    expect(textLength(page)).toBeGreaterThan(500);
  });
});

describe("renderHomeMarkdown", () => {
  const body = renderHomeMarkdown([localComponent, bareComponent]);

  it("carries the when-to-use guidance an agent needs to route to this site", () => {
    expect(body).toContain("## When to use this");
    expect(body).toContain("Not a fit");
  });

  it("advertises the machine-readable endpoints", () => {
    expect(body).toContain("/r/registry.json");
    expect(body).toContain("Accept: text/markdown");
  });

  it("lists every component with a link, description and tags", () => {
    expect(body).toContain("## Components (2)");
    expect(body).toContain("[Dynamic Island](");
    expect(body).toContain("A springy Dynamic Island interaction");
    expect(body).toContain("tags: overlay, minimal");
    expect(body).toContain("[Feed](");
  });

  it("exposes the filter taxonomy so an agent can build a filtered URL", () => {
    expect(body).toContain("**Elements**");
    expect(body).toContain("**Styles**");
    expect(body).toContain("**Categories**");
    expect(body).toContain("?element=inputs&style=skeuomorphism");
  });
});

describe("renderComponentMarkdown", () => {
  it("describes a local component and how to install it", () => {
    const body = renderComponentMarkdown(localComponent, ["/preview.tsx", "/dynamic-island.tsx"]);
    expect(body).toContain("# Dynamic Island");
    expect(body).toContain("npx shadcn@latest add");
    expect(body).toContain("/r/dynamic-island.json");
    expect(body).toContain("## Files (2)");
    expect(body).toContain("`/preview.tsx`");
    expect(body).toContain("[Kaiyu Hsu](https://kyh.io)");
  });

  it("falls back to a generic summary when a component has no description", () => {
    const body = renderComponentMarkdown(bareComponent, []);
    expect(body).toContain("> ");
    expect(body).not.toContain("## Files");
  });

  it("points a remote component at its original author", () => {
    const body = renderComponentMarkdown(remoteComponent, []);
    expect(body).toContain("https://example.com/embed");
    expect(body).toContain("https://example.com/source");
    expect(body).not.toContain("npx shadcn");
  });
});

describe("renderNotFoundMarkdown", () => {
  const body = renderNotFoundMarkdown("/does-not-exist");

  it("names the path that failed", () => {
    expect(body).toContain("# 404");
    expect(body).toContain("`/does-not-exist`");
  });

  it("hands the agent every recovery surface", () => {
    for (const link of notFoundRecoveryLinks) {
      expect(body).toContain(link.label);
    }
    expect(body).toContain("/llms.txt");
    expect(body).toContain("/sitemap.xml");
  });
});
