import type { FilterModel } from "../../core/types";
import type { Row, TableFeatures } from "@tanstack/react-table";
import * as f from "../../lib/filter-fns";

export function dateFilterFn<TFeatures extends TableFeatures, TData>(
  row: Row<TFeatures, TData>,
  columnId: string,
  filterValue: FilterModel<"date">,
): boolean {
  const value = row.getValue<Date>(columnId);

  return f.dateFilterFn(value, filterValue);
}

export function textFilterFn<TFeatures extends TableFeatures, TData>(
  row: Row<TFeatures, TData>,
  columnId: string,
  filterValue: FilterModel<"text">,
): boolean {
  const value = row.getValue<string>(columnId) ?? "";

  return f.textFilterFn(value, filterValue);
}

export function numberFilterFn<TFeatures extends TableFeatures, TData>(
  row: Row<TFeatures, TData>,
  columnId: string,
  filterValue: FilterModel<"number">,
): boolean {
  const value = row.getValue<number>(columnId);

  return f.numberFilterFn(value, filterValue);
}

export function booleanFilterFn<TFeatures extends TableFeatures, TData>(
  row: Row<TFeatures, TData>,
  columnId: string,
  filterValue: FilterModel<"boolean">,
): boolean {
  const value = row.getValue<boolean>(columnId) ?? false;

  return f.booleanFilterFn(value, filterValue);
}
