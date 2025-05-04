import { Button } from "@kyh/ui/button";
import { SearchIcon } from "lucide-react";

import { ComponentItem } from "@/components/component-item";
import { listContentComponents } from "@/lib/files";

const categories = [
  "All",
  "Calculator",
  "Clock",
  "Gaming",
  "Radio",
  "Recorder",
  "Speaker",
];

const Page = async () => {
  const content = await listContentComponents();

  return (
    <main>
      <div className="flex h-16 items-center justify-between border-b">
        <div className="flex h-full flex-1 items-center gap-3 overflow-y-hidden pl-6">
          {categories.map((category) => (
            <Button key={category} variant="outline">
              {category}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-full w-20 rounded-none border-l"
        >
          <SearchIcon />
        </Button>
      </div>
      <div className="bg-border grid gap-px md:grid-cols-2 lg:h-auto lg:grid-cols-10 lg:grid-rows-2 lg:*:col-span-2 md:[&>*:first-child]:col-span-2 md:[&>*:first-child]:h-auto lg:[&>*:first-child]:col-span-4 lg:[&>*:first-child]:row-span-2 lg:[&>*:first-child]:h-auto">
        {content.slice(0, 7).map((c, key) => (
          <ComponentItem slug={c.slug} name={c.name} key={key} />
        ))}
      </div>
      <div className="bg-border grid gap-px border-t md:grid-cols-2 lg:grid-cols-3 lg:*:h-auto">
        {content.slice(7).map((c, key) => (
          <ComponentItem slug={c.slug} name={c.name} key={key} />
        ))}
      </div>
    </main>
  );
};

export default Page;
