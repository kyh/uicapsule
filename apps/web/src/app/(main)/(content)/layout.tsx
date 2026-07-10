import { type ReactNode } from "react";
import { Header } from "@/components/layout";
import { getSearchEntries } from "@/lib/content-data";

const Layout = async ({ children }: { children: ReactNode }) => {
  return (
    <section className="mx-auto max-w-[1440px]">
      <Header searchEntries={await getSearchEntries()} />
      {children}
    </section>
  );
};

export default Layout;
