import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { siteConfig } from "@/lib/site-config";

import { inlineLinks } from "./inline-markup";
import { notFoundRecoveryLinks } from "./markdown";
import { agentEndpoints } from "./site-overview";
import {
  headingIds,
  headingIdsFor,
  privacyPage,
  prosePages,
  rendersOutsideRouter,
  slugifyHeading,
  termsPage,
  utilityPages,
} from "./site-pages";

import type { ProseBlock, ProseListItem, ProsePage } from "./site-pages";

describe("rendersOutsideRouter", () => {
  test("App Router pages go through next/link", () => {
    for (const href of [
      "/",
      "/about",
      "/contact",
      "/terms",
      "/ui/liquid-orb",
      "/?category=motion",
      "/privacy#tracking--other-technologies",
    ]) {
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
      "/privacy.md",
    ]) {
      assert.equal(rendersOutsideRouter(href), true, `${href} should bypass the router`);
    }
  });

  test("off-site hrefs and in-page anchors need a plain anchor", () => {
    for (const href of [
      "https://github.com/kyh/uicapsule",
      "mailto:uicapsule@kyh.io",
      "#how-to-contact-us",
    ]) {
      assert.equal(rendersOutsideRouter(href), true, `${href} should bypass the router`);
    }
  });

  test("a query string does not turn a page into a file", () => {
    assert.equal(rendersOutsideRouter("/?style=neo.brutalism"), false);
    assert.equal(rendersOutsideRouter("/llms.txt?v=2"), true);
  });
});

/** Every piece of copy a block carries, inline markup included. */
const blockTexts = (block: ProseBlock): string[] => {
  switch (block.kind) {
    case "list": {
      return block.items.flatMap((item) => [item.label, item.text ?? ""]);
    }
    case "bullets": {
      return block.items;
    }
    case "table": {
      return [...block.columns, ...block.rows.flat()];
    }
    case "divider": {
      return [];
    }
    default: {
      return [block.text];
    }
  }
};

const pageTexts = (page: ProsePage): string[] => page.blocks.flatMap(blockTexts);

/**
 * The three renderers of a `ProseListItem` (`prose-page.tsx`, `not-found.tsx`,
 * `gallery-outline.tsx`) all branch on `rendersOutsideRouter`, and so does the
 * inline link in copy, so every href this layer emits has to give that
 * predicate a defensible answer.
 */
const hrefsOf = (items: ProseListItem[]) => items.flatMap((item) => (item.href ? [item.href] : []));

const pageHrefs = (page: ProsePage): string[] => [
  ...page.blocks.flatMap((block) => (block.kind === "list" ? hrefsOf(block.items) : [])),
  ...pageTexts(page).flatMap((text) => inlineLinks(text).map((link) => link.href)),
];

