import { Button, Separator } from "./ui";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

import type {
  Column,
  FilterBinding,
  DataTableFilterActions,
  FiltersState,
  FilterStrategy,
} from "../filter-package";
import { getColumn, bindFilter } from "../filter-package";
import { FilterOperator } from "./filter-operator";
import { FilterSubject } from "./filter-subject";
import { FilterValue } from "./filter-value";

interface ActiveFiltersProps {
  columns: Column[];
  filters: FiltersState;
  actions: DataTableFilterActions;
  strategy: FilterStrategy;
  entityName?: string;
  aiGenerating?: boolean;
}

export function ActiveFilters({
  columns,
  filters,
  actions,
  strategy,
  entityName,
  aiGenerating,
}: ActiveFiltersProps) {
  return (
    <>
      {filters.map((filter) => {
        const id = filter.columnId;

        const column = getColumn(columns, id);

        return (
          <ActiveFilter
            key={`active-filter-${filter.columnId}`}
            binding={bindFilter(column, filter)}
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
    <div className="border-(--border) bg-(--muted)/60 text-(--muted-foreground) flex h-7 items-center gap-2 rounded-2xl border px-3 text-xs shadow-xs">
      <div className="flex items-center gap-2">
        <span className="bg-(--muted-foreground)/60 block h-2 w-10 animate-pulse rounded" />
        <span className="bg-(--muted-foreground)/40 block h-2 w-6 animate-pulse rounded" />
      </div>
    </div>
  );
}

interface ActiveFilterProps {
  binding: FilterBinding;
  actions: DataTableFilterActions;
  strategy: FilterStrategy;
  entityName?: string;
}

export function ActiveFilter({ binding, actions, strategy, entityName }: ActiveFilterProps) {
  const { column, filter } = binding;
  if (!filter) return null;
  return (
    <div className="border-(--border) bg-(--background) flex h-7 items-center rounded-2xl border text-xs shadow-xs">
      <FilterSubject column={column} entityName={entityName} />
      <Separator orientation="vertical" />
      <FilterOperator filter={filter} actions={actions} />
      <Separator orientation="vertical" />
      <FilterValue
        binding={binding}
        actions={actions}
        strategy={strategy}
        entityName={entityName}
      />
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        className="text-(--muted-foreground) hover:text-(--primary) h-full w-7 rounded-none rounded-r-2xl text-xs"
        aria-label={`Remove ${column.displayName} filter`}
        onClick={() => actions.removeFilter(filter.columnId)}
      >
        <X className="size-4 -translate-x-0.5" />
      </Button>
    </div>
  );
}

export function ActiveFiltersContainer({ children }: { children: ReactNode }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftBlur, setShowLeftBlur] = useState(false);
  const [showRightBlur, setShowRightBlur] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;

    setShowLeftBlur(scrollLeft > 0);
    // 1px buffer absorbs subpixel rounding so the right blur clears at the end.
    setShowRightBlur(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);
    const mutationObserver = new MutationObserver(checkScroll);
    mutationObserver.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [checkScroll]);

  return (
    <div className="relative min-w-0 flex-1 overflow-x-hidden md:overflow-visible">
      {showLeftBlur && (
        <div className="from-(--background) animate-in fade-in-0 pointer-events-none absolute top-0 bottom-0 left-0 z-10 md:hidden w-16 bg-gradient-to-r to-transparent" />
      )}

      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible"
        onScroll={checkScroll}
      >
        {children}
      </div>

      {showRightBlur && (
        <div className="from-(--background) animate-in fade-in-0 pointer-events-none absolute top-0 right-0 bottom-0 z-10 md:hidden w-16 bg-gradient-to-l to-transparent" />
      )}
    </div>
  );
}
