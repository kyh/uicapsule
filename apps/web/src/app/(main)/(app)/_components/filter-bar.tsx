"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { ButtonGroup } from "@repo/ui/components/button-group";
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
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPopup,
  NavigationMenuPortal,
  NavigationMenuPositioner,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@repo/ui/components/navigation-menu";
import { cn } from "cn";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";

import { parseGalleryFilter } from "@/lib/content/content-categories";
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
  // Sits on its own outside the joined group.
  standalone?: boolean;
  // Single-select only: the row that clears the parameter instead of setting it.
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

const selectionFor = (filter: GalleryFilter, key: Facet["key"]): ReadonlySet<string> => {
  if (key === "element") {
    return new Set(filter.elements);
  }
  if (key === "style") {
    return new Set(filter.styles);
  }
  return new Set(filter.view === "recent" ? [] : [filter.view]);
};

// A selected trigger draws its whole outline over the group's shared divider.
const triggerClassname = (highlighted: boolean) =>
  cn("shrink-0 dark:bg-background!", highlighted && "border-foreground relative z-10 border-l!");

const rowClassname =
  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-muted focus-visible:bg-muted data-[empty]:text-muted-foreground";

const useFilterNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefWith = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  };

  return {
    hrefWith,
    navigate: (mutate: (params: URLSearchParams) => void) =>
      router.push(hrefWith(mutate), { scroll: false }),
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
      onChange={(event) => onChange(event.target.value)}
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
        <Badge variant="secondary">{names.length}</Badge>
      ) : (
        <ChevronDownIcon className="size-4" />
      )}
    </>
  );
};

const FacetList = ({
  facet,
  selected,
  query,
  onNavigate,
}: FacetProps & { query: string; onNavigate?: () => void }) => {
  const { hrefWith, navigate } = useFilterNavigation();
  const [, startTransition] = useTransition();
  // The URL only updates once the server re-renders the grid; ticks must not wait for it.
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
            className={cn(
              rowClassname,
              "[&:hover_[data-slot=checkbox]]:border-muted-foreground/60",
            )}
            data-empty={option.count === 0 || undefined}
          >
            <Checkbox
              checked={checked.has(option.slug)}
              onCheckedChange={() => toggle(option.slug)}
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

  return (
    <FacetRows empty={rows.length === 0}>
      {rows.map((row) => {
        const active = row.slug === null ? selected.size === 0 : selected.has(row.slug);
        const href = hrefWith((params) => {
          if (row.slug === null) {
            params.delete(facet.key);
          } else {
            params.set(facet.key, row.slug);
          }
        });
        const content = (
          <>
            <CheckIcon className={cn("size-4", !active && "invisible")} />
            <span className="flex-1">{row.name}</span>
            <FacetCount count={row.count} />
          </>
        );
        const rowProps = {
          className: rowClassname,
          "data-empty": row.count === 0 || undefined,
        };

        // The menu link needs NavigationMenu context; the drawer has none.
        return onNavigate ? (
          <Link
            key={row.slug ?? "all"}
            href={href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            {...rowProps}
          >
            {content}
          </Link>
        ) : (
          <NavigationMenuLink
            key={row.slug ?? "all"}
            active={active}
            closeOnClick
            render={<Link href={href} scroll={false} />}
            {...rowProps}
          >
            {content}
          </NavigationMenuLink>
        );
      })}
    </FacetRows>
  );
};

const FacetDrawer = ({ facet, selected }: FacetProps) => {
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
            selected={selected}
            query={query}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// Both layouts mount and CSS picks one, so the server render already matches the viewport.
export const FilterBar = ({ facets }: { facets: Facet[] }) => {
  const [query, setQuery] = useState("");
  const [activeFacet, setActiveFacet] = useState<Facet | null>(null);
  const searchParams = useSearchParams();
  const filter = parseGalleryFilter((key) => searchParams.get(key));
  const selectedFor = (facet: Facet) => selectionFor(filter, facet.key);
  const standalone = facets.filter((facet) => facet.standalone);
  const grouped = facets.filter((facet) => !facet.standalone);

  // Items render as divs so the joined group can wrap a subset of the list.
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
      <NavigationMenuContent className="w-64">
        <FacetList facet={facet} selected={selectedFor(facet)} query={query} />
      </NavigationMenuContent>
    </NavigationMenuItem>
  );

  const drawer = (facet: Facet) => (
    <FacetDrawer key={facet.key} facet={facet} selected={selectedFor(facet)} />
  );

  // One shared popup morphs between facets instead of remounting the search input.
  return (
    <>
      <NavigationMenu
        className="max-md:hidden"
        onValueChange={(value) => {
          setActiveFacet(facets.find((facet) => facet.key === value) ?? null);
          setQuery("");
        }}
      >
        <NavigationMenuList render={<div />}>
          {standalone.map(trigger)}
          <ButtonGroup>{grouped.map(trigger)}</ButtonGroup>
        </NavigationMenuList>
        <NavigationMenuPortal>
          <NavigationMenuPositioner>
            <NavigationMenuPopup>
              {activeFacet?.searchable && <FilterInput value={query} onChange={setQuery} />}
              <NavigationMenuViewport />
            </NavigationMenuPopup>
          </NavigationMenuPositioner>
        </NavigationMenuPortal>
      </NavigationMenu>
      <div className="flex items-center gap-3 md:hidden">
        {standalone.map(drawer)}
        <ButtonGroup>{grouped.map(drawer)}</ButtonGroup>
      </div>
    </>
  );
};
