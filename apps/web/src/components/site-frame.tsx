import type { ReactNode } from "react";

export const SiteFrame = ({ children }: { children: ReactNode }) => (
  <section className="shadow-border mx-auto max-w-[1440px] shadow-[0_0_0_1px]">{children}</section>
);
