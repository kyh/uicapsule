import { type ReactNode } from "react";
import { Footer, Header } from "@/components/layout";
import { getSearchEntries } from "@/lib/content-data";

const Layout = async ({ children }: { children: ReactNode }) => {
  return (
    <section className="shadow-border mx-auto max-w-[1440px] shadow-[0_0_0_1px]">
      <Header
        className="bg-background sticky top-0 z-10 border-b"
        searchEntries={await getSearchEntries()}
      />
      {children}
      <Footer />
    </section>
  );
};

export default Layout;
