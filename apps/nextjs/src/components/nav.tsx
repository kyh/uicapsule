"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@init/ui/logo";
import cn from "clsx";
import { ArrowLeft } from "lucide-react";

import { NavLink } from "./nav-link";

export const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const links = [
    { href: "/", label: "Products" },
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-10 w-full">
      <div className="border-border relative z-10 flex h-20 w-full items-center justify-between border-b max-md:px-6 md:pr-6">
        <div className="flex h-full flex-row gap-px pr-px max-md:hidden">
          <>
            {pathname === "/products" ? (
              <NavLink href="/" setIsOpen={setIsOpen} isActive={false}>
                <ArrowLeft className="h-6 w-6" />
                Back
              </NavLink>
            ) : (
              links.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  setIsOpen={setIsOpen}
                  isActive={pathname === link.href}
                >
                  {link.label}
                </NavLink>
              ))
            )}
          </>
        </div>
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="text-black focus:outline-hidden"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path d="M6 18L18 6M6 6l12 12"></path>
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              )}
            </svg>
          </button>
        </div>
        <Logo />
      </div>
      <MobileMenu
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        links={links}
        pathname={pathname}
      />
    </nav>
  );
};

type MobileMenuProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  links: { href: string; label: string }[];
  pathname: string;
};

const MobileMenu = ({
  isOpen,
  setIsOpen,
  links,
  pathname,
}: MobileMenuProps) => {
  return (
    <div
      className={cn(
        "absolute top-0 left-0 flex h-screen w-full flex-col border-b-2 pt-24 transition-all duration-500 ease-in-out md:hidden",
        isOpen ? "translate-y-0" : "-translate-y-full",
      )}
    >
      {links.map((link) => (
        <NavLink
          key={link.href}
          href={link.href}
          setIsOpen={setIsOpen}
          isActive={pathname === link.href}
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  );
};
