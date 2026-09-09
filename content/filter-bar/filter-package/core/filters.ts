import type {
  FilterModel,
  FiltersState,
  FilterValueUpdate,
  FilterOperatorUpdate,
  Column,
  OptionBasedColumnDataType,
} from "./types";
import { DEFAULT_OPERATORS, determineNewOperator } from "./operators";

const replaceFilter = (filters: FiltersState, next: FilterModel): FiltersState => {
  if (next.values.length === 0) {
    return filters.filter((filter) => filter.columnId !== next.columnId);
  }
  return filters.some((filter) => filter.columnId === next.columnId)
    ? filters.map((filter) => (filter.columnId === next.columnId ? next : filter))
    : [...filters, next];
};

const defaultOperator = <Operator>(
  count: number,
  operators: { single: Operator; multiple: Operator },
) => (count > 1 ? operators.multiple : operators.single);

export const setFilterValue = (filters: FiltersState, update: FilterValueUpdate): FiltersState => {
  const current = filters.find((filter) => filter.columnId === update.columnId);
  const { columnId } = update;
  switch (update.type) {
    case "text": {
      const values = [...new Set(update.values)].filter((value) => value.trim().length > 0);
      return replaceFilter(filters, {
        columnId,
        operator: current?.type === "text" ? current.operator : "contains",
        type: "text",
        values,
      });
    }
    case "boolean": {
      const values = update.values.slice(0, 1);
      return replaceFilter(filters, {
        columnId,
        operator: current?.type === "boolean" ? current.operator : "is",
        type: "boolean",
        values,
      });
    }
    case "number": {
      const values = update.values
        .filter(Number.isFinite)
        .slice(0, 2)
        .toSorted((a, b) => a - b);
      const operator =
        current?.type === "number"
          ? determineNewOperator("number", current.values, values, current.operator)
          : defaultOperator(values.length, DEFAULT_OPERATORS.number);
      return replaceFilter(filters, { columnId, operator, type: "number", values });
    }
    case "date": {
      const values = update.values
        .filter((value) => Number.isFinite(value.getTime()))
        .slice(0, 2)
        .toSorted((a, b) => a.getTime() - b.getTime());
      const operator =
        current?.type === "date"
          ? determineNewOperator("date", current.values, values, current.operator)
          : defaultOperator(values.length, DEFAULT_OPERATORS.date);
      return replaceFilter(filters, { columnId, operator, type: "date", values });
    }
    case "option": {
      const values = [...new Set(update.values)];
      const operator =
        current?.type === "option"
          ? determineNewOperator("option", current.values, values, current.operator)
          : defaultOperator(values.length, DEFAULT_OPERATORS.option);
      return replaceFilter(filters, { columnId, operator, type: "option", values });
    }
    case "multiOption": {
      const values = [...new Set(update.values)];
      const operator =
        current?.type === "multiOption"
          ? determineNewOperator("multiOption", current.values, values, current.operator)
          : defaultOperator(values.length, DEFAULT_OPERATORS.multiOption);
      return replaceFilter(filters, { columnId, operator, type: "multiOption", values });
    }
    default: {
      throw new Error(`Unsupported filter type: ${String(update satisfies never)}`);
    }
  }
};

export const setFilterOperator = (
  filters: FiltersState,
  update: FilterOperatorUpdate,
): FiltersState =>
  filters.map((filter) => {
    if (filter.columnId !== update.columnId) {
      return filter;
    }
    switch (update.type) {
      case "text": {
        return filter.type === "text" ? { ...filter, operator: update.operator } : filter;
      }
      case "number": {
        return filter.type === "number" ? { ...filter, operator: update.operator } : filter;
      }
      case "date": {
        return filter.type === "date" ? { ...filter, operator: update.operator } : filter;
      }
      case "boolean": {
        return filter.type === "boolean" ? { ...filter, operator: update.operator } : filter;
      }
      case "option": {
        return filter.type === "option" ? { ...filter, operator: update.operator } : filter;
      }
      case "multiOption": {
        return filter.type === "multiOption" ? { ...filter, operator: update.operator } : filter;
      }
      default: {
        return filter;
      }
    }
  });

export const toggleFilterValues = (
  filters: FiltersState,
  column: Column<OptionBasedColumnDataType>,
  values: string[],
  add: boolean,
): FiltersState => {
  const current = filters.find((filter) => filter.columnId === column.id);
  const existing =
    current?.type === "option" || current?.type === "multiOption" ? current.values : [];
  return setFilterValue(filters, {
    columnId: column.id,
    type: column.type,
    values: add ? [...existing, ...values] : existing.filter((value) => !values.includes(value)),
  });
};
