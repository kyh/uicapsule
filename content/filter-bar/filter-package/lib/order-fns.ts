import type {
  ColumnOption,
  OrderDirection,
  TBuiltInOrderFn,
  TBuiltInOrderFnName,
  TCustomOrderFn,
  TOrderFnArg,
  TOrderFns,
} from "../core/types";

function count(a: ColumnOption, b: ColumnOption, direction: OrderDirection) {
  const x = a.count ?? 0;
  const y = b.count ?? 0;

  return direction === "asc" ? x - y : y - x;
}

function label(a: ColumnOption, b: ColumnOption, direction: OrderDirection) {
  const x = a.label.toLowerCase();
  const y = b.label.toLowerCase();

  return direction === "asc" ? x.localeCompare(y) : y.localeCompare(x);
}

export const orderFns = {
  count,
  label,
} as const satisfies Record<string, TBuiltInOrderFn>;

export function applyOrderFns(orderFns: TOrderFns, options: ColumnOption[]): ColumnOption[] {
  return options.toSorted((a, b) => {
    for (const orderFn of orderFns) {
      const result = orderFn(a, b);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  });
}

export function isBuiltInOrderFnName(value: string): value is TBuiltInOrderFnName {
  return Object.hasOwn(orderFns, value);
}

export function isOrderDirection(value: string): value is OrderDirection {
  return value === "asc" || value === "desc";
}

export function isCustomOrderFn(value: TOrderFnArg): value is TCustomOrderFn {
  return value instanceof Function && value.length === 2;
}

export function isBuiltInOrderFnTuple(
  value: TOrderFnArg,
): value is [TBuiltInOrderFnName, OrderDirection] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    isBuiltInOrderFnName(value[0]) &&
    isOrderDirection(value[1])
  );
}
