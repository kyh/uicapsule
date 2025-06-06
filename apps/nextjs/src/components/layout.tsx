"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileAvatar } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@repo/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  dropdownMenuItemVariants,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Logo } from "@repo/ui/logo";
import { cn, useMediaQuery } from "@repo/ui/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowUpRightIcon,
  BookCheckIcon,
  CircleFadingPlusIcon,
  FileInputIcon,
  FolderPlusIcon,
  GlobeLockIcon,
  HandshakeIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

import { useTRPC } from "@/trpc/react";

export const Nav = () => {
  return (
    <nav className="bg-background sticky top-0 z-10 grid h-16 w-full grid-cols-3 items-center gap-2 border-b px-6">
      <div className="flex items-center justify-start gap-2">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <div className="flex items-center justify-center gap-2">
        <SearchButton />
      </div>
      <div className="flex items-center justify-end gap-2">
        <ProfileButton />
      </div>
    </nav>
  );
};

const SearchButton = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <button
        className="border-input bg-muted flex h-9 w-full rounded-full border px-3 py-2 shadow-xs transition"
        onClick={() => setSearchOpen(true)}
      >
        <span className="flex grow items-center gap-1">
          <SearchIcon
            className="text-muted-foreground size-4"
            aria-hidden="true"
          />
          <span className="text-muted-foreground text-sm">Search</span>
        </span>
        <kbd className="bg-background text-muted-foreground inline-flex h-full items-center rounded border px-1 text-xs font-medium">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick start">
            <CommandItem>
              <FolderPlusIcon
                size={16}
                className="opacity-60"
                aria-hidden="true"
              />
              <span>New folder</span>
              <CommandShortcut className="justify-center">⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <FileInputIcon
                size={16}
                className="opacity-60"
                aria-hidden="true"
              />
              <span>Import document</span>
              <CommandShortcut className="justify-center">⌘I</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <CircleFadingPlusIcon
                size={16}
                className="opacity-60"
                aria-hidden="true"
              />
              <span>Add block</span>
              <CommandShortcut className="justify-center">⌘B</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            <CommandItem>
              <ArrowUpRightIcon
                size={16}
                className="opacity-60"
                aria-hidden="true"
              />
              <span>Go to dashboard</span>
            </CommandItem>
            <CommandItem>
              <ArrowUpRightIcon
                size={16}
                className="opacity-60"
                aria-hidden="true"
              />
              <span>Go to apps</span>
            </CommandItem>
            <CommandItem>
              <ArrowUpRightIcon
                size={16}
                className="opacity-60"
                aria-hidden="true"
              />
              <span>Go to connections</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export const ProfileButton = () => {
  const trpc = useTRPC();
  const {
    data: { user },
  } = useSuspenseQuery(trpc.auth.workspace.queryOptions());
  const isDesktop = useMediaQuery();

  const [open, setOpen] = useState(false);

  const menuItemClassName = dropdownMenuItemVariants({
    className: "w-full justify-start h-10",
  });

  const menuItems = [
    {
      id: "profile",
      condition: user,
      wrap: true,
      content: (
        <Link
          className={menuItemClassName}
          href={`/profile/${user?.id}`}
          onClick={() => setOpen(false)}
        >
          <UserIcon aria-hidden="true" className="size-4" />
          Profile
        </Link>
      ),
    },
    {
      id: "settings",
      condition: user,
      wrap: true,
      content: (
        <Link
          className={menuItemClassName}
          href="/settings"
          onClick={() => setOpen(false)}
        >
          <SettingsIcon aria-hidden="true" className="size-4" />
          Settings
        </Link>
      ),
    },
    {
      id: "login",
      condition: !user,
      wrap: true,
      content: (
        <Link
          className={menuItemClassName}
          href="/auth/sign-in"
          onClick={() => setOpen(false)}
        >
          <UserIcon aria-hidden="true" className="size-4" />
          Login
        </Link>
      ),
    },
    {
      id: "separator-1",
      condition: true,
      wrap: false,
      content: <DropdownMenuSeparator />,
    },
    {
      id: "about",
      condition: true,
      wrap: true,
      content: (
        <Link
          className={menuItemClassName}
          href="/about"
          onClick={() => setOpen(false)}
        >
          <BookCheckIcon aria-hidden="true" className="size-4" />
          About
        </Link>
      ),
    },
    {
      id: "privacy",
      condition: true,
      wrap: true,
      content: (
        <Link
          className={menuItemClassName}
          href="/privacy"
          onClick={() => setOpen(false)}
        >
          <GlobeLockIcon aria-hidden="true" className="size-4" />
          Privacy
        </Link>
      ),
    },
    {
      id: "terms",
      condition: true,
      wrap: true,
      content: (
        <Link
          className={menuItemClassName}
          href="/terms"
          onClick={() => setOpen(false)}
        >
          <HandshakeIcon aria-hidden="true" className="size-4" />
          Terms
        </Link>
      ),
    },
  ];

  if (isDesktop) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <ProfileAvatar className="size-8" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="end">
          {menuItems.map((item) => {
            if (!item.condition) {
              return null;
            }
            if (!item.wrap) {
              return <Fragment key={item.id}>{item.content}</Fragment>;
            }
            return (
              <DropdownMenuItem key={item.id} asChild>
                {item.content}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon">
          <ProfileAvatar className="size-8" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>Settings options</DrawerDescription>
        </DrawerHeader>
        {menuItems.map((item) => {
          if (!item.condition) {
            return null;
          }
          return <Fragment key={item.id}>{item.content}</Fragment>;
        })}
      </DrawerContent>
    </Drawer>
  );
};

export const Footer = () => {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center gap-5 border-t pt-5 lg:flex-row lg:pt-0">
      <p className="text-sm whitespace-nowrap lg:px-6">
        ©{new Date().getFullYear()} Kyh LLC
      </p>
      <div className="flex flex-wrap justify-center px-6 lg:w-full">
        <FooterLink href="/about">About</FooterLink>
        <FooterLink href="/privacy">Privacy</FooterLink>
        <FooterLink href="/terms">Terms</FooterLink>
      </div>
      <div className="grid w-full grid-cols-3 border-t lg:flex lg:w-auto lg:border-t-0">
        <FooterIcon href="https://github.com/kyh">
          <svg width="20" height="20" viewBox="0 0 32 32">
            <path
              className="fill-current"
              d="M16.003,0C7.17,0,0.008,7.162,0.008,15.997  c0,7.067,4.582,13.063,10.94,15.179c0.8,0.146,1.052-0.328,1.052-0.752c0-0.38,0.008-1.442,0-2.777  c-4.449,0.967-5.371-2.107-5.371-2.107c-0.727-1.848-1.775-2.34-1.775-2.34c-1.452-0.992,0.109-0.973,0.109-0.973  c1.605,0.113,2.451,1.649,2.451,1.649c1.427,2.443,3.743,1.737,4.654,1.329c0.146-1.034,0.56-1.739,1.017-2.139  c-3.552-0.404-7.286-1.776-7.286-7.906c0-1.747,0.623-3.174,1.646-4.292C7.28,10.464,6.73,8.837,7.602,6.634  c0,0,1.343-0.43,4.398,1.641c1.276-0.355,2.645-0.532,4.005-0.538c1.359,0.006,2.727,0.183,4.005,0.538  c3.055-2.07,4.396-1.641,4.396-1.641c0.872,2.203,0.323,3.83,0.159,4.234c1.023,1.118,1.644,2.545,1.644,4.292  c0,6.146-3.74,7.498-7.304,7.893C19.479,23.548,20,24.508,20,26c0,2,0,3.902,0,4.428c0,0.428,0.258,0.901,1.07,0.746  C27.422,29.055,32,23.062,32,15.997C32,7.162,24.838,0,16.003,0z"
            />
          </svg>
        </FooterIcon>
        <FooterIcon href="https://dribbble.com/kaiyuhsu">
          <svg width="20" height="20" viewBox="0 0 32 32">
            <path
              className="fill-current"
              d="M0 16q0-4.352 2.144-8.032t5.824-5.824 8.032-2.144 8.032 2.144 5.824 5.824 2.144 8.032-2.144 8.032-5.824 5.824-8.032 2.144-8.032-2.144-5.824-5.824-2.144-8.032zM2.656 16q0 4.992 3.36 8.8 1.536-3.008 4.864-5.728t6.496-3.424q-0.48-1.12-0.928-2.016-5.504 1.76-11.904 1.76-1.248 0-1.856-0.032 0 0.128 0 0.32t-0.032 0.32zM3.072 12.704q0.704 0.064 2.080 0.064 5.344 0 10.144-1.44-2.432-4.32-5.344-7.2-2.528 1.28-4.32 3.552t-2.56 5.024zM7.84 26.528q3.616 2.816 8.16 2.816 2.368 0 4.704-0.896-0.64-5.472-2.496-10.592-2.944 0.64-5.92 3.232t-4.448 5.44zM12.736 3.104q2.816 2.912 5.216 7.264 4.352-1.824 6.56-4.64-3.712-3.072-8.512-3.072-1.632 0-3.264 0.448zM19.104 12.64q0.48 1.024 1.088 2.592 2.368-0.224 5.152-0.224 1.984 0 3.936 0.096-0.256-4.352-3.136-7.744-2.080 3.104-7.040 5.28zM20.992 17.472q1.632 4.736 2.208 9.728 2.528-1.632 4.128-4.192t1.92-5.536q-2.336-0.16-4.256-0.16-1.76 0-4 0.16z"
            />
          </svg>
        </FooterIcon>
        <FooterIcon href="https://x.com/kaiyuhsu">
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

const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <Link
      href={href}
      className="relative flex items-center px-6 py-2 transition hover:text-black lg:py-0"
    >
      <div
        className={cn(
          "absolute left-3 aspect-square h-1 rotate-45 bg-black",
          usePathname() === href ? "block" : "hidden",
        )}
      />
      {children}
    </Link>
  );
};

const FooterIcon = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-16 w-full rounded-none border-l lg:w-16"
      asChild
    >
      <Link href={href} target="_blank">
        {children}
      </Link>
    </Button>
  );
};
