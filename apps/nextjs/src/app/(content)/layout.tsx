import type { ReactNode } from "react";

import { Header } from "@/components/layout";
import { getContentComponents } from "@/lib/content";

export const runtime = "nodejs";

const Layout = async ({ children }: { children: ReactNode }) => {
  const content = Object.values(await getContentComponents());
  const searchEntries = content.map((component) => ({
    slug: component.slug,
    name: component.name,
    description: component.description ?? "",
    tags: component.tags ?? [],
  }));

  return (
    <section className="mx-auto max-w-[1440px]">
      <Header searchEntries={searchEntries} />
      {children}
    </section>
  );
};

export default Layout;
