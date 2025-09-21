"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ProfileAvatar } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { useTheme } from "@repo/ui/theme";
import { cn, useMediaQuery } from "@repo/ui/utils";
import {
  ArrowUpRightIcon,
  BookCheckIcon,
  GithubIcon,
  MoonIcon,
  SearchIcon,
  StarsIcon,
  SunIcon,
  SunMoonIcon,
  TwitterIcon,
} from "lucide-react";

import { searchIndex } from "@/lib/search";
import type {
  SearchGroupKey,
  SearchSectionItem,
  SearchTaxonomyItem,
  SearchTrendingItem,
} from "@/lib/search";

const searchNavigation: { key: SearchGroupKey; label: string }[] = [
  { key: "trending", label: "Trending" },
  { key: "categories", label: "Categories" },
  { key: "sections", label: "Sections" },
  { key: "styles", label: "Styles" },
];

export const Header = ({ className }: { className?: string }) => {
  return (
    <nav
      className={cn(
        "flex h-16 w-full grid-cols-3 items-center gap-2 px-3 sm:grid sm:px-6",
        className,
      )}
    >
      <div className="flex items-center justify-start gap-2">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center gap-2">
        <SearchButton />
      </div>
      <div className="flex items-center justify-end gap-2">
        <ProfileButton />
      </div>
    </nav>
  );
};

