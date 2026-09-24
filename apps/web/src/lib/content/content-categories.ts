export interface ContentFilter {
  name: string;
  slug: string;
}

// Every component carries exactly one element tag, enforced by the metadata
// schema so a gallery filter can never yield a stray entry.
export const contentElements: ContentFilter[] = [
  { name: "Effects", slug: "effects" },
  { name: "Controls", slug: "controls" },
  { name: "Cards & Grids", slug: "cards-grids" },
  { name: "Navigation", slug: "navigation" },
  { name: "Data", slug: "data" },
  { name: "Pages", slug: "pages" },
];

// Only styles with shipped content belong here; an option that yields an empty
// gallery is worse than no option.
export const contentStyles: ContentFilter[] = [
  { name: "Minimal", slug: "minimal" },
  { name: "Geometric", slug: "geometric" },
  { name: "Skeuomorphism", slug: "skeuomorphism" },
  { name: "Pixel Art", slug: "pixel-art" },
  { name: "Colorful", slug: "colorful" },
  { name: "Cyberpunk", slug: "cyberpunk" },
  { name: "Silly", slug: "silly" },
];

const slugSet = (filters: ContentFilter[]): ReadonlySet<string> =>
  new Set(filters.map((filter) => filter.slug));

export const elementSlugs = slugSet(contentElements);
export const styleSlugs = slugSet(contentStyles);

const labels = new Map(
  [...contentElements, ...contentStyles].map((filter) => [filter.slug, filter.name]),
);

export const tagLabel = (slug: string) => labels.get(slug) ?? slug;

export type GalleryView = "recent" | "recommended";

export interface GalleryFilter {
  view: GalleryView;
  elements: string[];
  styles: string[];
}

// Unknown, duplicate and reordered slugs all collapse to one canonical filter, so junk URLs
// can't mint new cache entries and the server and filter bar agree on what is selected.
const parseSlugs = (value: string | null | undefined, allowed: ReadonlySet<string>) =>
  [
    ...new Set(
      (value ?? "")
        .split(",")
        .map((slug) => slug.trim().toLowerCase())
        .filter((slug) => allowed.has(slug)),
    ),
  ].toSorted();

export const parseGalleryFilter = (
  get: (key: string) => string | null | undefined,
): GalleryFilter => ({
  elements: parseSlugs(get("element"), elementSlugs),
  styles: parseSlugs(get("style"), styleSlugs),
  view: get("view") === "recommended" ? "recommended" : "recent",
});

export const galleryParams = (filter: GalleryFilter): URLSearchParams => {
  const params = new URLSearchParams();
  if (filter.view !== "recent") {
    params.set("view", filter.view);
  }
  if (filter.elements.length > 0) {
    params.set("element", filter.elements.join(","));
  }
  if (filter.styles.length > 0) {
    params.set("style", filter.styles.join(","));
  }
  return params;
};
