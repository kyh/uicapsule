"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@kyh/ui/logo";
import { cn } from "@kyh/ui/utils";
import { ArrowLeft } from "lucide-react";

const links = [
  { href: "/", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export const Nav = () => {
  const pathname = usePathname();

  return (
    <nav className="border-border sticky top-0 flex h-16 w-full items-center justify-between border-b">
      <div className="flex">
        <>
          {pathname.includes("/ui") ? (
            <NavLink href="/" isActive={false}>
              <ArrowLeft className="h-6 w-6" />
              Back
            </NavLink>
          ) : (
            links.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                isActive={pathname === link.href}
              >
                {link.label}
              </NavLink>
            ))
          )}
        </>
      </div>
      <Logo />
    </nav>
  );
};

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  isActive: boolean;
};

export const NavLink = ({ href, children, isActive }: NavLinkProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-2 px-9 py-6 text-lg leading-none hover:text-black md:justify-center",
        isActive ? "text-black" : "text-[#6b6b6b]",
      )}
    >
      <div
        className={cn(
          "aspect-square h-1 rotate-45 bg-black max-md:hidden",
          isActive ? "block" : "hidden",
        )}
      />
      <div
        className={cn(
          "absolute bottom-0 h-1 w-full duration-200 ease-in group-hover:bg-gray-200 max-md:hidden",
          isActive && "bg-black group-hover:bg-black!",
        )}
      />
      {children}
    </Link>
  );
};
