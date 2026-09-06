"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  BookmarkIcon,
  BoxIcon,
  LayoutGridIcon,
  PaletteIcon,
  SearchIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Command, CommandInputBare, CommandItem, CommandList } from "@repo/ui/components/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { cn } from "@repo/ui/lib/utils";
import {
  contentCategories,
  contentElements,
  contentStyles,
} from "@/lib/content/content-categories";
import type { SearchEntry } from "@/lib/content-data";

const SEARCH_RESULT_LIMIT = 12;
const TRENDING_LIMIT = 8;

type SearchKind = "component" | "category" | "section" | "style";

type SearchSuggestion = {
  value: string;
  href: string;
  label: string;
  sublabel: string;
  kind: SearchKind;
};

const searchKindIcon = {
  component: BoxIcon,
  category: BookmarkIcon,
  section: LayoutGridIcon,
  style: PaletteIcon,
} satisfies Record<SearchKind, typeof SearchIcon>;

const componentCountLabel = (count: number) => `${count} component${count === 1 ? "" : "s"}`;

const AnimateHeight = ({ children }: { children: ReactNode }) => (
  // The inner layout counter-scales content during the outer height transition.
  <motion.div
    layout
    initial={false}
    transition={{ type: "spring", visualDuration: 0.25, bounce: 0 }}
    className="overflow-hidden"
  >
    <motion.div layout="position">{children}</motion.div>
  </motion.div>
);

export const SearchButton = ({ searchEntries }: { searchEntries: SearchEntry[] }) => {
  type SearchView = "trending" | "categories" | "sections" | "styles";

  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState<SearchView>("trending");

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of searchEntries) {
      for (const tag of entry.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
    return counts;
  }, [searchEntries]);
  // Unlisted entries remain searchable but stay out of default suggestions.
  const trending = useMemo(
    () => searchEntries.filter((entry) => !entry.unlisted).slice(0, TRENDING_LIMIT),
    [searchEntries],
  );

  const resetSearch = useCallback(() => {
    setActiveView("trending");
    setQuery("");
  }, []);

  const changeSearchOpen = useCallback(
    (open: boolean) => {
      setSearchOpen(open);
      resetSearch();
    },
    [resetSearch],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
        resetSearch();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [resetSearch]);

  const categories = useMemo(
    () =>
      contentCategories
        .map((category) => ({
          name: category.name,
          slug: category.slug,
          count: tagCounts[category.slug] ?? 0,
        }))
        .filter((category) => category.count > 0)
        .toSorted((a, b) => {
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
          name: style.name,
          slug: style.slug,
          count: tagCounts[style.slug] ?? 0,
        }))
        .filter((style) => style.count > 0)
        .toSorted((a, b) => {
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
        name: sub.name,
        slug: sub.slug,
        parent: element.name,
        count: tagCounts[sub.slug] ?? 0,
      })),
    );

    return allSections
      .filter((section) => section.count > 0)
      .toSorted((a, b) => {
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
    (href: string) => {
      changeSearchOpen(false);
      router.push(href);
    },
    [changeSearchOpen, router],
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
    ...componentMatches.map((entry): SearchSuggestion => ({
      value: `component:${entry.slug}`,
      href: `/ui/${entry.slug}`,
      label: entry.name,
      sublabel: "Component",
      kind: "component",
    })),
    ...categoryMatches.map((category): SearchSuggestion => ({
      value: `category:${category.slug}`,
      href: `/?category=${category.slug}`,
      label: category.name,
      sublabel: "Category",
      kind: "category",
    })),
    ...sectionMatches.map((section): SearchSuggestion => ({
      value: `section:${section.slug}`,
      href: `/?element=${section.slug}`,
      label: section.name,
      sublabel: "Section",
      kind: "section",
    })),
    ...styleMatches.map((style): SearchSuggestion => ({
      value: `style:${style.slug}`,
      href: `/?style=${style.slug}`,
      label: style.name,
      sublabel: "Style",
      kind: "style",
    })),
  ];

  const browseViews: { id: SearchView; label: string; icon: typeof SearchIcon }[] = [
    { id: "trending", label: "Trending", icon: TrendingUpIcon },
    { id: "categories", label: "Categories", icon: BookmarkIcon },
    { id: "sections", label: "Sections", icon: LayoutGridIcon },
    { id: "styles", label: "Styles", icon: PaletteIcon },
  ];

  const viewSuggestions = {
    trending: trendingSuggestions,
    categories: categorySuggestions,
    sections: sectionSuggestions,
    styles: styleSuggestions,
  } satisfies Record<SearchView, SearchSuggestion[]>;

  const renderSuggestion = (suggestion: SearchSuggestion) => {
    const Icon = searchKindIcon[suggestion.kind];
    return (
      <CommandItem
        key={suggestion.value}
        value={suggestion.value}
        asChild
        className="px-2.5 py-2"
        onSelect={() => handleSelect(suggestion.href)}
      >
        <Link href={suggestion.href}>
          <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
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
        onClick={() => changeSearchOpen(true)}
      >
        <span className="flex grow items-center gap-1">
          <SearchIcon className="text-muted-foreground size-4" aria-hidden="true" />
          <span className="text-muted-foreground text-sm">Search</span>
        </span>
        <kbd className="bg-background text-muted-foreground inline-flex h-full items-center rounded border px-1 font-sans text-xs">
          ⌘K
        </kbd>
      </button>
      <Dialog open={searchOpen} onOpenChange={changeSearchOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[10vh] translate-y-0 gap-0 overflow-hidden rounded-md p-0 ring-0 sm:max-w-2xl"
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
                          "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium transition",
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
