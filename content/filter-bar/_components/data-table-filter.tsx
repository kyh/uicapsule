"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useIsMobile } from "@repo/ui/utils";

import type {
  Column,
  DataTableFilterActions,
  FiltersState,
  FilterStrategy,
} from "../filter-package";
import { isAnyOf } from "../filter-package";
import { ActiveFilters, ActiveFiltersMobileContainer } from "./active-filters";
import { FilterActions } from "./filter-actions";
import { FilterSelector } from "./filter-selector";

interface DataTableFilterProps<TData> {
  columns: Column<TData>[];
  filters: FiltersState;
  actions: DataTableFilterActions;
  strategy: FilterStrategy;
  entityName?: string;
}

export function DataTableFilter<TData>({
  columns,
  filters,
  actions,
  strategy,
  entityName,
}: DataTableFilterProps<TData>) {
  const isMobile = useIsMobile();
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSkeletonCount, setAiSkeletonCount] = useState(0);
  const aiTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearAiTimeouts = useCallback(() => {
    aiTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    aiTimeoutsRef.current = [];
  }, []);

  useEffect(() => clearAiTimeouts, [clearAiTimeouts]);

  const visibleOptionColumns = useMemo(
    () =>
      columns.filter(
        (column) =>
          !column.hidden && isAnyOf(column.type, ["option", "multiOption"]),
      ),
    [columns],
  );

  const handleAiFilterSubmit = useCallback(
    (prompt: string) => {
      if (!prompt.trim()) return;

      clearAiTimeouts();

      const sampledColumns = [...visibleOptionColumns];
      for (let i = sampledColumns.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [sampledColumns[i], sampledColumns[j]] = [
          sampledColumns[j],
          sampledColumns[i],
        ];
      }

      const selectedColumns = sampledColumns.slice(0, 2);

      if (selectedColumns.length === 0) {
        setAiSkeletonCount(0);
        setAiGenerating(false);
        return;
      }

      setAiGenerating(true);
      setAiSkeletonCount(Math.max(2, selectedColumns.length + 1));

      const queueFinish = () => {
        const finishTimeout = setTimeout(() => {
          setAiGenerating(false);
          setAiSkeletonCount(0);
        }, 300);
        aiTimeoutsRef.current.push(finishTimeout);
      };

      selectedColumns.forEach((column, index) => {
        const options = column.getOptions();
        if (!options || options.length === 0) {
          setAiSkeletonCount((prev) => Math.max(prev - 1, 0));
          if (index === selectedColumns.length - 1) {
            queueFinish();
          }
          return;
        }

        const option = options[Math.floor(Math.random() * options.length)];
        const timeout = setTimeout(() => {
          actions.setFilterValue(column as Column<TData, any>, [
            option.value,
          ] as any);
          setAiSkeletonCount((prev) => Math.max(prev - 1, 0));

          if (index === selectedColumns.length - 1) {
            queueFinish();
          }
        }, 900 + index * 600);

        aiTimeoutsRef.current.push(timeout);
      });
    },
    [actions, clearAiTimeouts, visibleOptionColumns],
  );

  const selectorProps = {
    columns,
    filters,
    actions,
    strategy,
    onAIFilterSubmit: handleAiFilterSubmit,
    aiGenerating,
  } as const;

  if (isMobile) {
    return (
      <div className="flex w-full items-start justify-between gap-2">
        <FilterSelector {...selectorProps} />
        <ActiveFiltersMobileContainer>
          <ActiveFilters
            columns={columns}
            filters={filters}
            actions={actions}
            strategy={strategy}
            entityName={entityName}
            aiGenerating={aiGenerating}
            aiSkeletonCount={aiSkeletonCount}
          />
          <FilterActions hasFilters={filters.length > 0} actions={actions} />
        </ActiveFiltersMobileContainer>
      </div>
    );
  }

  return (
    <div className="flex w-full items-start justify-between gap-2">
      <div className="flex w-full flex-1 gap-2 md:flex-wrap">
        <FilterSelector {...selectorProps} />
        <ActiveFilters
          columns={columns}
          filters={filters}
          actions={actions}
          strategy={strategy}
          entityName={entityName}
          aiGenerating={aiGenerating}
          aiSkeletonCount={aiSkeletonCount}
        />
        <FilterActions hasFilters={filters.length > 0} actions={actions} />
      </div>
    </div>
  );
}
