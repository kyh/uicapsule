import type { Column, FilterModel, FilterBinding } from "../core/types";

export const getColumn = (columns: Column[], id: string) => {
  const column = columns.find((candidate) => candidate.id === id);
  if (!column) {
    throw new Error(`Column with id ${id} not found`);
  }
  return column;
};

export const createNumberRange = (values: number[]): number[] => {
  const [a = 0, b = 0] = values;
  return a < b ? [a, b] : [b, a];
};

export const bindFilter = (column: Column, filter?: FilterModel): FilterBinding => {
  switch (column.type) {
    case "text": {
      return { column, filter: filter?.type === "text" ? filter : undefined, type: "text" };
    }
    case "number": {
      return { column, filter: filter?.type === "number" ? filter : undefined, type: "number" };
    }
    case "date": {
      return { column, filter: filter?.type === "date" ? filter : undefined, type: "date" };
    }
    case "boolean": {
      return { column, filter: filter?.type === "boolean" ? filter : undefined, type: "boolean" };
    }
    case "option": {
      return { column, filter: filter?.type === "option" ? filter : undefined, type: "option" };
    }
    case "multiOption": {
      return {
        column,
        filter: filter?.type === "multiOption" ? filter : undefined,
        type: "multiOption",
      };
    }
    default: {
      throw new Error(`Unsupported column type: ${String(column satisfies never)}`);
    }
  }
};
