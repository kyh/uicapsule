import { Suspense } from "react";
import Link from "next/link";
import {
  contentElements,
  contentStyles,
  type ContentFilter,
} from "@/lib/content/content-categories";
import { Button } from "@repo/ui/components/button";

import { getContentList, getFilterCounts, type GalleryFilter } from "@/lib/content-data";
import { ContentPreview, ContentPreviewSkeleton } from "./_components/content-preview";
import { FilterBar, type Facet } from "./_components/filter-bar";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
  searchParams: SearchParams;
};

const skeletonIds = Array.from({ length: 14 }, (_, index) => `placeholder-${index}`);

const Page = ({ searchParams }: PageProps) => {
  const contentContainerClassname =
    "bg-border grid gap-px md:h-auto md:grid-cols-10 md:grid-rows-2 md:*:col-span-2 md:[&>*:nth-child(10n+1)]:col-span-4 md:[&>*:nth-child(10n+1)]:row-span-2 md:[&>*:nth-child(10n+1)]:h-auto";

  return (
    <main>
      <div className="flex h-14 items-center justify-between border-b bg-(image:--background-stripe) bg-size-[10px_10px] bg-fixed sm:h-16">
        <Suspense>
          <Filters searchParams={searchParams} />
        </Suspense>
      </div>
      <Suspense
        fallback={
          <div className={contentContainerClassname}>
            {skeletonIds.map((id) => (
              <ContentPreviewSkeleton key={id} />
            ))}
          </div>
        }
      >
        <div className={contentContainerClassname}>
          <ContentList searchParams={searchParams} />
        </div>
      </Suspense>
    </main>
  );
};

export default Page;

const withCounts = (options: ContentFilter[], counts: Record<string, number>) =>
  options.map((option) => ({ ...option, count: counts[option.slug] ?? 0 }));

const Filters = async ({ searchParams }: PageProps) => {
  const filter = await parseFilter(searchParams);
  const counts = await getFilterCounts(filter);

  const facets: Facet[] = [
    {
      key: "view",
      label: "Recently added",
      mode: "single",
      searchable: false,
      defaultOption: { name: "Recently added" },
      options: [{ name: "Recommended", slug: "recommended" }],
    },
    {
      key: "element",
      label: "Components",
      mode: "multi",
      searchable: true,
      options: withCounts(contentElements, counts.elements),
    },
    {
      key: "style",
      label: "Styles",
      mode: "multi",
      searchable: true,
      options: withCounts(contentStyles, counts.styles),
    },
  ];

  return (
    <div className="flex h-full flex-1 items-center gap-3 overflow-x-auto px-3 sm:px-6">
      <FilterBar facets={facets} />
    </div>
  );
};

const ContentList = async ({ searchParams }: PageProps) => {
  const filter = await parseFilter(searchParams);
  const content = await getContentList(filter);

  if (content.length === 0) {
    return (
      <div className="bg-background text-muted-foreground col-span-full! flex min-h-[calc(100dvh-(--spacing(48)))] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <h1>No content found with the selected filters.</h1>
          <Button variant="outline" render={<Link href="/" />} nativeButton={false}>
            Reset Filters
          </Button>
        </div>
      </div>
    );
  }

  return content.map((c, index) => (
    <ContentPreview
      key={c.slug}
      slug={c.slug}
      name={c.name}
      index={index}
      tags={c.tags}
      isNew={c.isNew}
      coverUrl={c.coverUrl}
      coverType={c.coverType}
    />
  ));
};

const parseFilter = async (searchParams: SearchParams): Promise<GalleryFilter> => {
  const params = await searchParams;
  const slugs = (key: string) =>
    (params[key]?.toString() ?? "")
      .split(",")
      .map((slug) => slug.trim().toLowerCase())
      .filter(Boolean);

  return {
    view: params.view?.toString() === "recommended" ? "recommended" : "recent",
    elements: slugs("element"),
    styles: slugs("style"),
  };
};
