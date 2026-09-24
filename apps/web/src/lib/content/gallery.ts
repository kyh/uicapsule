import { elementSlugs, styleSlugs } from "./content-categories";
import type { GalleryFilter } from "./content-categories";

import type { Cover } from "@/lib/assets";

// Pure and client-safe: the gallery ships every card in the static shell and filters in the
// browser, so a filter change never waits on the server.

export interface GalleryCard {
  slug: string;
  name: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  cover?: Cover;
}

export const DEFAULT_GALLERY_FILTER: GalleryFilter = { elements: [], styles: [], view: "recent" };

// Selections within an axis are OR'd; the axes themselves are AND'd.
const matchesFilter = ({ tags }: GalleryCard, filter: GalleryFilter) => {
  const matchesAxis = (selection: string[]) =>
    selection.length === 0 || selection.some((slug) => tags.includes(slug));
  return matchesAxis(filter.elements) && matchesAxis(filter.styles);
};

const visibleCards = (cards: GalleryCard[], filter: GalleryFilter) =>
  cards.filter((card) => matchesFilter(card, filter));

// Cards arrive newest-first; a view only reorders, never hides.
export const filterGallery = (cards: GalleryCard[], filter: GalleryFilter): GalleryCard[] => {
  const visible = visibleCards(cards, filter);
  return filter.view === "recommended"
    ? visible.toSorted((a, b) => Number(b.featured) - Number(a.featured))
    : visible;
};

export interface FilterCounts {
  elements: Record<string, number>;
  styles: Record<string, number>;
}

// Each axis is counted against the other axes' selection so no option leads to an empty gallery.
export const countFilters = (cards: GalleryCard[], filter: GalleryFilter): FilterCounts => {
  const countBy = (
    slugs: ReadonlySet<string>,
    withSlug: (slug: string) => Partial<GalleryFilter>,
  ) =>
    Object.fromEntries(
      [...slugs].map((slug) => [
        slug,
        visibleCards(cards, { ...filter, ...withSlug(slug) }).length,
      ]),
    );

  return {
    elements: countBy(elementSlugs, (slug) => ({ elements: [slug] })),
    styles: countBy(styleSlugs, (slug) => ({ styles: [slug] })),
  };
};
