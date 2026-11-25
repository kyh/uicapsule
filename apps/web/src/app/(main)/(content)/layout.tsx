import type { ReactNode } from "react";
import { Header } from "@/components/header";

const Layout = ({ children }: { children: ReactNode }) => (
  <section>
    <Header />
    {children}
  </section>
);

export default Layout;
