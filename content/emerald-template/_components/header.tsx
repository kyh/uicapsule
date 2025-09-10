"use client";

import React, { useEffect, useState } from "react";
import { buttonVariants } from "@repo/ui/button";
import { cn } from "@repo/ui/utils";
import { useScroll } from "motion/react";

import { Logo } from "./logo";

const baseContainerClassName = "sticky top-0 z-40 w-full bg-transparent";

export const Header = () => {
  const [containerClassName, setContainerClassName] = useState(
    baseContainerClassName,
  );

  const { scrollY } = useScroll();

  useEffect(() => {
    const subscription = scrollY.on("change", () => {
      if (scrollY.get() > 100) {
        setContainerClassName(cn(baseContainerClassName, "backdrop-blur"));
      } else {
        setContainerClassName(baseContainerClassName);
      }
    });
    return () => subscription();
  }, [scrollY]);

  return (
    <header className={containerClassName}>
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
