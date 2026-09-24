"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@repo/ui/components/button";

import {
  contentElements,
  contentStyles,
  parseGalleryFilter,
} from "@/lib/content/content-categories";
import type { ContentFilter, GalleryFilter } from "@/lib/content/content-categories";
import { countFilters, DEFAULT_GALLERY_FILTER, filterGallery } from "@/lib/content/gallery";
import type { GalleryCard } from "@/lib/content/gallery";
import { ContentPreview } from "./content-preview";
import { FilterBar } from "./filter-bar";
import type { Facet } from "./filter-bar";

const gridClassname =
  "bg-border grid gap-px md:h-auto md:grid-cols-10 md:grid-rows-2 md:*:col-span-2 md:[&>*:nth-child(10n+1)]:col-span-4 md:[&>*:nth-child(10n+1)]:row-span-2 md:[&>*:nth-child(10n+1)]:h-auto";

const withCounts = (options: ContentFilter[], counts: Record<string, number>) =>
  options.map((option) => ({ ...option, count: counts[option.slug] ?? 0 }));

const facetsFor = (cards: GalleryCard[], filter: GalleryFilter): Facet[] => {
  const counts = countFilters(cards, filter);
  return [
    {
      defaultOption: { name: "Recently added" },
      key: "view",
      label: "Recently added",
      mode: "single",
      options: [{ name: "Recommended", slug: "recommended" }],
      searchable: false,
      standalone: true,
    },
    {
      key: "element",
      label: "Components",
      mode: "multi",
      options: withCounts(contentElements, counts.elements),
      searchable: true,
    },
    {
      key: "style",
      label: "Styles",
      mode: "multi",
      options: withCounts(contentStyles, counts.styles),
      searchable: true,
    },
  ];
};

// Search params are unknown at prerender, so reading them suspends. Only this leaf suspends;
// the grid above stays in the static shell and re-renders in place once the URL is known,
// instead of being client-rendered from scratch.
const UrlFilter = ({ onChange }: { onChange: (filter: GalleryFilter) => void }) => {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  useEffect(() => {
    const params = new URLSearchParams(query);
    onChange(parseGalleryFilter((key) => params.get(key)));
  }, [query, onChange]);
  return null;
};

export const Gallery = ({ cards }: { cards: GalleryCard[] }) => {
  const [filter, setFilter] = useState(DEFAULT_GALLERY_FILTER);
  const visible = filterGallery(cards, filter);

  return (
    <main>
      <Suspense>
        <UrlFilter onChange={setFilter} />
      </Suspense>
      <div className="flex h-14 items-center justify-between border-b bg-(image:--background-stripe) bg-size-[10px_10px] bg-fixed sm:h-16">
        <div className="flex h-full flex-1 items-center gap-3 overflow-x-auto px-3 sm:px-6">
          <FilterBar facets={facetsFor(cards, filter)} filter={filter} />
        </div>
      </div>
      <div className={gridClassname}>
        {visible.length === 0 ? (
          <div className="bg-background text-muted-foreground col-span-full! flex min-h-[calc(100dvh-(--spacing(48)))] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <h1>No content found with the selected filters.</h1>
              <Button variant="outline" render={<Link href="/" />} nativeButton={false}>
                Reset Filters
              </Button>
            </div>
          </div>
        ) : (
          visible.map((card, index) => (
            <ContentPreview
              key={card.slug}
              slug={card.slug}
              name={card.name}
              index={index}
              tags={card.tags}
              isNew={card.isNew}
              cover={card.cover}
            />
          ))
        )}
      </div>
    </main>
  );
};
