import { Button } from "@repo/ui/button";

import { ComponentItem } from "@/components/component-item";
import { getContentCategories, getContentComponents } from "@/lib/files";

const Page = async () => {
  const content = Object.values(await getContentComponents());
  const categories = await getContentCategories();

  return (
    <main>
      <div className="flex h-16 items-center justify-between border-b bg-[image:var(--background-stripe)] bg-[size:10px_10px] bg-fixed">
        <div className="flex h-full flex-1 items-center gap-3 overflow-y-hidden pl-6">
          {categories.map((category) => (
            <Button key={category} variant="outline">
              {category}
            </Button>
          ))}
        </div>
      </div>
      <div className="bg-border grid gap-px md:grid-cols-2 lg:h-auto lg:grid-cols-10 lg:grid-rows-2 lg:*:col-span-2 md:[&>*:first-child]:col-span-2 md:[&>*:first-child]:h-auto lg:[&>*:first-child]:col-span-4 lg:[&>*:first-child]:row-span-2 lg:[&>*:first-child]:h-auto">
        {content.slice(0, 7).map((c) => (
          <ComponentItem
            key={c.name}
            slug={c.slug}
            name={c.name}
            coverUrl={c.coverUrl}
            coverType={c.coverType}
          />
        ))}
      </div>
      <div className="bg-border grid gap-px border-t md:grid-cols-2 lg:grid-cols-3 lg:*:h-auto">
        {content.slice(7).map((c) => (
          <ComponentItem
            key={c.name}
            slug={c.slug}
            name={c.name}
            coverUrl={c.coverUrl}
            coverType={c.coverType}
          />
        ))}
      </div>
    </main>
  );
};

export default Page;
