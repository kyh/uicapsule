"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@repo/ui/button";
import { Checkbox } from "@repo/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@repo/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/popover";
import { cn, useMediaQuery } from "@repo/ui/utils";

import type { ContentFilter } from "@/lib/content";

type FilterComboBoxProps = {
  children: React.ReactNode;
  filterKey: string;
  filterOptions: ContentFilter[];
  highlighted?: boolean;
};

export const FilterComboBox = ({
  children,
  filterKey,
  filterOptions,
  highlighted = false,
}: FilterComboBoxProps) => {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const triggerClassname = cn(
    "justify-start capitalize",
    highlighted && "border-foreground",
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={triggerClassname} size="sm">
            {children}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <FilterOptionsList
            filterKey={filterKey}
            filterOptions={filterOptions}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className={triggerClassname} size="sm">
          {children}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <FilterOptionsList
            filterKey={filterKey}
            filterOptions={filterOptions}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

type FilterOptionsListProps = {
  filterKey: string;
  filterOptions: ContentFilter[];
};

const FilterOptionsList = ({
  filterKey,
  filterOptions,
}: FilterOptionsListProps) => {
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

  const { optionsWithSub, optionsWithoutSub, hasAnySubcategories } =
    useMemo(() => {
      const withSub = filterOptions.filter(
        (option) =>
          Array.isArray(option.subcategories) &&
          option.subcategories.length > 0,
      );
      const withoutSub = filterOptions.filter(
        (option) => !option.subcategories || option.subcategories.length === 0,
      );
      return {
        optionsWithSub: withSub,
        optionsWithoutSub: withoutSub,
        hasAnySubcategories: withSub.length > 0,
      } as const;
    }, [filterOptions]);

  const selectedFlatOptions = useMemo(
    () => filterOptions.filter((o) => selectedSet.has(o.slug)),
    [filterOptions, selectedSet],
  );

  const selectedGroupedSubItems = useMemo(
    () =>
      optionsWithSub
        .flatMap((parent) => parent.subcategories ?? [])
        .filter((sub) => selectedSet.has(sub.slug)),
    [optionsWithSub, selectedSet],
  );

  const selectedGroupedSingles = useMemo(
    () => optionsWithoutSub.filter((s) => selectedSet.has(s.slug)),
    [optionsWithoutSub, selectedSet],
  );

  const renderFlatOptions = useCallback(
    (options: ContentFilter[]) => (
      <>
        {selectedFlatOptions.length > 0 && (
          <CommandGroup heading="Selected">
            {selectedFlatOptions.map((option) => (
              <CommandItem
                key={option.slug}
                value={option.slug}
                onSelect={handleSelect}
              >
                <Checkbox
                  checked={selectedSet.has(option.slug)}
                  className="pointer-events-none"
                />
                <span>{option.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {options.length > 0 && (
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.slug}
                value={option.slug}
                onSelect={handleSelect}
              >
                <Checkbox
                  checked={selectedSet.has(option.slug)}
                  className="pointer-events-none"
                />
                <span>{option.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </>
    ),
    [handleSelect, selectedFlatOptions, selectedSet],
  );

  const renderGroupedOptions = useCallback(
    (parents: ContentFilter[], singles: ContentFilter[]) => (
      <>
        {(selectedGroupedSubItems.length > 0 ||
          selectedGroupedSingles.length > 0) && (
          <CommandGroup heading="Selected">
            {selectedGroupedSubItems.map((sub) => (
              <CommandItem
                key={sub.slug}
                value={sub.slug}
                onSelect={handleSelect}
              >
                <Checkbox
                  checked={selectedSet.has(sub.slug)}
                  className="pointer-events-none"
                />
                <span>{sub.name}</span>
              </CommandItem>
            ))}
            {selectedGroupedSingles.map((option) => (
              <CommandItem
                key={option.slug}
                value={option.slug}
                onSelect={handleSelect}
              >
                <Checkbox
                  checked={selectedSet.has(option.slug)}
                  className="pointer-events-none"
                />
                <span>{option.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {parents.map((parent) => (
          <CommandGroup key={parent.slug} heading={parent.name}>
            {parent.subcategories?.map((sub) => (
              <CommandItem
                key={sub.slug}
                value={sub.slug}
                onSelect={handleSelect}
              >
                <Checkbox
                  checked={selectedSet.has(sub.slug)}
                  className="pointer-events-none"
                />
                <span>{sub.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        {singles.length > 0 && (
          <CommandGroup>
            {singles.map((option) => (
              <CommandItem
                key={option.slug}
                value={option.slug}
                onSelect={handleSelect}
              >
                <Checkbox
                  checked={selectedSet.has(option.slug)}
                  className="pointer-events-none"
                />
                <span>{option.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </>
    ),
    [
      handleSelect,
      selectedGroupedSingles,
      selectedGroupedSubItems,
      selectedSet,
    ],
  );

  return (
    <Command>
      <CommandInput placeholder="Filter..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {hasAnySubcategories
          ? renderGroupedOptions(optionsWithSub, optionsWithoutSub)
          : renderFlatOptions(filterOptions)}
      </CommandList>
    </Command>
  );
};
