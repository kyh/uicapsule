import Link from "next/link";
import {
  contentCategories,
  contentElements,
  contentStyles,
} from "@repo/api/content/content-categories";
import { Button } from "@repo/ui/button";

import { caller } from "@/trpc/server";
import { ContentPreview } from "./_components/content-preview";
import { FilterComboBox } from "./_components/filter-combo-box";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const Page = async ({ searchParams }: PageProps) => {
  const allSearchParams = await searchParams;
  const elementFilter = allSearchParams.element?.toString().split(",") ?? [];
  const styleFilter = allSearchParams.style?.toString().split(",") ?? [];
  const categoryFilter = allSearchParams.category?.toString().split(",") ?? [];
  const filters = [elementFilter, styleFilter, categoryFilter].flat();
  const content = await caller.content.list({
    filterTags: filters,
  });

  return (
    <main>
      <div className="flex h-14 items-center justify-between border-b bg-[image:var(--background-stripe)] bg-[size:10px_10px] bg-fixed sm:h-16">
        <div className="flex h-full flex-1 items-center gap-3 px-3 sm:px-6">
          <FilterComboBox
            filterKey="element"
            filterOptions={contentElements}
            highlighted={elementFilter.length > 0}
            defaultLabel="Elements"
          />
          <FilterComboBox
            filterKey="style"
            filterOptions={contentStyles}
            highlighted={styleFilter.length > 0}
            defaultLabel="Styles"
          />
          <FilterComboBox
            filterKey="category"
            filterOptions={contentCategories}
            highlighted={categoryFilter.length > 0}
            defaultLabel="Categories"
          />
        </div>
      </div>
      <div className="bg-border grid gap-px border-b md:h-auto md:grid-cols-10 md:grid-rows-2 md:*:col-span-2 md:[&>*:nth-child(10n+1)]:col-span-4 md:[&>*:nth-child(10n+1)]:row-span-2 md:[&>*:nth-child(10n+1)]:h-auto">
        {content.length === 0 && (
          <div className="bg-background text-muted-foreground col-span-full! flex min-h-[calc(100dvh-theme(spacing.48))] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <h1>No content found with the selected filters.</h1>
              <Button variant="outline" asChild>
                <Link href="/">Reset Filters</Link>
              </Button>
            </div>
          </div>
        )}
        {content.map((c, index) => (
          <ContentPreview
            key={c.slug}
            slug={c.slug}
            name={c.name}
            index={index}
            tags={c.tags ?? []}
            coverUrl={c.coverUrl}
            coverType={c.coverType}
          />
        ))}
      </div>
    </main>
  );
};

export default Page;
