import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SiteFrame } from "@/components/site-frame";

const Layout = ({ children }: { children: ReactNode }) => (
  <SiteFrame>
    <Header className="bg-background sticky top-0 z-10 border-b" />
    {children}
    <Footer />
  </SiteFrame>
);

export default Layout;
