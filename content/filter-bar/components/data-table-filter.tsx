"use client";

import React from "react";
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
  if (isMobile) {
    return (
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex gap-1">
          <FilterSelector
            columns={columns}
            filters={filters}
            actions={actions}
            strategy={strategy}
          />
          <FilterActions hasFilters={filters.length > 0} actions={actions} />
        </div>
        <ActiveFiltersMobileContainer>
          <ActiveFilters
            columns={columns}
            filters={filters}
            actions={actions}
            strategy={strategy}
            entityName={entityName}
          />
        </ActiveFiltersMobileContainer>
      </div>
    );
  }

  return (
    <div className="flex w-full items-start justify-between gap-2">
      <div className="flex w-full flex-1 gap-2 md:flex-wrap">
        <FilterSelector
          columns={columns}
          filters={filters}
          actions={actions}
          strategy={strategy}
        />
        <ActiveFilters
          columns={columns}
          filters={filters}
          actions={actions}
          strategy={strategy}
          entityName={entityName}
        />
      </div>
      <FilterActions hasFilters={filters.length > 0} actions={actions} />
    </div>
  );
}
