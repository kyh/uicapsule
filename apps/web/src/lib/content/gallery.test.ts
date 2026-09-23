import assert from "node:assert/strict";
import { test } from "node:test";

import { galleryParams, parseGalleryFilter } from "./content-categories";
import { countFilters, DEFAULT_GALLERY_FILTER, filterGallery } from "./gallery";
import type { GalleryCard } from "./gallery";

const card = (slug: string, tags: string[], featured = false): GalleryCard => ({
  featured,
  isNew: false,
  name: slug,
  slug,
  tags,
});

const cards = [
  card("newest", ["effects", "minimal"]),
  card("middle", ["controls", "minimal"], true),
  card("oldest", ["effects", "pixel-art"]),
];

test("selections OR within an axis and AND across axes", () => {
  const filter = {
    elements: ["effects", "controls"],
    styles: ["minimal"],
    view: "recent" as const,
  };
  assert.deepEqual(
    filterGallery(cards, filter).map((c) => c.slug),
    ["newest", "middle"],
  );
});

test("recommended floats featured cards and otherwise keeps newest-first", () => {
  const filter = { ...DEFAULT_GALLERY_FILTER, view: "recommended" as const };
  assert.deepEqual(
    filterGallery(cards, filter).map((c) => c.slug),
    ["middle", "newest", "oldest"],
  );
});

test("each axis is counted against the other axis' selection", () => {
  const counts = countFilters(cards, { ...DEFAULT_GALLERY_FILTER, styles: ["minimal"] });
  assert.equal(counts.elements.effects, 1);
  assert.equal(counts.elements.controls, 1);
  assert.equal(counts.styles["pixel-art"], 1);
});

test("filters round-trip through the URL in canonical form", () => {
  const parsed = parseGalleryFilter((key) =>
    new URLSearchParams("element=Effects,bogus,controls&view=recommended").get(key),
  );
  assert.equal(galleryParams(parsed).toString(), "view=recommended&element=controls%2Ceffects");
  assert.equal(galleryParams(DEFAULT_GALLERY_FILTER).toString(), "");
});
