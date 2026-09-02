import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildSitemapEntries } from "./sitemap-entries";
import { prosePages } from "./site-pages";

const lastModified = new Date("2026-02-01T00:00:00.000Z");
const entries = buildSitemapEntries(["dynamic-island", "feed"], lastModified);
const urls = entries.map((entry) => entry.url);

describe("buildSitemapEntries", () => {
  test("leads with the home page at the highest priority", () => {
    assert.equal(entries[0]?.url, "https://uicapsule.com/");
    assert.equal(entries[0]?.priority, 1);
  });

  test("includes every prose page and every component page", () => {
    for (const page of prosePages) {
      assert.ok(
        urls.includes(`https://uicapsule.com${page.path}`),
        "should contain `https://uicapsule.com${page.path}`",
      );
    }
    assert.ok(
      urls.includes("https://uicapsule.com/ui/dynamic-island"),
      'should contain "https://uicapsule.com/ui/dynamic-island"',
    );
    assert.ok(
      urls.includes("https://uicapsule.com/ui/feed"),
      'should contain "https://uicapsule.com/ui/feed"',
    );
  });

  test("leaves the auth screens out — they are not indexable content", () => {
    assert.equal(
      urls.some((url) => url.includes("/auth/")),
      false,
    );
  });

  test("emits only absolute https URLs, with no duplicates", () => {
    for (const url of urls) assert.equal(url.startsWith("https://uicapsule.com/"), true);
    assert.equal(new Set(urls).size, urls.length);
  });

  test("stamps every entry with the supplied lastmod and a valid changefreq", () => {
    for (const entry of entries) {
      assert.equal(entry.lastModified, lastModified);
      assert.ok(
        ["weekly", "monthly"].includes(entry.changeFrequency ?? ""),
        `${entry.url} has changefreq ${entry.changeFrequency}`,
      );
      const priority = entry.priority ?? 0;
      assert.ok(priority > 0 && priority <= 1, `${entry.url} has priority ${priority}`);
    }
  });

  test("is deterministic for a given content set", () => {
    assert.deepEqual(buildSitemapEntries(["dynamic-island", "feed"], lastModified), entries);
  });
});
