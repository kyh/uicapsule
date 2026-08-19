import type { Column, FilterModel, FiltersState } from "../../core/types";
import type { ColumnDef, ColumnFiltersState, TableFeatures } from "@tanstack/react-table";
import { z } from "zod";

import { multiOptionFilterFn, optionFilterFn } from "../../lib/filter-fns";
import { booleanFilterFn, dateFilterFn, numberFilterFn, textFilterFn } from "./filter-fns";

// Cell values arrive untyped from tanstack rows; parse them at this boundary.
const optionValueCell = z.string();
const columnOptionCell = z.object({ value: z.string(), label: z.string() });
const optionValueListCell = z.array(optionValueCell);
const columnOptionListCell = z.array(columnOptionCell);

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

        const optionValue = optionValueCell.safeParse(value);
        if (optionValue.success) {
          return optionFilterFn(optionValue.data, filterValue);
        }

        const columnOption = columnOptionCell.safeParse(value);
        if (columnOption.success) {
          return optionFilterFn(columnOption.data.value, filterValue);
        }

        // SAFETY: any other cell holds the column's raw accessor value, which
        // transformValueToOptionFn is defined to accept.
        const sanitizedValue = config.transformValueToOptionFn!(value as never);
        return optionFilterFn(sanitizedValue.value, filterValue);
      };
    }

    if (config.type === "multiOption") {
      col.filterFn = (row, columnId, filterValue: FilterModel<"multiOption">) => {
        const value = row.getValue(columnId);

        if (!value) return false;

        const optionValues = optionValueListCell.safeParse(value);
        if (optionValues.success) {
          return multiOptionFilterFn(optionValues.data, filterValue);
        }

        const columnOptions = columnOptionListCell.safeParse(value);
        if (columnOptions.success) {
          return multiOptionFilterFn(
            columnOptions.data.map((v) => v.value),
            filterValue,
          );
        }

        // SAFETY: any other cell holds an array of the column's raw accessor
        // values, which transformValueToOptionFn is defined to accept.
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
