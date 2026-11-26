"use client";

import { memo, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { SearchIcon } from "lucide-react";
import { cn } from "cn";

import { contentElements } from "@/lib/content/content-categories";
import type { ContentComponentSummary } from "@/lib/content/content-schema";

interface ComponentNavProps {
  feed: ContentComponentSummary[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}

export const groupComponents = (components: ContentComponentSummary[]) =>
  contentElements
    .map((element) => ({
      ...element,
      items: components
        .filter((c) => c.tags.includes(element.slug))
        .toSorted((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((group) => group.items.length > 0);

const scrollIntoView = (element: HTMLAnchorElement | null) => {
  const list = element?.closest<HTMLElement>("[data-nav-list]");

  if (!element || !list) {
    return;
  }

  const item = element.getBoundingClientRect();
  const bounds = list.getBoundingClientRect();

  if (item.top < bounds.top || item.bottom > bounds.bottom) {
    list.scrollTop += item.top - bounds.top - bounds.height / 2 + item.height / 2;
  }
};

const isPlainClick = (event: MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

const ComponentNavBase = ({ feed, activeSlug, onSelect }: ComponentNavProps) => {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const matches = needle
      ? feed.filter((c) => c.name.toLowerCase().includes(needle) || c.slug.includes(needle))
      : feed;

    return groupComponents(matches);
  }, [feed, query]);

  return (
    <nav aria-label="Components" className="flex h-full flex-col">
      <div className="p-2">
        <label className="bg-muted/40 focus-within:border-ring flex h-8 items-center gap-2 rounded-md border px-2 transition-colors">
          <SearchIcon className="text-muted-foreground size-3.5 shrink-0" />
          <span className="sr-only">Filter components</span>
          <input
            type="search"
            value={query}
            placeholder="Filter components"
            className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
        </label>
      </div>
      <div
        data-nav-list
        className="min-h-0 flex-1 overflow-y-auto px-2 pb-6 [scrollbar-width:thin]"
      >
        {groups.length === 0 && (
          <p className="text-muted-foreground px-2 py-4 text-sm">No components match.</p>
        )}
        {groups.map((group) => (
          <section key={group.slug} className="pt-4 first:pt-1">
            <h2 className="text-muted-foreground px-2 pb-1 text-xs font-medium">{group.name}</h2>
            <ul className="flex flex-col">
              {group.items.map((item) => {
                const active = item.slug === activeSlug;

                return (
                  <li key={item.slug}>
                    <a
                      href={`/ui/${item.slug}`}
                      ref={active ? scrollIntoView : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "text-muted-foreground hover:text-foreground hover:bg-accent/60 relative flex h-7 items-center rounded-md px-2 text-sm transition-colors",
                        active && "text-primary hover:text-primary",
                      )}
                      onClick={(event) => {
                        if (!isPlainClick(event)) {
                          return;
                        }

                        event.preventDefault();
                        onSelect(item.slug);
                      }}
                    >
                      <span className="truncate">{item.name}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
};

export const ComponentNav = memo(ComponentNavBase);
