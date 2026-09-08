import type {
  ColumnDataType,
  FilterDetails,
  FilterOperators,
  FilterOperatorTarget,
  FilterTypeOperatorDetails,
  FilterValues,
} from "./types";

export const DEFAULT_OPERATORS = {
  boolean: {
    multiple: "is",
    single: "is",
  },
  date: {
    multiple: "is between",
    single: "is",
  },
  multiOption: {
    multiple: "include any of",
    single: "include",
  },
  number: {
    multiple: "is between",
    single: "is",
  },
  option: {
    multiple: "is any of",
    single: "is",
  },
  text: {
    multiple: "contains",
    single: "contains",
  },
} satisfies Record<ColumnDataType, Record<FilterOperatorTarget, FilterOperators[ColumnDataType]>>;

export const optionFilterOperators = {
  is: {
    key: "is",
    multiple: "is any of",
    target: "single",
    value: "is",
  },
  "is any of": {
    key: "is any of",
    single: "is",
    target: "multiple",
    value: "is any of",
  },
  "is none of": {
    key: "is none of",
    single: "is not",
    target: "multiple",
    value: "is none of",
  },
  "is not": {
    key: "is not",
    multiple: "is none of",
    target: "single",
    value: "is not",
  },
} as const satisfies FilterDetails<"option">;

export const multiOptionFilterOperators = {
  exclude: {
    key: "excludes",
    multiple: "exclude if any of",
    target: "single",
    value: "exclude",
  },
  "exclude if all": {
    key: "excludes all of",
    single: "exclude",
    target: "multiple",
    value: "exclude if all",
  },
  "exclude if any of": {
    key: "excludes if any of",
    single: "exclude",
    target: "multiple",
    value: "exclude if any of",
  },
  include: {
    key: "includes",
    multiple: "include any of",
    target: "single",
    value: "include",
  },
  "include all of": {
    key: "includes all of",
    single: "include",
    target: "multiple",
    value: "include all of",
  },
  "include any of": {
    key: "includes any of",
    single: "include",
    target: "multiple",
    value: "include any of",
  },
} as const satisfies FilterDetails<"multiOption">;

export const dateFilterOperators = {
  is: {
    key: "is",
    multiple: "is between",
    target: "single",
    value: "is",
  },
  "is after": {
    key: "is after",
    multiple: "is between",
    target: "single",
    value: "is after",
  },
  "is before": {
    key: "is before",
    multiple: "is between",
    target: "single",
    value: "is before",
  },
  "is between": {
    key: "is between",
    single: "is",
    target: "multiple",
    value: "is between",
  },
  "is not": {
    key: "is not",
    multiple: "is not between",
    target: "single",
    value: "is not",
  },
  "is not between": {
    key: "is not between",
    single: "is not",
    target: "multiple",
    value: "is not between",
  },
  "is on or after": {
    key: "is on or after",
    multiple: "is between",
    target: "single",
    value: "is on or after",
  },
  "is on or before": {
    key: "is on or before",
    multiple: "is between",
    target: "single",
    value: "is on or before",
  },
} as const satisfies FilterDetails<"date">;

export const textFilterOperators = {
  contains: {
    key: "contains",
    target: "single",
    value: "contains",
  },
  "does not contain": {
    key: "does not contain",
    target: "single",
    value: "does not contain",
  },
} as const satisfies FilterDetails<"text">;

export const numberFilterOperators = {
  is: {
    key: "is",
    multiple: "is between",
    target: "single",
    value: "is",
  },
  "is between": {
    key: "is between",
    single: "is",
    target: "multiple",
    value: "is between",
  },
  "is greater than": {
    key: "greater than",
    multiple: "is between",
    target: "single",
    value: "is greater than",
  },
  "is greater than or equal to": {
    key: "greater than or equal",
    multiple: "is between",
    target: "single",
    value: "is greater than or equal to",
  },
  "is less than": {
    key: "less than",
    multiple: "is between",
    target: "single",
    value: "is less than",
  },
  "is less than or equal to": {
    key: "less than or equal",
    multiple: "is between",
    target: "single",
    value: "is less than or equal to",
  },
  "is not": {
    key: "is not",
    multiple: "is not between",
    target: "single",
    value: "is not",
  },
  "is not between": {
    key: "is not between",
    single: "is not",
    target: "multiple",
    value: "is not between",
  },
} as const satisfies FilterDetails<"number">;

export const booleanFilterOperators = {
  is: {
    key: "is",
    multiple: "is not",
    target: "single",
    value: "is",
  },
  "is not": {
    key: "is not",
    multiple: "is",
    target: "single",
    value: "is not",
  },
} as const satisfies FilterDetails<"boolean">;

export const filterTypeOperatorDetails: FilterTypeOperatorDetails = {
  boolean: booleanFilterOperators,
  date: dateFilterOperators,
  multiOption: multiOptionFilterOperators,
  number: numberFilterOperators,
  option: optionFilterOperators,
  text: textFilterOperators,
};

// Preserve negation when the value count switches between one and many.
export const determineNewOperator = <TType extends ColumnDataType>(
  type: TType,
  oldVals: FilterValues<TType>,
  nextVals: FilterValues<TType>,
  currentOperator: FilterOperators[TType],
): FilterOperators[TType] => {
  const a = oldVals.length;
  const b = nextVals.length;

  if (a === b || (a >= 2 && b >= 2) || (a <= 1 && b <= 1)) {
    return currentOperator;
  }

  const opDetails = filterTypeOperatorDetails[type][currentOperator];

  if (a < b && b >= 2) {
    return opDetails.multiple ?? currentOperator;
  }
  if (a > b && b <= 1) {
    return opDetails.single ?? currentOperator;
  }
  return currentOperator;
};