const SearchButton = () => {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<SearchGroupKey>("categories");
  const [searchQuery, setSearchQuery] = useState("");

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

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery("");
      setActiveGroup("categories");
    }
  }, [searchOpen]);

  const trendingMatches = useMemo<SearchTrendingItem[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return searchIndex.trending;
    }

    return searchIndex.trending.filter((item) => {
      const name = item.name.toLowerCase();
      const slug = item.slug.toLowerCase();
      const description = item.description?.toLowerCase() ?? "";
      const tags = item.tags.map((tag) => tag.toLowerCase());

      return (
        name.includes(query) ||
        slug.includes(query) ||
        description.includes(query) ||
        tags.some((tag) => tag.includes(query))
      );
    });
  }, [searchQuery]);

  const filterTaxonomy = useCallback(
    <T extends SearchTaxonomyItem | SearchSectionItem>(items: T[]) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) {
        return items;
      }

      return items.filter((item) => {
        const matchesBase =
          item.name.toLowerCase().includes(query) ||
          item.slug.toLowerCase().includes(query);

        if (matchesBase) {
          return true;
        }

        if ("parent" in item && item.parent) {
          return item.parent.toLowerCase().includes(query);
        }

        return false;
      });
    },
    [searchQuery],
  );

  const categoryMatches = useMemo(
    () => filterTaxonomy(searchIndex.categories),
    [filterTaxonomy],
  );

  const sectionMatches = useMemo(
    () => filterTaxonomy(searchIndex.sections),
    [filterTaxonomy],
  );

  const styleMatches = useMemo(
    () => filterTaxonomy(searchIndex.styles),
    [filterTaxonomy],
  );

  const navMatchCounts = useMemo(
    () => ({
      trending: trendingMatches.length,
      categories: categoryMatches.length,
      sections: sectionMatches.length,
      styles: styleMatches.length,
    }),
    [categoryMatches, sectionMatches, styleMatches, trendingMatches],
  );

  const navTotalCounts = useMemo(
    () => ({
      trending: searchIndex.trending.length,
      categories: searchIndex.categories.length,
      sections: searchIndex.sections.length,
      styles: searchIndex.styles.length,
    }),
    [],
  );

  const activeItems = useMemo(() => {
    if (activeGroup === "trending") {
      return trendingMatches;
    }
    if (activeGroup === "categories") {
      return categoryMatches;
    }
    if (activeGroup === "sections") {
      return sectionMatches;
    }
    return styleMatches;
  }, [activeGroup, categoryMatches, sectionMatches, styleMatches, trendingMatches]);

  const activeHeading = useMemo(() => {
    const current = searchNavigation.find((item) => item.key === activeGroup);
    return current?.label ?? "Search";
  }, [activeGroup]);

  const headingMeta = useMemo(() => {
    const queryActive = searchQuery.trim().length > 0;
    const counts = queryActive ? navMatchCounts : navTotalCounts;
    const count = counts[activeGroup];

    const nounBase =
      activeGroup === "trending"
        ? "component"
        : activeGroup === "categories"
          ? "category"
          : activeGroup === "sections"
            ? "section"
            : "style";

    const noun = count === 1 ? nounBase : `${nounBase}s`;

    return `${count} ${noun}`;
  }, [activeGroup, navMatchCounts, navTotalCounts, searchQuery]);

  const handleSelect = useCallback(
    (href: string) => {
      setSearchOpen(false);
      router.push(href);
    },
    [router],
  );

  const renderTrendingItems = () => {
    if (activeGroup !== "trending") {
      return null;
    }

    return (
      <CommandGroup className="p-0">
        {trendingMatches.map((item) => (
          <CommandItem
            key={item.slug}
            value={`${item.name} ${item.slug} ${item.description ?? ""} ${item.tags.join(" ")}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2"
            onSelect={() => handleSelect(item.href)}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">{item.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {item.description ?? item.slug.replaceAll("-", " ")}
              </p>
            </div>
            <ArrowUpRightIcon className="text-muted-foreground size-4 shrink-0" />
          </CommandItem>
        ))}
      </CommandGroup>
    );
  };

  const renderTaxonomyItems = () => {
    if (activeGroup === "trending") {
      return null;
    }

    const items = activeItems as (SearchTaxonomyItem | SearchSectionItem)[];

    return (
      <CommandGroup className="p-0">
        {items.map((item) => (
          <CommandItem
            key={item.slug}
            value={`${item.name} ${item.slug} ${"parent" in item ? item.parent ?? "" : ""}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2"
            onSelect={() => handleSelect(item.href)}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">{item.name}</p>
              {"parent" in item && item.parent ? (
                <p className="text-muted-foreground truncate text-xs">{item.parent}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <CommandShortcut className="text-sm font-medium tabular-nums">
                {item.count}
              </CommandShortcut>
              <ArrowUpRightIcon className="text-muted-foreground size-4 shrink-0" />
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    );
  };

  return (
    <>
      <button
        className="border-input bg-muted flex h-9 w-full cursor-pointer rounded-full border px-3 py-2 shadow-xs transition"
        onClick={() => setSearchOpen(true)}
        type="button"
      >
        <span className="flex grow items-center gap-1">
          <SearchIcon
            className="text-muted-foreground size-4"
            aria-hidden="true"
          />
          <span className="text-muted-foreground text-sm">Search</span>
        </span>
        <kbd className="bg-background text-muted-foreground inline-flex h-full items-center rounded border px-1 font-sans text-xs">
          ⌘K
        </kbd>
      </button>
      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        className="max-w-3xl"
      >
        <CommandInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search sites, categories, sections or styles..."
        />
        <div className="flex flex-col gap-0 md:flex-row">
          <nav className="border-border text-sm md:w-48 md:border-r">
            <div className="grid grid-cols-2 gap-1 border-b px-3 py-2 md:grid-cols-1 md:border-b-0 md:px-2 md:py-3">
              {searchNavigation.map((item) => {
                const count = searchQuery
                  ? navMatchCounts[item.key]
                  : navTotalCounts[item.key];
                const isActive = activeGroup === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveGroup(item.key)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md px-2 py-2 text-left transition",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    <span className="truncate text-sm font-medium">
                      {item.label}
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
          <div className="flex min-h-[280px] flex-1 flex-col">
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {activeHeading}
              </p>
              <span className="text-muted-foreground text-xs tabular-nums">
                {headingMeta}
              </span>
            </div>
            <CommandList className="max-h-[360px] flex-1 overflow-y-auto">
              {activeItems.length === 0 && (
                <CommandEmpty>No results found.</CommandEmpty>
              )}
              <>
                {renderTrendingItems()}
                {renderTaxonomyItems()}
              </>
            </CommandList>
          </div>
        </div>
      </CommandDialog>
    </>
  );
};

export const ProfileButton = () => {
  const isDesktop = useMediaQuery();
  const { resolvedTheme, setTheme } = useTheme();

  const [open, setOpen] = useState(false);

  const menuItemClassName = dropdownMenuItemVariants({
    className: "group w-full justify-start",
  });

  const menuItemIconClassName =
    "text-muted-foreground size-4 group-hover:text-foreground transition";

  const menuItems = [
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
          <BookCheckIcon aria-hidden="true" className={menuItemIconClassName} />
          About
        </Link>
      ),
    },
    {
      id: "inspiration",
      condition: true,
      wrap: true,
      content: (
        <Link
          className={menuItemClassName}
          href="/inspiration"
          onClick={() => setOpen(false)}
        >
          <StarsIcon aria-hidden="true" className={menuItemIconClassName} />
          Inspiration
        </Link>
      ),
    },
    {
      id: "separator1",
      condition: true,
      wrap: false,
      content: <DropdownMenuSeparator />,
    },
    {
      id: "privacy",
      condition: true,
      wrap: true,
      content: (
        <Link
          className={menuItemClassName}
          href="https://github.com/kyh/uicapsule"
          target="_blank"
          onClick={() => setOpen(false)}
        >
          <GithubIcon aria-hidden="true" className={menuItemIconClassName} />
          GitHub
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
          href="https://x.com/kaiyuhsu"
          target="_blank"
          onClick={() => setOpen(false)}
        >
          <TwitterIcon aria-hidden="true" className={menuItemIconClassName} />
          Twitter
        </Link>
      ),
    },
    {
      id: "separator2",
      condition: true,
      wrap: false,
      content: <DropdownMenuSeparator />,
    },
    {
      id: "theme-toggle",
      condition: true,
      wrap: false,
      content: (
        <div className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm">
          <span className="flex-1">Theme</span>
          <Tabs
            defaultValue={resolvedTheme === "dark" ? "dark" : "light"}
            onValueChange={(value) => setTheme(value)}
          >
            <TabsList className="bg-background flex h-fit items-center gap-0.5 overflow-hidden rounded-full border p-0 focus-within:overflow-visible [&>[role=tab]]:size-6 [&>[role=tab]>.absolute]:-inset-px [&>[role=tab]>.absolute]:rounded-full [&>[role=tab]>.absolute]:border [&>[role=tab]>.absolute]:bg-transparent">
              <TabsTrigger
                value="system"
                className="text-muted-foreground data-[state=active]:bg-accent relative inline-flex h-[28px] items-center justify-center gap-1.5 rounded-full px-2 has-[>svg]:pl-1.5 [&>svg]:pointer-events-none"
                aria-label="System theme"
              >
                <div>
                  <SunMoonIcon className="size-3 flex-shrink-0" />
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="light"
                className="text-muted-foreground data-[state=active]:bg-accent relative inline-flex h-[28px] items-center justify-center gap-1.5 rounded-full px-2 has-[>svg]:pl-1.5 [&>svg]:pointer-events-none"
                aria-label="Light theme"
              >
                <div>
                  <SunIcon className="size-3 flex-shrink-0" />
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="dark"
                className="text-muted-foreground data-[state=active]:bg-accent relative inline-flex h-[28px] items-center justify-center gap-1.5 rounded-full px-2 has-[>svg]:pl-1.5 [&>svg]:pointer-events-none"
                aria-label="Dark theme"
              >
                <div>
                  <MoonIcon className="size-3 flex-shrink-0" />
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
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

export const Footer = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-col items-center justify-center gap-5 border-t pt-5 lg:h-16 lg:flex-row lg:pt-0",
        className,
      )}
    >
      <p className="text-sm whitespace-nowrap lg:px-6">
        ©{new Date().getFullYear()} Kaiyu Hsu
      </p>
      <div className="flex flex-wrap justify-center px-6 lg:w-full">
        <FooterLink href="/about">About</FooterLink>
        <FooterLink href="/inspiration">Inspiration</FooterLink>
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
