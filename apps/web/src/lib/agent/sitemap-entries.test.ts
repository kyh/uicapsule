import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildSitemapEntries } from "./sitemap-entries";
import { prosePages } from "./site-pages";

const components = [
  { addedAt: "2026-02-01", slug: "dynamic-island" },
  { addedAt: "2025-11-14", slug: "feed" },
];
const entries = buildSitemapEntries(components);
const urls = entries.map((entry) => entry.url);

describe("buildSitemapEntries", () => {
  test("leads with the home page at the highest priority", () => {
    assert.equal(entries[0]?.url, "https://uicapsule.com/");
    assert.equal(entries[0]?.priority, 1);
  });

  test("stamps the home page with the newest component date, whatever the order", () => {
    assert.equal(entries[0]?.lastModified, "2026-02-01");
    assert.equal(buildSitemapEntries(components.toReversed())[0]?.lastModified, "2026-02-01");
  });

  test("includes every prose page, the request form, and every component page", () => {
    for (const page of prosePages) {
      assert.ok(
        urls.includes(`https://uicapsule.com${page.path}`),
        `should contain https://uicapsule.com${page.path}`,
      );
    }
    assert.ok(
      urls.includes("https://uicapsule.com/request"),
      'should contain "https://uicapsule.com/request"',
    );
    assert.ok(
      urls.includes("https://uicapsule.com/ui/dynamic-island"),
      'should contain "https://uicapsule.com/ui/dynamic-island"',
    );
    assert.ok(
      urls.includes("https://uicapsule.com/ui/feed"),
      'should contain "https://uicapsule.com/ui/feed"',
    );
  });

  test("dates each component page from its own addedAt", () => {
    const byUrl = new Map(entries.map((entry) => [entry.url, entry]));
    assert.equal(byUrl.get("https://uicapsule.com/ui/dynamic-island")?.lastModified, "2026-02-01");
    assert.equal(byUrl.get("https://uicapsule.com/ui/feed")?.lastModified, "2025-11-14");
  });

  test("leaves the auth screens out — they are not indexable content", () => {
    assert.equal(
      urls.some((url) => url.includes("/auth/")),
      false,
    );
  });

  test("emits only absolute https URLs, with no duplicates", () => {
    for (const url of urls) {
      assert.equal(url.startsWith("https://uicapsule.com/"), true);
    }
    assert.equal(new Set(urls).size, urls.length);
  });

  test("gives every entry a valid changefreq and priority", () => {
    for (const entry of entries) {
      assert.ok(
        ["weekly", "monthly", "yearly"].includes(entry.changeFrequency ?? ""),
        `${entry.url} has changefreq ${entry.changeFrequency}`,
      );
      const priority = entry.priority ?? 0;
      assert.ok(priority > 0 && priority <= 1, `${entry.url} has priority ${priority}`);
    }
  });

  test("is deterministic for a given content set", () => {
    assert.deepEqual(buildSitemapEntries(components), entries);
  });
});
