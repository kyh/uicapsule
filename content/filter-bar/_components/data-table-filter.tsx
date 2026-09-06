"use client";

import type {
  Column,
  DataTableFilterActions,
  FiltersState,
  FilterStrategy,
} from "../filter-package";
import { ActiveFilters, ActiveFiltersContainer } from "./active-filters";
import { FilterActions } from "./filter-actions";
import { FilterSelector } from "./filter-selector";
import { useAiFilterSimulation } from "./use-ai-filter-simulation";

interface DataTableFilterProps {
  columns: Column[];
  filters: FiltersState;
  actions: DataTableFilterActions;
  strategy: FilterStrategy;
  entityName?: string;
}

export function DataTableFilter({
  columns,
  filters,
  actions,
  strategy,
  entityName,
}: DataTableFilterProps) {
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

  return (
    <div className="filter-bar flex w-full items-start gap-2">
      <FilterSelector {...selectorProps} />
      <ActiveFiltersContainer>
        <ActiveFilters
          columns={columns}
          filters={filters}
          actions={actions}
          strategy={strategy}
          entityName={entityName}
          aiGenerating={aiGenerating}
        />
        <FilterActions hasFilters={filters.length > 0} actions={actions} />
      </ActiveFiltersContainer>
    </div>
  );
}
