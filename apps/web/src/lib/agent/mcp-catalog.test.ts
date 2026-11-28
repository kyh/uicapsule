import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { galleryResultSchema } from "@repo/mcp-app/gallery-schema";

import { catalogEntry, searchCatalog } from "./mcp-catalog";

import type { ContentComponentSummary } from "@/lib/content/content-schema";

const component = (slug: string, name: string, description: string, tags: string[]) =>
  ({
    addedAt: "2026-01-01",
    description,
    name,
    slug,
    tags,
    type: "local",
  }) satisfies ContentComponentSummary;

const catalog: ContentComponentSummary[] = [
  component("volume-knob", "Volume Knob", "A skeuomorphic rotary dial.", [
    "controls",
    "skeuomorphism",
  ]),
  component("ios-volume-slider", "iOS Volume Slider", "Rubber-band slider.", [
    "controls",
    "minimal",
  ]),
  component("card-stack", "Card Stack", "Swipe cards with a slider-like drag.", [
    "cards-grids",
    "minimal",
  ]),
];

const slugs = ({ components }: { components: { slug: string }[] }) =>
  components.map((entry) => entry.slug);

describe("searchCatalog", () => {
  test("lists everything in catalog order for an empty query", () => {
    assert.deepEqual(slugs(searchCatalog(catalog, { limit: 10 })), [
      "volume-knob",
      "ios-volume-slider",
      "card-stack",
    ]);
  });

  test("ranks name hits above description hits", () => {
    assert.deepEqual(slugs(searchCatalog(catalog, { limit: 10, query: "slider" })), [
      "ios-volume-slider",
      "card-stack",
    ]);
  });

  test("ORs tokens so one missing synonym lowers rank instead of dropping", () => {
    assert.deepEqual(slugs(searchCatalog(catalog, { limit: 10, query: "rotary knob wheel" })), [
      "volume-knob",
    ]);
  });

  test("requires every requested tag", () => {
    assert.deepEqual(slugs(searchCatalog(catalog, { limit: 10, tags: ["controls", "minimal"] })), [
      "ios-volume-slider",
    ]);
  });

  test("honours the limit", () => {
    assert.equal(searchCatalog(catalog, { limit: 1 }).components.length, 1);
  });

  test("returns what the gallery view parses", () => {
    const result = galleryResultSchema.parse(searchCatalog(catalog, { limit: 10 }));
    assert.equal(result.components.length, catalog.length);
  });

  test("gives a video cover its still as the poster", () => {
    const [knob] = searchCatalog([{ ...(catalog[0] ?? assert.fail()), cover: "knob/knob.mp4" }], {
      limit: 1,
    }).components;

    assert.equal(knob?.cover?.type, "video");
    assert.ok(knob?.cover?.type === "video" && knob.cover.poster.endsWith("/knob/knob.jpg"));
    assert.ok(knob.cover.url.endsWith("/knob/knob.mp4"));
  });

  test("leaves the cover out for a component without one", () => {
    assert.equal(searchCatalog(catalog, { limit: 1 }).components[0]?.cover, undefined);
  });
});

describe("catalogEntry", () => {
  test("gives a local component its shadcn install command", () => {
    const entry = catalogEntry(catalog[0] ?? assert.fail());
    assert.ok(entry.installable);
    assert.match(entry.install, /^npx shadcn@latest add .+\/r\/volume-knob\.json$/u);
  });

  test("points a remote component at its source instead", () => {
    const entry = catalogEntry({
      addedAt: "2026-01-01",
      description: "Hosted elsewhere.",
      iframeUrl: "https://example.com/embed",
      name: "Elsewhere",
      slug: "elsewhere",
      sourceUrl: "https://example.com/source",
      tags: ["pages"],
      type: "remote",
    });

    assert.deepEqual(
      { installable: entry.installable, sourceUrl: "sourceUrl" in entry && entry.sourceUrl },
      { installable: false, sourceUrl: "https://example.com/source" },
    );
  });
});
