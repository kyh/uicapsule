"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export const FooterLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link
    href={href}
    className="hover:text-primary relative flex items-center px-6 py-2 text-sm transition lg:py-0"
  >
    <div
      className={cn(
        "bg-primary absolute left-3 aspect-square h-1 rotate-45",
        usePathname() === href ? "block" : "hidden",
      )}
    />
    {children}
  </Link>
);
