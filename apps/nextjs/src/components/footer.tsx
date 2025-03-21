"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import cn from "clsx";
import { Facebook, Instagram, Twitter } from "lucide-react";

type FooterIconProps = {
  href: string;
  icon: React.ReactNode;
};

type footerLinkProps = {
  href: string;
  children: React.ReactNode;
};

export const Footer = () => {
  return (
    <div className="border-border flex flex-col items-center justify-center border-t max-lg:gap-8 max-lg:pt-10 lg:h-20 lg:flex-row lg:justify-between lg:pl-6">
      <p className="text-[#696969] lg:w-56">©2023 dieter</p>

      <div className="flex flex-wrap justify-center gap-6 px-6 max-lg:w-full lg:flex-nowrap lg:gap-10">
        <FooterLink href="/faq">FAQ</FooterLink>
        <FooterLink href="/returns-policy">Returns Policy</FooterLink>
        <FooterLink href="/terms-and-conditions">
          Terms and Conditions
        </FooterLink>
        <FooterLink href="/contact">Contact</FooterLink>
      </div>

      <div className="border-border grid grid-cols-3 border-t max-lg:w-full lg:flex lg:border-t-0">
        <FooterIcon href="https://www.instagram.com/" icon={<Instagram />} />
        <FooterIcon
          href="https://twitter.com/"
          icon={<Twitter fill="currentColor" />}
        />
        <FooterIcon
          href="https://www.facebook.com/"
          icon={<Facebook fill="currentColor" stroke="transparent" />}
        />
      </div>
    </div>
  );
};

const FooterLink = ({ href, children }: footerLinkProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "text-[#333] hover:underline",
        usePathname() === href && "underline",
      )}
    >
      {children}
    </Link>
  );
};

const FooterIcon = ({ href, icon }: FooterIconProps) => {
  return (
    <Link
      href={href}
      className="border-border flex h-20 items-center justify-center border-l lg:w-20"
      target="_blank"
    >
      {icon}
    </Link>
  );
};
