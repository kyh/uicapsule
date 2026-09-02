import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { notFoundRecoveryLinks } from "./markdown";
import { agentEndpoints } from "./site-overview";
import { prosePages, rendersOutsideRouter } from "./site-pages";

import type { ProseListItem } from "./site-pages";

describe("rendersOutsideRouter", () => {
  test("App Router pages go through next/link", () => {
    for (const href of ["/", "/about", "/contact", "/ui/liquid-orb", "/?category=motion"]) {
      assert.equal(rendersOutsideRouter(href), false, `${href} should be a router page`);
    }
  });

  test("route handlers need a plain anchor", () => {
    for (const href of [
      "/llms.txt",
      "/sitemap.xml",
      "/robots.txt",
      "/r/registry.json",
      "/index.md",
    ]) {
      assert.equal(rendersOutsideRouter(href), true, `${href} should bypass the router`);
    }
  });

  test("off-site hrefs need a plain anchor", () => {
    for (const href of ["https://github.com/kyh/uicapsule", "mailto:uicapsule@kyh.io"]) {
      assert.equal(rendersOutsideRouter(href), true, `${href} should bypass the router`);
    }
  });

  test("a query string does not turn a page into a file", () => {
    assert.equal(rendersOutsideRouter("/?style=neo.brutalism"), false);
    assert.equal(rendersOutsideRouter("/llms.txt?v=2"), true);
  });
});

/**
 * The three renderers of a `ProseListItem` (`prose-page.tsx`, `not-found.tsx`,
 * `gallery-outline.tsx`) all branch on `rendersOutsideRouter`, so every href
 * this layer emits has to give that predicate a defensible answer.
 */
const hrefsOf = (items: ProseListItem[]) => items.flatMap((item) => (item.href ? [item.href] : []));

describe("every linked href is classifiable", () => {
  const linked = [
    ...hrefsOf(notFoundRecoveryLinks),
    ...hrefsOf(agentEndpoints),
    ...prosePages.flatMap((page) =>
      page.blocks.flatMap((block) => (block.kind === "list" ? hrefsOf(block.items) : [])),
    ),
  ];

  test("there are links to classify", () => {
    assert.ok(linked.length > 5, `expected several linked hrefs, got ${linked.length}`);
  });

  test("each is either a router path or an anchor href", () => {
    for (const href of linked) {
      const outside = rendersOutsideRouter(href);
      assert.equal(
        outside || href.startsWith("/"),
        true,
        `${href} is neither an absolute app path nor an off-site href`,
      );
    }
  });

  test("the agent endpoints are all route handlers", () => {
    for (const href of hrefsOf(agentEndpoints)) {
      assert.equal(rendersOutsideRouter(href), true, `${href} should bypass the router`);
    }
  });
});
