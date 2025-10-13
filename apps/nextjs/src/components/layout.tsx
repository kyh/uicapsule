"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  contentCategories,
  contentElements,
  contentStyles,
} from "@repo/api/content/content-categories";
import { ProfileAvatar } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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
import { useQuery } from "@tanstack/react-query";
import {
  BookCheckIcon,
  BookmarkIcon,
  GithubIcon,
  LayoutGridIcon,
  MoonIcon,
  PaletteIcon,
  SearchIcon,
  StarsIcon,
  SunIcon,
  SunMoonIcon,
  TwitterIcon,
} from "lucide-react";

import { useTRPC } from "@/trpc/react";

type SearchEntry = {
  slug: string;
  name: string;
  description: string;
  tags: string[];
};

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
  type SearchView = "trending" | "categories" | "sections" | "styles";

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState<SearchView>("categories");

  const api = useTRPC();
  const { data: searchData, isLoading } = useQuery(
    api.content.search.queryOptions(
      { query, limit: 12 },
      { enabled: searchOpen },
    ),
  );

  const tagCounts = useMemo(() => searchData?.tagCounts ?? {}, [searchData]);
  const trending = useMemo(
    () => (searchData?.trending ?? []) as SearchEntry[],
    [searchData],
  );
  const componentMatches = useMemo(
    () => (searchData?.components ?? []) as SearchEntry[],
    [searchData],
  );

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
      setQuery("");
    }
  }, [searchOpen]);

  const navigationItems = useMemo(
    () => [
      {
        id: "trending" satisfies SearchView,
        label: "Trending",
        description: "Popular UI capsules",
        icon: StarsIcon,
      },
      {
        id: "categories" satisfies SearchView,
        label: "Categories",
        description: "Product verticals",
        icon: BookmarkIcon,
      },
      {
        id: "sections" satisfies SearchView,
        label: "Sections",
        description: "Interface building blocks",
        icon: LayoutGridIcon,
      },
      {
        id: "styles" satisfies SearchView,
        label: "Styles",
        description: "Visual directions",
        icon: PaletteIcon,
      },
    ],
    [],
  );

  const categories = useMemo(
    () =>
      contentCategories
        .map((category) => ({
          ...category,
          count: tagCounts[category.slug] ?? 0,
        }))
        .filter((category) => category.count > 0)
        .sort((a, b) => {
          if (b.count === a.count) {
            return a.name.localeCompare(b.name);
          }
          return b.count - a.count;
        }),
    [tagCounts],
  );

  const styles = useMemo(
    () =>
      contentStyles
        .map((style) => ({
          ...style,
          count: tagCounts[style.slug] ?? 0,
        }))
        .filter((style) => style.count > 0)
        .sort((a, b) => {
          if (b.count === a.count) {
            return a.name.localeCompare(b.name);
          }
          return b.count - a.count;
        }),
    [tagCounts],
  );

  const sections = useMemo(() => {
    const allSections = contentElements.flatMap((element) =>
      (element.subcategories ?? []).map((sub) => ({
        ...sub,
        parent: element.name,
        count: tagCounts[sub.slug] ?? 0,
      })),
    );

    return allSections
      .filter((section) => section.count > 0)
      .sort((a, b) => {
        if (b.count === a.count) {
          return a.name.localeCompare(b.name);
        }
        return b.count - a.count;
      });
  }, [tagCounts]);

  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;
  const hasData = !isLoading && searchData !== undefined;

  const categoryMatches = useMemo(() => {
    if (!hasQuery) {
      return [];
    }

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(normalizedQuery) ||
        category.slug.includes(normalizedQuery)
      );
    });
  }, [categories, hasQuery, normalizedQuery]);

  const sectionMatches = useMemo(() => {
    if (!hasQuery) {
      return [];
    }

    return sections.filter((section) => {
      return (
        section.name.toLowerCase().includes(normalizedQuery) ||
        section.slug.includes(normalizedQuery) ||
        section.parent.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [hasQuery, normalizedQuery, sections]);

  const styleMatches = useMemo(() => {
    if (!hasQuery) {
      return [];
    }

    return styles.filter((style) => {
      return (
        style.name.toLowerCase().includes(normalizedQuery) ||
        style.slug.includes(normalizedQuery)
      );
    });
  }, [hasQuery, normalizedQuery, styles]);

  const totalMatches =
    componentMatches.length +
    categoryMatches.length +
    sectionMatches.length +
    styleMatches.length;

  const handleOpenChange = useCallback((open: boolean) => {
    setSearchOpen(open);
    if (open) {
      setActiveView("categories");
    }
  }, []);

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  const renderCategories = () => (
    <CommandGroup heading="Categories">
      {categories.map((category) => (
        <CommandItem
          key={category.slug}
          value={`${category.name} ${category.slug}`}
          asChild
        >
          <Link
            href={`/?category=${category.slug}`}
            onClick={handleCloseSearch}
          >
            <span className="flex flex-col">
              <span>{category.name}</span>
              <span className="text-muted-foreground text-xs">
                /{category.slug}
              </span>
            </span>
            <span className="text-muted-foreground ml-auto text-xs">
              {category.count}
            </span>
          </Link>
        </CommandItem>
      ))}
    </CommandGroup>
  );

  const renderSections = () => (
    <CommandGroup heading="Sections">
      {sections.map((section) => (
        <CommandItem
          key={section.slug}
          value={`${section.name} ${section.parent} ${section.slug}`}
          asChild
        >
          <Link href={`/?element=${section.slug}`} onClick={handleCloseSearch}>
            <span className="flex flex-col">
              <span>{section.name}</span>
              <span className="text-muted-foreground text-xs">
                {section.parent}
              </span>
            </span>
            <span className="text-muted-foreground ml-auto text-xs">
              {section.count}
            </span>
          </Link>
        </CommandItem>
      ))}
    </CommandGroup>
  );

  const renderStyles = () => (
    <CommandGroup heading="Styles">
      {styles.map((style) => (
        <CommandItem
          key={style.slug}
          value={`${style.name} ${style.slug}`}
          asChild
        >
          <Link href={`/?style=${style.slug}`} onClick={handleCloseSearch}>
            <span className="flex flex-col">
              <span>{style.name}</span>
              <span className="text-muted-foreground text-xs">
                /{style.slug}
              </span>
            </span>
            <span className="text-muted-foreground ml-auto text-xs">
              {style.count}
            </span>
          </Link>
        </CommandItem>
      ))}
    </CommandGroup>
  );

  const renderTrending = () => (
    <CommandGroup heading="Trending">
      {trending.map((entry) => (
        <CommandItem
          key={entry.slug}
          value={`${entry.name} ${entry.slug}`}
          asChild
        >
          <Link href={`/ui/${entry.slug}`} onClick={handleCloseSearch}>
            <span className="flex flex-col">
              <span>{entry.name}</span>
              <span className="text-muted-foreground text-xs">
                /ui/{entry.slug}
              </span>
            </span>
            <span className="text-muted-foreground ml-auto text-xs">
              {entry.tags[0] ?? ""}
            </span>
          </Link>
        </CommandItem>
      ))}
    </CommandGroup>
  );

  const renderQueryResults = () => (
    <>
      {componentMatches.length > 0 && (
        <CommandGroup heading="Components">
          {componentMatches.map((entry) => (
            <CommandItem
              key={entry.slug}
              value={`${entry.name} ${entry.slug}`}
              asChild
            >
              <Link href={`/ui/${entry.slug}`} onClick={handleCloseSearch}>
                <span className="flex flex-col">
                  <span>{entry.name}</span>
                  <span className="text-muted-foreground text-xs">
                    /ui/{entry.slug}
                  </span>
                </span>
                <span className="text-muted-foreground ml-auto text-xs">
                  {entry.tags.slice(0, 2).join(", ")}
                </span>
              </Link>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {categoryMatches.length > 0 && (
        <CommandGroup heading="Categories">
          {categoryMatches.map((category) => (
            <CommandItem
              key={category.slug}
              value={`${category.name} ${category.slug}`}
              asChild
            >
              <Link
                href={`/?category=${category.slug}`}
                onClick={handleCloseSearch}
              >
                <span className="flex flex-col">
                  <span>{category.name}</span>
                  <span className="text-muted-foreground text-xs">
                    /{category.slug}
                  </span>
                </span>
                <span className="text-muted-foreground ml-auto text-xs">
                  {category.count}
                </span>
              </Link>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {sectionMatches.length > 0 && (
        <CommandGroup heading="Sections">
          {sectionMatches.map((section) => (
            <CommandItem
              key={section.slug}
              value={`${section.name} ${section.parent} ${section.slug}`}
              asChild
            >
              <Link
                href={`/?element=${section.slug}`}
                onClick={handleCloseSearch}
              >
                <span className="flex flex-col">
                  <span>{section.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {section.parent}
                  </span>
                </span>
                <span className="text-muted-foreground ml-auto text-xs">
                  {section.count}
                </span>
              </Link>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {styleMatches.length > 0 && (
        <CommandGroup heading="Styles">
          {styleMatches.map((style) => (
            <CommandItem
              key={style.slug}
              value={`${style.name} ${style.slug}`}
              asChild
            >
              <Link href={`/?style=${style.slug}`} onClick={handleCloseSearch}>
                <span className="flex flex-col">
                  <span>{style.name}</span>
                  <span className="text-muted-foreground text-xs">
                    /{style.slug}
                  </span>
                </span>
                <span className="text-muted-foreground ml-auto text-xs">
                  {style.count}
                </span>
              </Link>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {hasQuery && totalMatches === 0 && (
        <div className="text-muted-foreground flex flex-1 items-center justify-center px-4 py-12 text-sm">
          No results found.
        </div>
      )}
    </>
  );

  const renderActiveView = () => {
    switch (activeView) {
      case "trending":
        return renderTrending();
      case "sections":
        return renderSections();
      case "styles":
        return renderStyles();
      case "categories":
      default:
        return renderCategories();
    }
  };

  return (
    <>
      <button
        className="border-input bg-muted flex h-9 w-full cursor-pointer rounded-full border px-3 py-2 shadow-xs transition"
        onClick={() => setSearchOpen(true)}
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
      <CommandDialog open={searchOpen} onOpenChange={handleOpenChange}>
        <div className="md:flex md:h-[540px]">
          <div className="border-border/60 bg-muted/10 hidden w-56 flex-none flex-col gap-1 border-r p-3 md:flex">
            <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
              Browse
            </p>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id && !hasQuery;
              return (
                <button
                  key={item.id}
                  className={cn(
                    "text-left text-sm transition",
                    "rounded-md px-3 py-2",
                    isActive
                      ? "bg-background shadow-xs"
                      : "hover:bg-background/40",
                  )}
                  onClick={() => setActiveView(item.id as SearchView)}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="text-muted-foreground size-4" />
                    <span>{item.label}</span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search sites, categories, sections or styles..."
            />
            <div className="border-border/60 md:hidden">
              <div className="flex gap-2 overflow-x-auto px-3 py-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id && !hasQuery;
                  return (
                    <button
                      key={item.id}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                        isActive
                          ? "border-foreground"
                          : "bg-muted border-transparent",
                      )}
                      onClick={() => setActiveView(item.id as SearchView)}
                      type="button"
                    >
                      <Icon className="size-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <CommandList className="flex-1 overflow-y-auto p-2 md:px-4 md:py-3">
              {isLoading ? (
                <div className="text-muted-foreground flex flex-1 items-center justify-center px-4 py-12 text-sm">
                  Loading...
                </div>
              ) : !hasData ? (
                <div className="text-muted-foreground flex flex-1 items-center justify-center px-4 py-12 text-sm">
                  Search is unavailable right now.
                </div>
              ) : hasQuery ? (
                renderQueryResults()
              ) : (
                renderActiveView()
              )}
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
