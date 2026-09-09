"use client";

import { useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
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
import { useMediaQuery } from "@repo/ui/hooks/use-media-query";
import { cn } from "cn";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import type { GalleryView } from "@/lib/content-data";

export type FacetOption = { name: string; slug: string; count: number };

export type Facet = {
  key: "element" | "source" | "style";
  label: string;
  allLabel: string;
  mode: "single" | "multi";
  options: FacetOption[];
};

type FilterBarProps = {
  view: GalleryView;
  facets: Facet[];
};

export const FilterBar = ({ view, facets }: FilterBarProps) => (
  <>
    <ExploreMenu view={view} />
    <FacetGroup facets={facets} />
  </>
);

const triggerClassname = (highlighted: boolean) =>
  cn("shrink-0 dark:bg-background!", highlighted && "border-foreground relative z-10");

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
    searchParams,
    hrefWith,
    navigate: (mutate: (params: URLSearchParams) => void) =>
      router.push(hrefWith(mutate), { scroll: false }),
  };
};

const galleryViews = [
  { value: "recent", label: "Recently added" },
  { value: "recommended", label: "Recommended" },
] satisfies { value: GalleryView; label: string }[];

const ExploreMenu = ({ view }: { view: GalleryView }) => {
  const { navigate } = useFilterNavigation();
  const current = galleryViews.find((candidate) => candidate.value === view);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className={triggerClassname(false)} />}
      >
        {current?.label} <ChevronDownIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={view}
          onValueChange={(value) => {
            const next = galleryViews.find((candidate) => candidate.value === value);
            if (!next) return;
            navigate((params) => {
              if (next.value === "recent") {
                params.delete("view");
              } else {
                params.set("view", next.value);
              }
            });
          }}
        >
          {galleryViews.map((candidate) => (
            <DropdownMenuRadioItem key={candidate.value} value={candidate.value}>
              {candidate.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// One shared popup morphs between facets instead of remounting per trigger.
const FacetGroup = ({ facets }: { facets: Facet[] }) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { searchParams } = useFilterNavigation();
  const selectedFor = (facet: Facet) => parseSelection(searchParams.get(facet.key));

  if (isDesktop) {
    return (
      <NavigationMenu>
        <ButtonGroup render={<NavigationMenuList className="gap-0" />}>
          {facets.map((facet) => (
            <NavigationMenuItem key={facet.key} value={facet.key}>
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
              <NavigationMenuContent className="w-60">
                <FacetList facet={facet} selected={selectedFor(facet)} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}
        </ButtonGroup>
        <NavigationMenuPortal>
          <NavigationMenuPositioner align="end">
            <NavigationMenuPopup>
              <NavigationMenuViewport />
            </NavigationMenuPopup>
          </NavigationMenuPositioner>
        </NavigationMenuPortal>
      </NavigationMenu>
    );
  }

  return (
    <ButtonGroup>
      {facets.map((facet) => (
        <FacetDrawer key={facet.key} facet={facet} selected={selectedFor(facet)} />
      ))}
    </ButtonGroup>
  );
};

type FacetProps = { facet: Facet; selected: ReadonlySet<string> };

const FacetDrawer = ({ facet, selected }: FacetProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className={triggerClassname(selected.size > 0)}>
          <FacetLabel facet={facet} selected={selected} />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>{facet.label}</DrawerTitle>
          <DrawerDescription>Select filters</DrawerDescription>
        </DrawerHeader>
        <div className="mt-4 border-t">
          <FacetList facet={facet} selected={selected} onNavigate={() => setOpen(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

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

const rowClassname =
  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-muted focus-visible:bg-muted data-[empty]:text-muted-foreground";

const FacetList = ({ facet, selected, onNavigate }: FacetProps & { onNavigate?: () => void }) => {
  const { hrefWith, navigate } = useFilterNavigation();

  if (facet.mode === "multi") {
    const toggle = (slug: string) => {
      const next = new Set(selected);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      navigate((params) => {
        if (next.size > 0) {
          params.set(facet.key, [...next].join(","));
        } else {
          params.delete(facet.key);
        }
      });
    };

    return (
      <div className="p-1">
        {facet.options.map((option) => (
          <label
            key={option.slug}
            className={cn(
              rowClassname,
              "[&:hover_[data-slot=checkbox]]:border-muted-foreground/60",
            )}
            data-empty={option.count === 0 || undefined}
          >
            <Checkbox
              checked={selected.has(option.slug)}
              onCheckedChange={() => toggle(option.slug)}
            />
            <span className="flex-1">{option.name}</span>
            <FacetCount count={option.count} />
          </label>
        ))}
      </div>
    );
  }

  const rows: { slug: string | null; name: string; count: number | null }[] = [
    { slug: null, name: facet.allLabel, count: null },
    ...facet.options,
  ];

  return (
    <div className="p-1">
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
            {row.count !== null && <FacetCount count={row.count} />}
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
    </div>
  );
};

const FacetCount = ({ count }: { count: number }) => (
  <span className="text-muted-foreground font-mono text-xs tabular-nums">{count}</span>
);

const parseSelection = (value: string | null): ReadonlySet<string> =>
  new Set(
    (value ?? "")
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean),
  );
