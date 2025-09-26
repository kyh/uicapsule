import type { ReactNode } from "react";

import { Header } from "@/components/layout";
import { getSearchEntries } from "@/lib/search";

export const runtime = "nodejs";

const Layout = async ({ children }: { children: ReactNode }) => {
  const searchEntries = await getSearchEntries();

  return (
    <section className="mx-auto max-w-[1440px]">
      <Header searchEntries={searchEntries} />
      {children}
    </section>
  );
};

export default Layout;
