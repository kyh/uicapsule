import type {
  ColumnConfig,
  ColumnDataType,
  ColumnOption,
  ElementType,
  FilterStrategy,
  MinMaxReturn,
  Nullable,
  NumericValue,
} from "../types";
import { z } from "zod";

import { isAnyOf, minMax, uniq } from "../../lib/array";
import { getValidNumber, isColumnOptionArray } from "../../lib/helpers";
import { memo } from "../../lib/memo";
import { applyOrderFns } from "../../lib/order-fns";

const bigintCell = z.bigint();

/**
 * Consolidated service for handling all column data operations including:
 * - Computing column options
 * - Getting column values
 * - Computing faceted unique values
 * - Computing faceted min/max values
 *
 * This centralizes the logic that was previously scattered across utils.ts and column-factory.ts
 */
export class ColumnDataService<TData> {
  constructor(
    private data: TData[],
    private strategy: FilterStrategy,
  ) {}

  /**
   * Step 1: Computes base column options without counts, ordering, or transforms
   */
  computeBaseOptions<TType extends ColumnDataType, TVal>(
    column: ColumnConfig<TData, TType, TVal>,
  ): ColumnOption[] {
    if (!isAnyOf(column.type, ["option", "multiOption"])) {
      return [];
    }

    if (this.strategy === "server" && !column.options) {
      throw new Error("column options are required for server-side filtering");
    }

    // If static options are provided, use them as the base
    if (column.options) {
      return column.options;
    }

    // Compute options from data
    const filtered = this.data
      .flatMap(column.accessor)
      .filter((v): v is NonNullable<TVal> => v !== undefined && v !== null);

    const uniqueValues = uniq(filtered);
    let columnOptions: ColumnOption[] = [];

    // Transform individual values to options
    const transformValueToOption = column.transformValueToOptionFn;
    if (transformValueToOption) {
      // SAFETY: flatMap flattened array-valued accessors one level, so at
      // runtime each element is ElementType<NonNullable<TVal>> even though
      // flatMap's typing reports NonNullable<TVal>.
      columnOptions = uniqueValues.map((m) =>
        transformValueToOption(m as ElementType<NonNullable<TVal>>),
      );
    }

    if (isColumnOptionArray(columnOptions)) {
      return columnOptions;
    }

    throw new Error(
      `[data-table-filter] [${column.id}] Either provide static options, a transformValueToOptionFn, or ensure the column data conforms to ColumnOption type`,
    );
  }

  /**
   * Step 2: Computes ordered options with counts applied
   */
  computeOrderedOptions<TType extends ColumnDataType, TVal>(
    column: ColumnConfig<TData, TType, TVal>,
  ): ColumnOption[] {
    const baseOptions = this.computeBaseOptions(column);
    const values = this.getValues(column);

    // Add counts to base options
    // SAFETY: option-based columns hold string or ColumnOption values
    // (ColumnDataNativeMap); computeFacetedUniqueValues guards other types.
    const facetedData = this.computeFacetedUniqueValues(
      column,
      values as string[] | ColumnOption[],
    );
    const optionsWithCounts = baseOptions.map((option) => ({
      ...option,
      count: facetedData?.get(option.value) || 0,
    }));

    // Apply ordering if provided
    if (column.orderFn) {
      return applyOrderFns(column.orderFn, optionsWithCounts);
    }

    return optionsWithCounts;
  }

  /**
   * Step 3: Computes final transformed options
   */
  computeTransformedOptions<TType extends ColumnDataType, TVal>(
    column: ColumnConfig<TData, TType, TVal>,
  ): ColumnOption[] {
    const orderedOptions = this.computeOrderedOptions(column);

    if (!column.transformOptionsFn) return orderedOptions;
    return column.transformOptionsFn(orderedOptions);
  }

