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
