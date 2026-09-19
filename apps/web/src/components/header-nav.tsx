"use client";

import Link from "next/link";
import { Logo } from "@repo/ui/components/logo";
import { cn } from "cn";
import { useWebHaptics } from "web-haptics/react";
import type { SearchEntry } from "@/lib/content-data";
import { SearchButton } from "@/components/search-button";
import { ProfileButton } from "@/components/profile-button";

interface HeaderNavProps {
  className?: string;
  searchEntries: SearchEntry[];
}

export const HeaderNav = ({ className, searchEntries }: HeaderNavProps) => {
  const { trigger } = useWebHaptics();
  return (
    <nav
      className={cn(
        "flex h-16 w-full grid-cols-3 items-center gap-2 px-3 sm:grid sm:px-6",
        className,
      )}
    >
      <div className="flex items-center justify-start gap-2">
        <Link href="/" aria-label="UICapsule home" onClick={() => trigger("selection")}>
          <Logo />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center gap-2">
        <SearchButton searchEntries={searchEntries} />
      </div>
      <div className="flex items-center justify-end gap-2">
        <ProfileButton />
      </div>
    </nav>
  );
};
