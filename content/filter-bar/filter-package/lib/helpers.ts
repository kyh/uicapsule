import { isBefore } from "date-fns";
import { z } from "zod";

import type { Column, ColumnOption, FiltersState } from "../core/types";
import {
  booleanFilterFn,
  dateFilterFn,
  multiOptionFilterFn,
  numberFilterFn,
  optionFilterFn,
  textFilterFn,
} from "./filter-fns";

export function getColumn<TData>(columns: Column<TData>[], id: string) {
  const column = columns.find((c) => c.id === id);

  if (!column) {
    throw new Error(`Column with id ${id} not found`);
  }

  return column;
}

export function createNumberFilterValue(values: number[] | undefined): number[] {
  if (!values || values.length === 0 || values[0] === undefined) return [];
  if (values.length === 1) return [values[0]];
  if (values.length === 2) return createNumberRange(values);
  return [values[0], values[1]!];
}

export function createBigIntFilterValue(values: bigint[] | undefined): bigint[] {
  if (!values || values.length === 0 || values[0] === undefined) return [];
  if (values.length === 1) return [values[0]];
  if (values.length === 2) return createBigIntRange(values);
  throw new Error("Cannot create bigint filter value from more than 2 values");
}

export function createDateFilterValue(values: [Date, Date] | [Date] | [] | undefined) {
  if (!values || values.length === 0) return [];
  if (values.length === 1) return [values[0]];
  if (values.length === 2) return createDateRange(values);
  throw new Error("Cannot create date filter value from more than 2 values");
}

export function createDateRange(values: [Date, Date]) {
  const [a, b] = values;
  const [min, max] = isBefore(a, b) ? [a, b] : [b, a];

  return [min, max];
}

export function createNumberRange(values: number[] | undefined) {
  let a = 0;
  let b = 0;

  if (!values || values.length === 0) return [a, b];
  if (values.length === 1) {
    a = values[0]!;
  } else {
    a = values[0]!;
    b = values[1]!;
  }

  const [min, max] = a < b ? [a, b] : [b, a];

  return [min, max];
}

export function createBigIntRange(values: bigint[] | undefined) {
  let a = 0n;
  let b = 0n;

  if (!values || values.length === 0) return [a, b];
  if (values.length === 1) {
    a = values[0]!;
  } else {
    a = values[0]!;
    b = values[1]!;
  }

  const [min, max] = a < b ? [a, b] : [b, a];

  return [min, max];
}

export function isColumnOption<T>(value: T | ColumnOption): value is ColumnOption {
  return value instanceof Object && "value" in value && "label" in value;
}

export function isColumnOptionArray<T>(value: T[] | ColumnOption[]): value is ColumnOption[] {
  return Array.isArray(value) && value.every((item) => isColumnOption(item));
}

const stringValue = z.string();

export function isStringArray<T>(value: T[] | string[]): value is string[] {
  return Array.isArray(value) && value.every((v) => stringValue.safeParse(v).success);
}

/* The faceted input for a column: option counts keyed by value, or a numeric min/max pair. */
export type FacetedInput = Map<string, number> | [number, number];

export function isColumnOptionMap(value: FacetedInput): value is Map<string, number> {
  return value instanceof Map;
}

export function isMinMaxTuple(value: FacetedInput): value is [number, number] {
  return Array.isArray(value) && value.length === 2;
}

// z.number() alone rejects the infinities, which are deliberately valid here.
const numberValue = z.union([
  z.number(),
  z.literal(Number.POSITIVE_INFINITY),
  z.literal(Number.NEGATIVE_INFINITY),
]);

export function getValidNumber(value: number | bigint | null | undefined): number | undefined {
  const parsed = numberValue.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export function isValidNumber(value: number): boolean {
  return numberValue.safeParse(value).success;
}

const bigIntInput = z.union([z.bigint(), z.string(), z.number()]);

export function getValidBigInt(
  value: bigint | number | string | null | undefined,
): bigint | undefined {
  const parsed = bigIntInput.safeParse(value);
  if (!parsed.success) return undefined;
  try {
    return BigInt(parsed.data);
  } catch {
    return undefined;
  }
}

export function filterRow(row: any, filters: FiltersState) {
  for (const filter of filters) {
    const cell = row[filter.columnId];

    if (filter.type === "text") {
      if (!textFilterFn(cell, filter)) {
        return false;
      }
    } else if (filter.type === "number") {
      if (!numberFilterFn(cell, filter)) {
        return false;
      }
    } else if (filter.type === "date") {
      if (!dateFilterFn(cell, filter)) {
        return false;
      }
    } else if (filter.type === "boolean") {
      if (!booleanFilterFn(cell, filter)) {
        return false;
      }
    } else if (filter.type === "option") {
      if (!optionFilterFn(cell, filter)) {
        return false;
      }
    } else if (filter.type === "multiOption") {
      if (!multiOptionFilterFn(cell, filter)) {
        return false;
      }
    } else {
      throw new Error(`Unknown filter type: ${filter.type}`);
    }
  }

  return true;
}

export function filterData<TData>(data: TData[], filters: FiltersState): TData[] {
  return data.filter((row) => filterRow(row, filters));
}
