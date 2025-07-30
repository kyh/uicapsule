import { Button } from "@repo/ui/button";

import { getContentCategories, getContentComponents } from "@/lib/files";
import { ContentComponentPreview } from "./_components/content-component-preview";

const Page = async () => {
  const content = Object.values(await getContentComponents());
  const categories = await getContentCategories();

  return (
    <main>
      <div className="flex h-14 items-center justify-between border-b bg-[image:var(--background-stripe)] bg-[size:10px_10px] bg-fixed sm:h-16">
        <div className="flex h-full flex-1 items-center gap-3 overflow-y-hidden px-3 sm:px-6">
          {categories.map((category) => (
            <Button key={category} variant="outline" size="sm">
              {category}
            </Button>
          ))}
        </div>
      </div>
      <div className="bg-border grid gap-px border-b md:grid-cols-2 lg:h-auto lg:grid-cols-10 lg:grid-rows-2 lg:*:col-span-2 md:[&>*:first-child]:col-span-2 md:[&>*:first-child]:h-auto lg:[&>*:first-child]:col-span-4 lg:[&>*:first-child]:row-span-2 lg:[&>*:first-child]:h-auto">
        {content.map((c, index) => (
          <ContentComponentPreview
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
