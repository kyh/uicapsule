"use client";

import { useMemo } from "react";

import type {
  Column,
  DataTableFilterActions,
  FiltersState,
  FilterStrategy,
} from "../filter-package";
import { ActiveFilters, ActiveFiltersContainer } from "./active-filters";
import { FilterActions } from "./filter-actions";
import { FilterSelector } from "./filter-selector";
import type { FilterBarStyle } from "./ui";
import { FilterBarStyleContext } from "./ui";
import { useAiFilterSimulation } from "./use-ai-filter-simulation";

const DEFAULT_AI_CHUNK_DELAY_MS: [number, number] = [600, 1400];

interface DataTableFilterProps {
  columns: Column[];
  filters: FiltersState;
  actions: DataTableFilterActions;
  strategy: FilterStrategy;
  entityName?: string;
  accent?: string;
  chipRadius?: number;
  placeholder?: string;
  ai?: boolean;
  aiChunkDelayMs?: [number, number];
}

export const DataTableFilter = ({
  columns,
  filters,
  actions,
  strategy,
  entityName,
  accent = "#f66b2c",
  chipRadius = 16,
  placeholder,
  ai = true,
  aiChunkDelayMs = DEFAULT_AI_CHUNK_DELAY_MS,
}: DataTableFilterProps) => {
  const { aiGenerating, handleAiFilterSubmit } = useAiFilterSimulation({
    actions,
    chunkDelayMs: aiChunkDelayMs,
    columns,
  });

  const style = useMemo<FilterBarStyle>(
    () => ({ "--chip-radius": `${chipRadius}px`, "--primary": accent }),
    [accent, chipRadius],
  );

  const selectorProps = {
    actions,
    aiGenerating,
    columns,
    filters,
    onAIFilterSubmit: ai ? handleAiFilterSubmit : undefined,
    placeholder,
    strategy,
  } as const;

  return (
    <FilterBarStyleContext value={style}>
      <div className="filter-bar flex w-full items-start gap-2" style={style}>
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
    </FilterBarStyleContext>
  );
};