describe("every linked href is classifiable", () => {
  const linked = [
    ...hrefsOf(notFoundRecoveryLinks),
    ...hrefsOf(agentEndpoints),
    ...[...prosePages, ...utilityPages].flatMap(pageHrefs),
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

describe("heading ids", () => {
  test("slug a heading the way GitHub-flavoured Markdown does", () => {
    assert.equal(
      slugifyHeading("Personal information we collect"),
      "personal-information-we-collect",
    );
    assert.equal(slugifyHeading("Tracking & Other Technologies"), "tracking--other-technologies");
    assert.equal(slugifyHeading("1. Accounts"), "1-accounts");
    assert.equal(
      slugifyHeading("5. Third-Party Services & Other Users"),
      "5-third-party-services--other-users",
    );
  });

  test("number a repeated heading, and skip ids already taken", () => {
    const blocks: ProseBlock[] = [
      { kind: "heading", text: "Retention" },
      { kind: "paragraph", text: "Copy." },
      { kind: "heading", level: 3, text: "Retention" },
      { kind: "heading", text: "Privacy Policy" },
    ];
    assert.deepEqual(headingIdsFor(blocks, ["privacy-policy"]), [
      "retention",
      undefined,
      "retention-1",
      "privacy-policy-1",
    ]);
  });

  test("a page's ids are unique and line up with its heading blocks", () => {
    for (const page of prosePages) {
      const ids = headingIds(page);
      assert.equal(ids.length, page.blocks.length);
      const present = ids.filter((id) => id !== undefined);
      assert.equal(new Set(present).size, present.length, `${page.path} repeats a heading id`);
      assert.equal(present.length, page.blocks.filter((block) => block.kind === "heading").length);
    }
  });

  test("every #anchor lands on a heading of the page it names", () => {
    const idsByPath = new Map(
      prosePages.map((page) => [page.path, new Set(headingIds(page).filter(Boolean))]),
    );
    for (const page of prosePages) {
      for (const href of pageHrefs(page)) {
        const hash = href.indexOf("#");
        if (hash === -1 || !(href.startsWith("#") || href.startsWith("/"))) {
          continue;
        }
        const target = hash === 0 ? page.path : href.slice(0, hash);
        const ids = idsByPath.get(target);
        assert.ok(ids, `${page.path} links ${href}, but ${target} is not a prose page`);
        assert.ok(
          ids.has(href.slice(hash + 1)),
          `${page.path} links ${href}, which has no heading`,
        );
      }
    }
  });
});

const sectionHeadings = (page: ProsePage) =>
  page.blocks.flatMap((block) =>
    block.kind === "heading" && block.level !== 3 ? [block.text] : [],
  );

const paragraphs = (page: ProsePage) =>
  page.blocks.flatMap((block) => (block.kind === "paragraph" ? [block.text] : []));

const GENERAL_LEGAL_CREDIT_START =
  'This template was prepared and made publicly available by General Legal, PC ("General Legal").';

describe("the legal pages", () => {
  test("the privacy policy keeps the template's sections, in order", () => {
    assert.equal(privacyPage.heading, "Privacy Policy");
    assert.deepEqual(sectionHeadings(privacyPage), [
      "Personal information we collect",
      "Tracking & Other Technologies",
      "How we use your personal information",
      "Retention",
      "How we share your personal information",
      "Your choices",
      "Other sites and services",
      "Security",
      "International data transfer",
      "Children",
      "Changes to this Privacy Policy",
      "How to contact us",
      "State privacy rights notice",
      "Notice to European users",
    ]);
  });

  test("the privacy policy opens with its effective date and indexes every section", () => {
    assert.equal(paragraphs(privacyPage)[0], "Effective as of October 3, 2026.");
    const index = privacyPage.blocks.find((block) => block.kind === "list");
    assert.ok(index?.kind === "list", "the first list is the index");
    assert.deepEqual(
      index.items.map((item) => item.label),
      sectionHeadings(privacyPage),
    );
  });

  test("the terms keep the template's eleven numbered sections, in order", () => {
    assert.equal(termsPage.heading, "Terms of Use");
    assert.equal(paragraphs(termsPage)[0], "**Version 1.0 Last revised:** October 3, 2026");
    // Cross-references ("Section 11", "Sections 2.2 through 2.7") depend on these numbers.
    assert.deepEqual(
      sectionHeadings(termsPage).map((heading) => heading.split(". ")[0]),
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
    );
  });

  test("the terms number subsections in sequence, and every cross-reference resolves", () => {
    const subsections = paragraphs(termsPage).flatMap((text) => {
      const number = /^(?<section>\d+)\.(?<sub>\d+) /u.exec(text)?.groups;
      return number ? [`${number.section}.${number.sub}`] : [];
    });
    const sections = sectionHeadings(termsPage).map((heading) => heading.split(". ")[0] ?? "");
    for (const section of sections) {
      const numbers = subsections.filter((number) => number.startsWith(`${section}.`));
      assert.deepEqual(
        numbers,
        numbers.map((_, index) => `${section}.${index + 1}`),
        `section ${section} skips or repeats a subsection`,
      );
    }
    const exists = (ref: string) =>
      ref.includes(".") ? subsections.includes(ref) : sections.includes(ref);
    // A statute ("Civil Code Section 1542") is not one of ours.
    const reference =
      /(?<!Code )Sections? (?<from>\d+(?:\.\d+)?)(?: through (?<to>\d+(?:\.\d+)?))?/gu;
    const references = paragraphs(termsPage).flatMap((text) => [...text.matchAll(reference)]);
    assert.ok(references.length > 5, "expected the terms to cross-reference their sections");
    for (const match of references) {
      for (const ref of [match.groups?.from, match.groups?.to]) {
        assert.ok(
          ref === undefined || exists(ref),
          `"${match[0]}" names a section the terms do not have`,
        );
      }
    }
  });

  test("each ends with General Legal's credit, after a divider", () => {
    for (const page of [privacyPage, termsPage]) {
      const last = page.blocks.at(-1);
      assert.equal(page.blocks.at(-2)?.kind, "divider", `${page.path} has no divider`);
      assert.ok(
        last?.kind === "paragraph" && last.text.startsWith(GENERAL_LEGAL_CREDIT_START),
        `${page.path} does not end with the credit`,
      );
    }
  });

  test("no template placeholder survives", () => {
    for (const page of [privacyPage, termsPage]) {
      for (const text of pageTexts(page)) {
        for (const leftover of [
          /<mark>/u,
          /INSERT/u,
          /\{\{/u,
          /\[_\]/u,
          /\bCompany\b/u,
          /COMPANY/u,
        ]) {
          assert.ok(!leftover.test(text), `${page.path} still carries ${leftover}: ${text}`);
        }
      }
    }
  });

  test("they name the operator and the site's own contact address", () => {
    for (const page of [privacyPage, termsPage]) {
      const body = pageTexts(page).join(" ");
      assert.ok(body.includes("Kaiyu Hsu"), `${page.path} does not name Kaiyu Hsu`);
      assert.ok(body.includes(siteConfig.email), `${page.path} does not give ${siteConfig.email}`);
    }
  });

  test("every table row has one cell per column", () => {
    for (const page of [privacyPage, termsPage]) {
      for (const block of page.blocks) {
        if (block.kind === "table") {
          for (const row of block.rows) {
            assert.equal(row.length, block.columns.length, `${page.path}: ${row[0] ?? ""}`);
          }
        }
      }
    }
  });
});
