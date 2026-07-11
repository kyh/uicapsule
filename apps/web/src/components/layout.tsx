"use client";

import {
  Fragment,
  cloneElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  contentCategories,
  contentElements,
  contentStyles,
} from "@/lib/content/content-categories";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Command, CommandInputBare, CommandItem, CommandList } from "@repo/ui/components/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Logo } from "@repo/ui/components/logo";
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useWebHaptics } from "web-haptics/react";
import { cn } from "@repo/ui/lib/utils";
import { useMediaQuery } from "@repo/ui/hooks/use-media-query";
import {
  BookCheckIcon,
  BookmarkIcon,
  BoxIcon,
  LayoutGridIcon,
  LogInIcon,
  LogOutIcon,
  MoonIcon,
  PaletteIcon,
  SearchIcon,
  StarsIcon,
  SunIcon,
  SunMoonIcon,
  TrendingUpIcon,
} from "lucide-react";

import type { SearchEntry } from "@/lib/content-data";
import { authClient } from "@/lib/auth-client";

const SEARCH_RESULT_LIMIT = 12;
const TRENDING_LIMIT = 8;
const RECENT_SEARCH_KEY = "uicapsule.recent-searches";
const RECENT_SEARCH_LIMIT = 6;

type SearchKind = "component" | "category" | "section" | "style";

type SearchSuggestion = {
  value: string;
  href: string;
  label: string;
  sublabel: string;
  kind: SearchKind;
};

type RecentSearch = Pick<SearchSuggestion, "href" | "label" | "kind">;

const searchKindIcon: Record<SearchKind, typeof SearchIcon> = {
  component: BoxIcon,
  category: BookmarkIcon,
  section: LayoutGridIcon,
  style: PaletteIcon,
};

const componentCountLabel = (count: number) => `${count} component${count === 1 ? "" : "s"}`;

/** Animates its height to follow content size, like Base UI's navigation-menu viewport. */
const AnimateHeight = ({ children }: { children: ReactNode }) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useEffect(() => {
    const element = contentRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ height }}
      transition={{ type: "spring", visualDuration: 0.25, bounce: 0 }}
      className="overflow-hidden"
    >
      <div ref={contentRef}>{children}</div>
    </motion.div>
  );
};

const isSearchKind = (value: unknown): value is SearchKind =>
  value === "component" || value === "category" || value === "section" || value === "style";

/** Parse recent searches from localStorage, dropping anything malformed. */
const readRecentSearches = (): RecentSearch[] => {
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const recents: RecentSearch[] = [];
    for (const item of parsed) {
      if (item && typeof item === "object" && "href" in item && "label" in item && "kind" in item) {
        const { href, label, kind } = item;
        if (typeof href === "string" && typeof label === "string" && isSearchKind(kind)) {
          recents.push({ href, label, kind });
        }
      }
    }
    return recents.slice(0, RECENT_SEARCH_LIMIT);
  } catch {
    return [];
  }
};

type HeaderNavProps = {
  className?: string;
  searchEntries: SearchEntry[];
};

/** Client view for the header — rendered by the server `Header` in header.tsx, which owns the data. */
export const HeaderNav = ({ className, searchEntries }: HeaderNavProps) => {
  const { trigger } = useWebHaptics();
  return (
    <nav
      className={cn(
        "flex h-16 w-full grid-cols-3 items-center gap-2 px-3 sm:grid sm:px-6",
        className,
      )}
    >
      <div className="flex items-center justify-start gap-2">
        <Link href="/" onClick={() => trigger("selection")}>
          <Logo />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center gap-2">
        <SearchButton searchEntries={searchEntries} />
      </div>
      <div className="flex items-center justify-end gap-2">
        <ProfileButton />
      </div>
    </nav>
  );
};

