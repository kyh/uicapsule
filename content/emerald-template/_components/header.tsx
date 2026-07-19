"use client";

import { useEffect, useState } from "react";
import { buttonVariants } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { useScroll } from "motion/react";

import { Logo } from "./logo";

/** Scroll offset past which the header gains its translucent backdrop. */
const BLUR_SCROLL_THRESHOLD = 100;

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  const { scrollY } = useScroll();

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setIsScrolled(latest > BLUR_SCROLL_THRESHOLD);
    });
    return unsubscribe;
  }, [scrollY]);

  return (
    <header
      className={cn("sticky top-0 z-40 w-full bg-transparent", isScrolled && "backdrop-blur")}
    >
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-5">
        <div className="flex-1">
          <a href="/">
            <Logo />
          </a>
        </div>
        <nav className="flex flex-1 justify-center">
          <ul className="flex gap-3 text-sm md:gap-8">
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/docs">Documentation</a>
            </li>
          </ul>
        </nav>
        <div className="flex flex-1 justify-end">
          <a
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "ml-4 w-24 rounded-full px-5",
            )}
            href="/auth/login"
          >
            Login
          </a>
        </div>
      </div>
    </header>
  );
};
