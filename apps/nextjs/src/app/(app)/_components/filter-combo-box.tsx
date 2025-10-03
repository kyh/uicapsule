"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@repo/ui/badge";
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
import { ChevronDownIcon } from "lucide-react";

import type { ContentFilter } from "@/lib/content-categories";

type FilterComboBoxProps = {
  filterKey: string;
  filterOptions: ContentFilter[];
  defaultLabel: string;
  highlighted?: boolean;
};

export const FilterComboBox = ({
  filterKey,
  filterOptions,
  defaultLabel,
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
            <FilterTriggerLabel
              defaultLabel={defaultLabel}
              filterKey={filterKey}
              filterOptions={filterOptions}
            />
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
          <FilterTriggerLabel
            defaultLabel={defaultLabel}
            filterKey={filterKey}
            filterOptions={filterOptions}
          />
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

  const renderFlatOptions = useCallback(
    (options: ContentFilter[]) => (
      <>
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
    [handleSelect, selectedSet],
  );

  const renderGroupedOptions = useCallback(
    (parents: ContentFilter[], singles: ContentFilter[]) => (
      <>
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
    [handleSelect, selectedSet],
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

const FilterTriggerLabel = ({
  defaultLabel,
  filterKey,
  filterOptions,
}: FilterOptionsListProps & {
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
