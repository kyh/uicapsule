import { ChevronDownIcon } from "lucide-react";

import {
  contentCategories,
  contentElements,
  contentStyles,
  getContentComponents,
} from "@/lib/content";
import { ContentComponentPreview } from "./_components/content-component-preview";
import { FilterComboBox } from "./_components/filter-combo-box";

const Page = async () => {
  const content = Object.values(await getContentComponents());

  return (
    <main>
      <div className="flex h-14 items-center justify-between border-b bg-[image:var(--background-stripe)] bg-[size:10px_10px] bg-fixed sm:h-16">
        <div className="flex h-full flex-1 items-center gap-3 px-3 sm:px-6">
          <FilterComboBox
            filterKey="category"
            filterOptions={contentCategories}
          >
            Categories <ChevronDownIcon className="size-4" />
          </FilterComboBox>
          <FilterComboBox filterKey="style" filterOptions={contentStyles}>
            Styles <ChevronDownIcon className="size-4" />
          </FilterComboBox>
          <FilterComboBox filterKey="element" filterOptions={contentElements}>
            Elements <ChevronDownIcon className="size-4" />
          </FilterComboBox>
        </div>
      </div>
      <div className="bg-border grid gap-px border-b md:h-auto md:grid-cols-10 md:grid-rows-2 md:*:col-span-2 md:[&>*:nth-child(10n+1)]:col-span-4 md:[&>*:nth-child(10n+1)]:row-span-2 md:[&>*:nth-child(10n+1)]:h-auto">
        {content.map((c, index) => (
          <ContentComponentPreview
            key={c.slug}
            slug={c.slug}
            name={c.name}
            index={index}
            coverUrl={c.coverUrl}
            coverType={c.coverType}
          />
        ))}
      </div>
    </main>
  );
};

export default Page;
