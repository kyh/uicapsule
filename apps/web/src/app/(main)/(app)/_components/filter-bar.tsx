"use client";

import { useOptimistic, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { cn } from "cn";
import { ChevronDownIcon, SearchIcon } from "lucide-react";

import { galleryParams } from "@/lib/content/content-categories";
import type { GalleryFilter } from "@/lib/content/content-categories";

export interface FacetOption {
  name: string;
  slug: string;
  count?: number;
}

export interface Facet {
  key: "view" | "element" | "style";
  label: string;
  mode: "single" | "multi";
  searchable: boolean;
  trailing?: boolean;
  defaultOption?: { name: string };
  options: FacetOption[];
}

interface FacetProps {
  facet: Facet;
  selected: ReadonlySet<string>;
}

interface FacetRow {
  slug: string | null;
  name: string;
  count?: number;
}

const selectionFor = (filter: GalleryFilter, key: Facet["key"]) => {
  if (key === "element") {
    return new Set(filter.elements);
  }

  if (key === "style") {
    return new Set(filter.styles);
  }

  return new Set(filter.view === "recent" ? [] : [filter.view]);
};

const triggerClassname = (highlighted: boolean) =>
  cn(
    "hover:text-primary aria-expanded:text-primary shrink-0 dark:bg-background!",
    highlighted && "border-foreground",
  );

const DEFAULT_ROW = "default";

const rowClassname =
  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-muted focus-visible:bg-muted data-[empty]:text-muted-foreground [&:hover_[data-slot=checkbox]]:border-muted-foreground/60 [&:hover_[data-slot=radio-group-item]]:border-muted-foreground/60";

const useFilterNavigation = (filter: GalleryFilter) => {
  const router = useRouter();
  const pathname = usePathname();

  const hrefWith = (mutate: (params: URLSearchParams) => void) => {
    const params = galleryParams(filter);
    mutate(params);
    const query = params.toString();

    return `${pathname}${query ? `?${query}` : ""}`;
  };

  return {
    navigate: (mutate: (params: URLSearchParams) => void) => {
      router.push(hrefWith(mutate), { scroll: false });
    },
  };
};

const FacetCount = ({ count }: { count?: number }) =>
  count === undefined ? null : (
    <span className="text-muted-foreground font-mono text-xs tabular-nums">{count}</span>
  );

const FacetRows = ({ empty, children }: { empty: boolean; children: React.ReactNode }) => (
  <div className="max-h-72 overflow-y-auto p-1">
    {empty ? <div className="py-6 text-center text-sm">No results found.</div> : children}
  </div>
);

interface FilterInputProps {
  value: string;
  onChange: (value: string) => void;
}

const FilterInput = ({ value, onChange }: FilterInputProps) => (
  <div className="border-border/60 flex h-9 shrink-0 items-center gap-2 border-b px-3">
    <SearchIcon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
    <input
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      placeholder="Filter..."
      aria-label="Filter options"
      className="placeholder:text-muted-foreground h-full w-full bg-transparent text-sm outline-none"
    />
  </div>
);

const FacetLabel = ({ facet, selected }: FacetProps) => {
  const names = facet.options
    .filter((option) => selected.has(option.slug))
    .map((option) => option.name);

  if (names.length === 1) {
    return (
      <>
        {names[0]} <ChevronDownIcon className="size-4" />
      </>
    );
  }

  return (
    <>
      {facet.label}{" "}
      {names.length > 1 ? (
        <Badge variant="secondary" className="text-current">
          {names.length}
        </Badge>
      ) : (
        <ChevronDownIcon className="size-4" />
      )}
    </>
  );
};

const FacetList = ({
  facet,
  filter,
  query,
  onNavigate,
}: {
  facet: Facet;
  filter: GalleryFilter;
  query: string;
  onNavigate?: () => void;
}) => {
  const selected = selectionFor(filter, facet.key);
  const { navigate } = useFilterNavigation(filter);
  const [, startTransition] = useTransition();
  const [checked, setChecked] = useOptimistic(selected);
  const normalizedQuery = facet.searchable ? query.trim().toLowerCase() : "";
  const matches = (name: string) => name.toLowerCase().includes(normalizedQuery);

  if (facet.mode === "multi") {
    const toggle = (slug: string) => {
      const next = new Set(checked);

      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }

      startTransition(() => {
        setChecked(next);
        navigate((params) => {
          if (next.size > 0) {
            params.set(facet.key, [...next].toSorted().join(","));
          } else {
            params.delete(facet.key);
          }
        });
      });
    };

    const options = facet.options.filter((option) => matches(option.name));

    return (
      <FacetRows empty={options.length === 0}>
        {options.map((option) => (
          <label
            key={option.slug}
            className={rowClassname}
            data-empty={option.count === 0 || undefined}
          >
            <Checkbox
              checked={checked.has(option.slug)}
              onCheckedChange={() => {
                toggle(option.slug);
              }}
            />
            <span className="flex-1">{option.name}</span>
            <FacetCount count={option.count} />
          </label>
        ))}
      </FacetRows>
    );
  }

  const rows: FacetRow[] = [
    ...(facet.defaultOption ? [{ name: facet.defaultOption.name, slug: null }] : []),
    ...facet.options,
  ].filter((row) => matches(row.name));

  const select = (slug: string | null) => {
    startTransition(() => {
      setChecked(new Set(slug === null ? [] : [slug]));
      navigate((params) => {
        if (slug === null) {
          params.delete(facet.key);
        } else {
          params.set(facet.key, slug);
        }
      });
    });
    onNavigate?.();
  };

  return (
    <FacetRows empty={rows.length === 0}>
      <RadioGroup
        aria-label={facet.label}
        value={[...checked][0] ?? DEFAULT_ROW}
        onValueChange={(value) => {
          select(value === DEFAULT_ROW ? null : value);
        }}
      >
        {rows.map((row) => (
          <label
            key={row.slug ?? DEFAULT_ROW}
            className={rowClassname}
            data-empty={row.count === 0 || undefined}
          >
            <RadioGroupItem value={row.slug ?? DEFAULT_ROW} />
            <span className="flex-1">{row.name}</span>
            <FacetCount count={row.count} />
          </label>
        ))}
      </RadioGroup>
    </FacetRows>
  );
};

