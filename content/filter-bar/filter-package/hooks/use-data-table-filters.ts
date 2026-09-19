"use client";

import { useMemo, useState } from "react";
import type { DataTableFilterActions, DataTableFiltersOptions, FiltersState } from "../core/types";
import { createColumns } from "../core/columns/column-factory";
import { setFilterOperator, setFilterValue, toggleFilterValues } from "../core/filters";

export const useDataTableFilters = <Row>({
  data,
  columnsConfig,
  filters: controlledFilters,
  onFiltersChange,
  defaultFilters = [],
  strategy = "client",
  entityName,
}: DataTableFiltersOptions<Row>) => {
  const [internalFilters, setInternalFilters] = useState<FiltersState>(defaultFilters);
  const filters = controlledFilters ?? internalFilters;
  const setFilters = onFiltersChange ?? setInternalFilters;
  const columns = useMemo(
    () => createColumns(data, columnsConfig, strategy),
    [data, columnsConfig, strategy],
  );
  const actions = useMemo<DataTableFilterActions>(
    () => ({
      addFilterValue: (column, values) =>
        setFilters((current) => toggleFilterValues(current, column, values, true)),
      removeAllFilters: () => setFilters([]),
      removeFilter: (columnId) =>
        setFilters((current) => current.filter((filter) => filter.columnId !== columnId)),
      removeFilterValue: (column, values) =>
        setFilters((current) => toggleFilterValues(current, column, values, false)),
      setFilterOperator: (update) => setFilters((current) => setFilterOperator(current, update)),
      setFilterValue: (update) => setFilters((current) => setFilterValue(current, update)),
    }),
    [setFilters],
  );
  return { actions, columns, entityName, filters, strategy };
};
