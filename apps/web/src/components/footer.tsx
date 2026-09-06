"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

export const Footer = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-col items-center justify-center gap-5 border-t pt-5 lg:h-16 lg:flex-row lg:pt-0",
        className,
      )}
    >
      <p className="text-sm whitespace-nowrap lg:px-6">©2026 Kaiyu Hsu</p>
      <div className="flex flex-wrap justify-center px-6 lg:w-full">
        <FooterLink href="/about">About</FooterLink>
        <FooterLink href="/inspiration">Inspiration</FooterLink>
      </div>
      <div className="grid w-full grid-cols-3 border-t lg:flex lg:w-auto lg:border-t-0">
        <FooterIcon href="https://github.com/kyh/uicapsule" label="GitHub">
          <svg width="20" height="20" viewBox="0 0 32 32">
            <path
              className="fill-current"
              d="M16.003,0C7.17,0,0.008,7.162,0.008,15.997  c0,7.067,4.582,13.063,10.94,15.179c0.8,0.146,1.052-0.328,1.052-0.752c0-0.38,0.008-1.442,0-2.777  c-4.449,0.967-5.371-2.107-5.371-2.107c-0.727-1.848-1.775-2.34-1.775-2.34c-1.452-0.992,0.109-0.973,0.109-0.973  c1.605,0.113,2.451,1.649,2.451,1.649c1.427,2.443,3.743,1.737,4.654,1.329c0.146-1.034,0.56-1.739,1.017-2.139  c-3.552-0.404-7.286-1.776-7.286-7.906c0-1.747,0.623-3.174,1.646-4.292C7.28,10.464,6.73,8.837,7.602,6.634  c0,0,1.343-0.43,4.398,1.641c1.276-0.355,2.645-0.532,4.005-0.538c1.359,0.006,2.727,0.183,4.005,0.538  c3.055-2.07,4.396-1.641,4.396-1.641c0.872,2.203,0.323,3.83,0.159,4.234c1.023,1.118,1.644,2.545,1.644,4.292  c0,6.146-3.74,7.498-7.304,7.893C19.479,23.548,20,24.508,20,26c0,2,0,3.902,0,4.428c0,0.428,0.258,0.901,1.07,0.746  C27.422,29.055,32,23.062,32,15.997C32,7.162,24.838,0,16.003,0z"
            />
          </svg>
        </FooterIcon>
        <FooterIcon href="https://x.com/kaiyuhsu" label="Twitter">
          <svg width="20" height="20" viewBox="0 0 39 32">
            <path
              className="fill-current"
              d="M0 28.384q0.96 0.096 1.92 0.096 5.632 0 10.048-3.456-2.624-0.032-4.704-1.6t-2.848-4q0.64 0.128 1.504 0.128 1.12 0 2.144-0.288-2.816-0.544-4.64-2.784t-1.856-5.12v-0.096q1.696 0.96 3.68 0.992-1.664-1.088-2.624-2.88t-0.992-3.84q0-2.176 1.12-4.064 3.008 3.744 7.36 5.952t9.28 2.496q-0.224-1.056-0.224-1.856 0-3.328 2.368-5.696t5.728-2.368q3.488 0 5.888 2.56 2.784-0.576 5.12-1.984-0.896 2.912-3.52 4.48 2.336-0.288 4.608-1.28-1.536 2.4-4 4.192v1.056q0 3.232-0.928 6.464t-2.88 6.208-4.64 5.28-6.432 3.68-8.096 1.344q-6.688 0-12.384-3.616z"
            />
          </svg>
        </FooterIcon>
      </div>
    </div>
  );
};

const FooterLink = ({ href, children }: { href: string; children: ReactNode }) => {
  return (
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
};

const FooterIcon = ({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-16 w-full rounded-none border-l lg:w-16"
      render={<Link href={href} target="_blank" />}
      nativeButton={false}
      aria-label={label}
    >
      {children}
    </Button>
  );
};
