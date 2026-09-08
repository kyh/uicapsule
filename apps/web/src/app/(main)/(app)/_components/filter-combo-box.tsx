"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/drawer";
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
import { cn } from "cn";
import { useMediaQuery } from "@repo/ui/hooks/use-media-query";
import { ChevronDownIcon, SearchIcon } from "lucide-react";

import type { ContentFilter } from "@/lib/content/content-categories";

interface FilterConfig {
  filterKey: string;
  filterOptions: ContentFilter[];
  defaultLabel: string;
  highlighted?: boolean;
}

interface FilterBarProps {
  filters: FilterConfig[];
}

const parseSelection = (value: string | null) =>
  new Set(
    (value ?? "")
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean),
  );

const triggerClassname = (highlighted?: boolean) =>
  cn("justify-start capitalize dark:bg-background!", highlighted && "border-foreground");

interface FilterInputProps {
  value: string;
  onChange: (value: string) => void;
}

const FilterInput = ({ value, onChange }: FilterInputProps) => (
  <div className="border-border/60 flex h-9 shrink-0 items-center gap-2 border-b px-3">
    <SearchIcon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Filter..."
      aria-label="Filter options"
      className="placeholder:text-muted-foreground h-full w-full bg-transparent text-sm outline-none"
    />
  </div>
);

interface FilterOptionsListProps {
  filterKey: string;
  filterOptions: ContentFilter[];
  query: string;
}

const optionRowClassname =
  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-muted focus-visible:bg-muted [&:hover_[data-slot=checkbox]]:border-muted-foreground/60";

const FilterOptionsList = ({ filterKey, filterOptions, query }: FilterOptionsListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedSet = parseSelection(searchParams.get(filterKey));

  const handleSelect = (slug: string) => {
    const current = new Set(selectedSet);
    if (current.has(slug)) {
      current.delete(slug);
    } else {
      current.add(slug);
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    if (current.size > 0) {
      nextParams.set(filterKey, [...current].join(","));
    } else {
      nextParams.delete(filterKey);
    }

    const next = nextParams.toString();
    router.push(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
  };

  const normalizedQuery = query.trim().toLowerCase();

  const groups = useMemo(() => {
    const matchesQuery = (option: { name: string; slug: string }) =>
      option.name.toLowerCase().includes(normalizedQuery) || option.slug.includes(normalizedQuery);
    const withSub = filterOptions.filter((option) => (option.subcategories?.length ?? 0) > 0);
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
  }, [filterOptions, normalizedQuery]);

  const renderOption = (option: { name: string; slug: string }) => (
    <label key={option.slug} className={optionRowClassname}>
      <Checkbox
        checked={selectedSet.has(option.slug)}
        onCheckedChange={() => handleSelect(option.slug)}
      />
      <span>{option.name}</span>
    </label>
  );

  return (
    <div className="max-h-72 overflow-y-auto p-1">
      {groups.length === 0 && <div className="py-6 text-center text-sm">No results found.</div>}
      {groups.map((group, index) => (
        <div key={group.heading || `flat-${index}`}>
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

  const selectedSet = parseSelection(searchParams.get(filterKey));

  const labels = filterOptions
    .flatMap((option) => [option, ...(option.subcategories ?? [])])
    .filter((option) => selectedSet.has(option.slug))
    .map((option) => option.name);

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
        <DrawerHeader className="sr-only">
          <DrawerTitle>{defaultLabel}</DrawerTitle>
          <DrawerDescription>Select filters</DrawerDescription>
        </DrawerHeader>
        <div className="mt-4 border-t">
          <FilterInput value={query} onChange={setQuery} />
          <FilterOptionsList filterKey={filterKey} filterOptions={filterOptions} query={query} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// Share one popup so it can animate between filters without remounting the input.
export const FilterBar = ({ filters }: FilterBarProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [query, setQuery] = useState("");

  if (isDesktop) {
    return (
      <NavigationMenu
        onValueChange={(value) => {
          if (value === null || value === undefined) {
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
