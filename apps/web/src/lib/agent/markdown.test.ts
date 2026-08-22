import assert from "node:assert/strict";
import { describe, test } from "node:test";

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
  test("leaves absolute and mailto URLs alone", () => {
    assert.equal(absoluteUrl("https://example.com/x"), "https://example.com/x");
    assert.equal(absoluteUrl("mailto:a@b.c"), "mailto:a@b.c");
  });

  test("prefixes site-relative paths with the site origin", () => {
    assert.match(absoluteUrl("/about"), /^https?:\/\/[^/]+\/about$/);
  });
});

describe("renderProsePageMarkdown", () => {
  test("opens with a single H1 and a blockquote summary", () => {
    const body = renderProsePageMarkdown(aboutPage);
    assert.equal(body.startsWith(`# ${aboutPage.heading}\n`), true);
    assert.deepEqual(body.match(/^# /gm), ["# "]);
    assert.ok(
      body.includes(`> ${aboutPage.description}`),
      "should contain `> ${aboutPage.description}`",
    );
  });

  test("renders headings, paragraphs and linked list items", () => {
    const body = renderProsePageMarkdown(contactPage);
    assert.ok(body.includes("## Channels"), 'should contain "## Channels"');
    assert.ok(
      body.includes("[uicapsule@kyh.io](mailto:uicapsule@kyh.io)"),
      'should contain "[uicapsule@kyh.io](mailto:uicapsule@kyh.io)"',
    );
    assert.ok(body.includes("GitHub issues"), 'should contain "GitHub issues"');
  });

  test("ends with a newline and links back to the discovery surfaces", () => {
    const body = renderProsePageMarkdown(privacyPage);
    assert.equal(body.endsWith("\n"), true);
    assert.ok(body.includes("/llms.txt"), 'should contain "/llms.txt"');
    assert.ok(body.includes("/sitemap.xml"), 'should contain "/sitemap.xml"');
  });

  test("gives every registered page a non-trivial body", () => {
    for (const page of [...prosePages, ...utilityPages]) {
      const body = renderProsePageMarkdown(page);
      assert.ok(body.includes(`# ${page.heading}`), "should contain `# ${page.heading}`");
      assert.ok(body.length > 100, "expected > 100");
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

  for (const page of [aboutPage, contactPage, privacyPage]) {
    test(`${page.path} carries real content`, () => {
      assert.ok(
        textLength(page) > 500,
        `${page.path} has only ${textLength(page)} characters of prose`,
      );
    });
  }
});

describe("renderHomeMarkdown", () => {
  const body = renderHomeMarkdown([localComponent, bareComponent]);

  test("carries the when-to-use guidance an agent needs to route to this site", () => {
    assert.ok(body.includes("## When to use this"), 'should contain "## When to use this"');
    assert.ok(body.includes("Not a fit"), 'should contain "Not a fit"');
  });

  test("advertises the machine-readable endpoints", () => {
    assert.ok(body.includes("/r/registry.json"), 'should contain "/r/registry.json"');
    assert.ok(body.includes("Accept: text/markdown"), 'should contain "Accept: text/markdown"');
  });

  test("lists every component with a link, description and tags", () => {
    assert.ok(body.includes("## Components (2)"), 'should contain "## Components (2)"');
    assert.ok(body.includes("[Dynamic Island]("), 'should contain "[Dynamic Island]("');
    assert.ok(
      body.includes("A springy Dynamic Island interaction"),
      'should contain "A springy Dynamic Island interaction"',
    );
    assert.ok(body.includes("tags: overlay, minimal"), 'should contain "tags: overlay, minimal"');
    assert.ok(body.includes("[Feed]("), 'should contain "[Feed]("');
  });

  test("exposes the filter taxonomy so an agent can build a filtered URL", () => {
    assert.ok(body.includes("**Elements**"), 'should contain "**Elements**"');
    assert.ok(body.includes("**Styles**"), 'should contain "**Styles**"');
    assert.ok(body.includes("**Categories**"), 'should contain "**Categories**"');
    assert.ok(
      body.includes("?element=inputs&style=skeuomorphism"),
      'should contain "?element=inputs&style=skeuomorphism"',
    );
  });
});

describe("renderComponentMarkdown", () => {
  test("describes a local component and how to install it", () => {
    const body = renderComponentMarkdown(localComponent, ["/preview.tsx", "/dynamic-island.tsx"]);
    assert.ok(body.includes("# Dynamic Island"), 'should contain "# Dynamic Island"');
    assert.ok(body.includes("npx shadcn@latest add"), 'should contain "npx shadcn@latest add"');
    assert.ok(body.includes("/r/dynamic-island.json"), 'should contain "/r/dynamic-island.json"');
    assert.ok(body.includes("## Files (2)"), 'should contain "## Files (2)"');
    assert.ok(body.includes("`/preview.tsx`"), 'should contain "`/preview.tsx`"');
    assert.ok(
      body.includes("[Kaiyu Hsu](https://kyh.io)"),
      'should contain "[Kaiyu Hsu](https://kyh.io)"',
    );
  });

  test("falls back to a generic summary when a component has no description", () => {
    const body = renderComponentMarkdown(bareComponent, []);
    assert.ok(body.includes("> "), 'should contain "> "');
    assert.ok(!body.includes("## Files"), 'should not contain "## Files"');
  });

  test("points a remote component at its original author", () => {
    const body = renderComponentMarkdown(remoteComponent, []);
    assert.ok(
      body.includes("https://example.com/embed"),
      'should contain "https://example.com/embed"',
    );
    assert.ok(
      body.includes("https://example.com/source"),
      'should contain "https://example.com/source"',
    );
    assert.ok(!body.includes("npx shadcn"), 'should not contain "npx shadcn"');
  });
});

describe("renderNotFoundMarkdown", () => {
  const body = renderNotFoundMarkdown("/does-not-exist");

  test("names the path that failed", () => {
    assert.ok(body.includes("# 404"), 'should contain "# 404"');
    assert.ok(body.includes("`/does-not-exist`"), 'should contain "`/does-not-exist`"');
  });

  test("hands the agent every recovery surface", () => {
    for (const link of notFoundRecoveryLinks) {
      assert.ok(body.includes(link.label), "should contain link.label");
    }
    assert.ok(body.includes("/llms.txt"), 'should contain "/llms.txt"');
    assert.ok(body.includes("/sitemap.xml"), 'should contain "/sitemap.xml"');
  });
});
