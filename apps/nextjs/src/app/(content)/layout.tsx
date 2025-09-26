import type { ReactNode } from "react";

import { Header } from "@/components/layout";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <section className="mx-auto max-w-[1440px]">
      <Header />
      {children}
    </section>
  );
};

export default Layout;
