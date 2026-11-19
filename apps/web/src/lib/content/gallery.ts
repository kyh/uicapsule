import { elementSlugs, styleSlugs } from "./content-categories";
import type { GalleryFilter } from "./content-categories";

import type { Cover } from "@/lib/assets";

export interface GalleryCard {
  slug: string;
  name: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  cover?: Cover;
}

export const DEFAULT_GALLERY_FILTER: GalleryFilter = { elements: [], styles: [], view: "recent" };

const matchesFilter = ({ tags }: GalleryCard, filter: GalleryFilter) => {
  const matchesAxis = (selection: string[]) =>
    selection.length === 0 || selection.some((slug) => tags.includes(slug));

  return matchesAxis(filter.elements) && matchesAxis(filter.styles);
};

const visibleCards = (cards: GalleryCard[], filter: GalleryFilter) =>
  cards.filter((card) => matchesFilter(card, filter));

export const filterGallery = (cards: GalleryCard[], filter: GalleryFilter) => {
  const visible = visibleCards(cards, filter);

  return filter.view === "recommended"
    ? visible.toSorted((a, b) => Number(b.featured) - Number(a.featured))
    : visible;
};

export interface FilterCounts {
  elements: Record<string, number>;
  styles: Record<string, number>;
}

export const countFilters = (cards: GalleryCard[], filter: GalleryFilter) => {
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
