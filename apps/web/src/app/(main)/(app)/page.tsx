import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  contentElements,
  contentStyles,
  parseGalleryFilter,
} from "@/lib/content/content-categories";
import type { ContentFilter, GalleryFilter } from "@/lib/content/content-categories";
import { Button } from "@repo/ui/components/button";

import { resolveCover } from "@/lib/assets";
import { getContentList, getFilterCounts } from "@/lib/content-data";
import { ContentPreview, ContentPreviewSkeleton } from "./_components/content-preview";
import { FilterBar } from "./_components/filter-bar";
import type { Facet } from "./_components/filter-bar";

// Filtered views are the same gallery; point them all at the root.
export const metadata: Metadata = { alternates: { canonical: "/" } };

type Props = Pick<PageProps<"/">, "searchParams">;

const skeletonIds = Array.from({ length: 14 }, (_, index) => `placeholder-${index}`);

const parseFilter = async (searchParams: Props["searchParams"]): Promise<GalleryFilter> => {
  const params = await searchParams;
  return parseGalleryFilter((key) => params[key]?.toString());
};

const withCounts = (options: ContentFilter[], counts: Record<string, number>) =>
  options.map((option) => ({ ...option, count: counts[option.slug] ?? 0 }));

const Filters = async ({ searchParams }: Props) => {
  const filter = await parseFilter(searchParams);
  const counts = await getFilterCounts(filter);

  const facets: Facet[] = [
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

  return (
    <div className="flex h-full flex-1 items-center gap-3 overflow-x-auto px-3 sm:px-6">
      <FilterBar facets={facets} />
    </div>
  );
};

const ContentList = async ({ searchParams }: Props) => {
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
      cover={resolveCover(c.cover)}
    />
  ));
};

const Page = ({ searchParams }: PageProps<"/">) => {
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