const SearchButton = ({ searchEntries }: { searchEntries: SearchEntry[] }) => {
  type SearchView = "trending" | "categories" | "sections" | "styles";

  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState<SearchView>("trending");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of searchEntries) {
      for (const tag of entry.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
    return counts;
  }, [searchEntries]);
  const trending = useMemo(() => searchEntries.slice(0, TRENDING_LIMIT), [searchEntries]);

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
    if (searchOpen) {
      setActiveView("trending");
      setRecentSearches(readRecentSearches());
    } else {
      setQuery("");
    }
  }, [searchOpen]);

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

  const componentMatches = useMemo(() => {
    if (!hasQuery) {
      return [];
    }

    return searchEntries
      .filter((entry) => {
        const haystacks = [entry.name, entry.description, ...entry.tags];
        return haystacks.some((field) => field.toLowerCase().includes(normalizedQuery));
      })
      .slice(0, SEARCH_RESULT_LIMIT);
  }, [hasQuery, normalizedQuery, searchEntries]);

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
        style.name.toLowerCase().includes(normalizedQuery) || style.slug.includes(normalizedQuery)
      );
    });
  }, [hasQuery, normalizedQuery, styles]);

  const totalMatches =
    componentMatches.length + categoryMatches.length + sectionMatches.length + styleMatches.length;

  const handleSelect = useCallback(
    (suggestion: RecentSearch) => {
      setRecentSearches((prev) => {
        const next = [
          suggestion,
          ...prev.filter((recent) => recent.href !== suggestion.href),
        ].slice(0, RECENT_SEARCH_LIMIT);
        try {
          window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
        } catch {
          // localStorage unavailable (private mode) — recents just don't persist
        }
        return next;
      });
      setSearchOpen(false);
      router.push(suggestion.href);
    },
    [router],
  );

  const trendingSuggestions: SearchSuggestion[] = trending.map((entry) => ({
    value: `trending:${entry.slug}`,
    href: `/ui/${entry.slug}`,
    label: entry.name,
    sublabel: entry.tags.slice(0, 2).join(", ") || "Component",
    kind: "component",
  }));

  const categorySuggestions: SearchSuggestion[] = categories.map((category) => ({
    value: `category:${category.slug}`,
    href: `/?category=${category.slug}`,
    label: category.name,
    sublabel: componentCountLabel(category.count),
    kind: "category",
  }));

  const sectionSuggestions: SearchSuggestion[] = sections.map((section) => ({
    value: `section:${section.slug}`,
    href: `/?element=${section.slug}`,
    label: section.name,
    sublabel: `${section.parent} · ${componentCountLabel(section.count)}`,
    kind: "section",
  }));

  const styleSuggestions: SearchSuggestion[] = styles.map((style) => ({
    value: `style:${style.slug}`,
    href: `/?style=${style.slug}`,
    label: style.name,
    sublabel: componentCountLabel(style.count),
    kind: "style",
  }));

  const querySuggestions: SearchSuggestion[] = [
    ...componentMatches.map(
      (entry): SearchSuggestion => ({
        value: `component:${entry.slug}`,
        href: `/ui/${entry.slug}`,
        label: entry.name,
        sublabel: "Component",
        kind: "component",
      }),
    ),
    ...categoryMatches.map(
      (category): SearchSuggestion => ({
        value: `category:${category.slug}`,
        href: `/?category=${category.slug}`,
        label: category.name,
        sublabel: "Category",
        kind: "category",
      }),
    ),
    ...sectionMatches.map(
      (section): SearchSuggestion => ({
        value: `section:${section.slug}`,
        href: `/?element=${section.slug}`,
        label: section.name,
        sublabel: "Section",
        kind: "section",
      }),
    ),
    ...styleMatches.map(
      (style): SearchSuggestion => ({
        value: `style:${style.slug}`,
        href: `/?style=${style.slug}`,
        label: style.name,
        sublabel: "Style",
        kind: "style",
      }),
    ),
  ];

  const browseViews: { id: SearchView; label: string; icon: typeof SearchIcon }[] = [
    { id: "trending", label: "Trending", icon: TrendingUpIcon },
    { id: "categories", label: "Categories", icon: BookmarkIcon },
    { id: "sections", label: "Sections", icon: LayoutGridIcon },
    { id: "styles", label: "Styles", icon: PaletteIcon },
  ];

  const viewSuggestions: Record<SearchView, SearchSuggestion[]> = {
    trending: trendingSuggestions,
    categories: categorySuggestions,
    sections: sectionSuggestions,
    styles: styleSuggestions,
  };

  const renderSuggestion = (suggestion: SearchSuggestion) => {
    const Icon = searchKindIcon[suggestion.kind];
    return (
      <CommandItem
        key={suggestion.value}
        value={suggestion.value}
        asChild
        className="rounded-xl px-2.5 py-2"
        onSelect={() => handleSelect(suggestion)}
      >
        <Link href={suggestion.href} onClick={() => handleSelect(suggestion)}>
          <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Icon className="text-muted-foreground size-4.5" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{suggestion.label}</span>
            <span className="text-muted-foreground truncate text-xs">{suggestion.sublabel}</span>
          </span>
        </Link>
      </CommandItem>
    );
  };

  return (
    <>
      <button
        type="button"
        aria-expanded={searchOpen}
        className="border-input bg-muted flex h-9 w-full rounded-full border px-3 py-2 shadow-xs transition"
        onClick={() => setSearchOpen(true)}
      >
        <span className="flex grow items-center gap-1">
          <SearchIcon className="text-muted-foreground size-4" aria-hidden="true" />
          <span className="text-muted-foreground text-sm">Search</span>
        </span>
        <kbd className="bg-background text-muted-foreground inline-flex h-full items-center rounded border px-1 font-sans text-xs">
          ⌘K
        </kbd>
      </button>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-md"
          className="top-[10vh] translate-y-0 gap-0 overflow-hidden rounded-md p-0 sm:max-w-2xl"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>
              Search components, categories, sections and styles
            </DialogDescription>
          </DialogHeader>
          <Command shouldFilter={false} className="h-auto rounded-md! p-0">
            <div className="flex h-14 shrink-0 items-center gap-3 px-5">
              <SearchIcon className="text-muted-foreground size-4.5 shrink-0" aria-hidden="true" />
              <CommandInputBare
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder="Components, categories, sections, styles or keywords..."
                className="h-full text-base"
              />
            </div>
            <AnimateHeight>
              {!hasQuery && recentSearches.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4 pb-3">
                  {recentSearches.map((recent) => {
                    const Icon = searchKindIcon[recent.kind];
                    return (
                      <Link
                        key={recent.href}
                        href={recent.href}
                        onClick={() => handleSelect(recent)}
                        className="bg-muted hover:bg-muted/70 flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition"
                      >
                        <Icon className="text-muted-foreground size-4" aria-hidden="true" />
                        {recent.label}
                      </Link>
                    );
                  })}
                </div>
              )}
              {hasQuery ? (
                <CommandList className="max-h-[min(55vh,440px)] overflow-y-auto px-3 pb-3">
                  {querySuggestions.map(renderSuggestion)}
                  {totalMatches === 0 && (
                    <div className="text-muted-foreground flex items-center justify-center px-4 py-12 text-sm">
                      No results found.
                    </div>
                  )}
                </CommandList>
              ) : (
                <div className="flex min-h-0 flex-col md:flex-row">
                  <div className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
                    {browseViews.map((view) => (
                      <button
                        key={view.id}
                        type="button"
                        className={cn(
                          "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition",
                          activeView === view.id ? "bg-muted" : "hover:bg-muted/50",
                        )}
                        onClick={() => setActiveView(view.id)}
                      >
                        <view.icon className="text-muted-foreground size-3.5" aria-hidden="true" />
                        {view.label}
                      </button>
                    ))}
                  </div>
                  <div className="hidden w-48 shrink-0 flex-col gap-1 p-3 pt-0 md:flex">
                    {browseViews.map((view) => (
                      <button
                        key={view.id}
                        type="button"
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                          activeView === view.id ? "bg-muted" : "hover:bg-muted/50",
                        )}
                        onClick={() => setActiveView(view.id)}
                      >
                        <view.icon className="text-muted-foreground size-4" aria-hidden="true" />
                        {view.label}
                      </button>
                    ))}
                  </div>
                  <CommandList className="max-h-[min(55vh,440px)] flex-1 overflow-y-auto px-3 pb-3 md:pl-0">
                    {viewSuggestions[activeView].map(renderSuggestion)}
                  </CommandList>
                </div>
              )}
            </AnimateHeight>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const ProfileButton = () => {
  const isDesktop = useMediaQuery();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [open, setOpen] = useState(false);

  const handleSignOut = () => {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          setOpen(false);
          router.refresh();
        },
      },
    });
  };

  const avatar = (
    <Avatar className="size-8">
      {user?.image && <AvatarImage src={user.image} />}
      <AvatarFallback>
        {user ? (user.name || user.email).slice(0, 2).toUpperCase() : "UI"}
      </AvatarFallback>
    </Avatar>
  );

  const menuItemClassName = "group w-full justify-start";

  const menuItemIconClassName =
    "text-muted-foreground size-4 group-hover:text-foreground transition";

  type WrappedMenuItem = {
    id: string;
    condition: boolean;
    wrap: true;
    link: ReactElement;
    body: ReactNode;
  };
  type UnwrappedMenuItem = {
    id: string;
    condition: boolean;
    wrap: false;
    content: ReactElement;
  };

  const menuItems: (WrappedMenuItem | UnwrappedMenuItem)[] = [
    {
      id: "account",
      condition: !!user,
      wrap: false,
      content: (
        <div className="flex flex-col px-2 py-1.5 text-sm">
          <span className="truncate">{user?.name}</span>
          <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
        </div>
      ),
    },
    {
      id: "account-separator",
      condition: !!user,
      wrap: false,
      content: <DropdownMenuSeparator />,
    },
    {
      id: "about",
      condition: true,
      wrap: true,
      link: <Link className={menuItemClassName} href="/about" onClick={() => setOpen(false)} />,
      body: (
        <>
          <BookCheckIcon aria-hidden="true" className={menuItemIconClassName} />
          About
        </>
      ),
    },
    {
      id: "inspiration",
      condition: true,
      wrap: true,
      link: (
        <Link className={menuItemClassName} href="/inspiration" onClick={() => setOpen(false)} />
      ),
      body: (
        <>
          <StarsIcon aria-hidden="true" className={menuItemIconClassName} />
          Inspiration
        </>
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
      link: (
        <Link
          className={menuItemClassName}
          href="https://github.com/kyh/uicapsule"
          target="_blank"
          onClick={() => setOpen(false)}
        />
      ),
      body: (
        <>
          <svg
            aria-hidden="true"
            className={menuItemIconClassName}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          GitHub
        </>
      ),
    },
    {
      id: "terms",
      condition: true,
      wrap: true,
      link: (
        <Link
          className={menuItemClassName}
          href="https://x.com/kaiyuhsu"
          target="_blank"
          onClick={() => setOpen(false)}
        />
      ),
      body: (
        <>
          <svg
            aria-hidden="true"
            className={menuItemIconClassName}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Twitter
        </>
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
          <Tabs value={theme ?? "system"} onValueChange={(value) => setTheme(value)}>
            <TabsList className="bg-background relative flex h-fit items-center gap-0.5 rounded-full border p-0 *:[[role=tab]]:size-6">
              <TabsIndicator className="rounded-full bg-accent" />
              <TabsTrigger
                value="system"
                className="text-muted-foreground data-active:text-foreground relative inline-flex h-[28px] items-center justify-center gap-1.5 rounded-full px-2 has-[>svg]:pl-1.5 [&>svg]:pointer-events-none"
                aria-label="System theme"
              >
                <div>
                  <SunMoonIcon className="size-3 shrink-0" />
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="light"
                className="text-muted-foreground data-active:text-foreground relative inline-flex h-[28px] items-center justify-center gap-1.5 rounded-full px-2 has-[>svg]:pl-1.5 [&>svg]:pointer-events-none"
                aria-label="Light theme"
              >
                <div>
                  <SunIcon className="size-3 shrink-0" />
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="dark"
                className="text-muted-foreground data-active:text-foreground relative inline-flex h-[28px] items-center justify-center gap-1.5 rounded-full px-2 has-[>svg]:pl-1.5 [&>svg]:pointer-events-none"
                aria-label="Dark theme"
              >
                <div>
                  <MoonIcon className="size-3 shrink-0" />
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ),
    },
    {
      id: "separator3",
      condition: true,
      wrap: false,
      content: <DropdownMenuSeparator />,
    },
    {
      id: "login",
      condition: !user,
      wrap: true,
      link: (
        <Link className={menuItemClassName} href="/auth/login" onClick={() => setOpen(false)} />
      ),
      body: (
        <>
          <LogInIcon aria-hidden="true" className={menuItemIconClassName} />
          Login
        </>
      ),
    },
    {
      id: "sign-out",
      condition: !!user,
      wrap: true,
      link: (
        <button
          type="button"
          className={cn(menuItemClassName, "flex items-center gap-2 px-2 py-1.5 text-sm")}
          onClick={handleSignOut}
        />
      ),
      body: (
        <>
          <LogOutIcon aria-hidden="true" className={menuItemIconClassName} />
          Sign out
        </>
      ),
    },
  ];

  if (isDesktop) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          {avatar}
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
              <DropdownMenuItem key={item.id} render={item.link}>
                {item.body}
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
          {avatar}
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
          if (!item.wrap) {
            return <Fragment key={item.id}>{item.content}</Fragment>;
          }
          return <Fragment key={item.id}>{cloneElement(item.link, {}, item.body)}</Fragment>;
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
      <p className="text-sm whitespace-nowrap lg:px-6">©2026 Kaiyu Hsu</p>
      <div className="flex flex-wrap justify-center px-6 lg:w-full">
        <FooterLink href="/about">About</FooterLink>
        <FooterLink href="/inspiration">Inspiration</FooterLink>
      </div>
      <div className="grid w-full grid-cols-3 border-t lg:flex lg:w-auto lg:border-t-0">
        <FooterIcon href="https://github.com/kyh/uicapsule">
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

const FooterIcon = ({ href, children }: { href: string; children: ReactNode }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-16 w-full rounded-none border-l lg:w-16"
      render={<Link href={href} target="_blank" />}
      nativeButton={false}
    >
      {children}
    </Button>
  );
};
