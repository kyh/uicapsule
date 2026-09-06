"use client";

import { useMemo, useState } from "react";
import type { DataTableFilterActions, DataTableFiltersOptions, FiltersState } from "../core/types";
import { createColumns } from "../core/columns/column-factory";
import { setFilterOperator, setFilterValue, toggleFilterValues } from "../core/filters";

export function useDataTableFilters<Row>({
  data,
  columnsConfig,
  filters: controlledFilters,
  onFiltersChange,
  defaultFilters = [],
  strategy = "client",
  entityName,
}: DataTableFiltersOptions<Row>) {
  const [internalFilters, setInternalFilters] = useState<FiltersState>(defaultFilters);
  const filters = controlledFilters ?? internalFilters;
  const setFilters = onFiltersChange ?? setInternalFilters;
  const columns = useMemo(
    () => createColumns(data, columnsConfig, strategy),
    [data, columnsConfig, strategy],
  );
  const actions = useMemo<DataTableFilterActions>(
    () => ({
      setFilterValue: (update) => setFilters((current) => setFilterValue(current, update)),
      setFilterOperator: (update) => setFilters((current) => setFilterOperator(current, update)),
      addFilterValue: (column, values) =>
        setFilters((current) => toggleFilterValues(current, column, values, true)),
      removeFilterValue: (column, values) =>
        setFilters((current) => toggleFilterValues(current, column, values, false)),
      removeFilter: (columnId) =>
        setFilters((current) => current.filter((filter) => filter.columnId !== columnId)),
      removeAllFilters: () => setFilters([]),
    }),
    [setFilters],
  );
  return { columns, filters, actions, strategy, entityName };
}
