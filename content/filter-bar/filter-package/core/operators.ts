import type {
  ColumnDataType,
  FilterDetails,
  FilterOperators,
  FilterOperatorTarget,
  FilterTypeOperatorDetails,
  FilterValues,
} from "./types";

export const DEFAULT_OPERATORS = {
  text: {
    single: "contains",
    multiple: "contains",
  },
  number: {
    single: "is",
    multiple: "is between",
  },
  date: {
    single: "is",
    multiple: "is between",
  },
  boolean: {
    single: "is",
    multiple: "is",
  },
  option: {
    single: "is",
    multiple: "is any of",
  },
  multiOption: {
    single: "include",
    multiple: "include any of",
  },
} satisfies Record<ColumnDataType, Record<FilterOperatorTarget, FilterOperators[ColumnDataType]>>;

export const optionFilterOperators = {
  is: {
    key: "is",
    value: "is",
    target: "single",
    multiple: "is any of",
  },
  "is not": {
    key: "is not",
    value: "is not",
    target: "single",
    multiple: "is none of",
  },
  "is any of": {
    key: "is any of",
    value: "is any of",
    target: "multiple",
    single: "is",
  },
  "is none of": {
    key: "is none of",
    value: "is none of",
    target: "multiple",
    single: "is not",
  },
} as const satisfies FilterDetails<"option">;

export const multiOptionFilterOperators = {
  include: {
    key: "includes",
    value: "include",
    target: "single",
    multiple: "include any of",
  },
  exclude: {
    key: "excludes",
    value: "exclude",
    target: "single",
    multiple: "exclude if any of",
  },
  "include any of": {
    key: "includes any of",
    value: "include any of",
    target: "multiple",
    single: "include",
  },
  "exclude if all": {
    key: "excludes all of",
    value: "exclude if all",
    target: "multiple",
    single: "exclude",
  },
  "include all of": {
    key: "includes all of",
    value: "include all of",
    target: "multiple",
    single: "include",
  },
  "exclude if any of": {
    key: "excludes if any of",
    value: "exclude if any of",
    target: "multiple",
    single: "exclude",
  },
} as const satisfies FilterDetails<"multiOption">;

export const dateFilterOperators = {
  is: {
    key: "is",
    value: "is",
    target: "single",
    multiple: "is between",
  },
  "is not": {
    key: "is not",
    value: "is not",
    target: "single",
    multiple: "is not between",
  },
  "is before": {
    key: "is before",
    value: "is before",
    target: "single",
    multiple: "is between",
  },
  "is on or after": {
    key: "is on or after",
    value: "is on or after",
    target: "single",
    multiple: "is between",
  },
  "is after": {
    key: "is after",
    value: "is after",
    target: "single",
    multiple: "is between",
  },
  "is on or before": {
    key: "is on or before",
    value: "is on or before",
    target: "single",
    multiple: "is between",
  },
  "is between": {
    key: "is between",
    value: "is between",
    target: "multiple",
    single: "is",
  },
  "is not between": {
    key: "is not between",
    value: "is not between",
    target: "multiple",
    single: "is not",
  },
} as const satisfies FilterDetails<"date">;

export const textFilterOperators = {
  contains: {
    key: "contains",
    value: "contains",
    target: "single",
  },
  "does not contain": {
    key: "does not contain",
    value: "does not contain",
    target: "single",
  },
} as const satisfies FilterDetails<"text">;

export const numberFilterOperators = {
  is: {
    key: "is",
    value: "is",
    target: "single",
    multiple: "is between",
  },
  "is not": {
    key: "is not",
    value: "is not",
    target: "single",
    multiple: "is not between",
  },
  "is greater than": {
    key: "greater than",
    value: "is greater than",
    target: "single",
    multiple: "is between",
  },
  "is greater than or equal to": {
    key: "greater than or equal",
    value: "is greater than or equal to",
    target: "single",
    multiple: "is between",
  },
  "is less than": {
    key: "less than",
    value: "is less than",
    target: "single",
    multiple: "is between",
  },
  "is less than or equal to": {
    key: "less than or equal",
    value: "is less than or equal to",
    target: "single",
    multiple: "is between",
  },
  "is between": {
    key: "is between",
    value: "is between",
    target: "multiple",
    single: "is",
  },
  "is not between": {
    key: "is not between",
    value: "is not between",
    target: "multiple",
    single: "is not",
  },
} as const satisfies FilterDetails<"number">;

export const booleanFilterOperators = {
  is: {
    key: "is",
    value: "is",
    target: "single",
    multiple: "is not",
  },
  "is not": {
    key: "is not",
    value: "is not",
    target: "single",
    multiple: "is",
  },
} as const satisfies FilterDetails<"boolean">;

export const filterTypeOperatorDetails: FilterTypeOperatorDetails = {
  text: textFilterOperators,
  number: numberFilterOperators,
  date: dateFilterOperators,
  boolean: booleanFilterOperators,
  option: optionFilterOperators,
  multiOption: multiOptionFilterOperators,
};

// Preserve negation when the value count switches between one and many.
export function determineNewOperator<TType extends ColumnDataType>(
  type: TType,
  oldVals: FilterValues<TType>,
  nextVals: FilterValues<TType>,
  currentOperator: FilterOperators[TType],
): FilterOperators[TType] {
  const a = oldVals.length;
  const b = nextVals.length;

  if (a === b || (a >= 2 && b >= 2) || (a <= 1 && b <= 1)) return currentOperator;

  const opDetails = filterTypeOperatorDetails[type][currentOperator];

  if (a < b && b >= 2) return opDetails.multiple ?? currentOperator;
  if (a > b && b <= 1) return opDetails.single ?? currentOperator;
  return currentOperator;
}
