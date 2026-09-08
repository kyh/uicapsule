import { type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@repo/ui/components/logo";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Sign in to UICapsule.",
};

type LayoutProps = {
  children: ReactNode;
};

const Layout = (props: LayoutProps) => (
  <div className="relative container grid min-h-dvh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
    <div className="bg-muted relative hidden h-full flex-col px-8 py-4 text-white md:py-10 lg:flex dark:border-r">
      <div className="absolute inset-0 bg-zinc-900" />
      <Link className="relative z-20 flex items-center" href="/">
        <Logo />
      </Link>
      <div className="relative z-20 mt-auto">
        <p className="max-w-md text-lg">
          A curated collection of components that spark joy, by a Human & AI. Read the source, make
          them yours.
        </p>
      </div>
    </div>
    <div className="lg:p-8">{props.children}</div>
  </div>
);

export default Layout;
