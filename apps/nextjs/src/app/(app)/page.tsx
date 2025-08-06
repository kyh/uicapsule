import { Button } from "@repo/ui/button";

import { getContentCategories, getContentComponents } from "@/lib/content";
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
