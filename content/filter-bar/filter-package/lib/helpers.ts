import type { Column, FilterModel, FilterBinding } from "../core/types";

export function getColumn(columns: Column[], id: string) {
  const column = columns.find((column) => column.id === id);
  if (!column) throw new Error(`Column with id ${id} not found`);
  return column;
}

export function createNumberRange(values: number[]): number[] {
  const [a = 0, b = 0] = values;
  return a < b ? [a, b] : [b, a];
}

export function bindFilter(column: Column, filter?: FilterModel): FilterBinding {
  switch (column.type) {
    case "text":
      return { type: "text", column, filter: filter?.type === "text" ? filter : undefined };
    case "number":
      return { type: "number", column, filter: filter?.type === "number" ? filter : undefined };
    case "date":
      return { type: "date", column, filter: filter?.type === "date" ? filter : undefined };
    case "boolean":
      return { type: "boolean", column, filter: filter?.type === "boolean" ? filter : undefined };
    case "option":
      return { type: "option", column, filter: filter?.type === "option" ? filter : undefined };
    case "multiOption":
      return {
        type: "multiOption",
        column,
        filter: filter?.type === "multiOption" ? filter : undefined,
      };
  }
}
