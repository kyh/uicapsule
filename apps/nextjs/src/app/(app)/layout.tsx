import type { ReactNode } from "react";

import { Footer, Header } from "@/components/layout";
import { getContentComponents } from "@/lib/content";

const Layout = async ({ children }: { children: ReactNode }) => {
  const content = Object.values(await getContentComponents());
  const searchEntries = content.map((component) => ({
    slug: component.slug,
    name: component.name,
    description: component.description ?? "",
    tags: component.tags ?? [],
  }));

  return (
    <section className="shadow-border mx-auto max-w-[1440px] shadow-[0_0_0_1px]">
      <Header
        className="bg-background sticky top-0 z-10 border-b"
        searchEntries={searchEntries}
      />
      {children}
      <Footer />
    </section>
  );
};

export default Layout;
