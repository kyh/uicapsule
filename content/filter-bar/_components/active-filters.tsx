import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator";
import { X } from "lucide-react";

import type {
  Column,
  ColumnDataType,
  DataTableFilterActions,
  FilterModel,
  FiltersState,
  FilterStrategy,
} from "../filter-package";
import { getColumn } from "../filter-package";
import { FilterOperator } from "./filter-operator";
import { FilterSubject } from "./filter-subject";
import { FilterValue } from "./filter-value";

interface ActiveFiltersProps<TData> {
  columns: Column<TData>[];
  filters: FiltersState;
  actions: DataTableFilterActions;
  strategy: FilterStrategy;
  entityName?: string;
  aiGenerating?: boolean;
}

export function ActiveFilters<TData>({
  columns,
  filters,
  actions,
  strategy,
  entityName,
  aiGenerating,
}: ActiveFiltersProps<TData>) {
  return (
    <>
      {filters.map((filter) => {
        const id = filter.columnId;

        const column = getColumn(columns, id);

        // Skip if no filter value
        if (!filter.values) return null;

        return (
          <ActiveFilter
            key={`active-filter-${filter.columnId}`}
            filter={filter}
            column={column}
            actions={actions}
            strategy={strategy}
            entityName={entityName}
          />
        );
      })}
      {aiGenerating && <ActiveFilterSkeleton />}
    </>
  );
}

function ActiveFilterSkeleton() {
  return (
    <div className="border-border bg-muted/60 text-muted-foreground flex h-7 items-center gap-2 rounded-2xl border px-3 text-xs shadow-xs">
      <div className="flex items-center gap-2">
        <span className="bg-muted-foreground/60 block h-2 w-10 animate-pulse rounded" />
        <span className="bg-muted-foreground/40 block h-2 w-6 animate-pulse rounded" />
      </div>
    </div>
  );
}

interface ActiveFilterProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>;
  column: Column<TData, TType>;
  actions: DataTableFilterActions;
  strategy: FilterStrategy;
  entityName?: string;
}

// Generic render function for a filter with type-safe value
export function ActiveFilter<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  strategy,
  entityName,
}: ActiveFilterProps<TData, TType>) {
  return (
    <div className="border-border bg-background flex h-7 items-center rounded-2xl border text-xs shadow-xs">
      <FilterSubject column={column} entityName={entityName} />
      <Separator orientation="vertical" />
      <FilterOperator filter={filter} column={column} actions={actions} />
      <Separator orientation="vertical" />
      <FilterValue
        filter={filter}
        column={column}
        actions={actions}
        strategy={strategy}
        entityName={entityName}
      />
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        className="text-muted-foreground hover:text-primary h-full w-7 rounded-none rounded-r-2xl text-xs"
        onClick={() => actions.removeFilter(filter.columnId)}
      >
        <X className="size-4 -translate-x-0.5" />
      </Button>
    </div>
  );
}

export function ActiveFiltersMobileContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftBlur, setShowLeftBlur] = useState(false);
  const [showRightBlur, setShowRightBlur] = useState(true);

  // Check if there's content to scroll and update blur states
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;

      // Show left blur if scrolled to the right
      setShowLeftBlur(scrollLeft > 0);

      // Show right blur if there's more content to scroll to the right
      // Add a small buffer (1px) to account for rounding errors
      setShowRightBlur(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  // Log blur states for debugging
  // useEffect(() => {
  //   console.log('left:', showLeftBlur, '  right:', showRightBlur)
  // }, [showLeftBlur, showRightBlur])

  // Set up ResizeObserver to monitor container size
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (scrollContainerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        checkScroll();
      });
      resizeObserver.observe(scrollContainerRef.current);
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Update blur states when children change
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    checkScroll();
  }, [children]);

  return (
    <div className="relative w-full overflow-x-hidden">
      {/* Left blur effect */}
      {showLeftBlur && (
        <div className="from-background animate-in fade-in-0 pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-16 bg-gradient-to-r to-transparent" />
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="no-scrollbar flex gap-2 overflow-x-scroll"
        onScroll={checkScroll}
      >
        {children}
      </div>

      {/* Right blur effect */}
      {showRightBlur && (
        <div className="from-background animate-in fade-in-0 pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-16 bg-gradient-to-l to-transparent" />
      )}
    </div>
  );
}
