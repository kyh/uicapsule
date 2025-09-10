import React from "react";

import { Logo } from "./logo";
import { WaitlistForm } from "./waitlist-form";

export const Footer = () => {
  return (
    <footer className="mt-20 border-t border-white/10 text-sm sm:mt-24">
      <div className="mx-auto max-w-5xl px-5 py-10 md:pt-16 md:pb-12">
        <div className="flex w-full justify-between pb-10 md:pb-12">
          <div className="hidden md:block">
            <Logo />
          </div>
          <div className="flex w-full justify-between md:w-auto md:gap-20">
            <ul className="flex flex-col gap-2">
              <p className="text-muted-foreground">Resources</p>
              <li>
                <a href="/docs">Documentation</a>
              </li>
              <li>
                <a href="/blog">Blog</a>
              </li>
            </ul>
            <ul className="flex flex-col gap-2">
              <p className="text-muted-foreground">Company</p>
              <li>
                <a href="/about">About</a>
              </li>
              <li>
                <a href="/terms">Terms of Use</a>
              </li>
              <li>
                <a href="/privacy">Privacy Policy</a>
              </li>
            </ul>
            <ul className="flex flex-col gap-2">
              <p className="text-muted-foreground">Support</p>
              <li>
                <a href="/help">Help center</a>
              </li>
              <li>
                <a href="/contact">Contact</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-5 border-t border-white/10 py-8 md:flex-row">
          <div className="w-full md:w-[30%]">
            <p>
              Subscribe to receive our latest updates right to your inbox 🚀
            </p>
          </div>
          <div className="flex items-center gap-2 md:ml-auto">
            <WaitlistForm />
          </div>
        </div>
        <SmallPrint />
      </div>
    </footer>
  );
};

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M16.712 6.652c.01.146.01.29.01.436 0 4.449-3.267 9.579-9.242 9.579v-.003a8.963 8.963 0 0 1-4.98-1.509 6.379 6.379 0 0 0 4.807-1.396c-1.39-.027-2.608-.966-3.035-2.337.487.097.99.077 1.467-.059-1.514-.316-2.606-1.696-2.606-3.3v-.041c.45.26.956.404 1.475.42C3.18 7.454 2.74 5.486 3.602 3.947c1.65 2.104 4.083 3.382 6.695 3.517a3.446 3.446 0 0 1 .94-3.217 3.172 3.172 0 0 1 4.596.148 6.38 6.38 0 0 0 2.063-.817 3.357 3.357 0 0 1-1.428 1.861 6.283 6.283 0 0 0 1.865-.53 6.735 6.735 0 0 1-1.62 1.744Z" />
    </svg>
  );
};

const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 1.667c-4.605 0-8.334 3.823-8.334 8.544 0 3.78 2.385 6.974 5.698 8.106.417.075.573-.182.573-.406 0-.203-.011-.875-.011-1.592-2.093.397-2.635-.522-2.802-1.002-.094-.246-.5-1.005-.854-1.207-.291-.16-.708-.556-.01-.567.656-.01 1.124.62 1.281.876.75 1.292 1.948.93 2.427.705.073-.555.291-.93.531-1.143-1.854-.213-3.791-.95-3.791-4.218 0-.929.322-1.698.854-2.296-.083-.214-.375-1.09.083-2.265 0 0 .698-.224 2.292.876a7.576 7.576 0 0 1 2.083-.288c.709 0 1.417.096 2.084.288 1.593-1.11 2.291-.875 2.291-.875.459 1.174.167 2.05.084 2.263.53.599.854 1.357.854 2.297 0 3.278-1.948 4.005-3.802 4.219.302.266.563.78.563 1.58 0 1.143-.011 2.061-.011 2.35 0 .224.156.491.573.405a8.365 8.365 0 0 0 4.11-3.116 8.707 8.707 0 0 0 1.567-4.99c0-4.721-3.73-8.545-8.334-8.545Z"
      />
    </svg>
  );
};

const SocialLink = ({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) => {
  return (
    <a href={href} className="group">
      <span className="sr-only">{children}</span>
      <Icon className="h-5 w-5 fill-zinc-700 transition group-hover:fill-zinc-900 dark:group-hover:fill-zinc-500" />
    </a>
  );
};

export const SmallPrint = () => {
  return (
    <div className="flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 sm:flex-row">
      <p className="text-xs text-zinc-400">
        &copy; Copyright {new Date().getFullYear()}. All rights reserved.
      </p>
      <div className="flex gap-4">
        <SocialLink href={""} icon={TwitterIcon}>
          Follow us on Twitter
        </SocialLink>
        <SocialLink href={""} icon={GitHubIcon}>
          Follow us on GitHub
        </SocialLink>
      </div>
    </div>
  );
};
