"use client";

import React, { useMemo } from "react";
import { useIsMobile } from "@repo/ui/utils";

import type {
  Column,
  DataTableFilterActions,
  FiltersState,
  FilterStrategy,
} from "../filter-package";
import { ActiveFilters, ActiveFiltersMobileContainer } from "./active-filters";
import { FilterActions } from "./filter-actions";
import { FilterSelector } from "./filter-selector";
import { useAiFilterSimulation } from "./use-ai-filter-simulation";

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

  const { aiGenerating, handleAiFilterSubmit } = useAiFilterSimulation({
    columns,
    actions,
  });

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
        />
        <FilterActions hasFilters={filters.length > 0} actions={actions} />
      </div>
    </div>
  );
}
