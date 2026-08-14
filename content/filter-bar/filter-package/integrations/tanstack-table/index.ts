import type { Column, FilterModel, FiltersState } from "../../core/types";
import type { ColumnDef, ColumnFiltersState, TableFeatures } from "@tanstack/react-table";
import { multiOptionFilterFn, optionFilterFn } from "../../lib/filter-fns";
import { isColumnOption, isColumnOptionArray, isStringArray } from "../../lib/helpers";
import { booleanFilterFn, dateFilterFn, numberFilterFn, textFilterFn } from "./filter-fns";

interface CreateTSTColumns<TFeatures extends TableFeatures, TData> {
  columns: ColumnDef<TFeatures, TData, any>[];
  configs: Column<TData>[];
}

export function createTSTColumns<TFeatures extends TableFeatures, TData>({
  columns,
  configs,
}: CreateTSTColumns<TFeatures, TData>) {
  const _cols: ColumnDef<TFeatures, TData, any>[] = [];

  for (const col of columns) {
    // Get the column filter config for this column
    const config = configs.find((c) => c.id === col.id);

    // If the column is not filterable or doesn't have a filter config, skip it
    // An explicit check is done on `enableColumnFilter`
    if (col.enableColumnFilter === false || !config) {
      _cols.push(col);
      continue;
    }

    if (config.type === "text") {
      col.filterFn = textFilterFn;
      _cols.push(col);
      continue;
    }

    if (config.type === "number") {
      col.filterFn = numberFilterFn;
      _cols.push(col);
      continue;
    }

    if (config.type === "date") {
      col.filterFn = dateFilterFn;
      _cols.push(col);
      continue;
    }

    if (config.type === "boolean") {
      col.filterFn = booleanFilterFn;
      _cols.push(col);
      continue;
    }

    if (config.type === "option") {
      col.filterFn = (row, columnId, filterValue: FilterModel<"option">) => {
        const value = row.getValue<unknown>(columnId);

        if (!value) return false;

        if (typeof value === "string") {
          return optionFilterFn(value, filterValue);
        }

        if (isColumnOption(value)) {
          return optionFilterFn(value.value, filterValue);
        }

        const sanitizedValue = config.transformValueToOptionFn!(value as never);
        return optionFilterFn(sanitizedValue.value, filterValue);
      };
    }

    if (config.type === "multiOption") {
      col.filterFn = (row, columnId, filterValue: FilterModel<"multiOption">) => {
        const value = row.getValue(columnId);

        if (!value) return false;

        if (isStringArray(value)) {
          return multiOptionFilterFn(value, filterValue);
        }

        if (isColumnOptionArray(value)) {
          return multiOptionFilterFn(
            value.map((v) => v.value),
            filterValue,
          );
        }

        const sanitizedValue = (value as never[]).map((v) => config.transformValueToOptionFn!(v));

        return multiOptionFilterFn(
          sanitizedValue.map((v) => v.value),
          filterValue,
        );
      };
    }

    _cols.push(col);
  }

  return _cols;
}

export function createTSTFilters(filters: FiltersState): ColumnFiltersState {
  return filters.map((filter) => ({ id: filter.columnId, value: filter }));
}
