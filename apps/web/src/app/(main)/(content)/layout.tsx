import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { SiteFrame } from "@/components/site-frame";

const Layout = ({ children }: { children: ReactNode }) => (
  <SiteFrame>
    <Header />
    {children}
  </SiteFrame>
);

export default Layout;