const FacetDrawer = ({ facet, filter }: { facet: Facet; filter: GalleryFilter }) => {
  const selected = selectionFor(filter, facet.key);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        setQuery("");
      }}
    >
      <DrawerTrigger
        render={
          <Button variant="outline" size="sm" className={triggerClassname(selected.size > 0)} />
        }
      >
        <FacetLabel facet={facet} selected={selected} />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>{facet.label}</DrawerTitle>
          <DrawerDescription>Select filters</DrawerDescription>
        </DrawerHeader>
        <div className="mt-4 border-t">
          {facet.searchable && <FilterInput value={query} onChange={setQuery} />}
          <FacetList
            facet={facet}
            filter={filter}
            query={query}
            onNavigate={() => {
              setOpen(false);
            }}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export const FilterBar = ({ facets, filter }: { facets: Facet[]; filter: GalleryFilter }) => {
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<Facet["key"] | null>(null);
  const activeFacet = facets.find((facet) => facet.key === openKey);
  const selectedFor = (facet: Facet) => selectionFor(filter, facet.key);
  const leading = facets.filter((facet) => facet.trailing !== true);
  const trailing = facets.filter((facet) => facet.trailing === true);

  const trigger = (facet: Facet) => (
    <NavigationMenuItem key={facet.key} value={facet.key} render={<div />}>
      <NavigationMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={triggerClassname(selectedFor(facet).size > 0)}
          />
        }
      >
        <FacetLabel facet={facet} selected={selectedFor(facet)} />
      </NavigationMenuTrigger>
      <NavigationMenuContent className={facet.searchable ? "w-64" : "w-48"}>
        <FacetList
          facet={facet}
          filter={filter}
          query={query}
          onNavigate={() => {
            setOpenKey(null);
          }}
        />
      </NavigationMenuContent>
    </NavigationMenuItem>
  );

  const drawer = (facet: Facet) => <FacetDrawer key={facet.key} facet={facet} filter={filter} />;

  return (
    <>
      <NavigationMenu
        className="w-full max-md:hidden"
        value={openKey}
        onValueChange={(value) => {
          setOpenKey(value);
          setQuery("");
        }}
      >
        <NavigationMenuList render={<div />} className="gap-2">
          {leading.map(trigger)}
          <div className="ml-auto flex items-center gap-3">{trailing.map(trigger)}</div>
        </NavigationMenuList>
        <NavigationMenuPortal>
          <NavigationMenuPositioner>
            <NavigationMenuPopup>
              {activeFacet?.searchable === true && (
                <FilterInput value={query} onChange={setQuery} />
              )}
              <NavigationMenuViewport />
            </NavigationMenuPopup>
          </NavigationMenuPositioner>
        </NavigationMenuPortal>
      </NavigationMenu>
      <div className="flex w-full items-center gap-2 md:hidden">
        {leading.map(drawer)}
        <div className="ml-auto flex items-center gap-3">{trailing.map(drawer)}</div>
      </div>
    </>
  );
};
