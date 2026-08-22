import { describe, expect, it } from "vitest";

import { buildSitemapEntries } from "./sitemap-entries";
import { prosePages } from "./site-pages";

const lastModified = new Date("2026-02-01T00:00:00.000Z");
const entries = buildSitemapEntries(["dynamic-island", "feed"], lastModified);
const urls = entries.map((entry) => entry.url);

describe("buildSitemapEntries", () => {
  it("leads with the home page at the highest priority", () => {
    expect(entries[0]?.url).toBe("https://uicapsule.com/");
    expect(entries[0]?.priority).toBe(1);
  });

  it("includes every prose page and every component page", () => {
    for (const page of prosePages) {
      expect(urls).toContain(`https://uicapsule.com${page.path}`);
    }
    expect(urls).toContain("https://uicapsule.com/ui/dynamic-island");
    expect(urls).toContain("https://uicapsule.com/ui/feed");
  });

  it("leaves the auth screens out — they are not indexable content", () => {
    expect(urls.some((url) => url.includes("/auth/"))).toBe(false);
  });

  it("emits only absolute https URLs, with no duplicates", () => {
    for (const url of urls) expect(url.startsWith("https://uicapsule.com/")).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("stamps every entry with the supplied lastmod and a valid changefreq", () => {
    for (const entry of entries) {
      expect(entry.lastModified).toBe(lastModified);
      expect(["weekly", "monthly"]).toContain(entry.changeFrequency);
      expect(entry.priority).toBeGreaterThan(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic for a given content set", () => {
    expect(buildSitemapEntries(["dynamic-island", "feed"], lastModified)).toEqual(entries);
  });
});