  /**
   * Gets raw column values for processing
   */
  getValues<TType extends ColumnDataType, TVal>(
    column: ColumnConfig<TData, TType, TVal>,
  ): ElementType<NonNullable<TVal>>[] {
    // Memoize accessor calls
    // SAFETY: flatMap flattened array-valued accessors one level, so at runtime
    // the elements are ElementType<NonNullable<TVal>>, not NonNullable<TVal>.
    const memoizedAccessor = memo(
      () => [this.data],
      (deps) =>
        (deps[0] ?? [])
          .flatMap(column.accessor)
          .filter((v): v is NonNullable<TVal> => v !== undefined && v !== null) as ElementType<
          NonNullable<TVal>
        >[],
      { key: `accessor-${column.id}` },
    );

    const raw = memoizedAccessor();

    if (!isAnyOf(column.type, ["option", "multiOption"])) {
      return raw;
    }

    if (column.options) {
      // SAFETY: option-based columns have string elements (ColumnDataNativeMap),
      // and matched option values are those same strings.
      return raw
        .map((v) => column.options?.find((o) => o.value === v)?.value)
        .filter((v) => v !== undefined && v !== null) as ElementType<NonNullable<TVal>>[];
    }

    const transformValueToOption = column.transformValueToOptionFn;
    if (transformValueToOption) {
      // SAFETY: transform-based option columns yield ColumnOptions here;
      // downstream consumers detect that shape via isColumnOptionArray.
      const memoizedTransform = memo(
        () => [raw],
        (deps) =>
          (deps[0] ?? []).map((v) => transformValueToOption(v) as ElementType<NonNullable<TVal>>),
        { key: `transform-values-${column.id}` },
      );
      return memoizedTransform();
    }

    if (isColumnOptionArray(raw)) {
      return raw;
    }

    throw new Error(
      `[data-table-filter] [${column.id}] Either provide static options, a transformValueToOptionFn, or ensure the column data conforms to ColumnOption type`,
    );
  }

  /**
   * Computes faceted unique values for option-based columns
   */
  computeFacetedUniqueValues<TType extends ColumnDataType, TVal>(
    column: ColumnConfig<TData, TType, TVal>,
    values: string[] | ColumnOption[],
  ): Map<string, number> | undefined {
    if (!isAnyOf(column.type, ["option", "multiOption"])) {
      console.warn(
        "Faceted unique values can only be retrieved for option and multiOption columns",
      );
      return new Map<string, number>();
    }

    if (this.strategy === "server") {
      return column.facetedOptions;
    }

    const acc = new Map<string, number>();

    if (isColumnOptionArray(values)) {
      for (const option of values) {
        const curr = acc.get(option.value) ?? 0;
        acc.set(option.value, curr + 1);
      }
    } else {
      for (const option of values) {
        const curr = acc.get(option) ?? 0;
        acc.set(option, curr + 1);
      }
    }

    return acc;
  }

  /**
   * Computes faceted min/max values for number/bigint columns
   */
  computeFacetedMinMaxValues<TType extends ColumnDataType, TVal>(
    column: ColumnConfig<TData, TType, TVal>,
  ): MinMaxReturn<TType> {
    if (!isAnyOf(column.type, ["number", "bigint"])) {
      // SAFETY: MinMaxReturn resolves to undefined for non-numeric columns.
      return undefined as MinMaxReturn<TType>;
    }

    // Check for static min/max values
    if (column.min !== undefined && column.max !== undefined) {
      // SAFETY: min/max exist only on number/bigint columns, matching
      // MinMaxReturn for this column's runtime-checked type.
      return [column.min, column.max] as MinMaxReturn<TType>;
    }

    if (this.strategy === "server") {
      // SAFETY: MinMaxReturn admits undefined for number/bigint columns.
      return undefined as MinMaxReturn<TType>;
    }

    // Extract values using the accessor
    // SAFETY: number/bigint columns hold numeric accessor values
    // (ColumnDataNativeMap); the filter below drops anything else.
    const rawValues = this.data
      .flatMap((row) => column.accessor(row) as Nullable<NumericValue>)
      .filter(
        (v): v is NumericValue =>
          getValidNumber(v) !== undefined || bigintCell.safeParse(v).success,
      );

    if (rawValues.length === 0) {
      const defaultValue = column.type === "bigint" ? [0n, 0n] : [0, 0];
      // SAFETY: the runtime tag picked the tuple kind matching MinMaxReturn.
      return defaultValue as MinMaxReturn<TType>;
    }

    // Filter to ensure type consistency
    if (column.type === "number") {
      const numberValues = rawValues.filter((v): v is number => getValidNumber(v) !== undefined);
      // SAFETY: column.type fixed TType to "number", so MinMaxReturn is [number, number].
      return minMax(numberValues) as MinMaxReturn<TType>;
    }
    const bigintValues = rawValues.filter((v): v is bigint => bigintCell.safeParse(v).success);
    // SAFETY: the remaining numeric kind is "bigint", so MinMaxReturn is [bigint, bigint].
    return minMax(bigintValues) as MinMaxReturn<TType>;
  }
}
