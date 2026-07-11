"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Drawer, DrawerContent, DrawerTrigger } from "@repo/ui/components/drawer";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuPopup,
  NavigationMenuPortal,
  NavigationMenuPositioner,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@repo/ui/components/navigation-menu";
import { cn } from "@repo/ui/lib/utils";
import { useMediaQuery } from "@repo/ui/hooks/use-media-query";
import { ChevronDownIcon, SearchIcon } from "lucide-react";

import type { ContentFilter } from "@/lib/content/content-categories";

type FilterConfig = {
  filterKey: string;
  filterOptions: ContentFilter[];
  defaultLabel: string;
  highlighted?: boolean;
};

type FilterBarProps = {
  filters: FilterConfig[];
};

/**
 * One navigation menu shared by all filters: the popup morphs between
 * triggers while the filter input stays put and only the option list swaps.
 */
export const FilterBar = ({ filters }: FilterBarProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [query, setQuery] = useState("");

  if (isDesktop) {
    return (
      <NavigationMenu
        onValueChange={(value) => {
          if (value == null) {
            setQuery("");
          }
        }}
      >
        <NavigationMenuList>
          {filters.map((filter) => (
            <NavigationMenuItem key={filter.filterKey} value={filter.filterKey}>
              <NavigationMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className={triggerClassname(filter.highlighted)}
                  />
                }
              >
                <FilterTriggerLabel
                  defaultLabel={filter.defaultLabel}
                  filterKey={filter.filterKey}
                  filterOptions={filter.filterOptions}
                />
              </NavigationMenuTrigger>
              <NavigationMenuContent className="w-72">
                <FilterOptionsList
                  filterKey={filter.filterKey}
                  filterOptions={filter.filterOptions}
                  query={query}
                />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
        <NavigationMenuPortal>
          <NavigationMenuPositioner>
            <NavigationMenuPopup>
              <FilterInput value={query} onChange={setQuery} />
              <NavigationMenuViewport />
            </NavigationMenuPopup>
          </NavigationMenuPositioner>
        </NavigationMenuPortal>
      </NavigationMenu>
    );
  }

  return (
    <>
      {filters.map((filter) => (
        <FilterDrawer key={filter.filterKey} {...filter} />
      ))}
    </>
  );
};

const triggerClassname = (highlighted?: boolean) =>
  cn("justify-start capitalize dark:bg-background!", highlighted && "border-foreground");

const FilterDrawer = ({ filterKey, filterOptions, defaultLabel, highlighted }: FilterConfig) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
        }
      }}
    >
      <DrawerTrigger asChild>
        <Button variant="outline" className={triggerClassname(highlighted)} size="sm">
          <FilterTriggerLabel
            defaultLabel={defaultLabel}
            filterKey={filterKey}
            filterOptions={filterOptions}
          />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <FilterInput value={query} onChange={setQuery} />
          <FilterOptionsList filterKey={filterKey} filterOptions={filterOptions} query={query} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

type FilterInputProps = {
  value: string;
  onChange: (value: string) => void;
};

const FilterInput = ({ value, onChange }: FilterInputProps) => (
  <div className="border-border/60 flex h-10 shrink-0 items-center gap-2.5 border-b px-3">
    <SearchIcon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Filter..."
      className="placeholder:text-muted-foreground h-full w-full bg-transparent text-sm outline-none"
    />
  </div>
);

type FilterOptionsListProps = {
  filterKey: string;
  filterOptions: ContentFilter[];
  query: string;
};

const optionRowClassname =
  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-muted focus-visible:bg-muted [&:hover_[data-slot=checkbox]]:border-muted-foreground/60";

const FilterOptionsList = ({ filterKey, filterOptions, query }: FilterOptionsListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedSet = useMemo(() => {
    const currentRaw = searchParams.get(filterKey) ?? "";
    return new Set(
      currentRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }, [filterKey, searchParams]);

  const handleSelect = useCallback(
    (slug: string) => {
      const currentRaw = searchParams.get(filterKey) ?? "";
      const current = new Set(
        currentRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );

      if (current.has(slug)) {
        current.delete(slug);
      } else {
        current.add(slug);
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      if (current.size > 0) {
        nextParams.set(filterKey, Array.from(current).join(","));
      } else {
        nextParams.delete(filterKey);
      }

      const next = nextParams.toString();
      const url = `${pathname}${next ? `?${next}` : ""}`;
      router.push(url, { scroll: false });
    },
    [filterKey, pathname, router, searchParams],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery = useCallback(
    (option: { name: string; slug: string }) =>
      normalizedQuery.length === 0 ||
      option.name.toLowerCase().includes(normalizedQuery) ||
      option.slug.includes(normalizedQuery),
    [normalizedQuery],
  );

  const groups = useMemo(() => {
    const withSub = filterOptions.filter(
      (option) => Array.isArray(option.subcategories) && option.subcategories.length > 0,
    );
    const withoutSub = filterOptions.filter(
      (option) => !option.subcategories || option.subcategories.length === 0,
    );

    const grouped = withSub
      .map((parent) => ({
        heading: parent.name,
        options: (parent.subcategories ?? []).filter(matchesQuery),
      }))
      .filter((group) => group.options.length > 0);

    const flat = withoutSub.filter(matchesQuery);
    if (flat.length > 0) {
      grouped.push({ heading: "", options: flat });
    }
    return grouped;
  }, [filterOptions, matchesQuery]);

  const renderOption = (option: { name: string; slug: string }) => (
    <button
      key={option.slug}
      type="button"
      className={optionRowClassname}
      onClick={() => handleSelect(option.slug)}
    >
      <Checkbox checked={selectedSet.has(option.slug)} className="pointer-events-none" />
      <span>{option.name}</span>
    </button>
  );

  return (
    <div className="max-h-72 overflow-y-auto p-1">
      {groups.length === 0 && <div className="py-6 text-center text-sm">No results found.</div>}
      {groups.map((group, index) => (
        <div key={group.heading || `flat-${index}`} className="p-1">
          {group.heading && (
            <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
              {group.heading}
            </div>
          )}
          {group.options.map(renderOption)}
        </div>
      ))}
    </div>
  );
};

const FilterTriggerLabel = ({
  defaultLabel,
  filterKey,
  filterOptions,
}: Omit<FilterOptionsListProps, "query"> & {
  defaultLabel: string;
}) => {
  const searchParams = useSearchParams();

  const selectedSet = useMemo(() => {
    const currentRaw = searchParams.get(filterKey) ?? "";
    return new Set(
      currentRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }, [filterKey, searchParams]);

  const labels = useMemo(() => {
    const selectedLabels: string[] = [];

    // Check top-level options
    filterOptions.forEach((option) => {
      if (selectedSet.has(option.slug)) {
        selectedLabels.push(option.name);
      }

      // Check subcategories
      if (option.subcategories) {
        option.subcategories.forEach((sub) => {
          if (selectedSet.has(sub.slug)) {
            selectedLabels.push(sub.name);
          }
        });
      }
    });

    return selectedLabels;
  }, [filterOptions, selectedSet]);

  if (labels.length === 1) {
    return (
      <>
        {labels[0]} <ChevronDownIcon className="size-4" />
      </>
    );
  }

  return (
    <>
      {defaultLabel}{" "}
      {labels.length > 1 ? (
        <Badge variant="secondary">{labels.length}</Badge>
      ) : (
        <ChevronDownIcon className="size-4" />
      )}
    </>
  );
};
